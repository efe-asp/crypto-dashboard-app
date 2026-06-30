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
      is_verified: user.is_verified,
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

const nodemailer = require('nodemailer');

// =============================================================
// POST /api/auth/send-verification-code
// =============================================================
router.post('/send-verification-code', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const code = UserModel.sendVerificationCode(req.user.id, email);
    
    // Eğer email güncellendiyse, yeni e-postayı veritabanından alalım (req.user eskiyi tutuyor olabilir)
    const currentUser = UserModel.findById(req.user.id);
    const targetEmail = currentUser.email;

    // Gerçek e-posta gönderimi için Nodemailer konfigürasyonu
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"CryptoNova Güvenlik" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject: 'CryptoNova Doğrulama Kodunuz',
      text: `Merhaba,\n\nHesabınızı doğrulamak için 6 haneli kodunuz: ${code}\n\nBu kod 15 dakika boyunca geçerlidir.\n\nİyi günler!`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0E14; padding: 40px 20px; margin: 0; color: #E2E8F0;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #151A24; border: 1px solid #232C3D; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">CryptoNova</h1>
            </div>

            <!-- Body -->
            <div style="padding: 30px 40px;">
              <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 20px;">Güvenlik Doğrulaması</h2>
              <p style="font-size: 15px; line-height: 1.6; margin-bottom: 25px; color: #94A3B8;">
                Merhaba,<br><br>
                Hesabınızı güvenli bir şekilde onaylayabilmeniz için tek kullanımlık doğrulama kodunuz aşağıda yer almaktadır.
              </p>

              <!-- Code Box -->
              <div style="background-color: #0B0E14; border: 1px solid #2A3441; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #00f2fe; letter-spacing: 8px;">${code}</span>
              </div>

              <p style="font-size: 14px; text-align: center; color: #64748B; margin-bottom: 0;">
                Bu kod <strong>15 dakika</strong> boyunca geçerlidir.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #0F131A; padding: 20px; text-align: center; border-top: 1px solid #232C3D;">
              <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.5;">
                Eğer bu isteği siz yapmadıysanız lütfen bu e-postayı dikkate almayın ve şifrenizi değiştirin.
                <br><br>
                &copy; ${new Date().getFullYear()} CryptoNova. Tüm hakları saklıdır.
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Eğer .env dosyasında bilgiler yoksa hatayı logla
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("UYARI: .env dosyasında EMAIL_USER veya EMAIL_PASS ayarlanmamış. Gerçek e-posta gönderilemedi! Sadece terminale yazdırılıyor.");
      console.log(`✉️ KOD: ${code} -> Alıcı: ${targetEmail}`);
      return res.status(200).json({ success: true, message: 'Doğrulama kodu e-postanıza gönderildi. (Geliştirici mod)' });
    }

    // E-postayı Gönder
    await transporter.sendMail(mailOptions);
    console.log(`Gerçek e-posta başarıyla gönderildi: ${targetEmail}`);
    
    res.status(200).json({ success: true, message: 'Doğrulama kodu e-postanıza gönderildi.' });
  } catch (error) {
    console.error('Send Code Hatası:', error);
    res.status(400).json({ success: false, message: error.message || 'Kod gönderilirken bir hata oluştu.' });
  }
});

// =============================================================
// POST /api/auth/verify-code
// =============================================================
router.post('/verify-code', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Kod gereklidir.' });
    }
    
    UserModel.verifyCode(req.user.id, code);
    res.status(200).json({ success: true, message: 'Hesabınız başarıyla doğrulandı.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
      is_verified: req.user.is_verified,
      createdAt: req.user.createdAt
    }
  });
});

// =============================================================
// PUT /api/auth/change-password — Şifre Değiştirme (Korunan)
// =============================================================
router.put('/change-password', protect, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ success: false, message: 'Yeni şifreler eşleşmiyor.' });

    await UserModel.changePassword(req.user.id, oldPassword, newPassword);
    res.status(200).json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// =============================================================
// PUT /api/auth/update-profile — Profil Güncelleme (Korunan)
// =============================================================
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username)
      return res.status(400).json({ success: false, message: 'Kullanıcı adı zorunludur.' });

    const updatedUser = UserModel.updateUsername(req.user.id, username);
    res.status(200).json({
      success: true,
      message: 'Kullanıcı adınız güncellendi.',
      user: {
        id       : updatedUser.id,
        username : updatedUser.username,
        email    : updatedUser.email,
        watchlist: updatedUser.watchlist,
        is_verified: updatedUser.is_verified,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;

