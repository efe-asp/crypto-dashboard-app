/**
 * =============================================================
 * db.js — SQLite Veritabanı Bağlantısı & Şema Başlatma
 * =============================================================
 * better-sqlite3 kullanır: Senkron, hızlı, kurulum gerektirmez.
 * Veritabanı dosyası: backend/database.sqlite
 * =============================================================
 */

const Database = require('better-sqlite3');
const path     = require('path');

// Veritabanı dosyasının yolu (backend klasörü içinde oluşturulur)
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Veritabanına bağlan (dosya yoksa otomatik oluşturulur)
const db = new Database(DB_PATH);

// WAL modu: Eş zamanlı okuma/yazma performansını artırır
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// =============================================================
// TABLO OLUŞTURMA
// =============================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    UNIQUE NOT NULL,
    email      TEXT    UNIQUE NOT NULL,
    password   TEXT    NOT NULL,
    watchlist  TEXT    NOT NULL DEFAULT '[]',
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log(`✅ SQLite Veritabanı hazır: ${DB_PATH}`);

module.exports = db;
