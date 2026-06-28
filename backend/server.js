/**
 * =============================================================
 * server.js — CryptoNova Ana Sunucu v2.0
 * =============================================================
 * SQLite tabanlı — MongoDB bağlantısı yok.
 * Rotalar: /api/auth, /api/crypto, /api/wallet
 * =============================================================
 */

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
require('dotenv').config();

// SQLite veritabanını başlat (tablolar otomatik oluşturulur)
require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;

// =============================================================
// GÜVENLİK MİDDLEWARE'LERİ
// =============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy    : false  // Development: CDN resimlerini engellemez
}));

const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    if (isDev)    return callback(null, true);
    if (!origin)  return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Bu kaynağa izin verilmiyor: ${origin}`));
  },
  credentials  : true,
  methods      : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Genel API rate limit: 15 dakikada 20000 istek (Dev için çok yüksek)
app.use('/api/', rateLimit({
  windowMs       : 15 * 60 * 1000,
  max            : 20000,
  standardHeaders: true,
  legacyHeaders  : false,
  message        : { success: false, message: 'Çok fazla istek. 15 dakika sonra tekrar deneyin.' }
}));

// Auth rate limit: 15 dakikada 1000 deneme (Dev için esnek)
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 1000,
  message : { success: false, message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' }
}));

// =============================================================
// BODY PARSER
// =============================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// =============================================================
// STATİK DOSYALAR (Frontend)
// =============================================================
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// =============================================================
// API ROTALAR
// =============================================================
const authRoutes   = require('./routes/auth');
const cryptoRoutes = require('./routes/crypto');
const walletRoutes = require('./routes/wallet');

app.use('/api/auth',   authRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/wallet', walletRoutes);

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({
    success  : true,
    message  : 'CryptoNova Sunucusu çalışıyor',
    version  : '2.0.0',
    db       : 'SQLite (dosya tabanlı)',
    timestamp: new Date().toISOString()
  });
});

// =============================================================
// SPA — Tüm bilinmeyen route'lar index.html'e yönlendirilir
// =============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// =============================================================
// HATA YÖNETİCİLERİ
// =============================================================

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `'${req.originalUrl}' bulunamadı.` });
});

// 500
app.use((err, req, res, next) => {
  console.error('❌ Sunucu Hatası:', err.stack);
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Sunucu hatası.' : err.message
  });
});

// =============================================================
// SUNUCU BAŞLAT
// =============================================================
const server = app.listen(PORT, () => {
  console.log(`\n🚀 CryptoNova v2.0 Sunucusu başlatıldı`);
  console.log(`📡 Adres      : http://localhost:${PORT}`);
  console.log(`💾 Veritabanı : SQLite (backend/database.sqlite)`);
  console.log(`🌍 Ortam      : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS       : ${isDev ? 'Tüm originler (dev modu)' : allowedOrigins.join(', ')}`);
  console.log(`📦 Rotalar    : /api/auth | /api/crypto | /api/wallet\n`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  Sunucu kapatılıyor...');
  server.close(() => { console.log('✅ Sunucu kapatıldı.'); process.exit(0); });
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Yakalanmamış Rejection:', reason);
});
