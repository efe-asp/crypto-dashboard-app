# ◈ CryptoNova — Full-Stack Cryptocurrency Tracking Platform

*Read this in other languages: [Türkçe (Turkish)](#-cryptonova--full-stack-kripto-para-takip-platformu)*

CryptoNova is a real-time cryptocurrency tracking platform featuring a premium dark theme and glassmorphism design system, tailored for a modern Web3/Fintech user experience.

This project is built as a clean **Full-Stack** application using **Node.js & Express.js** with a local **SQLite** database on the backend, and pure **Vanilla JS, HTML5, and CSS3** on the frontend (no frontend frameworks or UI libraries like React, Vue, or Tailwind were used).

---

## 🚀 Features

* **Real-time Market Data (Top 50):** Up-to-date prices, 1h/24h/7d percentage changes, market cap, and 24h volume fetched via CoinGecko API.
* **Backend Proxy & Caching:** To prevent API rate limit issues and optimize performance, all external API requests are proxied through the backend server and cached using `node-cache`.
* **Custom Canvas Charting:** Interactive price charts (24h to 365d) and sparkline trends drawn from scratch using HTML5 Canvas with neon glow effects and gradient fills (no external chart libraries).
* **Secure Authentication:** 
  * Registration and Login flows.
  * Password hashing using **bcryptjs** (salt rounds = 12).
  * Session management utilizing stateless **JSON Web Tokens (JWT)**.
* **Server-Side Watchlist:** User watchlists are stored directly in the SQLite database rather than local storage, allowing persistency across sessions.
* **Debounced Search Engine:** Instantly search for coins with a built-in debounce delay to minimize server requests.
* **Trending & Global Stats:** Discover the top searched coins in the last 24h and monitor global market cap dominance.
* **Premium UI/UX:**
  * Clean glassmorphism cards with glowing neon purple/cyan accents.
  * Shimmering **Skeleton Loaders** for all data-fetching sections.
  * Interactive and self-dismissing **Toast Notifications** for errors and success actions.
  * Fully responsive layouts (Desktop, Tablet, and Mobile).

---

## 🛠️ Tech Stack

* **Front-End:** HTML5 (Semantic & ARIA compliant), CSS3 (Custom Variables & Keyframe Animations), Vanilla JavaScript (ES6+).
* **Back-End:** Node.js, Express.js.
* **Database:** SQLite (powered by `better-sqlite3` for zero-configuration, lightning-fast local SQL storage).
* **Security & Utilities:**
  * `jsonwebtoken` (Auth verification)
  * `bcryptjs` (Secure password hashing)
  * `helmet` (Secure HTTP headers and Content Security Policy)
  * `express-rate-limit` (Brute-force and DDoS protection)
  * `cors` (Cross-Origin Resource Sharing)
  * `node-cache` (In-memory server cache)

---

## 🗂️ Project Directory Structure

```text
Canlı Borsa Takip API/
├── backend/
│   ├── db.js                   # SQLite database connection & schema
│   ├── server.js               # Express application entry & security setup
│   ├── .env                    # Environment variables & secrets
│   ├── package.json            # Server dependencies
│   ├── models/
│   │   └── User.js             # SQLite user CRUD & watchlist operations
│   ├── routes/
│   │   ├── auth.js             # Login / Register API endpoints
│   │   └── crypto.js           # CoinGecko proxy & watchlist API endpoints
│   └── middleware/
│       └── auth.js             # JWT verification middleware
│
├── frontend/
│   ├── index.html              # UI layout & modal templates
│   ├── style.css               # Design system, animations & responsive stylesheets
│   └── app.js                  # DOM interactions, Canvas charts & API requests
│
└── README.md                   # Project documentation
```

---

## 💻 Installation & Setup

Follow these steps to run the application locally:

### 1. Install Dependencies
Open your terminal, navigate to the `backend` directory, and install the package dependencies:
```bash
cd backend
npm install
```

### 2. Environment Variables (.env)
Create a `.env` file in the `backend` folder (already provided in the template):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=kripto_takip_super_gizli_anahtar_2024_degistir
JWT_EXPIRE=7d
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
CACHE_TTL_MARKETS=60
CACHE_TTL_COIN=30
CACHE_TTL_SEARCH=120
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500
```

### 3. Start the Server
Run the backend server using the development script:
```bash
npm run dev
```
Upon startup, the database file (`database.sqlite`) and its table schema will be generated automatically.

### 4. Open in Browser
To view the application, simply navigate to the following URL in your web browser:
```text
http://localhost:5000
```
*(Note: The Express backend automatically serves the frontend static directory, so you do not need to set up any separate live server).*

---
---

# ◈ CryptoNova — Full-Stack Kripto Para Takip Platformu

*Bu belgeyi diğer dillerde oku: [English (İngilizce)](#-cryptonova--full-stack-cryptocurrency-tracking-platform)*

CryptoNova, gerçek zamanlı kripto para verilerini takip etmenizi sağlayan, premium dark theme ve glassmorphism (cam efekti) tasarım diline sahip, modern ve güvenli bir **Full-Stack Web3/Fintech** uygulamasıdır.

Bu proje; arka planda **Node.js & Express.js** ve yerel **SQLite** veritabanı, ön yüzde ise hiçbir kütüphane veya framework (React, Vue, Tailwind vb.) kullanılmadan tamamen **Vanilla JS, HTML5 ve CSS3** ile geliştirilmiştir.

---

## 🚀 Özellikler

* **Canlı Kripto Verileri (Top 50):** CoinGecko API üzerinden çekilen en güncel fiyatlar, 1s, 24s ve 7g yüzde değişimleri, piyasa değerleri ve hacim bilgileri.
* **Backend Proxy & Önbellekleme (Cache):** API sınırlarına (Rate Limit) takılmamak ve performansı artırmak için tüm CoinGecko istekleri backend sunucusunda `node-cache` ile kısa süreli önbelleğe alınır.
* **Gelişmiş Grafik Sistemi (Canvas):** Dış kütüphane kullanmadan HTML5 Canvas ile el yapımı çizilen, neon parlamalı ve degrade dolgulu fiyat grafikleri ve mini sparkline'lar.
* **Güvenli Kimlik Doğrulama (Auth):**
  * Kayıt Olma (Register) ve Giriş Yapma (Login) işlevleri.
  * **bcryptjs** (salt=12) ile şifrelerin tek yönlü hash'lenmesi.
  * **JSON Web Token (JWT)** tabanlı güvenli oturum yönetimi.
* **Kişisel İzleme Listesi (Watchlist):** LocalStorage yerine doğrudan veritabanında (SQLite) kullanıcının hesabıyla eşleşen favori coin listesi.
* **Debounced Coin Arama:** Kullanıcı yazarken sunucuyu yormayan gecikmeli (debounced) anlık coin arama motoru.
* **Trend & Küresel Veriler:** Son 24 saatte en çok aranan popüler coinler ve küresel kripto piyasası istatistikleri.
* **Premium UI/UX:**
  * Modern koyu tema, mor/cyan neon efektleri ve buzlu cam (glassmorphism) pencereleri.
  * Sayfa yüklenirken verilerin yerini alan parıltılı **Skeleton Loading** kartları.
  * Hata ve başarı durumlarında ekranda beliren animasyonlu **Toast Bildirimleri**.
  * Tamamen responsive (mobil ve tablet uyumlu) esnek tasarım.

---

## 🛠️ Teknoloji Pili (Tech Stack)

* **Front-End:** HTML5 (Semantik & ARIA uyumlu), CSS3 (Custom Properties & Animasyonlar), Vanilla JavaScript (ES6+).
* **Back-End:** Node.js, Express.js.
* **Veritabanı:** SQLite (`better-sqlite3` ile hızlı ve yerel SQL veritabanı).
* **Güvenlik & Yardımcılar:**
  * `jsonwebtoken` (Oturum doğrulama)
  * `bcryptjs` (Şifre şifreleme)
  * `helmet` (HTTP güvenlik başlıkları)
  * `express-rate-limit` (DDoS ve kaba kuvvet saldırısı koruması)
  * `cors` (Güvenli kaynak paylaşımı)
  * `node-cache` (In-memory sunucu önbelleği)

---

## 🗂️ Klasör Yapısı

```text
Canlı Borsa Takip API/
├── backend/
│   ├── db.js                   # SQLite bağlantısı ve tablo şeması
│   ├── server.js               # Express sunucusu ve güvenlik middleware'leri
│   ├── .env                    # Yapılandırma ve JWT anahtarı
│   ├── package.json            # Sunucu bağımlılıkları
│   ├── models/
│   │   └── User.js             # SQLite veritabanı CRUD işlemleri (watchlist dahil)
│   ├── routes/
│   │   ├── auth.js             # Kayıt / Giriş API rotaları
│   │   └── crypto.js           # CoinGecko proxy ve watchlist API rotaları
│   └── middleware/
│       └── auth.js             # JWT koruma middleware'i
│
├── frontend/
│   ├── index.html              # Arayüz iskeleti ve modal pencereleri
│   ├── style.css               # Tasarım sistemi, animasyonlar ve responsive kodlar
│   └── app.js                  # DOM yönetimi, Canvas grafikleri ve API istekleri
│
└── README.md                   # Proje dokümantasyonu
```

---

## 💻 Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edin:

### 1. Bağımlılıkları Kurun
Terminalinizi açıp `backend` klasörünün içine girin ve gerekli Node.js paketlerini yükleyin:
```bash
cd backend
npm install
```

### 2. Yapılandırma (.env) Dosyası
`backend/.env` adında bir dosya oluşturun ve aşağıdaki şablonu yapıştırın (Zaten projenizde mevcuttur):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=kripto_takip_super_gizli_anahtar_2024_degistir
JWT_EXPIRE=7d
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3
CACHE_TTL_MARKETS=60
CACHE_TTL_COIN=30
CACHE_TTL_SEARCH=120
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500
```

### 3. Sunucuyu Başlatın
`backend` dizinindeyken sunucuyu başlatın:
```bash
npm run dev
```

### 4. Tarayıcıda Açın
Uygulamayı çalıştırmak için tarayıcınızda doğrudan şu adrese gidin:
```text
http://localhost:5000
```
