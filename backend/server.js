/**
 * =============================================================
 * server.js — Kripto Takip Platformu Ana Sunucu (SQLite)
 * =============================================================
 * Mongoose/MongoDB bağlantısı kaldırıldı.
 * SQLite dosya tabanlı veritabanı kullanılır — kurulum gerekmez.
 * =============================================================
 */

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
require('dotenv').config();

// SQLite veritabanını başlat (uygulama başlar başlamaz tablo oluşturulur)
require('./db');

// --- Uygulama ---
const app  = express();
const PORT = process.env.PORT || 5000;

// =============================================================
// GÜVENLİK MİDDLEWARE'LERİ
// =============================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Development'ta CSP'yi kapat — CoinGecko CDN resimlerini engellememesi için
  // Production'da buraya uygun direktifler eklenmeli
  contentSecurityPolicy: false
}));

// Development modunda tüm origin'lere izin ver
// Production'da ALLOWED_ORIGINS kullanılır
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Development modunda tüm origin'lere izin ver (Live Server, dosya protokolü vb.)
    if (isDev) return callback(null, true);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Bu kaynağa izin verilmiyor: ${origin}`));
  },
  credentials  : true,
  methods      : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Genel rate limit: 15 dakikada 100 istek
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message: { success: false, message: 'Çok fazla istek. 15 dakika sonra tekrar deneyin.' }
}));

// Auth rate limit: 15 dakikada 10 deneme
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 10,
  message: { success: false, message: 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.' }
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
// ROTALAR
// =============================================================
const authRoutes   = require('./routes/auth');
const cryptoRoutes = require('./routes/crypto');

app.use('/api/auth',   authRoutes);
app.use('/api/crypto', cryptoRoutes);

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({
    success  : true,
    message  : 'Sunucu çalışıyor',
    db       : 'SQLite (dosya tabanlı)',
    timestamp: new Date().toISOString()
  });
});

// Frontend SPA — tanımsız route'lar
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
  console.log(`\n🚀 CryptoNova Sunucusu başlatıldı`);
  console.log(`📡 Adres  : http://localhost:${PORT}`);
  console.log(`💾 DB     : SQLite (backend/database.sqlite)`);
  console.log(`🌍 Ortam  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS   : ${allowedOrigins.join(', ')}\n`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  Sunucu kapatılıyor...');
  server.close(() => { console.log('✅ Sunucu kapatıldı.'); process.exit(0); });
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Yakalanmamış Rejection:', reason);
});
