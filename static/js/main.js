// Toast notification
function showToast(msg, type='success') {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.className = 'toast', 3000);
}

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('mr-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ────────── Internationalization (Language Toggle) ──────────
const I18N = {
  mr: {
    'nav.home': '🏠 मुख्य पेज',
    'nav.about': '👤 आमच्याबद्दल',
    'nav.gallery': '🖼 गॅलरी',
    'nav.contact': '📞 संपर्क',
    'nav.admin': '🔐 Admin',
    'nav.toggle': 'EN',
    'gallery.title': '🖼 आमचे काम',
    'gallery.subtitle': 'Akshay Fabrication Works च्या काही उत्कृष्ट कामांचे फोटो',
  },
  en: {
    'nav.home': '🏠 Home',
    'nav.about': '👤 About',
    'nav.gallery': '🖼 Gallery',
    'nav.contact': '📞 Contact',
    'nav.admin': '🔐 Admin',
    'nav.toggle': 'मराठी',
    'gallery.title': '🖼 Our Work',
    'gallery.subtitle': 'Some of our best work at Akshay Fabrication Works',
  }
};

function getAppLang() {
  return localStorage.getItem('appLang') || 'mr';
}

function setAppLang(lang) {
  localStorage.setItem('appLang', lang);
  applyAppLang();
}

function toggleLanguage() {
  setAppLang(getAppLang() === 'mr' ? 'en' : 'mr');
}

function applyAppLang() {
  const lang = getAppLang();
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = (I18N[lang] && I18N[lang][key]) || el.textContent;
    if (text != null) el.textContent = text;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyAppLang();

  // Close mobile nav menu after clicking a link
  const navEl = document.getElementById('navLinks');
  if (navEl) {
    navEl.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navEl.classList.remove('open'));
    });
  }
});
