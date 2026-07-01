const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middleware/auth');

// =============================================================
// GET /api/user/login-history
// =============================================================
router.get('/login-history', protect, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Son 5 giriş hareketini tersten sıralayarak al
    const logs = db.prepare(`
      SELECT id, login_time, device_browser, ip_address, location 
      FROM login_activities 
      WHERE user_id = ? 
      ORDER BY login_time DESC 
      LIMIT 5
    `).all(userId);
    
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('Login History Hatası:', error);
    res.status(500).json({ success: false, message: 'Giriş geçmişi alınırken hata oluştu.' });
  }
});

module.exports = router;
