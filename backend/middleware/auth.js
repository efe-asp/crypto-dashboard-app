/**
 * =============================================================
 * middleware/auth.js — JWT Kimlik Doğrulama Middleware'i
 * =============================================================
 * SQLite tabanlı kullanıcı modeline uyarlandı.
 * =============================================================
 */

const jwt      = require('jsonwebtoken');
const UserModel = require('../models/User');

/**
 * protect — Korunan route'lar için kullanılan middleware.
 * Kullanım: router.get('/protected', protect, handler);
 */
const protect = (req, res, next) => {
  let token;

  // 1. Başlıktan token'ı al
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bu işlem için giriş yapmanız gerekiyor.'
    });
  }

  try {
    // 2. Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cryptonova_super_secret_key');

    // 3. Kullanıcının hâlâ var olup olmadığını SQLite'tan kontrol et
    const user = UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Bu token\'a ait kullanıcı artık mevcut değil.'
      });
    }

    // 4. Kullanıcıyı request nesnesine ekle
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Kimlik doğrulama sırasında bir hata oluştu.'
    });
  }
};

/**
 * generateToken — Yeni JWT oluşturur.
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'cryptonova_super_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = { protect, generateToken };
