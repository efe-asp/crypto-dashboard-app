/**
 * =============================================================
 * app.js — CryptoNova Vanilla JS Uygulama Motoru
 * =============================================================
 * Modüler yapı:
 *   CONFIG         — Sabitler ve yapılandırma
 *   Utils          — Yardımcı fonksiyonlar (format, zaman vb.)
 *   ParticleSystem — Arka plan partikülleri
 *   API            — Backend proxy üzerinden tüm API çağrıları
 *   AuthManager    — JWT tabanlı kimlik doğrulama yönetimi
 *   UIManager      — DOM güncellemeleri ve render mantığı
 *   ModalManager   — Auth + Coin detay modalları
 *   SearchManager  — Coin arama ve sonuçları
 *   WatchlistManager — Watchlist CRUD operasyonları
 *   ChartManager   — Canvas ile el çizimi fiyat grafiği
 *   ToastManager   — Uygulama içi bildirimler
 *   App            — Ana orkestrasyon + başlatma
 * =============================================================
 */

'use strict';

// =============================================================
// CONFIG — Merkezi yapılandırma
// =============================================================
const CONFIG = Object.freeze({
  API_BASE      : 'http://localhost:5000/api',
  TOKEN_KEY     : 'cryptonova_token',
  USER_KEY      : 'cryptonova_user',
  REFRESH_INTERVAL: 60_000,   // 60 saniyede bir piyasa güncelle
  DEBOUNCE_DELAY  : 400,      // Arama debounce süresi (ms)
  CURRENCIES      : {
    usd: { symbol: '$',  code: 'USD', locale: 'en-US' },
    eur: { symbol: '€',  code: 'EUR', locale: 'de-DE' },
    try: { symbol: '₺',  code: 'TRY', locale: 'tr-TR' }
  }
});

// =============================================================
// UTILS — Yardımcı saf fonksiyonlar
// =============================================================
const Utils = (() => {

  /**
   * Sayıyı para birimi formatına dönüştürür.
   * Büyük sayılar için K/M/B kısaltması kullanır (tablo için).
   * @param {number} num
   * @param {string} currency — 'usd' | 'eur' | 'try'
   * @param {boolean} compact — Kısaltma kullan mı (ör: $1.2B)
   */
  const formatCurrency = (num, currency = 'usd', compact = false) => {
    if (num == null || isNaN(num)) return '—';
    const cfg = CONFIG.CURRENCIES[currency] || CONFIG.CURRENCIES.usd;

    if (compact) {
      const abs = Math.abs(num);
      let value, suffix;
      if      (abs >= 1e12) { value = num / 1e12; suffix = 'T'; }
      else if (abs >= 1e9 ) { value = num / 1e9;  suffix = 'B'; }
      else if (abs >= 1e6 ) { value = num / 1e6;  suffix = 'M'; }
      else if (abs >= 1e3 ) { value = num / 1e3;  suffix = 'K'; }
      else                  { value = num;         suffix = '';  }

      return `${cfg.symbol}${value.toFixed(2)}${suffix}`;
    }

    // Tam format
    const opts = {
      style   : 'currency',
      currency: cfg.code,
      minimumFractionDigits: num < 1 ? 6 : num < 100 ? 4 : 2,
      maximumFractionDigits: num < 1 ? 6 : num < 100 ? 4 : 2
    };

    try {
      return new Intl.NumberFormat(cfg.locale, opts).format(num);
    } catch {
      return `${cfg.symbol}${num.toFixed(2)}`;
    }
  };

  /**
   * Yüzde değerini renkli HTML span olarak döndürür.
   * @param {number} pct — Yüzde değeri
   * @returns {string} HTML string
   */
  const formatPercent = (pct) => {
    if (pct == null || isNaN(pct)) return '<span class="neutral">—</span>';
    const cls   = pct > 0 ? 'positive' : pct < 0 ? 'negative' : 'neutral';
    const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '–';
    return `<span class="${cls}">${arrow} ${Math.abs(pct).toFixed(2)}%</span>`;
  };

  /**
   * Büyük sayıyı okunabilir formata çevirir.
   * @param {number} num
   */
  const formatLargeNumber = (num) => {
    if (num == null || isNaN(num)) return '—';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9 ) return `${(num / 1e9 ).toFixed(2)}B`;
    if (num >= 1e6 ) return `${(num / 1e6 ).toFixed(2)}M`;
    if (num >= 1e3 ) return `${(num / 1e3 ).toFixed(2)}K`;
    return num.toLocaleString('tr-TR');
  };

  /**
   * Debounce: Fonksiyonun çok sık çağrılmasını önler.
   */
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  /**
   * Göreli zaman ifadesi (örn: "3 dakika önce")
   */
  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    const intervals = [
      [31536000, 'yıl'], [2592000, 'ay'], [86400, 'gün'],
      [3600, 'saat'],    [60, 'dakika'],  [1, 'saniye']
    ];
    for (const [secs, label] of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return `${count} ${label} önce`;
    }
    return 'az önce';
  };

  /**
   * Tarihi Türkçe formatlar.
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  /**
   * HTML karakterlerini escapelar (XSS koruması).
   */
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Sayfa yüklendiğinde son güncelleme zamanını göster.
   */
  const updateLastRefreshTime = () => {
    const el = document.getElementById('lastUpdateTime');
    if (el) el.textContent = new Date().toLocaleTimeString('tr-TR');
  };

  return {
    formatCurrency, formatPercent, formatLargeNumber,
    debounce, timeAgo, formatDate, escapeHtml, updateLastRefreshTime
  };
})();

// =============================================================
// ParticleSystem — Arka plan partikülleri (Canvas)
// =============================================================
const ParticleSystem = (() => {
  let canvas, ctx, particles = [], animId;
  const PARTICLE_COUNT = 60;

  const init = () => {
    canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    createParticles();
    animate();
    window.addEventListener('resize', resize);
  };

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const createParticles = () => {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x    : Math.random() * canvas.width,
        y    : Math.random() * canvas.height,
        vx   : (Math.random() - 0.5) * 0.3,
        vy   : (Math.random() - 0.5) * 0.3,
        size : Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
        // Rastgele renk: cyan veya purple
        color: Math.random() > 0.5 ? '0, 245, 255' : '168, 85, 247'
      });
    }
  };

  const animate = () => {
    animId = requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      // Hareket
      p.x += p.vx;
      p.y += p.vy;

      // Sınır kontrolü — karşı taraftan çık
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Çiz
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });

    // Bağlantı çizgileri (yakın partiküller arası)
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 245, 255, ${0.06 * (1 - dist / 100)})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  return { init };
})();

// =============================================================
// ToastManager — Bildirim sistemi
// =============================================================
const ToastManager = (() => {
  const container = () => document.getElementById('toastContainer');

  const ICONS = {
    success: '✓', error: '✕', info: 'ℹ', warning: '⚠'
  };

  /**
   * @param {string} message  — Gösterilecek mesaj
   * @param {'success'|'error'|'info'|'warning'} type
   * @param {number} duration — Milisaniye cinsinden gösterim süresi
   */
  const show = (message, type = 'info', duration = 4000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${ICONS[type] || 'ℹ'}</span>
      <span class="toast__message">${Utils.escapeHtml(message)}</span>
    `;

    container().appendChild(toast);

    // Bildirimi kaldır: animasyon sınıfını ekle, 420ms sonra DOM'dan sil
    const remove = () => {
      if (!toast.parentNode) return; // Zaten kaldırılmışsa tekrar çalıştırma
      toast.classList.add('toast--removing');
      // animationend güvenilmez olabileceğinden doğrudan setTimeout kullan
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 420);
    };

    const timer = setTimeout(remove, duration);

    // Tıkla — hemen kapat
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });

    return { remove };
  };

  return { show };
})();

// =============================================================
// API — Tüm backend iletişimi
// =============================================================
const API = (() => {

  /**
   * Temel fetch wrapper: Token ekler, hataları işler.
   * @param {string} endpoint — '/crypto/coins' gibi (başında slash)
   * @param {object} options  — fetch options
   */
  const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const url = `${CONFIG.API_BASE}${endpoint}`;

    const response = await fetch(url, { ...options, headers });

    // Token süresi dolmuş
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      // Oturumu temizle (AuthManager bunu yapar ama döngüsel bağımlılığı önlemek için)
      localStorage.removeItem(CONFIG.TOKEN_KEY);
      localStorage.removeItem(CONFIG.USER_KEY);
      ToastManager.show('Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.', 'warning');
      App.handleLogout(false); // Sunucu çağrısı yapma
      throw new Error(data.message || 'Kimlik doğrulama hatası');
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Sunucu geçersiz yanıt döndürdü.');
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP Hatası: ${response.status}`);
    }

    return data;
  };

  // --- Auth ---
  const register = (username, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body  : JSON.stringify({ username, email, password })
    });

  const login = (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body  : JSON.stringify({ email, password })
    });

  const getMe = () => request('/auth/me');

  // --- Crypto ---
  const getCoins = (page = 1, currency = 'usd') =>
    request(`/crypto/coins?page=${page}&currency=${currency}`);

  const getCoin = (id) =>
    request(`/crypto/coin/${encodeURIComponent(id)}`);

  const getCoinChart = (id, days = 7, currency = 'usd') =>
    request(`/crypto/coin/${encodeURIComponent(id)}/chart?days=${days}&currency=${currency}`);

  const searchCoins = (q) =>
    request(`/crypto/search?q=${encodeURIComponent(q)}`);

  const getTrending = () =>
    request('/crypto/trending');

  const getGlobal = () =>
    request('/crypto/global');

  // --- Watchlist ---
  const getWatchlist = () =>
    request('/crypto/watchlist');

  const addToWatchlist = (coinId) =>
    request(`/crypto/watchlist/${encodeURIComponent(coinId)}`, { method: 'POST' });

  const removeFromWatchlist = (coinId) =>
    request(`/crypto/watchlist/${encodeURIComponent(coinId)}`, { method: 'DELETE' });

  return {
    register, login, getMe,
    getCoins, getCoin, getCoinChart, searchCoins, getTrending, getGlobal,
    getWatchlist, addToWatchlist, removeFromWatchlist
  };
})();

// =============================================================
// AuthManager — Kimlik doğrulama durumu
// =============================================================
const AuthManager = (() => {
  let currentUser   = null;
  let userWatchlist = new Set();

  const getToken = () => localStorage.getItem(CONFIG.TOKEN_KEY);

  const isLoggedIn = () => !!getToken() && !!currentUser;

  const setSession = (token, user) => {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    currentUser   = user;
    userWatchlist = new Set(user.watchlist || []);
  };

  const clearSession = () => {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    currentUser   = null;
    userWatchlist = new Set();
  };

  const getUser = () => currentUser;

  const getWatchlist = () => userWatchlist;

  const isInWatchlist = (coinId) => userWatchlist.has(coinId);

  const addToLocalWatchlist = (coinId) => userWatchlist.add(coinId);

  const removeFromLocalWatchlist = (coinId) => userWatchlist.delete(coinId);

  /**
   * Sayfa yüklendiğinde kayıtlı oturumu geri yükle.
   */
  const restoreSession = async () => {
    const token = getToken();
    const savedUser = localStorage.getItem(CONFIG.USER_KEY);

    if (!token || !savedUser) return false;

    try {
      currentUser   = JSON.parse(savedUser);
      userWatchlist = new Set(currentUser.watchlist || []);

      // Token'ı sunucu tarafında doğrula
      const response  = await API.getMe();
      currentUser     = response.user;
      userWatchlist   = new Set(currentUser.watchlist || []);
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(currentUser));
      return true;
    } catch {
      clearSession();
      return false;
    }
  };

  return {
    getToken, isLoggedIn, setSession, clearSession,
    getUser, getWatchlist, isInWatchlist,
    addToLocalWatchlist, removeFromLocalWatchlist,
    restoreSession
  };
})();

// =============================================================
// ChartManager — Canvas ile fiyat grafiği
// =============================================================
const ChartManager = (() => {
  let currentCoinId = null;
  let currentDays   = 7;
  let chartData     = null;

  const getCanvas     = () => document.getElementById('priceChart');
  const getLoader     = () => document.getElementById('chartLoader');

  /**
   * Grafik çizimi: Canvas üzerinde SVG/kütüphane kullanmadan
   * gradient dolgulu çizgi grafik.
   */
  const draw = (prices, isPositive) => {
    const canvas = getCanvas();
    if (!canvas) return;

    const ctx    = canvas.getContext('2d');
    const W      = canvas.parentElement.clientWidth  || 600;
    const H      = canvas.parentElement.clientHeight || 220;
    canvas.width  = W;
    canvas.height = H;

    if (!prices || prices.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font      = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Veri yok', W / 2, H / 2);
      return;
    }

    const pad   = { top: 20, right: 20, bottom: 30, left: 60 };
    const iW    = W - pad.left - pad.right;
    const iH    = H - pad.top  - pad.bottom;

    const vals  = prices.map(p => p[1]);
    const minV  = Math.min(...vals);
    const maxV  = Math.max(...vals);
    const range = maxV - minV || 1;

    // Koordinat dönüştürücüler
    const xOf = (i) => pad.left + (i / (prices.length - 1)) * iW;
    const yOf = (v) => pad.top  + iH - ((v - minV) / range) * iH;

    // Ana renk
    const lineColor = isPositive ? '#10b981' : '#ef4444';
    const gradTop   = isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';

    ctx.clearRect(0, 0, W, H);

    // --- Izgara çizgileri ---
    ctx.setLineDash([4, 6]);
    ctx.lineWidth   = 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (iH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();

      // Y ekseni etiketi
      const labelVal = maxV - (range / gridLines) * i;
      ctx.fillStyle   = 'rgba(255, 255, 255, 0.3)';
      ctx.font        = '10px JetBrains Mono, monospace';
      ctx.textAlign   = 'right';
      ctx.fillText(Utils.formatCurrency(labelVal, 'usd', true), pad.left - 6, y + 3);
    }
    ctx.setLineDash([]);

    // --- Gradient dolgu alanı ---
    const gradient = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    gradient.addColorStop(0,   gradTop);
    gradient.addColorStop(1,   'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    prices.forEach(([ts, v], i) => {
      const x = xOf(i), y = yOf(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // Kapatma yolu (alttan)
    ctx.lineTo(xOf(prices.length - 1), H - pad.bottom);
    ctx.lineTo(xOf(0), H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // --- Ana çizgi ---
    ctx.beginPath();
    ctx.lineWidth   = 2.5;
    ctx.strokeStyle = lineColor;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    prices.forEach(([ts, v], i) => {
      const x = xOf(i), y = yOf(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // --- Glow efekti ---
    ctx.shadowBlur  = 12;
    ctx.shadowColor = lineColor;
    ctx.beginPath();
    ctx.lineWidth   = 1.5;
    prices.forEach(([ts, v], i) => {
      const x = xOf(i), y = yOf(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- Son nokta ---
    const lastX = xOf(prices.length - 1);
    const lastY = yOf(vals[vals.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = lineColor;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const load = async (coinId, days, currency = 'usd') => {
    currentCoinId = coinId;
    currentDays   = days;

    const loader = getLoader();
    if (loader) loader.hidden = false;

    try {
      const response = await API.getCoinChart(coinId, days, currency);
      chartData = response.data.prices;

      // Pozitif mi negatif mi?
      const first = chartData[0]?.[1]  || 0;
      const last  = chartData[chartData.length - 1]?.[1] || 0;
      draw(chartData, last >= first);
    } catch (err) {
      console.error('Grafik yükleme hatası:', err);
      ToastManager.show('Grafik verisi yüklenemedi.', 'error');
    } finally {
      if (loader) loader.hidden = true;
    }
  };

  /**
   * Sparkline: Market tablosu için küçük trend grafiği
   */
  const drawSparkline = (canvas, prices, isPositive) => {
    if (!canvas || !prices || prices.length < 2) return;
    const ctx = canvas.getContext('2d');
    const W   = canvas.width  = 80;
    const H   = canvas.height = 36;

    ctx.clearRect(0, 0, W, H);

    const min   = Math.min(...prices);
    const max   = Math.max(...prices);
    const range = max - min || 1;
    const xStep = W / (prices.length - 1);
    const color = isPositive ? '#10b981' : '#ef4444';

    // Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, isPositive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.beginPath();
    prices.forEach((p, i) => {
      const x = i * xStep;
      const y = H - ((p - min) / range) * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.lineWidth   = 1.5;
    ctx.strokeStyle = color;
    prices.forEach((p, i) => {
      const x = i * xStep;
      const y = H - ((p - min) / range) * (H - 4) - 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  return { draw, load, drawSparkline };
})();

// =============================================================
// ModalManager — Modal açma/kapama/fokus yönetimi
// =============================================================
const ModalManager = (() => {
  let lastFocused = null;

  const open = (overlayId) => {
    lastFocused = document.activeElement;
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.hidden = false;
    // İlk fokuslanabilir elemana geç
    const focusable = overlay.querySelector(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
    document.body.style.overflow = 'hidden';
  };

  const close = (overlayId) => {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) { lastFocused.focus(); lastFocused = null; }
  };

  const closeOnOverlayClick = (overlayId) => {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(overlayId);
    });
  };

  // ESC tuşu ile kapat
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    ['authModalOverlay', 'coinModalOverlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.hidden) close(id);
    });
  });

  return { open, close, closeOnOverlayClick };
})();

// =============================================================
// SearchManager — Coin arama
// =============================================================
const SearchManager = (() => {
  const debouncedSearch = Utils.debounce(performSearch, CONFIG.DEBOUNCE_DELAY);
  let isOpen = false;

  const init = () => {
    const toggle  = document.getElementById('searchToggleBtn');
    const dropdown= document.getElementById('searchDropdown');
    const input   = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');

    if (!toggle) return;

    toggle.addEventListener('click', () => {
      isOpen = !isOpen;
      dropdown.hidden = !isOpen;
      toggle.setAttribute('aria-expanded', isOpen);
      if (isOpen) { input.focus(); input.value = ''; results.innerHTML = ''; }
    });

    input?.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      if (q.length === 0) { results.innerHTML = ''; return; }
      if (q.length >= 1) debouncedSearch(q);
    });

    // Dışarı tıklayınca kapat
    document.addEventListener('click', (e) => {
      if (!document.getElementById('searchWrapper')?.contains(e.target)) {
        dropdown.hidden = true;
        toggle.setAttribute('aria-expanded', false);
        isOpen = false;
      }
    });
  };

  async function performSearch(query) {
    const results = document.getElementById('searchResults');
    if (!results) return;

    results.innerHTML = '<li class="search-empty">Aranıyor...</li>';

    try {
      const response = await API.searchCoins(query);
      const coins    = response.data || [];

      if (coins.length === 0) {
        results.innerHTML = '<li class="search-empty">Sonuç bulunamadı.</li>';
        return;
      }

      results.innerHTML = coins.map(coin => `
        <li class="search-result-item" role="option" tabindex="0"
            data-coin-id="${Utils.escapeHtml(coin.id)}"
            aria-label="${Utils.escapeHtml(coin.name)} (${Utils.escapeHtml(coin.symbol)})">
          <img src="${Utils.escapeHtml(coin.thumb)}" alt="${Utils.escapeHtml(coin.name)}" width="28" height="28"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%23333%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2214%22>₿</text></svg>'" />
          <span class="result-name">${Utils.escapeHtml(coin.name)}</span>
          <span class="result-symbol">${Utils.escapeHtml(coin.symbol)}</span>
          ${coin.market_cap_rank ? `<span class="result-rank">#${coin.market_cap_rank}</span>` : ''}
        </li>
      `).join('');

      // Sonuç tıklama
      results.querySelectorAll('.search-result-item').forEach(item => {
        const openModal = () => {
          const coinId = item.dataset.coinId;
          UIManager.openCoinDetail(coinId);
          document.getElementById('searchDropdown').hidden = true;
          isOpen = false;
        };
        item.addEventListener('click', openModal);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
        });
      });

    } catch (err) {
      results.innerHTML = '<li class="search-empty">Arama başarısız oldu.</li>';
    }
  }

  return { init };
})();

// =============================================================
// WatchlistManager — Favoriler CRUD
// =============================================================
const WatchlistManager = (() => {

  /**
   * Coin'i watchlist'e ekle veya çıkar.
   * Optimistik UI: Önce UI'ı güncelle, sonra sunucuya gönder.
   */
  const toggle = async (coinId, coinName) => {
    if (!AuthManager.isLoggedIn()) {
      ToastManager.show('İzleme listesi için giriş yapmanız gerekiyor.', 'info');
      ModalManager.open('authModalOverlay');
      return;
    }

    const isIn = AuthManager.isInWatchlist(coinId);

    try {
      if (isIn) {
        // Çıkar
        AuthManager.removeFromLocalWatchlist(coinId);
        updateWatchlistButtons(coinId, false);
        await API.removeFromWatchlist(coinId);
        ToastManager.show(`${coinName} izleme listenizden çıkarıldı.`, 'info');
        // Watchlist bölümünü güncelle
        await renderWatchlist();
      } else {
        // Ekle
        AuthManager.addToLocalWatchlist(coinId);
        updateWatchlistButtons(coinId, true);
        await API.addToWatchlist(coinId);
        ToastManager.show(`${coinName} izleme listenize eklendi! ⭐`, 'success');
        await renderWatchlist();
      }

      // Coin modal'ındaki butonu da güncelle
      updateCoinModalWatchlistBtn(coinId);

    } catch (err) {
      // Geri al (optimistic UI rollback)
      if (isIn) {
        AuthManager.addToLocalWatchlist(coinId);
        updateWatchlistButtons(coinId, true);
      } else {
        AuthManager.removeFromLocalWatchlist(coinId);
        updateWatchlistButtons(coinId, false);
      }
      ToastManager.show(err.message || 'İşlem gerçekleştirilemedi.', 'error');
    }
  };

  /**
   * Tüm watchlist düğmelerini (tablo satırları) günceller.
   */
  const updateWatchlistButtons = (coinId, isActive) => {
    document.querySelectorAll(`.watchlist-btn[data-coin-id="${CSS.escape(coinId)}"]`).forEach(btn => {
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-label',
        isActive ? `${coinId} izleme listesinden çıkar` : `${coinId} izleme listesine ekle`
      );
    });
  };

  const updateCoinModalWatchlistBtn = (coinId) => {
    const btn = document.getElementById('coinModalWatchlistBtn');
    if (!btn || btn.dataset.coinId !== coinId) return;
    const isActive = AuthManager.isInWatchlist(coinId);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-label',
      isActive ? 'İzleme listesinden çıkar' : 'İzleme listesine ekle'
    );
  };

  /**
   * Watchlist bölümünü render et.
   */
  const renderWatchlist = async () => {
    const section = document.getElementById('watchlistSection');
    const grid    = document.getElementById('watchlistGrid');
    const empty   = document.getElementById('watchlistEmpty');

    if (!AuthManager.isLoggedIn()) {
      if (section) section.hidden = true;
      return;
    }

    if (section) section.hidden = false;

    if (AuthManager.getWatchlist().size === 0) {
      grid.innerHTML  = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    try {
      const response = await API.getWatchlist();
      const coins    = response.data || [];

      if (coins.length === 0) {
        grid.innerHTML = '';
        empty.hidden   = false;
        return;
      }

      const currentCurrency = App.getCurrentCurrency();

      grid.innerHTML = coins.map(coin => {
        const change24h = coin.price_change_percentage_24h_in_currency
          ?? coin.price_change_percentage_24h ?? 0;
        const isPositive = change24h >= 0;

        return `
          <div class="watchlist-coin-card" role="listitem"
               data-coin-id="${Utils.escapeHtml(coin.id)}"
               tabindex="0"
               aria-label="${Utils.escapeHtml(coin.name)} detayları">
            <div class="wl-card__header">
              <div class="wl-card__coin">
                <img src="${Utils.escapeHtml(coin.image)}" alt="${Utils.escapeHtml(coin.name)}"
                     width="40" height="40"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%23333%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2218%22>₿</text></svg>'" />
                <div>
                  <div class="wl-card__name">${Utils.escapeHtml(coin.name)}</div>
                  <div class="wl-card__symbol">${Utils.escapeHtml(coin.symbol)}</div>
                </div>
              </div>
              <button class="wl-card__remove" data-coin-id="${Utils.escapeHtml(coin.id)}"
                      data-coin-name="${Utils.escapeHtml(coin.name)}"
                      aria-label="${Utils.escapeHtml(coin.name)} izleme listesinden çıkar"
                      title="Listeden çıkar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="wl-card__price">
              ${Utils.formatCurrency(coin.current_price, currentCurrency)}
            </div>
            <div class="wl-card__change ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '▲' : '▼'} ${Math.abs(change24h).toFixed(2)}%
              <span style="color:var(--text-muted);font-weight:400;margin-left:4px;font-size:11px;">24s</span>
            </div>
            <div class="wl-card__sparkline">
              <canvas class="wl-sparkline-canvas" data-coin-id="${Utils.escapeHtml(coin.id)}"
                      width="100%" height="40"
                      aria-hidden="true"></canvas>
            </div>
          </div>
        `;
      }).join('');

      // Sparkline'ları çiz
      grid.querySelectorAll('.wl-sparkline-canvas').forEach(canvas => {
        const coinId   = canvas.dataset.coinId;
        const coinData = coins.find(c => c.id === coinId);
        if (coinData?.sparkline_in_7d?.price) {
          const prices    = coinData.sparkline_in_7d.price;
          const change    = coinData.price_change_percentage_7d_in_currency ?? 0;
          ChartManager.drawSparkline(canvas, prices, change >= 0);
        }
      });

      // Kart tıklama — coin detay
      grid.querySelectorAll('.watchlist-coin-card').forEach(card => {
        card.addEventListener('click', (e) => {
          // Remove butonuna tıklandıysa kart tıklamasını engelle
          if (e.target.closest('.wl-card__remove')) return;
          UIManager.openCoinDetail(card.dataset.coinId);
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.target.closest('.wl-card__remove')) {
            UIManager.openCoinDetail(card.dataset.coinId);
          }
        });
      });

      // Çıkarma butonları
      grid.querySelectorAll('.wl-card__remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggle(btn.dataset.coinId, btn.dataset.coinName);
        });
      });

    } catch (err) {
      console.error('Watchlist render hatası:', err);
      grid.innerHTML = `<p style="color:var(--text-muted);padding:var(--space-4);">İzleme listesi yüklenemedi.</p>`;
    }
  };

  return { toggle, renderWatchlist, updateWatchlistButtons };
})();

// =============================================================
// UIManager — DOM render + orchestration
// =============================================================
const UIManager = (() => {
  let currentPage     = 1;
  let currentCurrency = 'usd';
  let allCoins        = [];
  let sortKey         = null;
  let sortDir         = 'desc'; // 'asc' | 'desc'

  // ---- Küresel piyasa istatistikleri (Hero bölümü) ----
  const renderGlobalStats = async () => {
    try {
      const response = await API.getGlobal();
      const data     = response.data;

      const mcap      = data.total_market_cap?.usd;
      const vol       = data.total_volume?.usd;
      const btcDom    = data.market_cap_percentage?.btc;
      const numCoins  = data.active_cryptocurrencies;
      const mcapChange= data.market_cap_change_percentage_24h_usd;

      const setVal = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };

      setVal('statMarketCapValue',  Utils.formatCurrency(mcap, 'usd', true));
      setVal('statVolumeValue',     Utils.formatCurrency(vol,  'usd', true));
      setVal('statBtcDomValue',     btcDom ? `${btcDom.toFixed(1)}%` : '—');
      setVal('statCoinsValue',      numCoins ? numCoins.toLocaleString('tr-TR') : '—');

      if (mcapChange != null) {
        const el  = document.getElementById('statMarketCapChange');
        const dir = mcapChange >= 0 ? '▲' : '▼';
        if (el) {
          el.textContent = `${dir} ${Math.abs(mcapChange).toFixed(2)}% 24s`;
          el.className   = `stat-card__change ${mcapChange >= 0 ? 'positive' : 'negative'}`;
        }
      }

    } catch (err) {
      console.error('Global istatistik hatası:', err);
    }
  };

  // ---- Ticker bant (navbar) ----
  const renderTicker = (coins) => {
    const inner = document.getElementById('tickerInner');
    if (!inner || !coins?.length) return;

    // İlk 15 coini al, sonra tekrar et (sonsuz kayma için)
    const items = [...coins.slice(0, 15), ...coins.slice(0, 15)];
    inner.innerHTML = items.map(c => {
      const change = c.price_change_percentage_24h ?? 0;
      const cls    = change >= 0 ? 'positive' : 'negative';
      return `
        <span class="ticker-item">
          <span class="ticker-name">${Utils.escapeHtml(c.symbol?.toUpperCase())}</span>
          <span class="ticker-price">${Utils.formatCurrency(c.current_price, 'usd')}</span>
          <span class="ticker-change ${cls}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>
        </span>
      `;
    }).join('<span style="color:var(--color-border);margin:0 8px;">•</span>');
  };

  // ---- Trend coinler ----
  const renderTrending = async () => {
    const grid = document.getElementById('trendingGrid');
    if (!grid) return;

    try {
      const response = await API.getTrending();
      const coins    = response.data || [];

      grid.innerHTML = coins.map((coin, idx) => `
        <div class="trending-card" role="listitem" tabindex="0"
             data-coin-id="${Utils.escapeHtml(coin.id)}"
             aria-label="${Utils.escapeHtml(coin.name)} trend coin">
          <img src="${Utils.escapeHtml(coin.thumb)}" alt="${Utils.escapeHtml(coin.name)}"
               width="32" height="32"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%23333%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22>₿</text></svg>'" />
          <div class="trending-card__info">
            <div class="trending-card__name">${Utils.escapeHtml(coin.name)}</div>
            <div class="trending-card__symbol">${Utils.escapeHtml(coin.symbol)}</div>
          </div>
          <span class="trending-card__rank">#${idx + 1}</span>
        </div>
      `).join('');

      // Tıklama
      grid.querySelectorAll('.trending-card').forEach(card => {
        const openDetail = () => openCoinDetail(card.dataset.coinId);
        card.addEventListener('click', openDetail);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); }
        });
      });

    } catch (err) {
      console.error('Trending render hatası:', err);
      grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">Trend verisi yüklenemedi.</p>`;
    }
  };

  // ---- Market Tablosu ----
  const renderMarketTable = async (page = 1, currency = 'usd') => {
    currentPage     = page;
    currentCurrency = currency;

    const tbody   = document.getElementById('marketTableBody');
    const pageInfo= document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (!tbody) return;

    // Skeleton göster
    tbody.innerHTML = Array(8).fill(`
      <tr class="skeleton-row" aria-hidden="true">
        <td colspan="10"><div class="skeleton-line"></div></td>
      </tr>
    `).join('');

    try {
      const response = await API.getCoins(page, currency);
      allCoins       = response.data || [];

      // Sayfalama
      if (pageInfo) pageInfo.textContent = `Sayfa ${page}`;
      if (prevBtn)  prevBtn.disabled     = page <= 1;
      if (nextBtn)  nextBtn.disabled     = allCoins.length < 50;

      renderTableRows(allCoins, currency);

      // Ticker'ı güncelle (ilk sayfada)
      if (page === 1) renderTicker(allCoins);

      Utils.updateLastRefreshTime();

    } catch (err) {
      console.error('Market tablosu hatası:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center;padding:var(--space-8);color:var(--text-muted);">
            Piyasa verileri yüklenemedi. Sunucunun çalıştığından emin olun.
          </td>
        </tr>
      `;
    }
  };

  const renderTableRows = (coins, currency = currentCurrency) => {
    const tbody = document.getElementById('marketTableBody');
    if (!tbody) return;

    const userWl = AuthManager.getWatchlist();

    tbody.innerHTML = coins.map(coin => {
      const change1h  = coin.price_change_percentage_1h_in_currency  ?? null;
      const change24h = coin.price_change_percentage_24h_in_currency ?? coin.price_change_percentage_24h ?? null;
      const change7d  = coin.price_change_percentage_7d_in_currency  ?? null;
      const isWl      = userWl.has(coin.id);

      return `
        <tr data-coin-id="${Utils.escapeHtml(coin.id)}" tabindex="0"
            aria-label="${Utils.escapeHtml(coin.name)} fiyat satırı">
          <td class="col-rank">${coin.market_cap_rank ?? '—'}</td>
          <td class="col-coin">
            <div class="coin-cell">
              <img src="${Utils.escapeHtml(coin.image)}" alt="${Utils.escapeHtml(coin.name)}"
                   width="32" height="32"
                   onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%23333%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2212%22>₿</text></svg>'" />
              <div>
                <span class="coin-cell__name">${Utils.escapeHtml(coin.name)}</span>
                <span class="coin-cell__symbol">${Utils.escapeHtml(coin.symbol?.toUpperCase())}</span>
              </div>
            </div>
          </td>
          <td class="col-price">${Utils.formatCurrency(coin.current_price, currency)}</td>
          <td class="col-1h">${Utils.formatPercent(change1h)}</td>
          <td class="col-24h">${Utils.formatPercent(change24h)}</td>
          <td class="col-7d">${Utils.formatPercent(change7d)}</td>
          <td class="col-mcap">${Utils.formatCurrency(coin.market_cap, currency, true)}</td>
          <td class="col-volume">${Utils.formatCurrency(coin.total_volume, currency, true)}</td>
          <td class="col-spark">
            <canvas class="sparkline-canvas"
                    width="80" height="36"
                    aria-hidden="true"></canvas>
          </td>
          <td class="col-action">
            <button class="watchlist-btn ${isWl ? 'active' : ''}"
                    data-coin-id="${Utils.escapeHtml(coin.id)}"
                    data-coin-name="${Utils.escapeHtml(coin.name)}"
                    aria-label="${isWl ? coin.name + ' izleme listesinden çıkar' : coin.name + ' izleme listesine ekle'}"
                    title="${isWl ? 'Listeden çıkar' : 'Listeye ekle'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="${isWl ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Sparkline'ları çiz — veriyi doğrudan coin dizisinden al (data attribute parse sorunu yok)
    requestAnimationFrame(() => {
      coins.forEach(coin => {
        const row = tbody.querySelector(`tr[data-coin-id="${CSS.escape(coin.id)}"]`);
        if (!row) return;
        const canvas = row.querySelector('.sparkline-canvas');
        if (!canvas) return;
        const prices = coin.sparkline_in_7d?.price;
        if (!prices || prices.length < 2) return;
        const change  = coin.price_change_percentage_7d_in_currency
                     ?? coin.price_change_percentage_24h
                     ?? 0;
        ChartManager.drawSparkline(canvas, prices, change >= 0);
      });
    });

    // Satır tıklama — coin detay
    tbody.querySelectorAll('tr[data-coin-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.watchlist-btn')) return;
        openCoinDetail(row.dataset.coinId);
      });
      row.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.watchlist-btn')) {
          e.preventDefault();
          openCoinDetail(row.dataset.coinId);
        }
      });
    });

    // Watchlist butonları
    tbody.querySelectorAll('.watchlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        WatchlistManager.toggle(btn.dataset.coinId, btn.dataset.coinName);
      });
    });
  };

  // ---- Coin Detay Modal ----
  const openCoinDetail = async (coinId) => {
    // Modal'ı aç, yükleniyor durumunu göster
    ModalManager.open('coinModalOverlay');

    // Reset
    const setEl = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };
    setEl('coinModalTitle',  '—');
    setEl('coinModalSymbol', '—');
    setEl('coinModalRank',   '#—');
    setEl('coinModalPrice',  '—');
    document.getElementById('coinModalLogo')?.setAttribute('src', '');
    document.getElementById('chartLoader')?.toggleAttribute('hidden', false);

    // Grafik period resetle
    document.querySelectorAll('.chart-period').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.days === '7');
    });

    try {
      const response = await API.getCoin(coinId);
      const coin     = response.data;

      // Logo
      const logo = document.getElementById('coinModalLogo');
      if (logo) {
        logo.src = coin.image?.large || coin.image?.small || '';
        logo.alt = coin.name || '';
      }

      // Başlık bilgileri
      setEl('coinModalTitle',  coin.name);
      setEl('coinModalSymbol', coin.symbol?.toUpperCase());
      setEl('coinModalRank',   `#${coin.market_cap_rank ?? '—'}`);

      // Fiyat
      const price = coin.market_data?.current_price?.usd;
      setEl('coinModalPrice', Utils.formatCurrency(price, 'usd'));

      // Yüzde değişimler
      const mkt = coin.market_data || {};
      const setBadge = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (value == null) { el.textContent = '—'; el.className = 'change-badge neutral'; return; }
        const sign = value >= 0 ? '+' : '';
        el.textContent = `${id.replace('coinModal', '')} ${sign}${value.toFixed(2)}%`;
        el.className = `change-badge ${value >= 0 ? 'positive' : 'negative'}`;
      };

      document.getElementById('coinModal1h').textContent  = '';
      document.getElementById('coinModal24h').textContent = '';
      document.getElementById('coinModal7d').textContent  = '';

      setBadge('coinModal1h',  mkt.price_change_percentage_1h_in_currency?.usd);
      setBadge('coinModal24h', mkt.price_change_percentage_24h_in_currency?.usd ?? mkt.price_change_percentage_24h);
      setBadge('coinModal7d',  mkt.price_change_percentage_7d_in_currency?.usd);

      // İstatistikler
      setEl('statMcap',      Utils.formatCurrency(mkt.market_cap?.usd, 'usd', true));
      setEl('statVol',       Utils.formatCurrency(mkt.total_volume?.usd, 'usd', true));
      setEl('statSupply',    mkt.circulating_supply ? Utils.formatLargeNumber(mkt.circulating_supply) + ` ${coin.symbol?.toUpperCase()}` : '—');
      setEl('statMaxSupply', mkt.max_supply ? Utils.formatLargeNumber(mkt.max_supply) + ` ${coin.symbol?.toUpperCase()}` : '∞');
      setEl('statHigh',      Utils.formatCurrency(mkt.high_24h?.usd, 'usd'));
      setEl('statLow',       Utils.formatCurrency(mkt.low_24h?.usd, 'usd'));
      setEl('statATH',       Utils.formatCurrency(mkt.ath?.usd, 'usd'));

      const athChange = mkt.ath_change_percentage?.usd;
      const athEl     = document.getElementById('statATHChange');
      if (athEl) {
        athEl.textContent = athChange != null ? `${athChange.toFixed(1)}%` : '—';
        athEl.className   = `coin-stat__value ${athChange != null ? (athChange >= 0 ? 'positive' : 'negative') : ''}`;
      }

      // Watchlist butonu
      const wlBtn = document.getElementById('coinModalWatchlistBtn');
      if (wlBtn) {
        wlBtn.dataset.coinId   = coinId;
        wlBtn.dataset.coinName = coin.name;
        const isWl = AuthManager.isInWatchlist(coinId);
        wlBtn.classList.toggle('active', isWl);
        wlBtn.setAttribute('aria-label', isWl ? 'İzleme listesinden çıkar' : 'İzleme listesine ekle');
      }

      // Grafiği yükle
      await ChartManager.load(coinId, 7, 'usd');

    } catch (err) {
      console.error('Coin detay hatası:', err);
      ToastManager.show('Coin bilgisi yüklenemedi.', 'error');
      ModalManager.close('coinModalOverlay');
    }
  };

  // ---- Auth UI güncellemeleri ----
  const updateAuthUI = () => {
    const isLoggedIn = AuthManager.isLoggedIn();
    const user       = AuthManager.getUser();

    document.getElementById('authButtons')?.toggleAttribute('hidden', isLoggedIn);
    document.getElementById('userMenu')?.toggleAttribute('hidden', !isLoggedIn);

    if (isLoggedIn && user) {
      const initial = (user.username || user.email || 'U')[0].toUpperCase();
      const avatar  = document.getElementById('userAvatar');
      if (avatar) avatar.textContent = initial;

      const navUsername = document.getElementById('navUsername');
      if (navUsername) navUsername.textContent = user.username || 'Kullanıcı';

      const dropEmail = document.getElementById('dropdownEmail');
      if (dropEmail) dropEmail.textContent = user.email || '';
    }
  };

  // ---- Tablo sıralama ----
  const sortTable = (key) => {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = key === 'price' || key === 'mcap' ? 'desc' : 'asc';
    }

    const sorted = [...allCoins].sort((a, b) => {
      let valA, valB;
      switch (key) {
        case 'price': valA = a.current_price;                            valB = b.current_price;                            break;
        case '1h':    valA = a.price_change_percentage_1h_in_currency;   valB = b.price_change_percentage_1h_in_currency;   break;
        case '24h':   valA = a.price_change_percentage_24h;              valB = b.price_change_percentage_24h;              break;
        case '7d':    valA = a.price_change_percentage_7d_in_currency;   valB = b.price_change_percentage_7d_in_currency;   break;
        case 'mcap':  valA = a.market_cap;                               valB = b.market_cap;                               break;
        default: return 0;
      }
      if (valA == null) return 1;
      if (valB == null) return -1;
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

    // Başlık aria-sort güncelle
    document.querySelectorAll('.market-table th.sortable').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      th.setAttribute('aria-sort', 'none');
    });
    const activeTh = document.querySelector(`.market-table th[data-sort="${key}"]`);
    if (activeTh) {
      activeTh.classList.add(sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc');
      activeTh.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
    }

    renderTableRows(sorted);
  };

  // Getter'lar
  const getCurrentCurrency = () => currentCurrency;
  const getCurrentPage     = () => currentPage;

  return {
    renderGlobalStats, renderTrending, renderMarketTable,
    updateAuthUI, openCoinDetail, sortTable,
    getCurrentCurrency, getCurrentPage
  };
})();

// =============================================================
// App — Ana orkestrasyon + olay dinleyicileri
// =============================================================
const App = (() => {
  let refreshTimer   = null;
  let currentCurrency= 'usd';

  const getCurrentCurrency = () => currentCurrency;

  // ── Auth Form yardımcıları ──────────────────────────────────

  const setAuthAlert = (message, type = 'error') => {
    const el = document.getElementById('authAlert');
    if (!el) return;
    el.textContent = message;
    el.className   = `auth-alert ${type}`;
    el.hidden      = !message;
  };

  const setButtonLoading = (btnId, loading, text) => {
    const btn     = document.getElementById(btnId);
    if (!btn) return;
    const textEl  = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled  = loading;
    if (textEl)  textEl.textContent = loading ? (text || 'İşleniyor...') : textEl.dataset.original || textEl.textContent;
    if (spinner) spinner.hidden = !loading;
    if (loading && textEl && !textEl.dataset.original) textEl.dataset.original = textEl.textContent;
  };

  // ── Olay Bağlama: Auth Modal ───────────────────────────────

  const bindAuthModal = () => {
    // Açma
    document.getElementById('loginBtn')?.addEventListener('click', () => {
      switchAuthTab('login');
      setAuthAlert('');
      ModalManager.open('authModalOverlay');
    });

    document.getElementById('registerBtn')?.addEventListener('click', () => {
      switchAuthTab('register');
      setAuthAlert('');
      ModalManager.open('authModalOverlay');
    });

    // Kapama
    document.getElementById('closeAuthModal')?.addEventListener('click', () => {
      ModalManager.close('authModalOverlay');
    });

    ModalManager.closeOnOverlayClick('authModalOverlay');

    // Sekme değiştirme
    document.getElementById('loginTab')?.addEventListener('click',    () => switchAuthTab('login'));
    document.getElementById('registerTab')?.addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('switchToRegister')?.addEventListener('click', () => switchAuthTab('register'));
    document.getElementById('switchToLogin')?.addEventListener('click',    () => switchAuthTab('login'));

    // Şifre göster/gizle butonları
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.setAttribute('aria-label',
          input.type === 'password' ? 'Şifreyi göster' : 'Şifreyi gizle'
        );
      });
    });

    // Şifre gücü göstergesi
    document.getElementById('registerPassword')?.addEventListener('input', (e) => {
      checkPasswordStrength(e.target.value);
    });

    // Login formu
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);

    // Register formu
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
  };

  const switchAuthTab = (tab) => {
    const loginPanel    = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const loginTab      = document.getElementById('loginTab');
    const registerTab   = document.getElementById('registerTab');

    if (tab === 'login') {
      loginPanel.hidden    = false;
      registerPanel.hidden = true;
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginTab.setAttribute('aria-selected', 'true');
      registerTab.setAttribute('aria-selected', 'false');
    } else {
      loginPanel.hidden    = true;
      registerPanel.hidden = false;
      loginTab.classList.remove('active');
      registerTab.classList.add('active');
      loginTab.setAttribute('aria-selected', 'false');
      registerTab.setAttribute('aria-selected', 'true');
    }
    setAuthAlert('');
  };

  const checkPasswordStrength = (password) => {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;

    let score = 0;
    if (password.length >= 6)                          score++;
    if (password.length >= 10)                         score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password))               score++;

    const levels = [
      { cls: '', text: '' },
      { cls: 'weak',   text: 'Zayıf',   color: 'var(--red)'  },
      { cls: 'fair',   text: 'Orta',    color: 'var(--gold)' },
      { cls: 'strong', text: 'Güçlü',   color: 'var(--green)'},
      { cls: 'strong', text: 'Çok Güçlü', color: 'var(--cyan)'}
    ];

    const level = levels[Math.min(score, 4)];
    fill.className = `strength-fill ${level.cls}`;
    label.textContent = level.text;
    label.style.color = level.color || '';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
      setAuthAlert('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    setButtonLoading('loginSubmitBtn', true, 'Giriş Yapılıyor...');
    setAuthAlert('');

    try {
      const response = await API.login(email, password);
      AuthManager.setSession(response.token, response.user);

      ModalManager.close('authModalOverlay');
      UIManager.updateAuthUI();
      ToastManager.show(`Hoş geldiniz, ${response.user.username}! 🚀`, 'success');

      // Watchlist'i yükle ve göster
      await WatchlistManager.renderWatchlist();
      // Tablo satırlarındaki watchlist butonlarını güncelle
      UIManager.renderMarketTable(UIManager.getCurrentPage?.() || 1, currentCurrency);

    } catch (err) {
      setAuthAlert(err.message || 'Giriş başarısız.', 'error');
    } finally {
      setButtonLoading('loginSubmitBtn', false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername')?.value?.trim();
    const email    = document.getElementById('registerEmail')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;

    if (!username || !email || !password) {
      setAuthAlert('Lütfen tüm alanları doldurun.', 'error');
      return;
    }

    if (password.length < 6) {
      setAuthAlert('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }

    setButtonLoading('registerSubmitBtn', true, 'Hesap Oluşturuluyor...');
    setAuthAlert('');

    try {
      const response = await API.register(username, email, password);
      AuthManager.setSession(response.token, response.user);

      ModalManager.close('authModalOverlay');
      UIManager.updateAuthUI();
      ToastManager.show(`Hesabınız oluşturuldu! Hoş geldiniz, ${response.user.username}! 🎉`, 'success');

      await WatchlistManager.renderWatchlist();
      UIManager.renderMarketTable(1, currentCurrency);

    } catch (err) {
      setAuthAlert(err.message || 'Kayıt başarısız.', 'error');
    } finally {
      setButtonLoading('registerSubmitBtn', false);
    }
  };

  // ── Olay Bağlama: Coin Modal ────────────────────────────────

  const bindCoinModal = () => {
    document.getElementById('closeCoinModal')?.addEventListener('click', () => {
      ModalManager.close('coinModalOverlay');
    });

    ModalManager.closeOnOverlayClick('coinModalOverlay');

    // Grafik periyot butonları
    document.querySelectorAll('.chart-period').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.chart-period').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        const coinId = document.getElementById('coinModalWatchlistBtn')?.dataset.coinId;
        if (coinId) {
          await ChartManager.load(coinId, btn.dataset.days, 'usd');
        }
      });
    });

    // Watchlist butonu (modal içindeki büyük buton)
    document.getElementById('coinModalWatchlistBtn')?.addEventListener('click', (e) => {
      const btn  = e.currentTarget;
      const id   = btn.dataset.coinId;
      const name = btn.dataset.coinName;
      if (id) WatchlistManager.toggle(id, name);
    });
  };

  // ── Olay Bağlama: Navbar ────────────────────────────────────

  const bindNavbar = () => {
    // Kullanıcı menüsü dropdown
    const trigger  = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userDropdown');

    trigger?.addEventListener('click', () => {
      const isOpen = !dropdown.hidden;
      dropdown.hidden = isOpen;
      trigger.setAttribute('aria-expanded', !isOpen);
    });

    // Dışarı tıkla
    document.addEventListener('click', (e) => {
      if (!document.getElementById('userMenu')?.contains(e.target)) {
        if (dropdown) dropdown.hidden = true;
        trigger?.setAttribute('aria-expanded', 'false');
      }
    });

    // Çıkış
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Watchlist'e git (menüden)
    document.getElementById('watchlistNavBtn')?.addEventListener('click', () => {
      if (dropdown) dropdown.hidden = true;
      document.getElementById('watchlistSection')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Hero butonları
    document.getElementById('heroExploreBtn')?.addEventListener('click', () => {
      document.getElementById('marketSection')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('heroWatchlistBtn')?.addEventListener('click', () => {
      if (!AuthManager.isLoggedIn()) {
        ModalManager.open('authModalOverlay');
        return;
      }
      document.getElementById('watchlistSection')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Logo tıklama
    document.getElementById('logoHome')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // ── Olay Bağlama: Market Tablosu ───────────────────────────

  const bindMarketTable = () => {
    // Sayfalama
    document.getElementById('prevPage')?.addEventListener('click', () => {
      const page = UIManager.getCurrentPage?.() || 1;
      if (page > 1) UIManager.renderMarketTable(page - 1, currentCurrency);
    });

    document.getElementById('nextPage')?.addEventListener('click', () => {
      const page = UIManager.getCurrentPage?.() || 1;
      UIManager.renderMarketTable(page + 1, currentCurrency);
    });

    // Para birimi sekmeleri
    document.querySelectorAll('.currency-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.currency-tab').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        currentCurrency = btn.dataset.currency;
        UIManager.renderMarketTable(1, currentCurrency);
      });
    });

    // Sıralanabilir başlıklar
    document.querySelectorAll('.market-table th.sortable').forEach(th => {
      th.addEventListener('click', () => UIManager.sortTable(th.dataset.sort));
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          UIManager.sortTable(th.dataset.sort);
        }
      });
    });
  };

  // ── Logout ─────────────────────────────────────────────────

  const handleLogout = async (callServer = true) => {
    const username = AuthManager.getUser()?.username;
    AuthManager.clearSession();
    UIManager.updateAuthUI();

    // Watchlist bölümünü gizle
    const wlSection = document.getElementById('watchlistSection');
    if (wlSection) wlSection.hidden = true;

    // Tablo watchlist butonlarını resetle
    document.querySelectorAll('.watchlist-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.querySelector('svg')?.setAttribute('fill', 'none');
    });

    // Kullanıcı menüsünü kapat
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.hidden = true;

    if (username) {
      ToastManager.show(`Güle güle, ${username}! 👋`, 'info');
    }
  };

  // ── Otomatik Yenileme ───────────────────────────────────────

  const startAutoRefresh = () => {
    stopAutoRefresh();
    refreshTimer = setInterval(async () => {
      console.log('🔄 Otomatik güncelleme...');
      await UIManager.renderMarketTable(UIManager.getCurrentPage?.() || 1, currentCurrency);
      await UIManager.renderGlobalStats();
      if (AuthManager.isLoggedIn()) await WatchlistManager.renderWatchlist();
    }, CONFIG.REFRESH_INTERVAL);
  };

  const stopAutoRefresh = () => {
    if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  };

  // ── Init ────────────────────────────────────────────────────

  const init = async () => {
    console.log('🚀 CryptoNova başlatılıyor...');

    // Arka plan partikülleri
    ParticleSystem.init();

    // Olay dinleyicilerini bağla
    bindAuthModal();
    bindCoinModal();
    bindNavbar();
    bindMarketTable();
    SearchManager.init();

    // Oturumu geri yükle
    const sessionRestored = await AuthManager.restoreSession();
    UIManager.updateAuthUI();

    // Paralel veri yükleme
    await Promise.allSettled([
      UIManager.renderGlobalStats(),
      UIManager.renderTrending(),
      UIManager.renderMarketTable(1, currentCurrency),
      sessionRestored ? WatchlistManager.renderWatchlist() : Promise.resolve()
    ]);

    // Otomatik yenileme başlat
    startAutoRefresh();

    console.log('✅ CryptoNova hazır!');
  };

  return {
    init,
    handleLogout,
    getCurrentCurrency: () => currentCurrency
  };
})();

// =============================================================
// BAŞLAT
// =============================================================
document.addEventListener('DOMContentLoaded', () => App.init());
