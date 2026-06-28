/**
 * =============================================================
 * db.js — SQLite Veritabanı Bağlantısı & Şema Başlatma
 * =============================================================
 * better-sqlite3 kullanır: Senkron, hızlı, kurulum gerektirmez.
 * Tablolar: users, wallets, transactions
 * =============================================================
 */

const Database = require('better-sqlite3');
const path     = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db      = new Database(DB_PATH);

// WAL modu: Eş zamanlı okuma/yazma performansını artırır
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// =============================================================
// TABLO OLUŞTURMA
// =============================================================
db.exec(`
  -- --------------------------------------------------------
  -- KULLANICILAR
  -- --------------------------------------------------------
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

  -- --------------------------------------------------------
  -- CÜZDANLAR (her kullanıcı için birden fazla para birimi)
  -- --------------------------------------------------------
  CREATE TABLE IF NOT EXISTS wallets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency   TEXT    NOT NULL,
    balance    REAL    NOT NULL DEFAULT 0,
    updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, currency)
  );

  -- --------------------------------------------------------
  -- İŞLEM GEÇMİŞİ (Trade History)
  -- type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  -- --------------------------------------------------------
  CREATE TABLE IF NOT EXISTS transactions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coin_id       TEXT    NOT NULL,
    coin_symbol   TEXT    NOT NULL,
    type          TEXT    NOT NULL,
    amount        REAL    NOT NULL,
    price_at_time REAL    NOT NULL,
    total_cost    REAL    NOT NULL,
    timestamp     TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- --------------------------------------------------------
  -- STAKING / VADELİ KİLİTLEME
  -- --------------------------------------------------------
  CREATE TABLE IF NOT EXISTS stakings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency      TEXT    NOT NULL,
    amount        REAL    NOT NULL,
    apy           REAL    NOT NULL DEFAULT 12.0,
    locked_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- İndeksler
  CREATE INDEX IF NOT EXISTS idx_wallets_user_id       ON wallets(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id  ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created  ON transactions(timestamp DESC);
`);

console.log(`✅ SQLite Veritabanı hazır: ${DB_PATH}`);

module.exports = db;
