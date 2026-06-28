/**
 * =============================================================
 * routes/crypto.js — Kripto Para API Rotaları
 * =============================================================
 * 429-Proof Stale-While-Revalidate Cache:
 *   - Her başarılı yanıt hem node-cache hem de lastGoodData Map'e kaydedilir.
 *   - 429 veya herhangi bir ağ hatası durumunda lastGoodData'dan servis edilir.
 *   - 60sn dolmadan KESİNLİKLE dış API'ye yeni istek atılmaz.
 * Bulk Fetching:
 *   - /coins endpoint'i tek istekte 100 coin getirir.
 *   - Her coin için ayrı detay isteği ATILMAZ.
 * =============================================================
 */

const express   = require('express');
const router    = express.Router();
const axios     = require('axios');
const NodeCache = require('node-cache');
const { protect }  = require('../middleware/auth');
const UserModel    = require('../models/User');

// =============================================================
// CACHE SİSTEMİ
// =============================================================

// Birincil TTL tabanlı cache (node-cache)
const cache = new NodeCache({
  stdTTL     : 60,       // 60 saniye varsayılan TTL
  checkperiod: 120,
  useClones  : false
});

// İkincil "Son Başarılı Veri" deposu — TTL'siz, asla silinmez
// 429 veya herhangi bir hata durumunda buradan servis edilir
const lastGoodData = new Map();

const BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';

const getHeaders = () => {
  const headers = {
    'Accept'    : 'application/json',
    'User-Agent': 'CryptoNova/2.0'
  };
  if (process.env.COINGECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  }
  return headers;
};

/**
 * fetchWithCache — 429-Proof akıllı önbellek yöneticisi.
 *
 * 1) Cache HIT  → Anında yanıt, dış istek atılmaz.
 * 2) Cache MISS → Dış API çağrısı.
 *    a) Başarı   → node-cache + lastGoodData'ya kaydet.
 *    b) 429/Hata → lastGoodData'dan stale veri döndür.
 *    c) lastGoodData de boşsa → hatayı fırlat.
 */
const fetchWithCache = async (cacheKey, url, params = {}, ttl = 60) => {
  // --- 1. node-cache kontrolü ---
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    console.log(`🔵 Cache HIT : ${cacheKey}`);
    return { data: cached, fromCache: true, stale: false };
  }

  console.log(`🟡 Cache MISS: ${cacheKey} — Dış API isteği başlıyor...`);

  try {
    const response = await axios.get(url, {
      params,
      headers: getHeaders(),
      timeout: 12000
    });

    // Başarılı yanıtı her iki cache'e de kaydet
    cache.set(cacheKey, response.data, ttl);
    lastGoodData.set(cacheKey, {
      data     : response.data,
      savedAt  : Date.now()
    });

    console.log(`✅ API Başarılı: ${cacheKey}`);
    return { data: response.data, fromCache: false, stale: false };

  } catch (error) {
    const status = error.response?.status;
    const stale  = lastGoodData.get(cacheKey);

    if (status === 429) {
      console.warn(`⚠️  429 Too Many Requests: ${cacheKey}`);
    } else {
      console.error(`❌ API Hatası [${status || 'network'}]: ${cacheKey} — ${error.message}`);
    }

    // Stale veri varsa onu döndür (Graceful Degradation)
    if (stale) {
      const ageMin = Math.round((Date.now() - stale.savedAt) / 60000);
      console.log(`🟠 Stale veri kullanılıyor: ${cacheKey} (${ageMin} dakika önce kaydedildi)`);
      // Stale veriyi kısa süre cache'e al ki tekrar tekrar API çağrısı yapılmasın
      cache.set(cacheKey, stale.data, Math.min(ttl, 30));
      return { data: stale.data, fromCache: true, stale: true };
    }

    throw error;
  }
};

// =============================================================
// GET /api/crypto/coins — Top 100 Coin (Bulk Fetch)
// =============================================================
router.get('/coins', async (req, res) => {
  try {
    const page     = parseInt(req.query.page) || 1;
    const currency = (req.query.currency || 'usd').toLowerCase();
    const cacheKey = `markets_${currency}_${page}`;
    const ttl      = parseInt(process.env.CACHE_TTL_MARKETS) || 60;

    const { data, fromCache, stale } = await fetchWithCache(
      cacheKey,
      `${BASE_URL}/coins/markets`,
      {
        vs_currency             : currency,
        order                   : 'market_cap_desc',
        per_page                : 100,
        page,
        sparkline               : true,
        price_change_percentage : '1h,24h,7d'
      },
      ttl
    );

    res.status(200).json({
      success: true,
      fromCache,
      stale,
      count   : data.length,
      page,
      currency,
      data
    });

  } catch (error) {
    console.error('Coins Hatası:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Piyasa verileri alınamadı. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// =============================================================
// GET /api/crypto/coin/:id — Tek Coin Detayı (Modal için)
// =============================================================
router.get('/coin/:id', async (req, res) => {
  try {
    const coinId   = req.params.id.toLowerCase().trim();
    const cacheKey = `coin_${coinId}`;

    if (!/^[a-z0-9-]+$/.test(coinId)) {
      return res.status(400).json({ success: false, message: 'Geçersiz coin ID.' });
    }

    const { data, fromCache, stale } = await fetchWithCache(
      cacheKey,
      `${BASE_URL}/coins/${coinId}`,
      {
        localization   : false,
        tickers        : false,
        market_data    : true,
        community_data : false,
        developer_data : false,
        sparkline      : true
      },
      parseInt(process.env.CACHE_TTL_COIN) || 60
    );

    res.status(200).json({ success: true, fromCache, stale, data });

  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ success: false, message: 'Bu coin bulunamadı.' });
    }
    console.error('Coin Detay Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Coin bilgisi alınamadı.' });
  }
});

// =============================================================
// GET /api/crypto/coin/:id/chart — Grafik Verisi
// =============================================================
router.get('/coin/:id/chart', async (req, res) => {
  try {
    const coinId    = req.params.id.toLowerCase().trim();
    const days      = req.query.days     || '7';
    const currency  = req.query.currency || 'usd';
    const validDays = ['1', '7', '14', '30', '90', '180', '365', 'max'];

    if (!validDays.includes(days)) {
      return res.status(400).json({ success: false, message: 'Geçersiz gün parametresi.' });
    }

    const { data, fromCache, stale } = await fetchWithCache(
      `chart_${coinId}_${days}_${currency}`,
      `${BASE_URL}/coins/${coinId}/market_chart`,
      {
        vs_currency: currency,
        days,
        interval: days === '1' ? 'hourly' : 'daily'
      },
      300
    );

    res.status(200).json({ success: true, fromCache, stale, data });

  } catch (error) {
    console.error('Chart Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Grafik verisi alınamadı.' });
  }
});

// =============================================================
// GET /api/crypto/search — Coin Arama
// =============================================================
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query || query.length < 1) {
      return res.status(400).json({ success: false, message: 'Arama terimi zorunludur.' });
    }

    const { data, fromCache } = await fetchWithCache(
      `search_${query.toLowerCase()}`,
      `${BASE_URL}/search`,
      { query },
      parseInt(process.env.CACHE_TTL_SEARCH) || 120
    );

    const coins = (data.coins || []).slice(0, 20).map(c => ({
      id            : c.id,
      name          : c.name,
      symbol        : c.symbol,
      thumb         : c.thumb,
      market_cap_rank: c.market_cap_rank
    }));

    res.status(200).json({ success: true, fromCache, count: coins.length, data: coins });

  } catch (error) {
    console.error('Arama Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Arama yapılamadı.' });
  }
});

// =============================================================
// GET /api/crypto/trending — Trend Coinler
// =============================================================
router.get('/trending', async (req, res) => {
  try {
    const { data, fromCache, stale } = await fetchWithCache(
      'trending_coins',
      `${BASE_URL}/search/trending`,
      {},
      600
    );

    const trending = (data.coins || []).map(item => ({
      id       : item.item.id,
      name     : item.item.name,
      symbol   : item.item.symbol,
      thumb    : item.item.thumb,
      score    : item.item.score,
      price_btc: item.item.price_btc,
      data     : item.item.data
    }));

    res.status(200).json({ success: true, fromCache, stale, data: trending });

  } catch (error) {
    console.error('Trending Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Trend verisi alınamadı.' });
  }
});

// =============================================================
// GET /api/crypto/global — Küresel Piyasa İstatistikleri
// =============================================================
router.get('/global', async (req, res) => {
  try {
    const { data, fromCache, stale } = await fetchWithCache(
      'global_market',
      `${BASE_URL}/global`,
      {},
      300
    );
    res.status(200).json({ success: true, fromCache, stale, data: data.data });
  } catch (error) {
    console.error('Global Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Küresel piyasa verisi alınamadı.' });
  }
});

// =============================================================
// GET /api/crypto/prices — Birden fazla coin fiyatı (converter için)
// =============================================================
router.get('/prices', async (req, res) => {
  try {
    const ids      = req.query.ids      || 'bitcoin,ethereum';
    const currency = req.query.currency || 'usd';

    if (!ids) {
      return res.status(400).json({ success: false, message: 'ids parametresi zorunludur.' });
    }

    const { data, fromCache, stale } = await fetchWithCache(
      `prices_${ids}_${currency}`,
      `${BASE_URL}/simple/price`,
      {
        ids,
        vs_currencies          : currency,
        include_24hr_change    : true,
        include_market_cap     : false
      },
      60
    );

    res.status(200).json({ success: true, fromCache, stale, data });

  } catch (error) {
    console.error('Prices Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Fiyat verisi alınamadı.' });
  }
});

// =============================================================
// GET /api/crypto/watchlist — Kullanıcı Watchlist
// =============================================================
router.get('/watchlist', protect, async (req, res) => {
  try {
    const watchlist = UserModel.getWatchlist(req.user.id);

    if (!watchlist || watchlist.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const { data, fromCache, stale } = await fetchWithCache(
      `watchlist_${req.user.id}`,
      `${BASE_URL}/coins/markets`,
      {
        vs_currency             : 'usd',
        ids                     : watchlist.join(','),
        order                   : 'market_cap_desc',
        sparkline               : true,
        price_change_percentage : '24h,7d'
      },
      60
    );

    res.status(200).json({ success: true, fromCache, stale, count: data.length, data });

  } catch (error) {
    console.error('Watchlist GET Hatası:', error.message);
    res.status(500).json({ success: false, message: 'İzleme listesi alınamadı.' });
  }
});

// =============================================================
// POST /api/crypto/watchlist/:id — Watchlist'e Ekle
// =============================================================
router.post('/watchlist/:id', protect, async (req, res) => {
  try {
    const coinId = req.params.id.toLowerCase().trim();

    if (!/^[a-z0-9-]+$/.test(coinId)) {
      return res.status(400).json({ success: false, message: 'Geçersiz coin ID formatı.' });
    }

    const { added, watchlist } = UserModel.addToWatchlist(req.user.id, coinId);

    if (!added) {
      return res.status(409).json({ success: false, message: 'Bu coin zaten izleme listenizde.' });
    }

    cache.del(`watchlist_${req.user.id}`);

    res.status(200).json({
      success  : true,
      message  : `${coinId} izleme listenize eklendi.`,
      watchlist
    });

  } catch (error) {
    if (error.message.includes('İzleme listesi dolu')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Watchlist Ekleme Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Coin eklenemedi.' });
  }
});

// =============================================================
// DELETE /api/crypto/watchlist/:id — Watchlist'ten Çıkar
// =============================================================
router.delete('/watchlist/:id', protect, async (req, res) => {
  try {
    const coinId = req.params.id.toLowerCase().trim();
    const { removed, watchlist } = UserModel.removeFromWatchlist(req.user.id, coinId);

    if (!removed) {
      return res.status(404).json({ success: false, message: 'Bu coin izleme listenizde bulunamadı.' });
    }

    cache.del(`watchlist_${req.user.id}`);

    res.status(200).json({
      success  : true,
      message  : `${coinId} izleme listenizden çıkarıldı.`,
      watchlist
    });

  } catch (error) {
    console.error('Watchlist Silme Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Coin çıkarılamadı.' });
  }
});

// =============================================================
// GET /api/crypto/cache/stats — Debug (yalnızca development)
// =============================================================
router.get('/cache/stats', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: "Production'da erişilemez." });
  }
  const stats = cache.getStats();
  res.status(200).json({
    success: true,
    stats  : {
      hits        : stats.hits,
      misses      : stats.misses,
      keys        : cache.keys().length,
      lastGoodKeys: lastGoodData.size
    },
    keys        : cache.keys(),
    lastGoodKeys: [...lastGoodData.keys()]
  });
});

module.exports = router;
