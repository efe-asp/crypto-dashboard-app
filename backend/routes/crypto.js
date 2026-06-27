/**
 * =============================================================
 * routes/crypto.js — Kripto Para API Rotaları (SQLite uyumlu)
 * =============================================================
 * Watchlist işlemleri SQLite modeline uyarlandı.
 * CoinGecko proxy + cache mantığı değişmedi.
 * =============================================================
 */

const express    = require('express');
const router     = express.Router();
const axios      = require('axios');
const NodeCache  = require('node-cache');
const { protect }  = require('../middleware/auth');
const UserModel    = require('../models/User');

// =============================================================
// CACHE KURULUMU
// =============================================================
const cache = new NodeCache({
  stdTTL    : 60,
  checkperiod: 120,
  useClones : false
});

const BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';

const getHeaders = () => {
  const headers = { 'Accept': 'application/json', 'User-Agent': 'CryptoTracker/1.0' };
  if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  return headers;
};

const fetchWithCache = async (cacheKey, url, params = {}, ttl = 60) => {
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`🔵 Cache HIT: ${cacheKey}`);
    return { data: cached, fromCache: true };
  }

  console.log(`🟡 Cache MISS: ${cacheKey}`);
  try {
    const response = await axios.get(url, { params, headers: getHeaders(), timeout: 10000 });
    cache.set(cacheKey, response.data, ttl);
    return { data: response.data, fromCache: false };
  } catch (error) {
    if (error.response?.status === 429) {
      const staleData = cache.get(cacheKey);
      if (staleData) return { data: staleData, fromCache: true, stale: true };
    }
    throw error;
  }
};

// =============================================================
// GET /api/crypto/coins — Top 50 Coin
// =============================================================
router.get('/coins', async (req, res) => {
  try {
    const page     = parseInt(req.query.page)    || 1;
    const currency = req.query.currency          || 'usd';
    const cacheKey = `markets_${currency}_${page}`;
    const ttl      = parseInt(process.env.CACHE_TTL_MARKETS) || 60;

    const { data, fromCache } = await fetchWithCache(
      cacheKey,
      `${BASE_URL}/coins/markets`,
      {
        vs_currency             : currency,
        order                   : 'market_cap_desc',
        per_page                : 50,
        page,
        sparkline               : true,
        price_change_percentage : '1h,24h,7d'
      },
      ttl
    );

    res.status(200).json({ success: true, fromCache, count: data.length, page, currency, data });

  } catch (error) {
    console.error('Coins Hatası:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Piyasa verileri alınamadı. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// =============================================================
// GET /api/crypto/coin/:id — Tek Coin Detayı
// =============================================================
router.get('/coin/:id', async (req, res) => {
  try {
    const coinId   = req.params.id.toLowerCase().trim();
    const cacheKey = `coin_${coinId}`;

    if (!/^[a-z0-9-]+$/.test(coinId)) {
      return res.status(400).json({ success: false, message: 'Geçersiz coin ID.' });
    }

    const { data, fromCache } = await fetchWithCache(
      cacheKey,
      `${BASE_URL}/coins/${coinId}`,
      { localization: false, tickers: false, market_data: true, community_data: false, developer_data: false, sparkline: true },
      parseInt(process.env.CACHE_TTL_COIN) || 30
    );

    res.status(200).json({ success: true, fromCache, data });

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
    const coinId   = req.params.id.toLowerCase().trim();
    const days     = req.query.days     || '7';
    const currency = req.query.currency || 'usd';
    const validDays = ['1', '7', '14', '30', '90', '180', '365', 'max'];

    if (!validDays.includes(days)) {
      return res.status(400).json({ success: false, message: 'Geçersiz gün parametresi.' });
    }

    const { data, fromCache } = await fetchWithCache(
      `chart_${coinId}_${days}_${currency}`,
      `${BASE_URL}/coins/${coinId}/market_chart`,
      { vs_currency: currency, days, interval: days === '1' ? 'hourly' : 'daily' },
      300
    );

    res.status(200).json({ success: true, fromCache, data });

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
      id: c.id, name: c.name, symbol: c.symbol,
      thumb: c.thumb, market_cap_rank: c.market_cap_rank
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
    const { data, fromCache } = await fetchWithCache(
      'trending_coins', `${BASE_URL}/search/trending`, {}, 600
    );

    const trending = (data.coins || []).map(item => ({
      id      : item.item.id,
      name    : item.item.name,
      symbol  : item.item.symbol,
      thumb   : item.item.thumb,
      score   : item.item.score,
      price_btc: item.item.price_btc,
      data    : item.item.data
    }));

    res.status(200).json({ success: true, fromCache, data: trending });

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
    const { data, fromCache } = await fetchWithCache(
      'global_market', `${BASE_URL}/global`, {}, 300
    );
    res.status(200).json({ success: true, fromCache, data: data.data });
  } catch (error) {
    console.error('Global Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Küresel piyasa verisi alınamadı.' });
  }
});

// =============================================================
// GET /api/crypto/watchlist — Kullanıcı Watchlist (SQLite)
// =============================================================
router.get('/watchlist', protect, async (req, res) => {
  try {
    const watchlist = UserModel.getWatchlist(req.user.id);

    if (!watchlist || watchlist.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const { data, fromCache } = await fetchWithCache(
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

    res.status(200).json({ success: true, fromCache, count: data.length, data });

  } catch (error) {
    console.error('Watchlist GET Hatası:', error.message);
    res.status(500).json({ success: false, message: 'İzleme listesi alınamadı.' });
  }
});

// =============================================================
// POST /api/crypto/watchlist/:id — Watchlist'e Ekle (SQLite)
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

    // Watchlist cache'ini sıfırla
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
// DELETE /api/crypto/watchlist/:id — Watchlist'ten Çıkar (SQLite)
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
    return res.status(403).json({ success: false, message: 'Production\'da erişilemez.' });
  }
  const stats = cache.getStats();
  res.status(200).json({
    success: true,
    stats  : { hits: stats.hits, misses: stats.misses, keys: cache.keys().length },
    keys   : cache.keys()
  });
});

module.exports = router;
