/**
 * =============================================================
 * routes/wallet.js — Cüzdan & Al-Sat Rotaları
 * =============================================================
 * GET    /api/wallet             — Kullanıcı bakiyeleri
 * POST   /api/wallet/deposit     — USD yatır
 * POST   /api/wallet/withdraw    — USD çek
 * POST   /api/wallet/trade       — Al / Sat (market fiyatı)
 * GET    /api/wallet/transactions — İşlem geçmişi
 * =============================================================
 */

const express    = require('express');
const router     = express.Router();
const axios      = require('axios');
const db         = require('../db');
const { protect } = require('../middleware/auth');

// Tüm wallet endpoint'leri korumalı
router.use(protect);

// =============================================================
// YARDIMCI FONKSİYONLAR
// =============================================================

/**
 * Kullanıcının belirtilen currency için bakiyesini getir.
 * Yoksa 0 döner.
 */
const getBalance = (userId, currency) => {
  const row = db.prepare(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?'
  ).get(userId, currency.toUpperCase());
  return row ? row.balance : 0;
};

/**
 * Bakiyeyi güncelle (upsert). Negatif bakiyeye izin vermez.
 */
const updateBalance = (userId, currency, delta) => {
  const cur = currency.toUpperCase();

  // Mevcut bakiyeyi al
  const existing = db.prepare(
    'SELECT balance FROM wallets WHERE user_id = ? AND currency = ?'
  ).get(userId, cur);

  const currentBalance = existing ? existing.balance : 0;
  const newBalance = currentBalance + delta;

  if (newBalance < 0) {
    throw new Error(`Yetersiz ${cur} bakiyesi. Mevcut: ${currentBalance.toFixed(8)}`);
  }

  if (existing) {
    db.prepare(
      "UPDATE wallets SET balance = ?, updated_at = datetime('now') WHERE user_id = ? AND currency = ?"
    ).run(newBalance, userId, cur);
  } else {
    db.prepare(
      "INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, ?)"
    ).run(userId, cur, newBalance);
  }

  return newBalance;
};

/**
 * İşlem kaydı oluştur.
 */
const recordTransaction = (userId, coinId, coinSymbol, type, amount, price, total) => {
  return db.prepare(`
    INSERT INTO transactions (user_id, coin_id, coin_symbol, type, amount, price_at_time, total_cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, coinId, coinSymbol.toUpperCase(), type.toUpperCase(), amount, price, total);
};

/**
 * CoinGecko'dan anlık fiyat çek (cache bypass — trade için kritik).
 */
const fetchLivePrice = async (coinId, currency = 'usd') => {
  const BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
  const headers  = { 'Accept': 'application/json', 'User-Agent': 'CryptoNova/2.0' };
  if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;

  const resp = await axios.get(`${BASE_URL}/simple/price`, {
    params  : { ids: coinId, vs_currencies: currency },
    headers,
    timeout : 8000
  });

  const price = resp.data?.[coinId]?.[currency.toLowerCase()];
  if (!price) throw new Error(`${coinId} için fiyat alınamadı.`);
  return price;
};

// =============================================================
// GET /api/wallet — Tüm Bakiyeler & Ortalama Maliyet (P&L)
// =============================================================
router.get('/', (req, res) => {
  try {
    const wallets = db.prepare(
      'SELECT currency, balance, updated_at FROM wallets WHERE user_id = ? ORDER BY balance DESC'
    ).all(req.user.id);

    // Kâr/Zarar (P&L) için coin başına ortalama alış maliyeti hesaplama
    const pnlData = {};
    const buys = db.prepare(`SELECT coin_symbol, SUM(amount) as total_amount, SUM(total_cost) as total_invested FROM transactions WHERE user_id = ? AND type = 'BUY' GROUP BY coin_symbol`).all(req.user.id);
    const sells = db.prepare(`SELECT coin_symbol, SUM(amount) as total_amount, SUM(total_cost) as total_sold FROM transactions WHERE user_id = ? AND type = 'SELL' GROUP BY coin_symbol`).all(req.user.id);
    
    buys.forEach(b => {
      pnlData[b.coin_symbol] = { totalInvested: b.total_invested, totalAmount: b.total_amount };
    });
    sells.forEach(s => {
      if(pnlData[s.coin_symbol]) {
        pnlData[s.coin_symbol].totalInvested -= s.total_sold;
        pnlData[s.coin_symbol].totalAmount -= s.total_amount;
        // Bakiye tükendiyse maliyeti sıfırla
        if(pnlData[s.coin_symbol].totalAmount <= 0.0001) pnlData[s.coin_symbol].totalInvested = 0;
      }
    });

    const enrichedWallets = wallets.map(w => {
       const costData = pnlData[w.currency.toUpperCase()];
       const avgCost = costData && costData.totalAmount > 0 ? (costData.totalInvested / costData.totalAmount) : 0;
       return { ...w, avg_buy_price: Math.max(0, avgCost) };
    });

    // USD yoksa varsayılan olarak ekle (yeni kullanıcılar için)
    const hasUSD = enrichedWallets.some(w => w.currency === 'USD');
    if (!hasUSD) {
      db.prepare(
        "INSERT OR IGNORE INTO wallets (user_id, currency, balance) VALUES (?, 'USD', 10000)"
      ).run(req.user.id);
      enrichedWallets.unshift({ currency: 'USD', balance: 10000, updated_at: new Date().toISOString(), avg_buy_price: 1 });
    }

    res.status(200).json({ success: true, data: enrichedWallets });

  } catch (error) {
    console.error('Wallet GET Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Bakiye bilgisi alınamadı.' });
  }
});

// =============================================================
// POST /api/wallet/deposit — USD Yatır
// =============================================================
router.post('/deposit', (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli bir miktar girin.' });
    }
    if (parsedAmount > 1_000_000) {
      return res.status(400).json({ success: false, message: 'Maksimum tek seferde $1.000.000 yatırılabilir.' });
    }

    const newBalance = updateBalance(req.user.id, 'USD', parsedAmount);
    recordTransaction(req.user.id, 'usd', 'USD', 'DEPOSIT', parsedAmount, 1, parsedAmount);

    res.status(200).json({
      success   : true,
      message   : `$${parsedAmount.toLocaleString('en-US')} başarıyla yatırıldı.`,
      newBalance,
      currency  : 'USD'
    });

  } catch (error) {
    console.error('Deposit Hatası:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// =============================================================
// POST /api/wallet/withdraw — USD Çek
// =============================================================
router.post('/withdraw', (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli bir miktar girin.' });
    }

    const currentBalance = getBalance(req.user.id, 'USD');
    if (parsedAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: `Yetersiz bakiye. Mevcut USD: $${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      });
    }

    const newBalance = updateBalance(req.user.id, 'USD', -parsedAmount);
    recordTransaction(req.user.id, 'usd', 'USD', 'WITHDRAW', parsedAmount, 1, parsedAmount);

    res.status(200).json({
      success   : true,
      message   : `$${parsedAmount.toLocaleString('en-US')} başarıyla çekildi.`,
      newBalance,
      currency  : 'USD'
    });

  } catch (error) {
    console.error('Withdraw Hatası:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
});

// =============================================================
// POST /api/wallet/trade — Al / Sat
// Body: { coinId, coinSymbol, type: 'buy'|'sell', amount, useLive: true }
// =============================================================
router.post('/trade', async (req, res) => {
  try {
    const { coinId, coinSymbol, type, amount, currency = 'usd' } = req.body;

    if (!coinId || !coinSymbol || !type || !amount) {
      return res.status(400).json({ success: false, message: 'coinId, coinSymbol, type ve amount zorunludur.' });
    }
    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ success: false, message: "type 'buy' veya 'sell' olmalıdır." });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli bir miktar girin.' });
    }

    // Anlık fiyatı çek
    const livePrice = await fetchLivePrice(coinId, currency);
    const totalCost = parsedAmount * livePrice;
    const symbol    = coinSymbol.toUpperCase();
    const fiatCurrency = currency.toUpperCase();

    if (type === 'buy') {
      // USD bakiyesi yeterli mi?
      const usdBalance = getBalance(req.user.id, fiatCurrency);
      if (totalCost > usdBalance) {
        return res.status(400).json({
          success: false,
          message: `Yetersiz ${fiatCurrency} bakiyesi. Gerekli: ${totalCost.toFixed(2)}, Mevcut: ${usdBalance.toFixed(2)}`
        });
      }

      // Atomik işlem: USD azalt, kripto artır
      db.transaction(() => {
        updateBalance(req.user.id, fiatCurrency, -totalCost);
        updateBalance(req.user.id, symbol, parsedAmount);
        recordTransaction(req.user.id, coinId, symbol, 'BUY', parsedAmount, livePrice, totalCost);
      })();

      res.status(200).json({
        success   : true,
        message   : `${parsedAmount} ${symbol} başarıyla satın alındı!`,
        type      : 'buy',
        amount    : parsedAmount,
        symbol,
        price     : livePrice,
        total     : totalCost,
        currency  : fiatCurrency
      });

    } else {
      // SELL: Kripto bakiyesi yeterli mi?
      const cryptoBalance = getBalance(req.user.id, symbol);
      if (parsedAmount > cryptoBalance) {
        return res.status(400).json({
          success: false,
          message: `Yetersiz ${symbol} bakiyesi. Mevcut: ${cryptoBalance.toFixed(8)}`
        });
      }

      db.transaction(() => {
        updateBalance(req.user.id, symbol, -parsedAmount);
        updateBalance(req.user.id, fiatCurrency, totalCost);
        recordTransaction(req.user.id, coinId, symbol, 'SELL', parsedAmount, livePrice, totalCost);
      })();

      res.status(200).json({
        success   : true,
        message   : `${parsedAmount} ${symbol} başarıyla satıldı!`,
        type      : 'sell',
        amount    : parsedAmount,
        symbol,
        price     : livePrice,
        total     : totalCost,
        currency  : fiatCurrency
      });
    }

  } catch (error) {
    console.error('Trade Hatası:', error.message);
    res.status(500).json({ success: false, message: error.message || 'İşlem gerçekleştirilemedi.' });
  }
});

// =============================================================
// GET /api/wallet/transactions — İşlem Geçmişi
// =============================================================
router.get('/transactions', (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const transactions = db.prepare(`
      SELECT id, coin_id, coin_symbol, type, amount, price_at_time, total_cost, timestamp
      FROM transactions
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, limit, offset);

    const totalCount = db.prepare(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?'
    ).get(req.user.id).count;

    res.status(200).json({
      success : true,
      count   : transactions.length,
      total   : totalCount,
      offset,
      data    : transactions
    });

  } catch (error) {
    console.error('Transactions Hatası:', error.message);
    res.status(500).json({ success: false, message: 'İşlem geçmişi alınamadı.' });
  }
});

// =============================================================
// POST /api/wallet/transfer — P2P Transfer
// =============================================================
router.post('/transfer', (req, res) => {
  try {
    const { email, currency, amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!email || !currency || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli email, para birimi ve miktar girin.' });
    }

    const cur = currency.toUpperCase();
    
    // Alıcıyı bul
    const receiver = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Alıcı bulunamadı.' });
    }
    if (receiver.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Kendinize transfer yapamazsınız.' });
    }

    // Gönderenin bakiyesi yeterli mi?
    const senderBalance = getBalance(req.user.id, cur);
    if (parsedAmount > senderBalance) {
      return res.status(400).json({ success: false, message: `Yetersiz bakiye. Mevcut ${cur}: ${senderBalance.toFixed(2)}` });
    }

    // ACID Transaction ile transferi yap
    db.transaction(() => {
      // Gönderenden düş
      updateBalance(req.user.id, cur, -parsedAmount);
      // Alıcıya ekle
      updateBalance(receiver.id, cur, parsedAmount);

      // Log (Gönderen)
      recordTransaction(req.user.id, cur.toLowerCase(), cur, 'TRANSFER_OUT', parsedAmount, 1, parsedAmount);
      // Log (Alıcı)
      recordTransaction(receiver.id, cur.toLowerCase(), cur, 'TRANSFER_IN', parsedAmount, 1, parsedAmount);
    })();

    res.status(200).json({ success: true, message: `${parsedAmount} ${cur} başarıyla ${receiver.email} adresine gönderildi.` });
  } catch (error) {
    console.error('Transfer Hatası:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// =============================================================
// GET /api/wallet/export-csv — İşlem Geçmişini CSV İndir
// =============================================================
router.get('/export-csv', (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT coin_symbol, type, amount, price_at_time, total_cost, timestamp
      FROM transactions
      WHERE user_id = ?
      ORDER BY timestamp DESC
    `).all(req.user.id);

    let csvContent = 'Tarih,Varlik,Tip,Miktar,Islem_Fiyati,Toplam_Tutar\n';
    transactions.forEach(t => {
      csvContent += `"${t.timestamp}","${t.coin_symbol}","${t.type}","${t.amount}","${t.price_at_time}","${t.total_cost}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="islemler.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('CSV Export Hatası:', error.message);
    res.status(500).json({ success: false, message: 'Dışa aktarma başarısız.' });
  }
});

// =============================================================
// STAKING / VADELİ (KAZAN)
// =============================================================
router.post('/stake', (req, res) => {
  try {
    const { currency, amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (!currency || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Geçerli miktar ve varlık girin.' });
    }

    const cur = currency.toUpperCase();
    const currentBalance = getBalance(req.user.id, cur);
    if (parsedAmount > currentBalance) {
      return res.status(400).json({ success: false, message: `Yetersiz ${cur} bakiyesi.` });
    }

    db.transaction(() => {
      updateBalance(req.user.id, cur, -parsedAmount);
      const existing = db.prepare('SELECT id, amount FROM stakings WHERE user_id = ? AND currency = ?').get(req.user.id, cur);
      if (existing) {
        db.prepare("UPDATE stakings SET amount = amount + ?, locked_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(parsedAmount, existing.id);
      } else {
        db.prepare("INSERT INTO stakings (user_id, currency, amount, apy) VALUES (?, ?, ?, 12.0)").run(req.user.id, cur, parsedAmount);
      }
    })();

    res.status(200).json({ success: true, message: `${parsedAmount} ${cur} başarıyla stake edildi.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/unstake', (req, res) => {
  try {
    const { currency } = req.body;
    const cur = (currency || '').toUpperCase();

    const stake = db.prepare('SELECT * FROM stakings WHERE user_id = ? AND currency = ?').get(req.user.id, cur);
    if (!stake || stake.amount <= 0) {
      return res.status(400).json({ success: false, message: 'Stake edilmiş varlığınız bulunmuyor.' });
    }

    // Faiz hesapla (Saniye başına %12)
    const lockedTimeMs = new Date() - new Date(stake.locked_at + 'Z');
    const lockedSeconds = Math.max(0, lockedTimeMs / 1000);
    const yearlyInterestRate = stake.apy / 100;
    const interestPerSecond = yearlyInterestRate / (365 * 24 * 60 * 60);
    const earnedInterest = stake.amount * interestPerSecond * lockedSeconds;
    const totalReturn = stake.amount + earnedInterest;

    db.transaction(() => {
      db.prepare('DELETE FROM stakings WHERE id = ?').run(stake.id);
      updateBalance(req.user.id, cur, totalReturn);
    })();

    res.status(200).json({ success: true, message: `Stake bozuldu. Kazanılan faiz: ${earnedInterest.toFixed(6)} ${cur}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/staking', (req, res) => {
  try {
    const stakings = db.prepare('SELECT * FROM stakings WHERE user_id = ?').all(req.user.id);
    res.status(200).json({ success: true, data: stakings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
