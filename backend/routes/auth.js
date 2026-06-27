/**
 * =============================================================
 * routes/auth.js — Kimlik Doğrulama Rotaları (SQLite)
 * =============================================================
 * POST /api/auth/register — Yeni kullanıcı kaydı
 * POST /api/auth/login    — Giriş ve JWT döndürme
 * GET  /api/auth/me       — Mevcut kullanıcı bilgisi (korunan)
 * =============================================================
 */

const express    = require('express');
const router     = express.Router();
const UserModel  = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// =============================================================
// YARDIMCI: Token + Kullanıcı bilgisini döndür
// =============================================================
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = generateToken(user.id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id       : user.id,
      username : user.username,
      email    : user.email,
      watchlist: user.watchlist,
      createdAt: user.createdAt
    }
  });
};

// =============================================================
// POST /api/auth/register
// =============================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const user = await UserModel.createUser({ username, email, password });

    console.log(`✅ Yeni kayıt: ${user.username} (${user.email})`);
    sendTokenResponse(user, 201, res, 'Kayıt başarılı! Hoş geldiniz.');

  } catch (error) {
    // Kullanıcı dostu validasyon ve duplicate hataları
    const clientErrors = [
      'Tüm alanlar zorunludur.',
      'Kullanıcı adı 3-30 karakter olmalıdır.',
      'Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.',
      'Geçerli bir e-posta adresi girin.',
      'Şifre en az 6 karakter olmalıdır.',
      'E-posta adresi zaten kullanımda.',
      'Kullanıcı adı zaten kullanımda.'
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(400).json({ success: false, message: error.message });
    }

    console.error('Register Hatası:', error);
    res.status(500).json({ success: false, message: 'Kayıt sırasında bir hata oluştu.' });
  }
});

// =============================================================
// POST /api/auth/login
// =============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-posta ve şifre zorunludur.'
      });
    }

    const user = await UserModel.findByCredentials(email, password);

    console.log(`✅ Giriş: ${user.username} (${user.email})`);
    sendTokenResponse(user, 200, res, 'Giriş başarılı!');

  } catch (error) {
    if (error.message === 'E-posta veya şifre hatalı.') {
      return res.status(401).json({ success: false, message: error.message });
    }
    console.error('Login Hatası:', error);
    res.status(500).json({ success: false, message: 'Giriş sırasında bir hata oluştu.' });
  }
});

// =============================================================
// GET /api/auth/me — Korunan
// =============================================================
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id       : req.user.id,
      username : req.user.username,
      email    : req.user.email,
      watchlist: req.user.watchlist,
      createdAt: req.user.createdAt
    }
  });
});

module.exports = router;
