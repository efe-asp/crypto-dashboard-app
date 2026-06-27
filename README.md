# ◈ CryptoNova — Full-Stack Kripto Para Takip Platformu

CryptoNova, gerçek zamanlı kripto para verilerini takip etmenizi sağlayan, premium dark theme ve glassmorphism (cam efekti) tasarım diline sahip, modern ve güvenli bir **Full-Stack Web3/Fintech** uygulamasıdır.

Bu proje; arka planda **Node.js & Express.js** ve yerel **SQLite** veritabanı, ön yüzde ise hiçbir kütüphane veya framework (React, Vue, Tailwind vb.) kullanılmadan tamamen **Vanilla JS, HTML5 ve CSS3** ile geliştirilmiştir.

---

## 🚀 Özellikler

* **Canlı Kripto Verileri (Top 50):** CoinGecko API üzerinden çekilen en güncel fiyatlar, 1s, 24s ve 7g yüzde değişimleri, piyasa değerleri ve hacim bilgileri.
* **Backend Proxy & Önbellekleme (Cache):** API sınırlarına (Rate Limit) takılmamak ve performansı artırmak için tüm CoinGecko istekleri backend sunucusunda `node-cache` ile kısa süreli önbelleğe alınır.
* **Gelişmiş Grafik Sistemi (Canvas):** Dış kütüphane kullanmadan HTML5 Canvas ile el yapımı çizilen, neon parlamalı ve degrade dolgulu 24 saatlik/30 günlük interaktif fiyat grafikleri ve mini sparkline'lar.
* **Güvenli Kimlik Doğrulama (Auth):**
  * Kayıt Olma (Register) ve Giriş Yapma (Login) işlevleri.
  * **bcryptjs** (salt=12) ile şifrelerin kırılması imkansız şekilde tek yönlü hash'lenmesi.
  * **JSON Web Token (JWT)** tabanlı güvenli oturum yönetimi.
* **Kişisel İzleme Listesi (Watchlist):** LocalStorage yerine doğrudan veritabanında (SQLite) kullanıcının hesabıyla eşleşen, dinamik ekleme/çıkarma yapılabilen favori coin listesi.
* **Debounced Coin Arama:** Kullanıcı yazarken sunucuyu yormayan gecikmeli (debounced) anlık coin arama motoru.
* **Trend & Küresel Veriler:** Son 24 saatte en çok aranan popüler coinler ve küresel kripto piyasası istatistikleri (Dominance, Toplam Değer vb.).
* **Premium UI/UX:**
  * Modern koyu tema, mor/cyan neon efektleri ve buzlu cam (glassmorphism) pencereleri.
  * Sayfa yüklenirken verilerin yerini alan parıltılı **Skeleton Loading** kartları.
  * Hata ve başarı durumlarında ekranda beliren animasyonlu **Toast Bildirimleri**.
  * Tamamen responsive (mobil ve tablet uyumlu) esnek tasarım.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

* **Front-End:** HTML5 (Semantik & ARIA uyumlu), CSS3 (Custom Properties & Animasyonlar), Vanilla JavaScript (ES6+).
* **Back-End:** Node.js, Express.js.
* **Veritabanı:** SQLite (`better-sqlite3` driver'ı ile hızlı ve sıfır kurulumlu yerel SQL veritabanı).
* **Güvenlik & Yardımcılar:**
  * `jsonwebtoken` (Oturum doğrulama)
  * `bcryptjs` (Şifre şifreleme)
  * `helmet` (HTTP güvenlik başlıkları ve CSP koruması)
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
Sunucu başarıyla başladığında veritabanı dosyası (`database.sqlite`) otomatik olarak oluşturulacak ve tablolar hazırlanacaktır.

### 4. Tarayıcıda Açın
Uygulamayı çalıştırmak için tarayıcınızda doğrudan şu adrese gidin:
```text
http://localhost:5000
```
*(Not: Express sunucumuz frontend dosyalarını otomatik olarak `http://localhost:5000` üzerinden yayınlamaktadır, ekstra bir canlı sunucu kurmanıza gerek yoktur).*
