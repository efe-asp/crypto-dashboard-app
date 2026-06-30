/**
 * =============================================================
 * CryptoNova v2.0 — Ana Uygulama (app.js)
 * =============================================================
 * Modüller:
 *   I18n       — TR/EN dil sistemi (localStorage'a kaydedilir)
 *   Theme      — Dark/Light tema (localStorage'a kaydedilir)
 *   TabRouter  — 4 sekme SPA navigasyonu
 *   API        — Merkezi fetch servisi
 *   Markets    — Piyasa tablosu, trending, global istatistik
 *   Trade      — Al-Sat paneli
 *   Converter  — Kripto dönüştürücü
 *   Wallet     — Cüzdan, yatır/çek, işlem geçmişi
 *   Auth       — JWT tabanlı giriş/kayıt
 *   Toast      — Bildirim sistemi
 *   CoinModal  — Coin detay modalı + grafik
 * =============================================================
 */

'use strict';

// ============================================================
// CANLI DÖVİZ KURLARI (FIAT)
// ============================================================
const GlobalRates = {
  eur: 0.92,
  try: 46.61,
  async init() {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates) {
        this.eur = data.rates.EUR || this.eur;
        this.try = data.rates.TRY || this.try;
      }
    } catch (e) {
      console.warn('Canlı döviz kurları çekilemedi, varsayılan kurlar kullanılıyor.', e);
    }
  }
};

// ============================================================
// I18N — ÇEVIRI SİSTEMİ
// ============================================================
const LANGS = {
  tr: {
    nav_home      : 'Ana Sayfa',
    nav_markets   : 'Piyasalar',
    nav_trade     : 'Al-Sat',
    nav_converter : 'Dönüştür',
    nav_wallet    : 'Cüzdan',
    nav_history   : 'Geçmiş',
    history_title : 'İşlem Geçmişi',
    history_subtitle: 'Tüm alım ve satım işlemlerinizin finansal dökümü',
    filter_all    : 'Tümü',
    filter_buy    : 'Sadece Alış',
    filter_sell   : 'Sadece Satış',
    col_asset     : 'Varlık',
    col_type      : 'Tip',
    col_amount    : 'Miktar',
    col_price     : 'İşlem Fiyatı',
    col_total     : 'Toplam Tutarı',
    col_date      : 'Tarih',
    history_empty_title: 'Kayıt Bulunamadı',
    history_empty_desc: 'Henüz bir işleminiz bulunmuyor veya aradığınız kriterde sonuç yok.',
    wallet_avg_buy: 'Ortalama Maliyet:',
    pnl_label     : 'Kâr / Zarar:',

    hero_badge    : 'Canlı Piyasa Verileri',
    hero_title_1  : 'Kripto Piyasasını',
    hero_title_2  : 'Gerçek Zamanlı',
    hero_title_3  : ' Takip Et',
    hero_subtitle : '100+ kripto paranın anlık fiyat, hacim ve piyasa verilerini takip edin.',

    stat_mcap     : 'Toplam Piyasa Değeri',
    stat_volume   : '24s Hacim',
    stat_btc_dom  : 'BTC Dominance',
    stat_coins    : 'Aktif Coin',
    stat_supply   : 'Dolaşımdaki Arz',
    stat_max_supply: 'Maks. Arz',
    stat_high     : '24s Yüksek',
    stat_low      : '24s Düşük',
    stat_ath      : 'Tüm Zamanlar Yüksek',
    stat_ath_change: "ATH'den Uzaklık",

    trending_title   : 'Trend Coinler',
    trending_subtitle: 'Son 24 saatte en çok aranan coinler',
    market_title     : 'Piyasa Tablosu',
    market_subtitle  : 'Piyasa değerine göre sıralanmış coinler',
    market_page_title: 'Kapsamlı Piyasalar',
    market_page_subtitle: 'Tüm kripto varlıkların anlık verilerini detaylı inceleyin ve sıralayın',

    th_coin   : 'Coin',
    th_price  : 'Fiyat',
    th_mcap   : 'Piyasa Değeri',
    th_volume : '24s Hacim',
    th_chart  : '7 Günlük',

    btn_login    : 'Giriş Yap',
    btn_register : 'Kayıt Ol',
    btn_logout   : 'Çıkış Yap',
    btn_prev     : 'Önceki',
    btn_next     : 'Sonraki',
    btn_buy      : 'Al',
    btn_sell     : 'Sat',
    btn_deposit  : 'Para Yatır',
    btn_withdraw : 'Para Çek',
    btn_deposit_submit  : 'Yatır',
    btn_withdraw_submit : 'Çek',
    btn_load_more: 'Daha Fazla Yükle',
    btn_quick_buy : 'Hızlı Al',
    btn_quick_sell: 'Hızlı Sat',
    btn_buy_submit : 'Al',

    trade_title    : 'Hızlı Al-Sat',
    trade_subtitle : 'Anlık piyasa fiyatından kripto para alın veya satın',
    trade_login_notice: 'Al-Sat yapabilmek için',

    converter_title   : 'Kripto Dönüştürücü',
    converter_subtitle: 'Anlık kurlarla kripto ve fiat para birimlerini dönüştürün',
    market_rates      : 'Piyasa Kurları',
    quick_convert     : 'Hızlı:',

    wallet_title        : 'Cüzdanım',
    wallet_subtitle     : 'Bakiyelerinizi yönetin, yatırın veya çekin',
    wallet_login_notice : 'Cüzdanınıza erişmek için giriş yapmanız gerekiyor.',
    total_portfolio     : 'Toplam Varlık Değeri',
    my_assets           : 'Varlıklarım',
    transaction_history : 'İşlem Geçmişi',
    balance_login_notice: 'Bakiyenizi görmek için giriş yapın',
    recent_trades       : 'Son İşlemler',
    no_transactions     : 'Henüz işlem yok',

    label_coin       : 'Coin Seç',
    label_amount     : 'Miktar',
    label_amount_usd : 'Miktar (USD)',
    label_current_price: 'Anlık Fiyat',
    label_from       : 'Kaynak',
    label_to         : 'Hedef',
    label_balance    : 'Bakiyeniz',
    label_price      : 'Fiyat',
    label_total      : 'Toplam',
    label_available  : 'Kullanılabilir:',
    label_email      : 'E-posta',
    label_password   : 'Şifre',
    label_username   : 'Kullanıcı Adı',

    auth_title       : "CryptoNova'ya Hoş Geldiniz",
    auth_subtitle    : 'Hesabınıza giriş yapın veya yeni hesap oluşturun',
    auth_no_account  : 'Hesabınız yok mu?',
    auth_have_account: 'Zaten hesabınız var mı?',
    btn_register_submit: 'Hesap Oluştur',

    loading : 'Yükleniyor...',
    footer_powered  : 'Veriler CoinGecko API ile sağlanmaktadır.',
    footer_updated  : ' güncellendi',
    footer_disclaimer: 'Bu uygulama yatırım tavsiyesi vermez. Kripto piyasaları yüksek risk içerir.',

    toast_buy_success  : (amount, symbol, price) => `${amount} ${symbol} başarıyla satın alındı! @ $${price}`,
    toast_sell_success : (amount, symbol, price) => `${amount} ${symbol} başarıyla satıldı! @ $${price}`,
    toast_deposit_ok   : (amount) => `$${amount.toLocaleString()} yatırıldı.`,
    toast_withdraw_ok  : (amount) => `$${amount.toLocaleString()} çekildi.`,
    toast_watchlist_add: (name) => `${name} izleme listesine eklendi!`,
    toast_watchlist_rem: (name) => `${name} izleme listesinden çıkarıldı.`,
    toast_login_ok     : 'Hoş geldiniz! Başarıyla giriş yaptınız.',
    toast_logout_ok    : 'Başarıyla çıkış yaptınız.',
    toast_register_ok  : 'Hesabınız oluşturuldu! Hoş geldiniz.',
    toast_error        : 'Bir hata oluştu. Lütfen tekrar deneyin.',
    toast_need_login   : 'Bu işlem için giriş yapmanız gerekiyor.',
    err_no_price       : 'Fiyat bilgisi alınamadı.',
    err_api            : 'Veri alınamadı. Lütfen daha sonra tekrar deneyin.',
    page_info          : (p, t) => `Sayfa ${p} / ${t}`,

    // YENİ EKLENENLER (P2P, Staking vb.)
    btn_transfer       : 'Transfer',
    btn_transfer_submit: 'Gönder',
    btn_stake          : 'Varlığı Kilitle (Stake)',
    btn_unstake        : 'Stake Boz & Faizi Al',
    btn_export_csv     : 'Excel İndir',
    label_receiver_email: 'Alıcı Email',
    label_currency     : 'Varlık',
    staking_title      : 'Staking (Kazan)',
    staking_active_amount: 'Kilitli Miktar:',
    staking_earned     : 'Biriken Faiz:',
    risk_score_label   : 'Varlık Risk Skoru',
    portfolio_history  : 'Varlık Zaman Grafiği',
    price_alerts_title : 'Fiyat Alarmları',
    greeting_morning   : 'Günaydın',
    greeting_afternoon : 'İyi Günler',
    greeting_evening   : 'İyi Akşamlar',
    greeting_night     : 'İyi Geceler',
    widget_vip         : 'VIP',
    widget_points      : 'NovaPuan',
    widget_star        : 'Günün Yıldızı',
    widget_account_type: 'Hesap Türü',
    btn_quick_deposit  : 'Hızlı Yatır',
    btn_wallet_detail  : 'Cüzdan Detay',
    network_status     : 'Ethereum Gas',
    btn_settings       : 'Ayarlar',
    modal_settings     : 'Ayarlar',
    tab_security       : 'Güvenlik',
    email_verification_title: 'E-posta Doğrulama',
    email_verification_desc: 'Hesabınızı daha güvenli hale getirmek ve tam yetkiyle kullanabilmek için e-postanızı doğrulayın.',
    status_verified    : '✔ Onaylı Hesap',
    status_unverified  : 'Doğrulanmamış',
    btn_verify_email   : 'E-postayı Doğrula'
  },

  en: {
    nav_home      : 'Home',
    nav_markets   : 'Markets',
    nav_trade     : 'Trade',
    nav_converter : 'Convert',
    nav_wallet    : 'Wallet',
    nav_history   : 'History',
    history_title : 'Trade History',
    history_subtitle: 'Financial breakdown of all your trades',
    filter_all    : 'All',
    filter_buy    : 'Buy Only',
    filter_sell   : 'Sell Only',
    col_asset     : 'Asset',
    col_type      : 'Type',
    col_amount    : 'Amount',
    col_price     : 'Price',
    col_total     : 'Total Cost',
    col_date      : 'Date',
    history_empty_title: 'No Records Found',
    history_empty_desc: 'You have no transactions yet or no results for the search criteria.',
    wallet_avg_buy: 'Avg Buy Price:',
    pnl_label     : 'Profit / Loss:',

    hero_badge    : 'Live Market Data',
    hero_title_1  : 'Track Crypto Markets',
    hero_title_2  : 'In Real Time',
    hero_title_3  : '',
    hero_subtitle : 'Follow live prices, volumes and market data for 100+ cryptocurrencies.',

    stat_mcap     : 'Total Market Cap',
    stat_volume   : '24h Volume',
    stat_btc_dom  : 'BTC Dominance',
    stat_coins    : 'Active Coins',
    stat_supply   : 'Circulating Supply',
    stat_max_supply: 'Max Supply',
    stat_high     : '24h High',
    stat_low      : '24h Low',
    stat_ath      : 'All Time High',
    stat_ath_change: 'ATH Distance',

    trending_title   : 'Trending Coins',
    trending_subtitle: 'Most searched coins in the last 24 hours',
    market_title     : 'Market Table',
    market_subtitle  : 'Coins sorted by market cap',
    market_page_title: 'Comprehensive Markets',
    market_page_subtitle: 'Examine and sort all crypto assets in detail',

    th_coin   : 'Coin',
    th_price  : 'Price',
    th_mcap   : 'Market Cap',
    th_volume : '24h Volume',
    th_chart  : '7 Day',

    btn_login    : 'Login',
    btn_register : 'Sign Up',
    btn_logout   : 'Logout',
    btn_prev     : 'Prev',
    btn_next     : 'Next',
    btn_buy      : 'Buy',
    btn_sell     : 'Sell',
    btn_deposit  : 'Deposit',
    btn_withdraw : 'Withdraw',
    btn_deposit_submit  : 'Deposit',
    btn_withdraw_submit : 'Withdraw',
    btn_load_more: 'Load More',
    btn_quick_buy : 'Quick Buy',
    btn_quick_sell: 'Quick Sell',
    btn_buy_submit : 'Buy',

    trade_title    : 'Quick Trade',
    trade_subtitle : 'Buy or sell crypto at live market price',
    trade_login_notice: 'Please',

    converter_title   : 'Crypto Converter',
    converter_subtitle: 'Convert crypto and fiat currencies at live rates',
    market_rates      : 'Market Rates',
    quick_convert     : 'Quick:',

    wallet_title        : 'My Wallet',
    wallet_subtitle     : 'Manage your balances, deposit or withdraw',
    wallet_login_notice : 'Please log in to access your wallet.',
    total_portfolio     : 'Total Portfolio Value',
    my_assets           : 'My Assets',
    transaction_history : 'Transaction History',
    balance_login_notice: 'Login to see your balance',
    recent_trades       : 'Recent Trades',
    no_transactions     : 'No transactions yet',

    label_coin       : 'Select Coin',
    label_amount     : 'Amount',
    label_amount_usd : 'Amount (USD)',
    label_current_price: 'Current Price',
    label_from       : 'From',
    label_to         : 'To',
    label_balance    : 'Your Balance',
    label_price      : 'Price',
    label_total      : 'Total',
    label_available  : 'Available:',
    label_email      : 'Email',
    label_password   : 'Password',
    label_username   : 'Username',

    auth_title       : 'Welcome to CryptoNova',
    auth_subtitle    : 'Login to your account or create a new one',
    auth_no_account  : "Don't have an account?",
    auth_have_account: 'Already have an account?',
    btn_register_submit: 'Create Account',

    loading : 'Loading...',
    footer_powered  : 'Data provided by CoinGecko API.',
    footer_updated  : ' updated',
    footer_disclaimer: 'This application does not provide investment advice. Crypto markets carry high risk.',

    toast_buy_success  : (amount, symbol, price) => `Bought ${amount} ${symbol} @ $${price}!`,
    toast_sell_success : (amount, symbol, price) => `Sold ${amount} ${symbol} @ $${price}!`,
    toast_deposit_ok   : (amount) => `$${amount.toLocaleString()} deposited.`,
    toast_withdraw_ok  : (amount) => `$${amount.toLocaleString()} withdrawn.`,
    toast_register_ok  : 'Account created! Welcome.',
    toast_error        : 'An error occurred. Please try again.',
    toast_need_login   : 'You must be logged in for this action.',
    err_no_price       : 'Price information could not be retrieved.',
    err_api            : 'Failed to fetch data. Please try again later.',
    page_info          : (p, t) => `Page ${p} / ${t}`,

    btn_transfer       : 'Transfer',
    btn_transfer_submit: 'Send',
    btn_stake          : 'Lock Asset (Stake)',
    btn_unstake        : 'Unstake & Get Interest',
    btn_export_csv     : 'Download Excel',
    label_receiver_email: 'Receiver Email',
    label_currency     : 'Asset',
    staking_title      : 'Staking (Earn)',
    staking_active_amount: 'Locked Amount:',
    staking_earned     : 'Earned Interest:',
    risk_score_label   : 'Portfolio Risk Score',
    portfolio_history  : 'Portfolio Time Chart',
    price_alerts_title : 'Price Alerts',
    greeting_morning   : 'Good Morning',
    greeting_afternoon : 'Good Afternoon',
    greeting_evening   : 'Good Evening',
    greeting_night     : 'Good Night',
    widget_vip         : 'VIP',
    widget_points      : 'NovaPoints',
    widget_star        : 'Top Performer',
    widget_account_type: 'Account Type',
    btn_quick_deposit  : 'Quick Deposit',
    btn_wallet_detail  : 'Wallet Detail',
    network_status     : 'Ethereum Gas',
    btn_settings       : 'Settings',
    modal_settings     : 'Settings',
    tab_security       : 'Security',
    email_verification_title: 'Email Verification',
    email_verification_desc: 'Verify your email to make your account more secure and unlock full access.',
    status_verified    : '✔ Verified Account',
    status_unverified  : 'Unverified',
    btn_verify_email   : 'Verify Email'
  }
};

// ============================================================
// I18N ENGINE
// ============================================================
const I18n = (() => {
  let currentLang = localStorage.getItem('cn_lang') || 'tr';

  const t = (key, ...args) => {
    const val = LANGS[currentLang]?.[key] || LANGS['tr']?.[key] || key;
    return typeof val === 'function' ? val(...args) : val;
  };

  const setLang = (lang) => {
    if (!LANGS[lang]) return;
    currentLang = lang;
    localStorage.setItem('cn_lang', lang);
    applyTranslations();
  };

  const getLang = () => currentLang;

  const applyTranslations = () => {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const val = t(key);
      if (typeof val === 'string') el.textContent = val;
    });
    document.getElementById('currentLangLabel').textContent = currentLang.toUpperCase();
  };

  return { t, setLang, getLang, applyTranslations };
})();

// ============================================================
// THEME MANAGER
// ============================================================
const Theme = (() => {
  let current = localStorage.getItem('cn_theme') || 'dark';

  const apply = (theme) => {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cn_theme', theme);
  };

  const toggle = () => apply(current === 'dark' ? 'light' : 'dark');
  const get    = () => current;

  return { apply, toggle, get };
})();

// ============================================================
// TOAST SYSTEM
// ============================================================
const Toast = (() => {
  const container = () => document.getElementById('toastContainer');
  const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const show = (type, title, msg = '', duration = 4000) => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast__icon">${ICONS[type] || '🔔'}</div>
      <div class="toast__body">
        <div class="toast__title">${title}</div>
        ${msg ? `<div class="toast__msg">${msg}</div>` : ''}
      </div>`;

    container().prepend(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };

  return {
    success : (title, msg) => show('success', title, msg),
    error   : (title, msg) => show('error',   title, msg),
    info    : (title, msg) => show('info',    title, msg),
    warning : (title, msg) => show('warning', title, msg),
  };
})();

// ============================================================
// API SERVICE
// ============================================================
const API_BASE = '/api';

const ApiService = (() => {
  const getAuthHeader = () => {
    const token = localStorage.getItem('cn_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const request = async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(opts.headers || {})
      },
      ...opts
    });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.message || 'API Error'), { status: res.status, data });
    return data;
  };

  return {
    get   : (path)          => request(path),
    post  : (path, body)    => request(path, { method: 'POST',   body: JSON.stringify(body) }),
    delete: (path)          => request(path, { method: 'DELETE' }),

    // Crypto
    getCoins    : (currency = 'usd', page = 1) => request(`/crypto/coins?currency=${currency}&page=${page}`),
    getCoin     : (id)         => request(`/crypto/coin/${id}`),
    getChart    : (id, days)   => request(`/crypto/coin/${id}/chart?days=${days}`),
    getTrending : ()           => request('/crypto/trending'),
    getGlobal   : ()           => request('/crypto/global'),
    searchCoins : (q)          => request(`/crypto/search?q=${encodeURIComponent(q)}`),
    getPrices   : (ids, cur = 'usd') => request(`/crypto/prices?ids=${ids}&currency=${cur}`),
    addWatchlist   : (id)      => request(`/crypto/watchlist/${id}`, { method: 'POST' }),
    removeWatchlist: (id)      => request(`/crypto/watchlist/${id}`, { method: 'DELETE' }),
    getWatchlist   : ()        => request('/crypto/watchlist'),

    // Auth
    login    : (email, password)            => request('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
    register : (username, email, password)  => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
    me       : ()                           => request('/auth/me'),
    sendVerificationCode: ()                => request('/auth/send-verification-code', { method: 'POST' }),
    verifyCode  : (code)                    => request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ code }) }),

    // Wallet
    getWallet      : ()                             => request('/wallet'),
    deposit        : (amount)                       => request('/wallet/deposit',      { method: 'POST', body: JSON.stringify({ amount }) }),
    withdraw       : (amount)                       => request('/wallet/withdraw',     { method: 'POST', body: JSON.stringify({ amount }) }),
    trade          : (coinId, coinSymbol, type, amount) => request('/wallet/trade',   { method: 'POST', body: JSON.stringify({ coinId, coinSymbol, type, amount }) }),
    getTransactions: (limit = 50, offset = 0)       => request(`/wallet/transactions?limit=${limit}&offset=${offset}`),
    transfer       : (email, currency, amount)      => request('/wallet/transfer',     { method: 'POST', body: JSON.stringify({ email, currency, amount }) }),
    stake          : (currency, amount)             => request('/wallet/stake',        { method: 'POST', body: JSON.stringify({ currency, amount }) }),
    unstake        : (currency)                     => request('/wallet/unstake',      { method: 'POST', body: JSON.stringify({ currency }) }),
    getStaking     : ()                             => request('/wallet/staking'),
  };
})();

// ============================================================
// AUTH STATE
// ============================================================
const Auth = (() => {
  let currentUser = null;

  const getUser  = () => currentUser;
  const getToken = () => localStorage.getItem('cn_token');
  const isLoggedIn = () => !!getToken() && !!currentUser;

  const setSession = (user, token) => {
    currentUser = user;
    localStorage.setItem('cn_token', token);
    updateNavUI();
  };

  const clearSession = () => {
    currentUser = null;
    localStorage.removeItem('cn_token');
    updateNavUI();
  };

  const updateNavUI = () => {
    const loggedIn = isLoggedIn();
    
    // HTML tagına class ekle/çıkar (CLS önleme ve widget görünürlüğü için)
    if (loggedIn) {
      document.documentElement.classList.add('is-logged-in');
    } else {
      document.documentElement.classList.remove('is-logged-in');
    }

    document.getElementById('authButtons').hidden = loggedIn;
    document.getElementById('userMenu').hidden     = !loggedIn;

    if (loggedIn && currentUser) {
      document.getElementById('navUsername').textContent   = currentUser.username;
      document.getElementById('userAvatar').textContent    = currentUser.username[0].toUpperCase();
      document.getElementById('dropdownEmail').textContent = currentUser.email;
    }

    // Wallet & Trade panellerini güncelle
    TradeModule.onAuthChange();
    WalletModule.onAuthChange();
    WalletModule.updateHomeWidget();
  };

  const tryRestoreSession = async () => {
    if (!getToken()) return;
    try {
      const data = await ApiService.me();
      if (data.success && data.user) {
        currentUser = data.user;
        updateNavUI();
      }
    } catch {
      clearSession();
    }
  };

  return { getUser, getToken, isLoggedIn, setSession, clearSession, updateNavUI, tryRestoreSession };
})();

// ============================================================
// TAB ROUTER
// ============================================================
const TabRouter = (() => {
  let currentTab = 'home';

  const navigate = (tabName) => {
    if (currentTab === tabName) return;
    currentTab = tabName;

    // Panel'leri göster/gizle
    document.querySelectorAll('.tab-panel').forEach(p => {
      const isActive = p.id === `tab-${tabName}`;
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
    });

    // Butonları güncelle
    document.querySelectorAll('.tab-btn').forEach(b => {
      const isActive = b.dataset.tab === tabName;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive);
    });

    // Tab'a özgü veri yükleme
    if (tabName === 'trade')     TradeModule.onTabActivate();
    if (tabName === 'converter') ConverterModule.onTabActivate();
    if (tabName === 'wallet')    WalletModule.onTabActivate();
    if (tabName === 'history' && typeof HistoryModule !== 'undefined') HistoryModule.onTabActivate();
  };

  const init = () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.tab));
    });

    // Başlangıçta home tab aktif
    document.getElementById('tab-home').classList.add('active');
    document.getElementById('tab-home').hidden = false;
  };

  const getCurrent = () => currentTab;
  const goTo = (tab) => navigate(tab);

  return { init, getCurrent, goTo };
})();

// ============================================================
// FORMAT UTILITIES
// ============================================================
const Fmt = {
  price: (val, currency = 'usd', compact = false) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const symbols = { usd: '$', eur: '€', try: '₺' };
    const sym = symbols[currency] || '$';
    if (compact && Math.abs(val) >= 1e9)  return `${sym}${(val / 1e9).toFixed(2)}B`;
    if (compact && Math.abs(val) >= 1e6)  return `${sym}${(val / 1e6).toFixed(2)}M`;
    if (compact && Math.abs(val) >= 1e3)  return `${sym}${(val / 1e3).toFixed(2)}K`;
    if (Math.abs(val) < 0.000001) return `${sym}${val.toExponential(4)}`;
    if (Math.abs(val) < 0.01)     return `${sym}${val.toFixed(8)}`;
    if (Math.abs(val) < 1)        return `${sym}${val.toFixed(4)}`;
    if (Math.abs(val) < 10)       return `${sym}${val.toFixed(3)}`;
    return `${sym}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  compact: (val, currency = 'usd') => Fmt.price(val, currency, true),

  pct: (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  },

  pctClass: (val) => {
    if (!val || isNaN(val)) return 'neutral';
    return val >= 0 ? 'positive' : 'negative';
  },

  supply: (val) => {
    if (!val) return '∞';
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
    return val.toLocaleString();
  },

  time: (isoStr) => {
    if (!isoStr) return '—';
    try {
      let dateStr = isoStr;
      if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('T')) {
        dateStr = dateStr.replace(' ', 'T') + 'Z';
      }
      return new Date(dateStr).toLocaleString(I18n.getLang() === 'tr' ? 'tr-TR' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return isoStr; }
  },

  cryptoAmount: (val, decimals = 8) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    if (val >= 1e6)   return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (val >= 1)     return val.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return val.toFixed(decimals).replace(/\.?0+$/, '');
  }
};

// ============================================================
// SPARKLINE RENDERER (Canvas)
// ============================================================
function drawSparkline(canvas, data, isPositive) {
  if (!canvas || !data || !data.length) return;
  
  // CoinGecko API'sinden gelebilecek null veya geçersiz verileri temizle
  const validData = data.filter(v => typeof v === 'number' && !isNaN(v) && v !== null);
  if (validData.length < 2) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // Display: none durumunda offsetWidth 0 döner, fallback ver
  const w = canvas.offsetWidth || parseInt(canvas.getAttribute('width')) || 100;
  const h = canvas.offsetHeight || parseInt(canvas.getAttribute('height')) || 40;

  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;
  const pad = 4;

  const xStep = (w - pad * 2) / (validData.length - 1);
  const yScale = (h - pad * 2) / range;

  const points = validData.map((v, i) => ({
    x: pad + i * xStep,
    y: h - pad - (v - min) * yScale
  }));

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  const color = isPositive ? '0, 212, 160' : '255, 84, 112';
  grad.addColorStop(0, `rgba(${color}, 0.25)`);
  grad.addColorStop(1, `rgba(${color}, 0)`);

  ctx.beginPath();
  ctx.moveTo(points[0].x, h);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = isPositive ? '#00d4a0' : '#ff5470';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// ============================================================
// MARKETS MODULE
// ============================================================
const MarketsModule = (() => {
  let allCoins   = [];
  let sortedCoins = [];
  let currentPage = 1;
  let currency    = 'usd';
  let sortCol     = null;
  let sortDir     = 'desc';
  let searchQuery = '';
  let watchlist   = JSON.parse(localStorage.getItem('cn_watchlist') || '[]');

  const COINS_PER_PAGE = 25;

  // ----- Veri Çekme -----
  const fetchMarkets = async () => {
    try {
      const data = await ApiService.getCoins(currency, 1);
      allCoins = data.data || [];
      applyFilter();
      updateLastTime();
    } catch (err) {
      console.error('Markets fetch error:', err);
      Toast.error(I18n.t('err_api'));
    }
  };

  const fetchGlobal = async () => {
    try {
      const data = await ApiService.getGlobal();
      if (!data.data) return;
      const g = data.data;
      const setV = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

      const mcapChange = g.market_cap_change_percentage_24h_usd;
      setV('statMarketCapValue', Fmt.compact(g.total_market_cap?.usd, 'usd'));
      const changeEl = document.getElementById('statMarketCapChange');
      if (changeEl) {
        changeEl.textContent = Fmt.pct(mcapChange);
        changeEl.className   = 'stat-card__change ' + Fmt.pctClass(mcapChange);
      }
      setV('statVolumeValue',  Fmt.compact(g.total_volume?.usd, 'usd'));
      setV('statBtcDomValue',  `${g.market_cap_percentage?.btc?.toFixed(1) || '—'}%`);
      setV('statCoinsValue',   g.active_cryptocurrencies?.toLocaleString() || '—');
    } catch (err) {
      console.error('Global fetch error:', err);
    }
  };

  const fetchTrending = async () => {
    try {
      const data = await ApiService.getTrending();
      renderTrending(data.data || []);
    } catch (err) {
      console.error('Trending fetch error:', err);
    }
  };

  // ----- Filtre & Sıralama -----
  const applyFilter = () => {
    let coins = [...allCoins];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      coins = coins.filter(c =>
        c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    if (sortCol) {
      coins.sort((a, b) => {
        let av, bv;
        switch (sortCol) {
          case 'price': av = a.current_price;                         bv = b.current_price; break;
          case '1h'   : av = a.price_change_percentage_1h_in_currency; bv = b.price_change_percentage_1h_in_currency; break;
          case '24h'  : av = a.price_change_percentage_24h_in_currency; bv = b.price_change_percentage_24h_in_currency; break;
          case '7d'   : av = a.price_change_percentage_7d_in_currency; bv = b.price_change_percentage_7d_in_currency; break;
          case 'mcap' : av = a.market_cap;                            bv = b.market_cap; break;
          default     : av = a.market_cap_rank;                       bv = b.market_cap_rank;
        }
        av = av ?? 0; bv = bv ?? 0;
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }

    sortedCoins = coins;
    currentPage = 1;
    renderTable();
    renderPagination();
  };

  // ----- Render: Tablo -----
  const renderTable = () => {
    const tbody = document.getElementById('marketTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * COINS_PER_PAGE;
    const coins = sortedCoins.slice(start, start + COINS_PER_PAGE);

    if (!coins.length) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--color-text-muted)">Sonuç bulunamadı.</td></tr>`;
      return;
    }

    tbody.innerHTML = coins.map((c, idx) => {
      const ch1h  = c.price_change_percentage_1h_in_currency;
      const ch24h = c.price_change_percentage_24h_in_currency;
      const ch7d  = c.price_change_percentage_7d_in_currency;
      const isFav = watchlist.includes(c.id);

      return `
        <tr data-id="${c.id}" data-name="${c.name}" data-symbol="${c.symbol}" role="row">
          <td class="td-rank col-rank">${c.market_cap_rank || start + idx + 1}</td>
          <td>
            <div class="td-coin">
              ${c.image
                ? `<img class="coin-logo" src="${c.image}" alt="${c.name}" width="32" height="32" loading="lazy" />`
                : `<div class="coin-logo-placeholder">${c.symbol[0]}</div>`
              }
              <div>
                <div class="coin-name">${c.name}</div>
                <div class="coin-symbol">${c.symbol}</div>
              </div>
            </div>
          </td>
          <td class="td-price">${Fmt.price(c.current_price, currency)}</td>
          <td class="td-right">
            <span class="change-pill ${Fmt.pctClass(ch1h)}">${Fmt.pct(ch1h)}</span>
          </td>
          <td class="td-right">
            <span class="change-pill ${Fmt.pctClass(ch24h)}">${Fmt.pct(ch24h)}</span>
          </td>
          <td class="td-right">
            <span class="change-pill ${Fmt.pctClass(ch7d)}">${Fmt.pct(ch7d)}</span>
          </td>
          <td class="td-mcap">${Fmt.compact(c.market_cap, currency)}</td>
          <td class="td-volume">${Fmt.compact(c.total_volume, currency)}</td>
          <td>
            <canvas class="sparkline-canvas" data-sparkline="${start + idx}" width="100" height="40"></canvas>
          </td>
          <td style="text-align:center">
            <button class="watchlist-btn ${isFav ? 'active' : ''}" data-coin="${c.id}" data-name="${c.name}" aria-label="Favorilere ekle" aria-pressed="${isFav}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
          </td>
        </tr>`;
    }).join('');

    // Sparkline'ları çiz
    setTimeout(() => {
      coins.forEach((c, idx) => {
        const canvas = tbody.querySelector(`[data-sparkline="${start + idx}"]`);
        if (canvas && c.sparkline_in_7d?.price) {
          const isPos = (c.price_change_percentage_7d_in_currency || 0) >= 0;
          drawSparkline(canvas, c.sparkline_in_7d.price, isPos);
        }
      });
    }, 50);

    // Satır tıklama → Coin Modal
    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.watchlist-btn')) return;
        CoinDetailModule.open(row.dataset.id, allCoins.find(c => c.id === row.dataset.id));
      });
    });

    // Watchlist butonları
    tbody.querySelectorAll('.watchlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchlist(btn.dataset.coin, btn.dataset.name, btn);
      });
    });
  };

  // ----- Render: Pagination -----
  const renderPagination = () => {
    const totalPages = Math.max(1, Math.ceil(sortedCoins.length / COINS_PER_PAGE));
    document.getElementById('pageInfo').textContent = I18n.t('page_info', currentPage, totalPages);
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
  };

  // ----- Render: Trending -----
  const renderTrending = (coins) => {
    const grid = document.getElementById('trendingGrid');
    if (!grid || !coins.length) return;

    grid.innerHTML = coins.slice(0, 7).map(c => `
      <div class="trending-card" data-id="${c.id}" role="listitem" tabindex="0">
        <div class="trending-card__img-wrap">
          ${c.thumb ? `<img src="${c.thumb}" alt="${c.name}" width="32" height="32" loading="lazy">` : ''}
          <span class="trending-card__rank">#${c.score + 1}</span>
        </div>
        <div class="trending-card__name">${c.name}</div>
        <div class="trending-card__symbol">${c.symbol?.toUpperCase()}</div>
        <div class="trending-card__price">${c.data?.price ? Fmt.price(parseFloat(c.data.price)) : ''}</div>
      </div>`).join('');

    grid.querySelectorAll('.trending-card').forEach(card => {
      const handler = () => {
        const coin = allCoins.find(c => c.id === card.dataset.id);
        CoinDetailModule.open(card.dataset.id, coin || null);
      };
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
    });
  };

  // ----- Ticker -----
  const buildTicker = () => {
    if (!allCoins.length) return;
    const inner = document.getElementById('tickerInner');
    if (!inner) return;

    const top20 = allCoins.slice(0, 20);
    // Tekrar ettirerek sonsuz scroll efekti
    const items = [...top20, ...top20].map(c => {
      const ch = c.price_change_percentage_24h_in_currency;
      const cls = Fmt.pctClass(ch);
      return `<span class="ticker-item">
        <strong>${c.symbol?.toUpperCase()}</strong>
        ${Fmt.price(c.current_price, currency)}
        <span class="${cls}">${Fmt.pct(ch)}</span>
      </span>`;
    }).join('');

    inner.innerHTML = items;
  };

  // ----- Watchlist -----
  const toggleWatchlist = async (coinId, coinName, btn) => {
    if (!Auth.isLoggedIn()) {
      Toast.warning(I18n.t('toast_need_login'));
      AuthModal.open();
      return;
    }

    const isFav = watchlist.includes(coinId);
    try {
      if (isFav) {
        await ApiService.removeWatchlist(coinId);
        watchlist = watchlist.filter(id => id !== coinId);
        Toast.info(I18n.t('toast_watchlist_rem', coinName));
      } else {
        await ApiService.addWatchlist(coinId);
        watchlist = [...watchlist, coinId];
        Toast.success(I18n.t('toast_watchlist_add', coinName));
      }
      localStorage.setItem('cn_watchlist', JSON.stringify(watchlist));
      btn.classList.toggle('active', !isFav);
      btn.setAttribute('aria-pressed', !isFav);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', !isFav ? 'currentColor' : 'none');
    } catch (err) {
      Toast.error(err.message || I18n.t('toast_error'));
    }
  };

  const isInWatchlist = (coinId) => watchlist.includes(coinId);

  // ----- Event Listeners -----
  const initEvents = () => {
    // Sıralama
    document.querySelectorAll('.sortable').forEach(th => {
      const handler = () => {
        const col = th.dataset.sort;
        if (sortCol === col) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = col;
          sortDir = 'desc';
        }
        document.querySelectorAll('.sortable').forEach(t => t.setAttribute('aria-sort', 'none'));
        th.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
        applyFilter();
      };
      th.addEventListener('click', handler);
      th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
    });

    // Para birimi
    document.querySelectorAll('.currency-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currency = btn.dataset.currency;
        document.querySelectorAll('.currency-tab').forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', b === btn);
        });
        fetchMarkets();
      });
    });

    // Sayfalama
    const scrollToMarket = () => {
      const el = document.getElementById('marketSection');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    };

    document.getElementById('prevPage')?.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderTable(); renderPagination(); scrollToMarket(); }
    });
    document.getElementById('nextPage')?.addEventListener('click', () => {
      const totalPages = Math.ceil(sortedCoins.length / COINS_PER_PAGE);
      if (currentPage < totalPages) { currentPage++; renderTable(); renderPagination(); scrollToMarket(); }
    });

    // Tablo içi arama
    const tableSearch = document.getElementById('tableSearchInput');
    if (tableSearch) {
      let searchTimer;
      tableSearch.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchQuery = tableSearch.value.trim();
          applyFilter();
        }, 300);
      });
    }
  };

  // ----- Init -----
  const init = async () => {
    initEvents();
    await Promise.all([fetchGlobal(), fetchMarkets(), fetchTrending()]);
    buildTicker();

    // 60 saniyede bir yenile
    setInterval(async () => {
      await fetchMarkets();
      buildTicker();
    }, 60 * 1000);

    // Global 5 dakikada bir
    setInterval(fetchGlobal, 5 * 60 * 1000);
  };

  const updateLastTime = () => {
    const el = document.getElementById('lastUpdateTime');
    if (el) el.textContent = new Date().toLocaleTimeString(I18n.getLang() === 'tr' ? 'tr-TR' : 'en-US');
  };

  const getAllCoins = () => allCoins;
  const getCurrency = () => currency;

  const updateLivePrice = (symbol, newPrice) => {
    const rows = document.querySelectorAll(`#marketTableBody tr[data-symbol="${symbol.toLowerCase()}"]`);
    rows.forEach(row => {
      const priceCell = row.querySelector('.td-price');
      if (!priceCell) return;
      const oldStr = priceCell.textContent.replace(/[^0-9.-]+/g, "");
      const oldPrice = parseFloat(oldStr);
      if (isNaN(oldPrice) || oldPrice === newPrice) return;
      
      priceCell.textContent = Fmt.price(newPrice, currency);
      
      const flashClass = newPrice > oldPrice ? 'flash-up' : 'flash-down';
      priceCell.classList.remove('flash-up', 'flash-down');
      void priceCell.offsetWidth; // Reflow
      priceCell.classList.add(flashClass);
    });
  };

  return { init, getAllCoins, getCurrency, isInWatchlist, updateLivePrice };
})();

// ============================================================
// NAVBAR SEARCH
// ============================================================
const NavSearch = (() => {
  let timer;

  const init = () => {
    const btn      = document.getElementById('searchToggleBtn');
    const dropdown = document.getElementById('searchDropdown');
    const input    = document.getElementById('searchInput');
    const results  = document.getElementById('searchResults');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = !dropdown.hidden;
      dropdown.hidden = isOpen;
      btn.setAttribute('aria-expanded', !isOpen);
      if (!isOpen) setTimeout(() => input.focus(), 50);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#searchWrapper')) {
        dropdown.hidden = true;
        btn.setAttribute('aria-expanded', false);
      }
    });

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      timer = setTimeout(() => doSearch(q, results), 400);
    });
  };

  const doSearch = async (q, results) => {
    results.innerHTML = `<li style="padding:12px 16px;color:var(--color-text-muted);font-size:.85rem">${I18n.t('loading')}</li>`;
    try {
      const data = await ApiService.searchCoins(q);
      if (!data.data.length) {
        results.innerHTML = `<li style="padding:12px 16px;color:var(--color-text-muted);font-size:.85rem">Sonuç bulunamadı.</li>`;
        return;
      }
      results.innerHTML = data.data.map(c => `
        <li class="search-result-item" data-id="${c.id}" role="option" tabindex="0">
          ${c.thumb ? `<img src="${c.thumb}" alt="${c.name}" width="28" height="28">` : ''}
          <span class="name">${c.name}</span>
          <span class="symbol">${c.symbol?.toUpperCase()}</span>
          ${c.market_cap_rank ? `<span class="rank">#${c.market_cap_rank}</span>` : ''}
        </li>`).join('');

      results.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          document.getElementById('searchDropdown').hidden = true;
          CoinDetailModule.open(item.dataset.id, null);
        });
      });
    } catch {
      results.innerHTML = `<li style="padding:12px 16px;color:var(--color-negative);font-size:.85rem">${I18n.t('err_api')}</li>`;
    }
  };

  return { init };
})();

// ============================================================
// COIN DETAIL MODULE (BORSA TERMINALI & ORDER BOOK)
// ============================================================
const CoinDetailModule = (() => {
  let priceChartInstance = null;
  let currentCoin = null;
  let obTimer = null;
  
  const view = () => document.getElementById('tab-coindetail');

  const open = async (coinId, previewData = null) => {
    try {
      currentCoin = previewData || MarketsModule.getAllCoins().find(c => c.id === coinId) || { id: coinId };
      
      // Tab panel geçişi
      if (typeof TabRouter !== 'undefined') {
        TabRouter.goTo('coindetail');
      }

      if (previewData || currentCoin.name) populateData(currentCoin);

      showChartLoader(true);
      await loadChart(coinId, 7);

      startOrderBook();
      loadSentiment(coinId);
      updateTradeWidget(coinId);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error(e);
      if (typeof Toast !== 'undefined') Toast.error("Sistem Hatası: " + e.message);
    }
  };

  const close = () => {
    currentCoin = null;
    if (priceChartInstance) { priceChartInstance.destroy(); priceChartInstance = null; }
    clearInterval(obTimer);
    if (typeof TabRouter !== 'undefined') {
      TabRouter.goTo('markets');
    }
  };

  const populateData = (c) => {
    const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const logo = document.getElementById('cdLogo');
    if (logo && c.image) { logo.src = c.image; logo.alt = c.name; }
    s('cdTitle',  c.name || '—');
    s('cdSymbol', c.symbol?.toUpperCase() || '—');
    s('cdRank',   `#${c.market_cap_rank || '—'}`);

    const cur = MarketsModule.getCurrency();
    s('cdPrice', Fmt.price(c.current_price || 0, cur));
    
    s('obCurrentPrice', Fmt.price(c.current_price || 0, 'usd'));

    const setBadge = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = id.replace('cd', '').replace('h', 's ').replace('d', 'g ') + Fmt.pct(val);
      el.className = `change-badge ${Fmt.pctClass(val)}`;
    };
    setBadge('cd1h',  c.price_change_percentage_1h_in_currency);
    setBadge('cd24h', c.price_change_percentage_24h_in_currency || c.price_change_percentage_24h);
    setBadge('cd7d',  c.price_change_percentage_7d_in_currency);

    s('cdMcap',      Fmt.compact(c.market_cap, cur));
    s('cdVol',       Fmt.compact(c.total_volume, cur));
    s('cdSupply',    Fmt.supply(c.circulating_supply));
    s('cdMaxSupply', Fmt.supply(c.max_supply));
    
    const hEl = document.getElementById('cdHigh');
    if (hEl) { hEl.textContent = Fmt.price(c.high_24h, cur); hEl.className = 'positive'; }
    const lEl = document.getElementById('cdLow');
    if (lEl) { lEl.textContent = Fmt.price(c.low_24h, cur); lEl.className = 'negative'; }
    
    s('cdATH',       Fmt.price(c.ath, cur));
    s('cdATHChange', Fmt.pct(c.ath_change_percentage));
  };

  const loadChart = async (coinId, days) => {
    showChartLoader(true);
    try {
      const data = await ApiService.getChart(coinId, days.toString());
      renderChart(data.data?.prices || [], days);
    } catch (err) {
      console.error('Chart load error:', err);
    } finally {
      showChartLoader(false);
    }
  };

  const renderChart = (prices, days) => {
    const canvas = document.getElementById('cdPriceChart');
    if (!canvas || !prices.length) return;

    if (priceChartInstance) priceChartInstance.destroy();

    const labels = prices.map(p => {
      const d = new Date(p[0]);
      return days <= 1 ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                       : d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    });
    const values = prices.map(p => p[1]);
    const isPos  = values[values.length - 1] >= values[0];
    const color  = isPos ? '#00d4a0' : '#ff5470';

    const ctx  = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, isPos ? 'rgba(0,212,160,0.25)' : 'rgba(255,84,112,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    priceChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data         : values,
          borderColor  : color,
          borderWidth  : 2,
          backgroundColor: grad,
          fill         : true,
          tension      : 0.4,
          pointRadius  : 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: color,
        }]
      },
      options: {
        responsive : true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (items) => `Zaman: ${items[0].label}`,
              label: (ctx) => `Fiyat: ${Fmt.price(ctx.parsed.y, MarketsModule.getCurrency())}`
            }
          }
        },
        scales: {
          x: { grid : { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c5c7a', maxTicksLimit: 6 } },
          y: { grid : { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5c5c7a', callback: (v) => Fmt.compact(v) } }
        }
      }
    });
  };

  const showChartLoader = (show) => {
    const loader = document.getElementById('cdChartLoader');
    if (loader) loader.hidden = !show;
  };

  /* --- ORDER BOOK SIMULATION --- */
  const startOrderBook = () => {
    clearInterval(obTimer);
    const renderOb = () => {
      if (!currentCoin) return;
      const basePrice = currentCoin.current_price || 100;
      
      const generateRows = (isSell) => {
        let html = '';
        for (let i = 0; i < 5; i++) {
          const offset = basePrice * (Math.random() * 0.005);
          const price = isSell ? (basePrice + offset) : (basePrice - offset);
          const amount = Math.random() * 2 + 0.01;
          const total = price * amount;
          const bgWidth = Math.floor(Math.random() * 100) + '%';
          html += `
            <div class="ob-row">
              <div class="ob-bg" style="width:${bgWidth}"></div>
              <span class="ob-price">${price.toPrecision(6)}</span>
              <span>${amount.toFixed(4)}</span>
              <span>${Fmt.compact(total, 'usd')}</span>
            </div>
          `;
        }
        return html;
      };

      const sells = document.getElementById('obSells');
      const buys = document.getElementById('obBuys');
      if(sells) sells.innerHTML = generateRows(true);
      if(buys) buys.innerHTML = generateRows(false);
    };
    
    renderOb();
    obTimer = setInterval(renderOb, 1500); 
  };

  /* --- MARKET SENTIMENT --- */
  const loadSentiment = (coinId) => {
    const key = `sentiment_${coinId}`;
    let data = JSON.parse(localStorage.getItem(key)) || { bull: 50, bear: 50, userVoted: false };
    updateSentimentUI(data);
  };

  const voteSentiment = (type) => {
    if (!currentCoin) return;
    const key = `sentiment_${currentCoin.id}`;
    let data = JSON.parse(localStorage.getItem(key)) || { bull: 50, bear: 50, userVoted: false };
    if (data.userVoted) return Toast.info("Bu coin için zaten oy kullandınız.");
    
    if (type === 'bull') data.bull += 1; else data.bear += 1;
    data.userVoted = true;
    localStorage.setItem(key, JSON.stringify(data));
    updateSentimentUI(data);
    Toast.success("Oyunuz kaydedildi, teşekkürler!");
  };

  const updateSentimentUI = (data) => {
    const total = data.bull + data.bear;
    const bullPct = total > 0 ? Math.round((data.bull / total) * 100) : 50;
    const bearPct = 100 - bullPct;
    
    const bar = document.getElementById('cdBullBar');
    if (bar) bar.style.width = bullPct + '%';
    
    const bLbl = document.getElementById('cdBullPct');
    const brLbl = document.getElementById('cdBearPct');
    if (bLbl) bLbl.textContent = `%${bullPct} Alım`;
    if (brLbl) brLbl.textContent = `%${bearPct} Satış`;
  };

  /* --- QUICK TRADE WIDGET --- */
  let tradeSide = 'buy';
  const updateTradeWidget = (coinId) => {
    if(!Auth.isLoggedIn()) {
      const bEl = document.getElementById('cdAvailableBalance');
      if(bEl) bEl.textContent = 'Giriş Yapılmadı';
      return;
    }
    const curLabel = document.getElementById('cdTradeCurrencyLabel');
    if(curLabel) curLabel.textContent = currentCoin?.symbol?.toUpperCase() || 'Coin';
    
    ApiService.getWallet().then(res => {
      const wallets = res.data || [];
      const el = document.getElementById('cdAvailableBalance');
      if(!el) return;
      if (tradeSide === 'buy') {
        const usdWallet = wallets.find(w => w.currency === 'USD');
        el.textContent = Fmt.price(usdWallet ? usdWallet.balance : 0, 'usd');
      } else {
        const coinWallet = wallets.find(w => w.currency === currentCoin?.symbol?.toUpperCase());
        el.textContent = Fmt.cryptoAmount(coinWallet ? coinWallet.balance : 0) + ' ' + (currentCoin?.symbol?.toUpperCase() || '');
      }
    }).catch(e => console.log(e));
  };

  const submitTrade = async () => {
    if (!Auth.isLoggedIn()) { AuthModal.open(); return; }
    if (!currentCoin) return;
    
    const amount = parseFloat(document.getElementById('cdTradeAmount').value);
    if (!amount || amount <= 0) return Toast.warning("Lütfen geçerli miktar girin.");
    
    const sym = currentCoin.symbol.toUpperCase();
    const btn = document.getElementById('cdTradeBtn');
    btn.disabled = true;
    btn.textContent = "İşleniyor...";
    
    try {
      await ApiService.trade(sym, tradeSide, amount);
      Toast.success("İşlem Başarılı!", `${amount} adet ${sym} emri tamamlandı.`);
      document.getElementById('cdTradeAmount').value = '';
      updateTradeWidget(currentCoin.id);
      if(typeof WalletModule !== 'undefined') WalletModule.onTabActivate(); 
    } catch (err) {
      Toast.error("İşlem Başarısız", err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = tradeSide === 'buy' ? "Alım İşlemini Onayla" : "Satış İşlemini Onayla";
    }
  };

  const initEvents = () => {
    document.getElementById('cdBackBtn')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !view().hidden) close(); });

    document.querySelectorAll('#tab-coindetail .chart-period').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tab-coindetail .chart-period').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (currentCoin) loadChart(currentCoin.id, parseInt(btn.dataset.days));
      });
    });

    const setTradeSide = (side) => {
      tradeSide = side;
      document.getElementById('cdTabBuy').classList.toggle('active', side === 'buy');
      document.getElementById('cdTabSell').classList.toggle('active', side === 'sell');
      const btn = document.getElementById('cdTradeBtn');
      if(btn) {
        btn.textContent = side === 'buy' ? 'Alım İşlemini Onayla' : 'Satış İşlemini Onayla';
        btn.className = side === 'buy' ? 'btn btn--buy btn--full' : 'btn btn--sell btn--full';
      }
      updateTradeWidget(currentCoin?.id);
    };
    document.getElementById('cdTabBuy')?.addEventListener('click', () => setTradeSide('buy'));
    document.getElementById('cdTabSell')?.addEventListener('click', () => setTradeSide('sell'));
    
    document.getElementById('cdTradeBtn')?.addEventListener('click', submitTrade);
    document.getElementById('cdVoteBull')?.addEventListener('click', () => voteSentiment('bull'));
    document.getElementById('cdVoteBear')?.addEventListener('click', () => voteSentiment('bear'));
  };

  return { open, close, initEvents };
})();


// ============================================================
// TRADE MODULE
// ============================================================
const TradeModule = (() => {
  let selectedCoin   = null;
  let currentType    = 'buy';
  let currentPrice   = 0;
  let walletBalances = {};

  const onTabActivate = async () => {
    populateCoinSelect();
    if (Auth.isLoggedIn()) await loadBalances();
  };

  const onAuthChange = () => {
    const notice = document.getElementById('tradeAuthNotice');
    const submit = document.getElementById('tradeSubmitBtn');
    if (notice) notice.hidden = Auth.isLoggedIn();
    if (submit) submit.disabled = !Auth.isLoggedIn();
    if (Auth.isLoggedIn()) loadBalances();
    else {
      const body = document.getElementById('tradeBalanceBody');
      if (body) body.innerHTML = `<p class="balance-panel__login">${I18n.t('balance_login_notice')}</p>`;
    }
  };

  const populateCoinSelect = () => {
    const select = document.getElementById('tradeCoinSelect');
    if (!select) return;
    const coins = MarketsModule.getAllCoins();
    if (!coins.length) return;
    select.innerHTML = coins.map(c =>
      `<option value="${c.id}" data-symbol="${c.symbol?.toUpperCase()}" data-price="${c.current_price}">
        ${c.name} (${c.symbol?.toUpperCase()})
      </option>`
    ).join('');
    select.value = coins[0]?.id || '';
    onCoinChange();
  };

  const onCoinChange = () => {
    const select = document.getElementById('tradeCoinSelect');
    if (!select) return;
    const opt = select.options[select.selectedIndex];
    if (!opt) return;
    selectedCoin   = select.value;
    currentPrice   = parseFloat(opt.dataset.price) || 0;
    const symbol   = opt.dataset.symbol || '';
    const coin = MarketsModule.getAllCoins().find(c => c.id === selectedCoin);
    const ch24h = coin?.price_change_percentage_24h_in_currency || coin?.price_change_percentage_24h;

    document.getElementById('tradeCurrentPrice').textContent = Fmt.price(currentPrice, MarketsModule.getCurrency());
    const changeEl = document.getElementById('tradeCurrentChange');
    if (changeEl) {
      changeEl.textContent  = Fmt.pct(ch24h);
      changeEl.className    = `price-display__change ${Fmt.pctClass(ch24h)}`;
    }
    const suffix = document.getElementById('tradeAmountSuffix');
    if (suffix) suffix.textContent = symbol;
    updateSummary();
    setQuickAmounts();
  };

  const updateSummary = () => {
    const amount = parseFloat(document.getElementById('tradeAmount')?.value) || 0;
    const total  = amount * currentPrice;
    document.getElementById('summaryPrice').textContent  = Fmt.price(currentPrice, MarketsModule.getCurrency());
    document.getElementById('summaryAmount').textContent = `${amount || '—'} ${document.getElementById('tradeAmountSuffix')?.textContent || ''}`;
    document.getElementById('summaryTotal').textContent  = total ? Fmt.price(total, MarketsModule.getCurrency()) : '—';
  };

  const setQuickAmounts = () => {
    const select = document.getElementById('tradeCoinSelect');
    const opt    = select?.options[select.selectedIndex];
    if (!opt) return;
    const symbol = opt.dataset.symbol;
    const isUSD  = currentType === 'buy';

    document.querySelectorAll('#tab-trade .quick-amounts .quick-btn').forEach(btn => {
      const pct = parseInt(btn.dataset.pct);
      if (isNaN(pct)) return;

      btn.addEventListener('click', () => {
        const balance = isUSD
          ? (walletBalances['USD'] || 0)
          : (walletBalances[symbol] || 0);
        const maxVal = isUSD
          ? (balance / currentPrice) * (pct / 100)
          : balance * (pct / 100);
        const input = document.getElementById('tradeAmount');
        if (input) { input.value = maxVal.toFixed(8).replace(/\.?0+$/, ''); updateSummary(); }
      });
    });
  };

  const loadBalances = async () => {
    try {
      const data = await ApiService.getWallet();
      walletBalances = {};
      (data.data || []).forEach(w => { walletBalances[w.currency] = w.balance; });
      renderBalancePanel();
    } catch { 
      walletBalances = {};
      renderBalancePanel();
    }
  };

  const renderBalancePanel = () => {
    const body = document.getElementById('tradeBalanceBody');
    if (!body) return;
    const entries = Object.entries(walletBalances);
    if (!entries.length) {
      body.innerHTML = `<p class="empty-notice" style="padding: 16px; text-align: center; color: var(--color-text-muted);">Henüz bakiyeniz yok</p>`;
      return;
    }
    body.innerHTML = entries.slice(0, 8).map(([cur, bal]) => `
      <div class="balance-item">
        <div class="balance-item__currency">
          ${cur} <span>${getCurrencyName(cur)}</span>
        </div>
        <div class="balance-item__amount">${Fmt.cryptoAmount(bal)}</div>
      </div>`).join('');
  };

  const getCurrencyName = (cur) => {
    const names = { USD: 'Dolar', EUR: 'Euro', TRY: 'Türk Lirası', BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana', ADA: 'Cardano', XRP: 'Ripple' };
    return names[cur] || '';
  };

  const selectCoin = (coinId, type) => {
    const select = document.getElementById('tradeCoinSelect');
    if (!select) return;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === coinId) { select.value = coinId; break; }
    }
    onCoinChange();
    if (type) setTradeType(type);
  };

  const setTradeType = (type) => {
    currentType = type;
    const buyBtn  = document.getElementById('tradeBuyBtn');
    const sellBtn = document.getElementById('tradeSellBtn');
    const submit  = document.getElementById('tradeSubmitBtn');
    if (buyBtn)  { buyBtn.classList.toggle('active', type === 'buy');   buyBtn.setAttribute('aria-pressed', type === 'buy'); }
    if (sellBtn) { sellBtn.classList.toggle('active', type === 'sell'); sellBtn.setAttribute('aria-pressed', type === 'sell'); }
    if (submit) {
      submit.className = `btn btn--trade btn--full ${type === 'buy' ? 'btn--buy' : 'btn--sell-action'}`;
      submit.querySelector('.btn-text').textContent = I18n.t(type === 'buy' ? 'btn_buy' : 'btn_sell');
    }
    setQuickAmounts();
  };

  const doTrade = async () => {
    if (!Auth.isLoggedIn()) { Toast.warning(I18n.t('toast_need_login')); AuthModal.open(); return; }
    const amount = parseFloat(document.getElementById('tradeAmount')?.value);
    if (!amount || amount <= 0) { Toast.warning('Lütfen geçerli bir miktar girin.'); return; }

    const select = document.getElementById('tradeCoinSelect');
    const opt    = select?.options[select.selectedIndex];
    const symbol = opt?.dataset.symbol || '';

    const submitBtn = document.getElementById('tradeSubmitBtn');
    submitBtn.disabled = true;
    const spinner = submitBtn.querySelector('.btn-spinner');
    const text    = submitBtn.querySelector('.btn-text');
    if (spinner) spinner.hidden = false;
    if (text)    text.hidden    = true;

    try {
      const data = await ApiService.trade(selectedCoin, symbol, currentType, amount);
      const fn   = currentType === 'buy' ? 'toast_buy_success' : 'toast_sell_success';
      Toast.success(I18n.t(fn, Fmt.cryptoAmount(data.amount), data.symbol, Fmt.price(data.price)));
      document.getElementById('tradeAmount').value = '';
      updateSummary();
      await loadBalances();
      // Recent trades
      loadRecentTrades();
    } catch (err) {
      Toast.error(err.message || I18n.t('toast_error'));
    } finally {
      submitBtn.disabled = !Auth.isLoggedIn();
      if (spinner) spinner.hidden = true;
      if (text)    text.hidden    = false;
    }
  };

  const loadRecentTrades = async () => {
    if (!Auth.isLoggedIn()) return;
    try {
      const data = await ApiService.getTransactions(5, 0);
      const body = document.getElementById('recentTradesBody');
      if (!body) return;
      const txs = (data.data || []).filter(t => ['buy', 'sell'].includes(t.type));
      if (!txs.length) {
        body.innerHTML = `<p class="empty-notice">${I18n.t('no_transactions')}</p>`;
        return;
      }
      body.innerHTML = txs.map(t => `
        <div class="trade-history-item">
          <span class="trade-history-item__type ${t.type}">${t.type.toUpperCase()}</span>
          <div class="trade-history-item__details">
            <div class="trade-history-item__coin">${t.to_currency !== 'USD' ? t.to_currency : t.from_currency}</div>
            <div class="trade-history-item__meta">${Fmt.time(t.created_at)}</div>
          </div>
          <div class="trade-history-item__total ${t.type === 'buy' ? 'negative' : 'positive'}">
            ${t.type === 'buy' ? '-' : '+'}${Fmt.price(t.total)}
          </div>
        </div>`).join('');
    } catch { /* silent */ }
  };

  const initEvents = () => {
    document.getElementById('tradeCoinSelect')?.addEventListener('change', onCoinChange);
    document.getElementById('tradeAmount')?.addEventListener('input', updateSummary);
    document.getElementById('tradeBuyBtn')?.addEventListener('click',  () => setTradeType('buy'));
    document.getElementById('tradeSellBtn')?.addEventListener('click', () => setTradeType('sell'));
    document.getElementById('tradeSubmitBtn')?.addEventListener('click', doTrade);
    document.getElementById('tradeLoginLink')?.addEventListener('click', () => AuthModal.open());
  };

  const updateLivePrice = (sym, newPrice) => {
    if (!selectedCoin) return;
    const select = document.getElementById('tradeCoinSelect');
    const opt = select?.options[select.selectedIndex];
    if (opt?.dataset.symbol?.toLowerCase() === sym.toLowerCase()) {
       currentPrice = newPrice;
       const priceEl = document.getElementById('tradeCurrentPrice');
       if (priceEl) {
         const oldStr = priceEl.textContent.replace(/[^0-9.-]+/g, "");
         const oldPrice = parseFloat(oldStr);
         if (!isNaN(oldPrice) && oldPrice !== newPrice) {
            priceEl.textContent = Fmt.price(newPrice, MarketsModule.getCurrency());
            const flashClass = newPrice > oldPrice ? 'flash-up' : 'flash-down';
            priceEl.classList.remove('flash-up', 'flash-down');
            void priceEl.offsetWidth;
            priceEl.classList.add(flashClass);
         }
       }
       updateSummary();
    }
  };

  const init = () => {
    initEvents();
    onAuthChange();
  };

  return { init, onTabActivate, onAuthChange, selectCoin, updateLivePrice };
})();

// ============================================================
// CONVERTER MODULE
// ============================================================
const ConverterModule = (() => {
  let priceMap = {};
  let calcTimer;

  const FIAT_IDS = ['usd', 'eur', 'try'];
  const CRYPTO_IDS = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano'];

  const MARKET_PAIRS = [
    { from: 'bitcoin',  to: 'usd', label: 'BTC/USD' },
    { from: 'ethereum', to: 'usd', label: 'ETH/USD' },
    { from: 'bitcoin',  to: 'ethereum', label: 'BTC/ETH' },
    { from: 'solana',   to: 'usd', label: 'SOL/USD' },
    { from: 'binancecoin', to: 'usd', label: 'BNB/USD' },
  ];

  const onTabActivate = async () => {
    await loadPrices();
    calculate();
    renderMarketRates();
  };

  const loadPrices = async () => {
    try {
      const ids  = CRYPTO_IDS.join(',');
      const data = await ApiService.getPrices(ids, 'usd');
      priceMap = data.data || {};
      document.getElementById('converterRateInfo').hidden  = false;
      document.getElementById('converterRateLoading').hidden = true;
    } catch (err) {
      console.error('Converter prices error:', err);
    }
  };

  // USD cinsinden fiyat al
  const getUsdPrice = (id) => {
    if (FIAT_IDS.includes(id.toLowerCase())) {
      const rate = id.toLowerCase() === 'usd' ? 1 : (GlobalRates[id.toLowerCase()] || 1);
      return 1 / rate;
    }
    return priceMap[id]?.usd || 0;
  };

  const calculate = () => {
    const fromAmt   = parseFloat(document.getElementById('converterFromAmount')?.value) || 0;
    const fromSel   = document.getElementById('converterFromCurrency');
    const toSel     = document.getElementById('converterToCurrency');
    if (!fromSel || !toSel) return;

    const fromId    = fromSel.value;
    const toId      = toSel.value;
    const fromUsd   = getUsdPrice(fromId);
    const toUsd     = getUsdPrice(toId);

    const toAmount  = toUsd > 0 ? (fromAmt * fromUsd) / toUsd : 0;
    const toInput   = document.getElementById('converterToAmount');
    if (toInput) toInput.value = toAmount ? toAmount.toPrecision(8).replace(/\.?0+$/, '') : '';

    // Kur metni
    const fromSym = fromSel.options[fromSel.selectedIndex]?.dataset.symbol || fromId.toUpperCase();
    const toSym   = toSel.options[toSel.selectedIndex]?.dataset.symbol   || toId.toUpperCase();
    const rate    = toUsd > 0 ? (fromUsd / toUsd) : 0;
    const rateEl  = document.getElementById('converterRateText');
    if (rateEl) rateEl.textContent = `1 ${fromSym} = ${rate.toPrecision(6).replace(/\.?0+$/, '')} ${toSym}`;

    const updateEl = document.getElementById('converterRateUpdate');
    if (updateEl) updateEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMarketRates = () => {
    const container = document.getElementById('converterMarketRates');
    if (!container) return;
    container.innerHTML = MARKET_PAIRS.map(p => {
      const fromPrice = getUsdPrice(p.from);
      const toPrice   = getUsdPrice(p.to);
      const rate      = toPrice > 0 ? fromPrice / toPrice : 0;
      const change    = priceMap[p.from]?.usd_24h_change;
      return `
        <div class="market-rate-item">
          <span class="market-rate-item__pair">${p.label}</span>
          <span class="market-rate-item__rate">${rate.toLocaleString('en-US', { maximumFractionDigits: 4 })}</span>
          ${change !== undefined
            ? `<span class="market-rate-item__change ${Fmt.pctClass(change)}">${Fmt.pct(change)}</span>`
            : ''}
        </div>`;
    }).join('');
  };

  const initEvents = () => {
    ['converterFromAmount', 'converterFromCurrency', 'converterToCurrency'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        clearTimeout(calcTimer);
        calcTimer = setTimeout(calculate, 200);
      });
      document.getElementById(id)?.addEventListener('change', calculate);
    });

    document.getElementById('converterSwapBtn')?.addEventListener('click', () => {
      const fromSel = document.getElementById('converterFromCurrency');
      const toSel   = document.getElementById('converterToCurrency');
      if (!fromSel || !toSel) return;
      const tmp    = fromSel.value;
      fromSel.value = toSel.value;
      toSel.value   = tmp;
      calculate();
    });

    // Hızlı değer butonları
    document.querySelectorAll('#tab-converter .quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.dataset.val);
        if (!isNaN(val)) {
          const input = document.getElementById('converterFromAmount');
          if (input) { input.value = val; calculate(); }
        }
      });
    });
  };

  const init = () => {
    initEvents();
  };

  return { init, onTabActivate };
})();

// ============================================================
// WALLET MODULE
// ============================================================
const WalletModule = (() => {
  let transactionOffset = 0;
  const LIMIT = 20;
  let walletChartInstance = null;
  let stakingTimer = null;
  let currentStaking = null;
  let portfolioLineChart = null;
  let activeAlerts = [];

  const updateHomeWidget = async () => {
    const widget = document.getElementById('homeWelcomeWidget');
    if (!widget) return;
    if (!Auth.isLoggedIn()) {
      widget.style.display = 'none';
      return;
    }
    
    const hour = new Date().getHours();
    let greetingKey = 'greeting_morning';
    if (hour >= 12 && hour < 18) greetingKey = 'greeting_afternoon';
    else if (hour >= 18 && hour < 22) greetingKey = 'greeting_evening';
    else if (hour >= 22 || hour < 5) greetingKey = 'greeting_night';
    
    document.getElementById('homeWelcomeGreeting').textContent = I18n.t(greetingKey) + ', ';
    document.getElementById('homeWelcomeName').textContent = Auth.getUser()?.username;
    
    const hwTotal = document.getElementById('homeWelcomeTotal');
    const hwPnl = document.getElementById('homeWelcomePnl');
    const hwStar = document.getElementById('homeWelcomeStar');
    
    if (hwTotal) hwTotal.textContent = 'Hesaplanıyor...';
    if (hwPnl) hwPnl.textContent = '';
    widget.style.display = 'flex';

    try {
      const res = await ApiService.getWallet();
      const items = res.data || [];
      const allCoins = MarketsModule.getAllCoins();
      
      let total = 0;
      let totalInvested = 0;
      
      items.forEach(w => {
        let usdVal = 0;
        if (w.currency === 'USD') usdVal = w.balance;
        else if (w.currency === 'EUR') usdVal = w.balance * 1.09;
        else if (w.currency === 'TRY') usdVal = w.balance / GlobalRates.try;
        else {
          const coin = allCoins.find(c => c.symbol?.toUpperCase() === w.currency);
          if (coin) usdVal = w.balance * (coin.current_price || 0);
        }
        total += usdVal;
        
        if (w.currency !== 'USD' && w.avg_buy_price && w.balance > 0) {
          totalInvested += (w.balance * w.avg_buy_price);
        }
      });
      
      widget.dataset.rawTotal = Fmt.price(total, 'usd');
      
      let pnlHtmlRaw = '';
      if (totalInvested > 0) {
        let netPnl = 0;
        items.forEach(w => {
           if (w.currency !== 'USD' && w.avg_buy_price && w.balance > 0) {
             const coin = allCoins.find(c => c.symbol?.toUpperCase() === w.currency);
             if (coin) {
               const currentVal = w.balance * coin.current_price;
               const investedVal = w.balance * w.avg_buy_price;
               netPnl += (currentVal - investedVal);
             }
           }
        });
        const pnlPct = (netPnl / totalInvested) * 100;
        const sign = netPnl >= 0 ? '+' : '';
        const colorClass = netPnl >= 0 ? 'color-positive' : 'color-negative';
        pnlHtmlRaw = `<span class="${colorClass}">${sign}${Fmt.price(netPnl, 'usd')} (${sign}${pnlPct.toFixed(2)}%)</span>`;
      }
      widget.dataset.rawPnl = pnlHtmlRaw;
      
      applyPrivacyMode();
      
      const hwStatus = document.getElementById('homeWelcomeAccountStatus');
      if (hwStatus) {
        const user = Auth.getUser();
        if (user && user.is_verified) {
          hwStatus.textContent = I18n.t('status_verified') || 'Onaylı';
          hwStatus.style.color = 'var(--color-positive)';
        } else {
          hwStatus.textContent = I18n.t('status_unverified') || 'Doğrulanmamış';
          hwStatus.style.color = 'var(--color-text-muted)';
        }
      }
    } catch (e) {
      console.log('Widget error', e);
    }
  };

  const applyPrivacyMode = () => {
    const isHidden = localStorage.getItem('cn_privacy') === 'true';
    const widget = document.getElementById('homeWelcomeWidget');
    if (!widget) return;
    
    const hwTotal = document.getElementById('homeWelcomeTotal');
    const hwPnl = document.getElementById('homeWelcomePnl');
    const iconOpen = document.getElementById('privacyIconOpen');
    const iconClosed = document.getElementById('privacyIconClosed');
    
    if (isHidden) {
      if (hwTotal) hwTotal.textContent = '••••••';
      if (hwPnl) hwPnl.innerHTML = '';
      if (iconOpen) iconOpen.style.display = 'block';
      if (iconClosed) iconClosed.style.display = 'none';
    } else {
      if (hwTotal) hwTotal.textContent = widget.dataset.rawTotal || '$0.00';
      if (hwPnl) hwPnl.innerHTML = widget.dataset.rawPnl || '';
      if (iconOpen) iconOpen.style.display = 'none';
      if (iconClosed) iconClosed.style.display = 'block';
    }
  };

  const onTabActivate = async () => {
    if (!Auth.isLoggedIn()) return;
    await Promise.all([loadBalances(), loadTransactions(true), loadStaking(), loadPortfolioHistory(1)]);
    renderActiveAlerts();
  };

  const onAuthChange = () => {
    const notice  = document.getElementById('walletAuthNotice');
    const content = document.getElementById('walletContent');
    if (!notice || !content) return;
    notice.hidden  = Auth.isLoggedIn();
    content.hidden = !Auth.isLoggedIn();
    if (Auth.isLoggedIn() && TabRouter.getCurrent() === 'wallet') onTabActivate();
  };

  const loadBalances = async () => {
    try {
      const data = await ApiService.getWallet();
      const items = data.data || [];
      renderBalances(items);
      updateTotalValue(items);
      const usd = items.find(w => w.currency === 'USD');
      const avEl = document.getElementById('withdrawAvailable');
      if (avEl) avEl.textContent = Fmt.price(usd?.balance || 0, 'usd');
    } catch (err) {
      console.error('Wallet load error:', err);
    }
  };

  const updateTotalValue = (items) => {
    const allCoins = MarketsModule.getAllCoins();
    let total = 0;
    let totalInvested = 0;
    let safeValue = 0;
    let volatileValue = 0;

    items.forEach(w => {
      let usdVal = 0;
      if (w.currency === 'USD') usdVal = w.balance;
      else if (w.currency === 'EUR') usdVal = w.balance / GlobalRates.eur;
      else if (w.currency === 'TRY') usdVal = w.balance / GlobalRates.try;
      else {
        const coin = allCoins.find(c => c.symbol?.toUpperCase() === w.currency);
        if (coin) usdVal = w.balance * (coin.current_price || 0);
      }
      total += usdVal;
      
      if (['USD', 'EUR', 'TRY', 'USDT', 'USDC'].includes(w.currency.toUpperCase())) {
        safeValue += usdVal;
      } else {
        volatileValue += usdVal;
      }
      
      // P&L
      if (w.currency !== 'USD' && w.avg_buy_price && w.balance > 0) {
        totalInvested += (w.balance * w.avg_buy_price);
      }
    });

    const el = document.getElementById('walletTotalValue');
    if (el) el.textContent = Fmt.price(total, 'usd');
    
    const pnlEl = document.getElementById('walletTotalPnl');
    if (pnlEl) {
      if (totalInvested > 0) {
        let netPnl = 0;
        items.forEach(w => {
           if (w.currency !== 'USD' && w.avg_buy_price && w.balance > 0) {
             const coin = allCoins.find(c => c.symbol?.toUpperCase() === w.currency);
             if (coin) {
               const currentVal = w.balance * coin.current_price;
               const investedVal = w.balance * w.avg_buy_price;
               netPnl += (currentVal - investedVal);
             }
           }
        });
        const pnlPct = (netPnl / totalInvested) * 100;
        const sign = netPnl >= 0 ? '+' : '';
        const colorClass = netPnl >= 0 ? 'color-positive' : 'color-negative';
        pnlEl.innerHTML = `<span class="${colorClass}">${sign}${Fmt.price(netPnl, 'usd')} (${sign}${pnlPct.toFixed(2)}%)</span>`;
        pnlEl.style.opacity = 1;
      } else {
        pnlEl.innerHTML = '';
        pnlEl.style.opacity = 0;
      }
    }

    const sub = document.getElementById('walletTotalSub');
    if (sub) sub.textContent = `${items.length} farklı varlık`;
    
    renderRiskScore(safeValue, volatileValue, total);
  };

  const renderRiskScore = (safe, volatile, total) => {
    const riskScoreText = document.getElementById('riskScoreText');
    const riskBarSafe = document.getElementById('riskBarSafe');
    const riskBarVolatile = document.getElementById('riskBarVolatile');
    if (!riskScoreText || total === 0) return;

    const safePct = (safe / total) * 100;
    const volatilePct = (volatile / total) * 100;
    
    riskBarSafe.style.width = `${safePct}%`;
    riskBarVolatile.style.width = `${volatilePct}%`;
    
    if (safePct > 70) {
      riskScoreText.textContent = "Güvenli / Muhafazakar";
      riskScoreText.style.color = "#2ecc71";
    } else if (safePct >= 30) {
      riskScoreText.textContent = "Dengeli";
      riskScoreText.style.color = "#f39c12";
    } else {
      riskScoreText.textContent = "Yüksek Riskli / Agresif";
      riskScoreText.style.color = "#e74c3c";
    }
  };

  const renderBalances = (items) => {
    const list = document.getElementById('walletBalanceList');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = `<p class="empty-notice" style="padding: 16px; text-align: center; color: var(--color-text-muted);">Henüz cüzdanınızda varlık bulunmuyor.</p>`;
      return;
    }
    const allCoins = MarketsModule.getAllCoins();

    let chartLabels = [];
    let chartData = [];
    let chartColors = [];
    const colorPalette = ['#00FF88', '#FF0055', '#00BBFF', '#FFBB00', '#9900FF', '#FF5500', '#00FFCC'];

    const transferCur = document.getElementById('transferCurrency');
    const stakeCur = document.getElementById('stakeCurrency');
    if (transferCur) transferCur.innerHTML = '';
    if (stakeCur) stakeCur.innerHTML = '';

    list.innerHTML = items.map((w, index) => {
      const coin = allCoins.find(c => c.symbol?.toUpperCase() === w.currency);
      const usdVal = w.currency === 'USD' ? w.balance
                   : w.currency === 'EUR' ? w.balance * 1.09
                   : w.currency === 'TRY' ? w.balance / 32.5
                   : coin ? w.balance * coin.current_price : 0;
      
      if (usdVal > 0) {
        chartLabels.push(w.currency);
        chartData.push(usdVal);
        chartColors.push(colorPalette[index % colorPalette.length]);
      }

      if (w.balance > 0) {
        if (transferCur) transferCur.innerHTML += `<option value="${w.currency}">${w.currency} (Mevcut: ${Fmt.cryptoAmount(w.balance)})</option>`;
        if (stakeCur) stakeCur.innerHTML += `<option value="${w.currency}">${w.currency} (Mevcut: ${Fmt.cryptoAmount(w.balance)})</option>`;
      }

      return `
        <div class="wallet-balance-item">
          <div class="wallet-balance-item__left">
            <div class="wallet-balance-item__icon" style="background: ${colorPalette[index % colorPalette.length]}33; color: ${colorPalette[index % colorPalette.length]}">${w.currency[0]}</div>
            <div>
              <div class="wallet-balance-item__currency">${w.currency}</div>
              <div class="wallet-balance-item__name">${coin?.name || getCurrencyName(w.currency) || ''}</div>
            </div>
          </div>
          <div class="wallet-balance-item__right" style="text-align:right;">
            <div class="wallet-balance-item__amount">${Fmt.cryptoAmount(w.balance)}</div>
            ${usdVal ? `<div class="wallet-balance-item__usd">${Fmt.price(usdVal, 'usd')}</div>` : ''}
            ${(w.avg_buy_price && w.balance > 0 && w.currency !== 'USD') ? `
              <div style="font-size:0.75rem; color:var(--color-text-muted); margin-top:4px;">
                ${I18n.t('wallet_avg_buy')} ${Fmt.price(w.avg_buy_price, 'usd')}<br>
                ${I18n.t('pnl_label')} <span style="color: ${(usdVal - (w.balance * w.avg_buy_price)) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}">${Fmt.price(usdVal - (w.balance * w.avg_buy_price), 'usd')}</span>
              </div>
            ` : ''}
          </div>
        </div>`;
    }).join('');

    renderChart(chartLabels, chartData, chartColors);
  };

  const renderChart = (labels, data, colors) => {
    const ctx = document.getElementById('walletChart');
    if (!ctx) return;
    if (walletChartInstance) walletChartInstance.destroy();
    
    // Yalnızca renderBalances'den değer gelirse çiz
    if (data.length === 0) return;

    walletChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,10,10,0.9)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) { return ' ' + Fmt.price(context.raw, 'usd'); }
            }
          }
        }
      }
    });
  };

  const loadStaking = async () => {
    try {
      const resp = await ApiService.getStaking();
      const stakings = resp.data || [];
      const activeContainer = document.getElementById('activeStakingContainer');
      const newContainer = document.getElementById('newStakingContainer');
      if (!activeContainer || !newContainer) return;

      if (stakings.length > 0) {
        currentStaking = stakings[0]; 
        activeContainer.hidden = false;
        newContainer.hidden = true;
        document.getElementById('stakedAmountLabel').textContent = `${currentStaking.amount} ${currentStaking.currency}`;
        startStakingSimulation();
      } else {
        currentStaking = null;
        activeContainer.hidden = true;
        newContainer.hidden = false;
        clearInterval(stakingTimer);
      }
    } catch (err) {
      console.error('Staking load error:', err);
    }
  };

  const startStakingSimulation = () => {
    clearInterval(stakingTimer);
    if (!currentStaking) return;
    
    const updateInterest = () => {
      const lockedTimeMs = new Date() - new Date(currentStaking.locked_at + 'Z');
      const lockedSeconds = Math.max(0, lockedTimeMs / 1000);
      const interestPerSecond = (currentStaking.apy / 100) / (365 * 24 * 60 * 60);
      const earned = currentStaking.amount * interestPerSecond * lockedSeconds;
      const lbl = document.getElementById('stakedEarnedLabel');
      if (lbl) lbl.textContent = `+${earned.toFixed(6)} ${currentStaking.currency}`;
    };

    updateInterest();
    stakingTimer = setInterval(updateInterest, 1000);
  };

  const getCurrencyName = (cur) => {
    const n = { USD: 'US Dollar', EUR: 'Euro', TRY: 'Turkish Lira' };
    return n[cur] || '';
  };

  const loadTransactions = async (reset = false) => {
    if (reset) transactionOffset = 0;
    try {
      const data = await ApiService.getTransactions(LIMIT, transactionOffset);
      const txs  = data.data || [];
      transactionOffset += txs.length;

      const list = document.getElementById('transactionsList');
      if (!list) return;

      if (reset) list.innerHTML = '';
      if (!txs.length && reset) {
        list.innerHTML = `<p class="empty-notice">${I18n.t('no_transactions')}</p>`;
        return;
      }

      const typeIcons = { BUY: '📈', SELL: '📉', DEPOSIT: '💰', WITHDRAW: '💸', TRANSFER_IN: '📥', TRANSFER_OUT: '📤' };
      list.insertAdjacentHTML('beforeend', txs.map(t => {
        const typeUp = (t.type || '').toUpperCase();
        const isInflow = ['BUY', 'DEPOSIT', 'TRANSFER_IN'].includes(typeUp);
        return `
          <div class="transaction-item">
            <div class="transaction-item__icon ${typeUp.toLowerCase()}">${typeIcons[typeUp] || '💱'}</div>
            <div class="transaction-item__details">
              <div class="transaction-item__title">${typeUp} ${t.coin_symbol || 'USD'}</div>
              <div class="transaction-item__date">${Fmt.time(t.timestamp)}</div>
            </div>
            <div class="transaction-item__amount ${isInflow ? 'positive' : 'negative'}">
              ${isInflow ? '+' : '-'}${Fmt.price(t.total_cost || t.amount)}
            </div>
          </div>`;
      }).join(''));

      const loadMoreBtn = document.getElementById('loadMoreTransactions');
      if (loadMoreBtn) loadMoreBtn.hidden = txs.length < LIMIT;
    } catch (err) {
      console.error('Transactions load error:', err);
    }
  };

  let qrCodeInstance = null;
  const showQrModal = (currency, action) => {
    const modal = document.getElementById('qrModal');
    const title = document.getElementById('qrModalTitle');
    const qrContainer = document.getElementById('qrCodeContainer');
    const addressInput = document.getElementById('qrWalletAddress');
    if (!modal || !window.QRCode) return;
    
    title.textContent = `${currency} ${action === 'yatırma' ? 'Yatır' : 'Çek'}`;
    
    const prefix = currency === 'BTC' ? 'bc1' : '0x';
    const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const fakeAddress = `${prefix}q9a${hash}`.substring(0, 34);
    addressInput.value = fakeAddress;
    
    qrContainer.innerHTML = '';
    qrCodeInstance = new QRCode(qrContainer, {
      text: fakeAddress,
      width: 150,
      height: 150,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.M
    });
    
    modal.hidden = false;
  };

  const doDeposit = async () => {
    const currency = document.getElementById('depositCurrency')?.value || 'USD';
    const amount = parseFloat(document.getElementById('depositAmount')?.value);
    
    if (currency !== 'USD') {
      showQrModal(currency, 'yatırma');
      return;
    }

    if (!amount || amount <= 0) return Toast.warning('Geçerli miktar girin.');
    try {
      await ApiService.deposit(amount);
      Toast.success(I18n.t('toast_deposit_ok', amount));
      document.getElementById('depositAmount').value = '';
      onTabActivate();
    } catch (err) { Toast.error(err.message || I18n.t('toast_error')); }
  };

  const doWithdraw = async () => {
    const currency = document.getElementById('withdrawCurrency')?.value || 'USD';
    const amount = parseFloat(document.getElementById('withdrawAmount')?.value);

    if (currency !== 'USD') {
      showQrModal(currency, 'çekme');
      return;
    }

    if (!amount || amount <= 0) return Toast.warning('Geçerli miktar girin.');
    try {
      await ApiService.withdraw(amount);
      Toast.success(I18n.t('toast_withdraw_ok', amount));
      document.getElementById('withdrawAmount').value = '';
      onTabActivate();
    } catch (err) { Toast.error(err.message || I18n.t('toast_error')); }
  };

  const doTransfer = async () => {
    const email = document.getElementById('transferEmail')?.value;
    const currency = document.getElementById('transferCurrency')?.value;
    const amount = parseFloat(document.getElementById('transferAmount')?.value);
    if (!email || !currency || !amount) return Toast.warning('Tüm alanları doldurun.');
    try {
      const res = await ApiService.transfer(email, currency, amount);
      Toast.success('Başarılı', res.message);
      document.getElementById('transferAmount').value = '';
      document.getElementById('transferEmail').value = '';
      onTabActivate();
    } catch (err) { Toast.error('Hata', err.message); }
  };

  const doStake = async () => {
    const currency = document.getElementById('stakeCurrency')?.value;
    const amount = parseFloat(document.getElementById('stakeAmount')?.value);
    if (!currency || !amount) return Toast.warning('Geçerli varlık ve miktar girin.');
    try {
      const res = await ApiService.stake(currency, amount);
      Toast.success('Başarılı', res.message);
      document.getElementById('stakeAmount').value = '';
      onTabActivate();
    } catch (err) { Toast.error('Hata', err.message); }
  };

  const doUnstake = async () => {
    if (!currentStaking) return;
    try {
      const res = await ApiService.unstake(currentStaking.currency);
      Toast.success('Stake Bozuldu', res.message);
      onTabActivate();
    } catch (err) { Toast.error('Hata', err.message); }
  };

  const loadPortfolioHistory = async (days = 1) => {
    try {
      const token = localStorage.getItem('cn_token');
      const res = await fetch(`/api/wallet/history?days=${days}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const json = await res.json();
      if (json.success) {
        renderPortfolioChart(json.labels, json.data);
      }
    } catch (err) {
      console.error('Portfolio history load error:', err);
    }
  };

  const renderPortfolioChart = (labels, data) => {
    const ctx = document.getElementById('portfolioLineChart');
    if (!ctx) return;
    if (portfolioLineChart) portfolioLineChart.destroy();
    
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.5)'); // neon green
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0.0)');
    
    portfolioLineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Toplam Varlık Değeri',
          data: data,
          borderColor: '#00FF88', // neon green
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(10,10,10,0.9)',
            titleColor: '#fff',
            bodyColor: '#00FF88',
            callbacks: {
              label: function(context) { return Fmt.price(context.raw, 'usd'); }
            }
          }
        },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: false }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    });
  };

  const addPriceAlert = () => {
    const currency = document.getElementById('alertCurrency')?.value;
    const priceStr = document.getElementById('alertPrice')?.value;
    const targetPrice = parseFloat(priceStr);
    
    if (!currency || isNaN(targetPrice) || targetPrice <= 0) {
      return Toast.warning('Geçerli bir kripto para ve hedef fiyat girin.');
    }
    
    activeAlerts.push({
      id: Date.now(),
      currency,
      targetPrice
    });
    
    document.getElementById('alertPrice').value = '';
    Toast.success('Alarm kuruldu.');
    renderActiveAlerts();
  };

  const renderActiveAlerts = () => {
    const container = document.getElementById('activeAlertsList');
    if (!container) return;
    if (activeAlerts.length === 0) {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--color-text-muted);">Aktif alarm yok.</p>`;
      return;
    }
    
    container.innerHTML = activeAlerts.map(alert => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:4px;">
        <div>
          <span style="font-weight:600; font-size:0.85rem;">${alert.currency.toUpperCase()}</span>
          <span style="color:var(--color-text-muted); font-size:0.8rem; margin-left:8px;">Hedef: ${Fmt.price(alert.targetPrice, 'usd')}</span>
        </div>
        <button class="btn btn--ghost" style="padding:4px;" onclick="WalletModule.removeAlert(${alert.id})">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  };

  const removeAlert = (id) => {
    activeAlerts = activeAlerts.filter(a => a.id !== id);
    renderActiveAlerts();
  };

  const checkAlerts = (symbol, currentPrice) => {
    const triggered = activeAlerts.filter(a => a.currency.toLowerCase() === symbol.toLowerCase());
    triggered.forEach(alert => {
      const diff = Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice;
      if (diff < 0.005) {
        Toast.success(`🔔 ALARM: ${symbol.toUpperCase()} fiyatı hedefe (${Fmt.price(alert.targetPrice, 'usd')}) yaklaştı/ulaştı!`);
        removeAlert(alert.id);
      }
    });
  };

  const initEvents = () => {
    document.getElementById('togglePrivacyBtn')?.addEventListener('click', () => {
      const isHidden = localStorage.getItem('cn_privacy') === 'true';
      localStorage.setItem('cn_privacy', !isHidden);
      applyPrivacyMode();
    });

    document.getElementById('homeWalletDetailBtn')?.addEventListener('click', () => {
      TabRouter.goTo('wallet');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('homeQuickDepositBtn')?.addEventListener('click', () => {
      TabRouter.goTo('wallet');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // "Yatırma" (deposit) tabını seç
      const depositTabBtn = document.querySelector('.dw-tab-btn[data-target="depositPanel"]');
      if (depositTabBtn) depositTabBtn.click();
    });
    
    document.getElementById('walletLoginBtn')?.addEventListener('click', () => AuthModal.open());
    document.getElementById('depositBtn')?.addEventListener('click', doDeposit);
    document.getElementById('withdrawBtn')?.addEventListener('click', doWithdraw);
    document.getElementById('transferBtn')?.addEventListener('click', doTransfer);
    document.getElementById('stakeBtn')?.addEventListener('click', doStake);
    document.getElementById('unstakeBtn')?.addEventListener('click', doUnstake);
    document.getElementById('loadMoreTransactions')?.addEventListener('click', () => loadTransactions(false));

    // Modal events
    document.getElementById('closeQrModalBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('qrModal');
      if (modal) modal.hidden = true;
    });
    
    document.getElementById('copyAddressBtn')?.addEventListener('click', () => {
      const input = document.getElementById('qrWalletAddress');
      if (input) {
        input.select();
        document.execCommand('copy');
        Toast.success('Adres panoya kopyalandı.');
      }
    });
    
    // Deposit Currency Change
    document.getElementById('depositCurrency')?.addEventListener('change', (e) => {
      const amountGroup = document.getElementById('depositAmountGroup');
      const quickAmounts = document.getElementById('depositQuickAmounts');
      if (e.target.value === 'USD') {
        amountGroup.hidden = false;
        quickAmounts.hidden = false;
        document.getElementById('depositBtn').textContent = 'Yatır';
      } else {
        amountGroup.hidden = true;
        quickAmounts.hidden = true;
        document.getElementById('depositBtn').textContent = 'Adres / QR Oluştur';
      }
    });

    // Withdraw Currency Change
    document.getElementById('withdrawCurrency')?.addEventListener('change', (e) => {
      const amountGroup = document.getElementById('withdrawAmountGroup');
      if (e.target.value === 'USD') {
        amountGroup.hidden = false;
        document.getElementById('withdrawBtn').textContent = 'Çek';
      } else {
        amountGroup.hidden = true;
        document.getElementById('withdrawBtn').textContent = 'Çekim Adresi İste';
      }
    });
    
    // Portfolio History Chart Events
    document.querySelectorAll('.time-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--color-text-muted)';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.color = 'white';
        loadPortfolioHistory(btn.dataset.days);
      });
    });

    // Price Alerts Events
    document.getElementById('addAlertBtn')?.addEventListener('click', addPriceAlert);

    // Yatır/Çek/Transfer tab toggle
    document.querySelectorAll('.dw-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dw-tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', false); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', true);
        const target = btn.dataset.dwtab;
        
        const depPanel = document.getElementById('depositPanel');
        const witPanel = document.getElementById('withdrawPanel');
        const trnPanel = document.getElementById('transferPanel');
        
        if(depPanel) depPanel.hidden = target !== 'deposit';
        if(witPanel) witPanel.hidden = target !== 'withdraw';
        if(trnPanel) trnPanel.hidden = target !== 'transfer';
      });
    });

    document.querySelectorAll('#depositPanel .quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('depositAmount');
        if (input) input.value = btn.dataset.amount;
      });
    });
  };

  const init = () => { initEvents(); };

  return { init, onTabActivate, onAuthChange, removeAlert, checkAlerts, updateHomeWidget };
})();

// ============================================================
// SETTINGS MODAL
// ============================================================
const SettingsModule = (() => {
  let isCodeSent = false;

  const updateUI = () => {
    const user = Auth.getUser();
    if (!user) return;
    
    const stateVerified = document.getElementById('verifiedState');
    const step1 = document.getElementById('verifyStep1');
    const step2 = document.getElementById('verifyStep2');
    const emailInput = document.getElementById('verifyEmailInput');
    
    if (!stateVerified || !step1 || !step2) return;
    
    if (user.is_verified) {
      stateVerified.style.display = 'block';
      step1.style.display = 'none';
      step2.style.display = 'none';
    } else {
      stateVerified.style.display = 'none';
      if (emailInput && !isCodeSent) {
        emailInput.value = user.email; // Pre-fill with user's email
      }
      
      if (isCodeSent) {
        step1.style.display = 'none';
        step2.style.display = 'flex';
      } else {
        step1.style.display = 'flex';
        step2.style.display = 'none';
      }
    }
  };

  const sendCode = async () => {
    const btn = document.getElementById('sendCodeBtn');
    btn.disabled = true;
    btn.textContent = I18n.t('loading') || 'Gönderiliyor...';
    
    try {
      const res = await ApiService.sendVerificationCode();
      if (res.success) {
        Toast.success(res.message);
        isCodeSent = true;
        updateUI();
      }
    } catch (err) {
      Toast.error('Hata', err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Kodu Gönder';
    }
  };

  const verifyCode = async () => {
    const btn = document.getElementById('verifyCodeBtn');
    const codeInput = document.getElementById('verifyCodeInput');
    const code = codeInput?.value.trim();
    
    if (!code || code.length !== 6) {
      Toast.error('Hata', 'Lütfen 6 haneli kodu girin.');
      return;
    }
    
    btn.disabled = true;
    btn.textContent = I18n.t('loading') || 'Yükleniyor...';
    
    try {
      const res = await ApiService.verifyCode(code);
      if (res.success) {
        Toast.success(res.message);
        
        // Update user state locally
        const user = Auth.getUser();
        if (user) {
          user.is_verified = 1;
          const token = Auth.getToken();
          Auth.setSession(user, token);
        }
        
        isCodeSent = false;
        updateUI();
      }
    } catch (err) {
      Toast.error('Hata', err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Doğrula';
    }
  };

  const init = () => {
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      document.getElementById('userDropdown').hidden = true;
      TabRouter.goTo('settings');
      updateUI();
    });
    
    document.getElementById('sendCodeBtn')?.addEventListener('click', sendCode);
    document.getElementById('verifyCodeBtn')?.addEventListener('click', verifyCode);
  };

  return { init, updateUI };
})();

// ============================================================
// AUTH MODAL
// ============================================================
const AuthModal = (() => {
  const overlay = () => document.getElementById('authModalOverlay');

  const open = (tab = 'login') => {
    const modal = overlay();
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    showTab(tab);
    clearAlert();
    setTimeout(() => {
      const input = tab === 'login'
        ? document.getElementById('loginEmail')
        : document.getElementById('registerUsername');
      input?.focus();
    }, 100);
  };

  const close = () => {
    overlay().hidden = true;
    document.body.style.overflow = '';
  };

  const showTab = (tab) => {
    const isLogin = tab === 'login';
    document.getElementById('loginPanel').hidden    = !isLogin;
    document.getElementById('registerPanel').hidden = isLogin;
    document.getElementById('loginTab').classList.toggle('active', isLogin);
    document.getElementById('registerTab').classList.toggle('active', !isLogin);
    document.getElementById('loginTab').setAttribute('aria-selected', isLogin);
    document.getElementById('registerTab').setAttribute('aria-selected', !isLogin);
  };

  const showAlert = (msg, type = 'error') => {
    const alert = document.getElementById('authAlert');
    alert.textContent = msg;
    alert.className   = `auth-alert ${type}`;
    alert.hidden      = false;
  };

  const clearAlert = () => {
    const alert = document.getElementById('authAlert');
    if (alert) { alert.hidden = true; alert.textContent = ''; }
  };

  const setLoading = (btnId, loading) => {
    const btn     = document.getElementById(btnId);
    if (!btn) return;
    const spinner = btn.querySelector('.btn-spinner');
    const text    = btn.querySelector('.btn-text');
    btn.disabled = loading;
    if (spinner) spinner.hidden = !loading;
    if (text)    text.hidden    = loading;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearAlert();
    const email    = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    if (!email || !password) { showAlert('E-posta ve şifre zorunludur.'); return; }
    setLoading('loginSubmitBtn', true);
    try {
      const data = await ApiService.login(email, password);
      Auth.setSession(data.user, data.token);
      Toast.success(I18n.t('toast_login_ok'));
      close();
    } catch (err) {
      showAlert(err.message || I18n.t('toast_error'));
    } finally {
      setLoading('loginSubmitBtn', false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearAlert();
    const username = document.getElementById('registerUsername')?.value?.trim();
    const email    = document.getElementById('registerEmail')?.value?.trim();
    const password = document.getElementById('registerPassword')?.value;
    if (!username || !email || !password) { showAlert('Tüm alanlar zorunludur.'); return; }
    setLoading('registerSubmitBtn', true);
    try {
      await ApiService.register(username, email, password);
      Toast.success('Hesap başarıyla oluşturuldu! Lütfen giriş yapın.');
      showTab('login');
      const loginEmailInput = document.getElementById('loginEmail');
      if(loginEmailInput) loginEmailInput.value = email;
    } catch (err) {
      showAlert(err.message || I18n.t('toast_error'));
    } finally {
      setLoading('registerSubmitBtn', false);
    }
  };

  // Şifre gücü
  const calcStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd))  score++;
    if (/[0-9]/.test(pwd))  score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const updateStrength = (val) => {
    const score = calcStrength(val);
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;
    const levels = [
      { pct: '0%',   color: 'transparent', text: '' },
      { pct: '20%',  color: '#ff5470',     text: 'Çok Zayıf' },
      { pct: '40%',  color: '#f59e0b',     text: 'Zayıf' },
      { pct: '60%',  color: '#f59e0b',     text: 'Orta' },
      { pct: '80%',  color: '#00d4a0',     text: 'Güçlü' },
      { pct: '100%', color: '#00d4a0',     text: 'Çok Güçlü' },
    ];
    const l = levels[Math.min(score, 5)];
    fill.style.width      = l.pct;
    fill.style.background = l.color;
    label.textContent     = val ? l.text : '';
  };

  const initEvents = () => {
    document.getElementById('closeAuthModal')?.addEventListener('click', close);
    overlay()?.addEventListener('click', (e) => { if (e.target === overlay()) close(); });
    document.getElementById('loginBtn')?.addEventListener('click', ()    => open('login'));
    document.getElementById('registerBtn')?.addEventListener('click', () => open('register'));
    document.getElementById('switchToRegister')?.addEventListener('click', () => showTab('register'));
    document.getElementById('switchToLogin')?.addEventListener('click',    () => showTab('login'));
    document.getElementById('loginTab')?.addEventListener('click',    () => showTab('login'));
    document.getElementById('registerTab')?.addEventListener('click', () => showTab('register'));

    document.getElementById('loginForm')?.addEventListener('submit',    handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('registerPassword')?.addEventListener('input', (e) => updateStrength(e.target.value));

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      Auth.clearSession();
      Toast.info(I18n.t('toast_logout_ok'));
      document.getElementById('userDropdown').hidden = true;
      TabRouter.goTo('home');
    });

    // User menu toggle
    document.getElementById('userMenuTrigger')?.addEventListener('click', () => {
      const dd = document.getElementById('userDropdown');
      const isOpen = !dd.hidden;
      dd.hidden = isOpen;
      document.getElementById('userMenuTrigger').setAttribute('aria-expanded', !isOpen);
    });

    // Şifre göster/gizle
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay().hidden) close();
    });

    // Dropdown dışına tık → kapat
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#userMenu')) {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.hidden = true;
        document.getElementById('userMenuTrigger')?.setAttribute('aria-expanded', false);
      }
    });
  };

  return { open, close, initEvents };
})();

// ============================================================
// THEME & LANG CONTROLS
// ============================================================
const initControls = () => {
  // Tema
  document.getElementById('themeToggleBtn')?.addEventListener('click', () => Theme.toggle());

  // Dil
  document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    const next = I18n.getLang() === 'tr' ? 'en' : 'tr';
    I18n.setLang(next);
  });

  // Logo → Ana Sayfa
  document.getElementById('logoHome')?.addEventListener('click', (e) => {
    e.preventDefault();
    TabRouter.goTo('home');
  });
};

// ============================================================
// HISTORY MODULE
// ============================================================
const HistoryModule = (() => {
  let allTransactions = [];
  let currentFilter = 'ALL';
  let searchQuery = '';

  const initEvents = () => {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        render();
      });
    });

    document.getElementById('historySearchInput')?.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      render();
    });

    document.getElementById('csvExportBtn')?.addEventListener('click', async () => {
      try {
        Toast.info('Hazırlanıyor', 'Excel tablosu oluşturuluyor...');
        const token = localStorage.getItem('cn_token');
        const res = await fetch('/api/wallet/export-excel', {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('İndirme başarısız oldu.');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CryptoNova_Islemler.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        Toast.error('Hata', err.message);
      }
    });
  };

  const loadData = async () => {
    try {
      const resp = await ApiService.getTransactions(200, 0);
      allTransactions = resp.data || [];
      render();
    } catch (err) {
      console.error('History load error:', err);
    }
  };

  const render = () => {
    const tbody = document.getElementById('historyTableBody');
    const empty = document.getElementById('historyEmptyState');
    if (!tbody || !empty) return;

    let filtered = allTransactions;
    if (currentFilter !== 'ALL') {
      filtered = filtered.filter(t => t.type?.toUpperCase() === currentFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(t => 
        (t.coin_symbol || '').toLowerCase().includes(searchQuery) ||
        (t.coin_id || '').toLowerCase().includes(searchQuery)
      );
    }

    if (!filtered.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
      document.querySelector('.history-table-container').hidden = true;
      return;
    }

    empty.hidden = true;
    document.querySelector('.history-table-container').hidden = false;

    tbody.innerHTML = filtered.map(t => {
      const typeStr = (t.type || '').toUpperCase();
      const isBuy = typeStr === 'BUY';
      const isSell = typeStr === 'SELL';
      const rowClass = isBuy ? 'buy-row' : (isSell ? 'sell-row' : '');
      let typeLabel = typeStr;
      if (isBuy) typeLabel = I18n.t('filter_buy').replace('Sadece ', '').replace(' Only', '');
      else if (isSell) typeLabel = I18n.t('filter_sell').replace('Sadece ', '').replace(' Only', '');

      const isPositive = ['BUY', 'DEPOSIT', 'TRANSFER_IN'].includes(typeStr);
      
      return `
        <tr class="${rowClass}">
          <td data-label="${I18n.t('col_asset')}">
            <div style="font-weight:600;display:flex;align-items:center;gap:8px;">
              <div class="transaction-item__icon ${typeStr.toLowerCase()}" style="width:24px;height:24px;font-size:12px;">${isPositive ? '📈' : '📉'}</div>
              <div>
                ${typeStr} ${t.coin_symbol || 'USD'}
                <div style="font-size:0.75rem; color:var(--color-text-muted); font-weight:normal; margin-top:2px;">
                  ${t.price_at_time ? Fmt.price(t.price_at_time) + ' fiyattan' : ''}
                </div>
              </div>
            </div>
          </td>
          <td data-label="${I18n.t('col_type')}">
            <span class="change-pill ${isPositive ? 'positive' : 'negative'}">${typeLabel}</span>
          </td>
          <td class="td-right" data-label="${I18n.t('col_amount')}">
            ${isPositive ? '+' : '-'}${Fmt.cryptoAmount(t.amount)}
          </td>
          <td class="td-right" data-label="${I18n.t('col_price')}">${Fmt.price(t.price_at_time)}</td>
          <td class="td-right" data-label="${I18n.t('col_total')}">${Fmt.price(t.total_cost)}</td>
          <td class="td-right" data-label="${I18n.t('col_date')}">${Fmt.time(t.timestamp)}</td>
        </tr>
      `;
    }).join('');
  };

  const onTabActivate = () => {
    if (Auth.isLoggedIn()) {
      loadData();
    } else {
      const tbody = document.getElementById('historyTableBody');
      if(tbody) tbody.innerHTML = '';
      document.getElementById('historyEmptyState').hidden = false;
      document.querySelector('.history-table-container').hidden = true;
    }
  };

  const init = () => {
    initEvents();
  };

  return { init, onTabActivate, loadData };
})();

// ============================================================
// LIVE PRICE MODULE (Binance WebSocket)
// ============================================================
const LivePriceModule = (() => {
  let ws = null;
  const init = () => connect();

  const connect = () => {
    if (ws) ws.close();
    ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!Array.isArray(data)) return;
        
        data.forEach(ticker => {
          const symFull = ticker.s.toLowerCase();
          if (symFull.endsWith('usdt')) {
            const sym = symFull.replace('usdt', '');
            const newPrice = parseFloat(ticker.c);
            
            MarketsModule.updateLivePrice(sym, newPrice);
            if (TabRouter.getCurrent() === 'trade') {
              TradeModule.updateLivePrice(sym, newPrice);
            }
            if (WalletModule && WalletModule.checkAlerts) {
              WalletModule.checkAlerts(sym, newPrice);
            }
          }
        });
      } catch (err) {}
    };

    ws.onerror = (e) => console.error('Binance WS Error', e);
    ws.onclose = () => setTimeout(connect, 5000);
  };

  return { init };
})();

// ============================================================
// APP INIT
// ============================================================
const App = {
  async init() {
    const logoHome = document.getElementById('logoHome');
    if (logoHome) {
      logoHome.addEventListener('click', (e) => {
        e.preventDefault();
        TabRouter.goTo('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 0. Canlı döviz kurlarını çek
    await GlobalRates.init();

    // 1. Tema uygula
    Theme.apply(Theme.get());

    // 2. Dil uygula
    I18n.applyTranslations();

    // 3. Tab Router
    TabRouter.init();

    // 4. Auth modal & kontroller
    AuthModal.initEvents();
    SettingsModule.init();

    // 5. Tema & dil kontrolleri
    initControls();

    // 6. Coin Detail
    CoinDetailModule.initEvents();

    // 7. Navbar Search
    NavSearch.init();

    // 8. Modüller init
    TradeModule.init();
    ConverterModule.init();
    WalletModule.init();
    HistoryModule.init();
    LivePriceModule.init();

    // 9. Session geri yükleme
    await Auth.tryRestoreSession();

    // 10. Piyasa verilerini çek
    await MarketsModule.init();

    console.log('🚀 CryptoNova v2.0 hazır!');
  }
};

// DOM hazır olduğunda başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
