/**
 * =============================================================
 * models/User.js — SQLite Kullanıcı Modeli
 * =============================================================
 * Mongoose'un yerini alan, SQLite üzerinde çalışan
 * kullanıcı CRUD ve watchlist yönetim fonksiyonları.
 * =============================================================
 */

const bcrypt = require('bcryptjs');
const db     = require('../db');

// =============================================================
// YARDIMCI: Watchlist JSON dönüşümleri
// =============================================================
const parseWatchlist  = (str) => { try { return JSON.parse(str || '[]'); } catch { return []; } };
const stringifyWatchlist = (arr) => JSON.stringify(arr || []);

// =============================================================
// KULLANICI İŞLEMLERİ
// =============================================================

/**
 * Yeni kullanıcı oluştur.
 * @param {object} data — { username, email, password }
 * @returns {object}    — Oluşturulan kullanıcı (şifresiz)
 */
const createUser = async ({ username, email, password }) => {
  // Validasyon
  if (!username || !email || !password) throw new Error('Tüm alanlar zorunludur.');
  if (username.length < 3 || username.length > 30) throw new Error('Kullanıcı adı 3-30 karakter olmalıdır.');
  if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new Error('Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.');
  if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) throw new Error('Geçerli bir e-posta adresi girin.');
  if (password.length < 6) throw new Error('Şifre en az 6 karakter olmalıdır.');

  // Tekrar eden kullanıcı kontrolü
  const existingEmail    = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());

  if (existingEmail)    throw new Error('E-posta adresi zaten kullanımda.');
  if (existingUsername) throw new Error('Kullanıcı adı zaten kullanımda.');

  // Şifreyi hashle (saltRounds=12)
  const hashedPassword = await bcrypt.hash(password, 12);

  const stmt = db.prepare(`
    INSERT INTO users (username, email, password)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(username.trim(), email.toLowerCase().trim(), hashedPassword);

  // Oluşturulan kullanıcıyı döndür
  return findById(result.lastInsertRowid);
};

/**
 * ID ile kullanıcı bul.
 */
const findById = (id) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(id);
  if (!user) return null;
  return formatUser(user);
};

/**
 * E-posta ile kullanıcı bul.
 */
const findByEmail = (email) => {
  return db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase().trim());
};

/**
 * E-posta + şifre doğrulaması.
 * Her iki hata için de aynı mesajı döndürür (güvenlik).
 */
const findByCredentials = async (email, password) => {
  const user = findByEmail(email); // Şifreli ham kullanıcıyı al

  if (!user) throw new Error('E-posta veya şifre hatalı.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('E-posta veya şifre hatalı.');

  return formatUser(user);
};

/**
 * Kullanıcıyı formatla: Şifreyi çıkar, watchlist'i parse et.
 */
const formatUser = (user) => {
  if (!user) return null;
  const { password, is_active, ...rest } = user;
  return {
    ...rest,
    id       : user.id,
    watchlist: parseWatchlist(user.watchlist),
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

// =============================================================
// WATCHLIST İŞLEMLERİ
// =============================================================

/**
 * Watchlist'e coin ekle.
 * @param {number} userId  — Kullanıcı ID'si
 * @param {string} coinId  — CoinGecko coin ID'si
 * @returns {string[]}     — Güncellenmiş watchlist
 */
const addToWatchlist = (userId, coinId) => {
  const user = db.prepare('SELECT watchlist FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı.');

  const watchlist = parseWatchlist(user.watchlist);

  if (watchlist.includes(coinId)) return { added: false, watchlist };
  if (watchlist.length >= 50) throw new Error('İzleme listesi dolu (maksimum 50 coin).');

  watchlist.push(coinId);

  db.prepare('UPDATE users SET watchlist = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(stringifyWatchlist(watchlist), userId);

  return { added: true, watchlist };
};

/**
 * Watchlist'ten coin çıkar.
 */
const removeFromWatchlist = (userId, coinId) => {
  const user = db.prepare('SELECT watchlist FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı.');

  const watchlist = parseWatchlist(user.watchlist);
  const index     = watchlist.indexOf(coinId);

  if (index === -1) return { removed: false, watchlist };

  watchlist.splice(index, 1);

  db.prepare('UPDATE users SET watchlist = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(stringifyWatchlist(watchlist), userId);

  return { removed: true, watchlist };
};

/**
 * Kullanıcının watchlist'ini getir.
 */
const getWatchlist = (userId) => {
  const user = db.prepare('SELECT watchlist FROM users WHERE id = ?').get(userId);
  if (!user) return [];
  return parseWatchlist(user.watchlist);
};

/**
 * E-posta için 6 haneli doğrulama kodu oluşturur ve kaydeder.
 */
const sendVerificationCode = (userId) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // 15 dakika geçerli (şu anki saate 15 dk ekle)
  const expires = new Date(Date.now() + 15 * 60000).toISOString();
  
  db.prepare('UPDATE users SET verification_code = ?, verification_expires = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(code, expires, userId);
    
  return code;
};

/**
 * Kullanıcının girdiği 6 haneli kodu doğrular.
 */
const verifyCode = (userId, code) => {
  const user = db.prepare('SELECT verification_code, verification_expires FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('Kullanıcı bulunamadı.');
  
  if (!user.verification_code || user.verification_code !== code.toString().trim()) {
    throw new Error('Hatalı doğrulama kodu.');
  }
  
  if (new Date() > new Date(user.verification_expires)) {
    throw new Error('Doğrulama kodunun süresi dolmuş.');
  }
  
  // Başarılı, kodu temizle ve onaylı yap
  db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(userId);
  return true;
};

module.exports = {
  createUser,
  findById,
  findByEmail,
  findByCredentials,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  sendVerificationCode,
  verifyCode
};
