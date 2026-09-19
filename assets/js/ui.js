/* Shared helpers, icon sprite and brand mark. Loaded by every page. */
window.APP = { lang: 'en', currency: 'BDT' };

const LS = {
  get(k, fb) { try { const v = localStorage.getItem('sup_' + k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set(k, v) { try { localStorage.setItem('sup_' + k, JSON.stringify(v)); return true; } catch { return false; } }
};
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const num = s => APP.lang === 'bn' ? String(s).replace(/\d/g, d => BN_DIGITS[+d]) : String(s);

function money(bdt) {
  if (APP.currency === 'USD') return '$' + num(Math.round(bdt / CONFIG.USD_RATE).toLocaleString('en-US'));
  return '৳' + num(Math.round(bdt || 0).toLocaleString('en-IN'));
}
const taka = n => '৳' + Number(n || 0).toLocaleString('en-IN');

function toast(msg) {
  let el = $('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] bg-ink text-white text-[13.5px] font-semibold px-5 py-3 rounded-xl shadow-deep';
  el.textContent = msg;
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.add('hide'), 2600);
}

/* phone helpers ------------------------------------------------------ */
const waNumber = p => String(p || '').replace(/\D/g, '').replace(/^00/, '').replace(/^0/, '88');
const waLink = (phone, text) => 'https://wa.me/' + waNumber(phone) + (text ? '?text=' + encodeURIComponent(text) : '');

/* generated artwork used whenever a photo is missing ------------------ */
function artwork(hue, label, h) {
  hue = hue || 198;
  return `<svg viewBox="0 0 400 ${h}" preserveAspectRatio="none" class="w-full h-full" role="img" aria-label="${esc(label || 'photo')}">
    <defs><linearGradient id="g${hue}${h}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="hsl(${hue},48%,42%)"/><stop offset="1" stop-color="hsl(${hue},55%,24%)"/></linearGradient></defs>
    <rect width="400" height="${h}" fill="url(#g${hue}${h})"/>
    <circle cx="316" cy="${h * 0.3}" r="${h * 0.17}" fill="#F5C518" opacity=".9"/>
    <path d="M0 ${h * 0.68}c60-26 104 10 150-6s90-32 130-12 78 26 120 12V${h}H0Z" fill="hsl(${hue},45%,18%)" opacity=".55"/>
    <path d="M0 ${h * 0.82}c70 14 120-12 190 2s140 18 210-4V${h}H0Z" fill="hsl(${hue},50%,14%)" opacity=".6"/>
  </svg>`;
}
window.__art = artwork;
function picture(img, hue, label, h) {
  if (img) return `<img src="${esc(img)}" alt="${esc(label || '')}" loading="lazy" class="w-full h-full object-cover"
    onerror="this.parentNode.innerHTML=window.__art(${hue || 198},'photo',${h})">`;
  return artwork(hue, label, h);
}

/* icon sprite + logo, injected once ---------------------------------- */
const SPRITE = `
<symbol id="ic-phone" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></symbol>
<symbol id="ic-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></symbol>
<symbol id="ic-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="ic-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="ic-plane" viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.3-2.4 2.4-2-.6a.5.5 0 0 0-.5.8L5.6 16l1.7 2.3a.5.5 0 0 0 .8-.5l-.6-2 2.4-2.4 4.3 3.9a.5.5 0 0 0 .8-.5Z"/></symbol>
<symbol id="ic-star" viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6.1-5.3-3-5.3 3 1.1-6.1L3.4 9.4l6-.8Z"/></symbol>
<symbol id="ic-heart" viewBox="0 0 24 24"><path d="M20.4 5.6a5 5 0 0 0-7.1 0L12 6.9l-1.3-1.3a5 5 0 1 0-7.1 7.1l8.4 8.4 8.4-8.4a5 5 0 0 0 0-7.1Z"/></symbol>
<symbol id="ic-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7"/></symbol>
<symbol id="ic-bed" viewBox="0 0 24 24"><path d="M2 18V7m0 6h20v5M2 13V9h8v4m4 0V9h8"/></symbol>
<symbol id="ic-crown" viewBox="0 0 24 24"><path d="M3 18h18M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 8h-13Z"/></symbol>
<symbol id="ic-wa" viewBox="0 0 24 24" class="i-fill"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm0 1.9a8 8 0 1 1-4.1 14.85l-.3-.18-3.05.88.9-2.96-.2-.32A8 8 0 0 1 12.04 3.9Zm-2.5 4.1c-.2 0-.5.07-.75.35-.26.28-1 .95-1 2.32 0 1.37 1.02 2.7 1.16 2.88.14.19 2 3.05 4.9 4.16 2.4.92 2.9.74 3.42.7.52-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.54-.33-.28-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.4-.84-.75-1.41-1.68-1.58-1.96-.16-.28-.02-.43.13-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.63-1.53-.87-2.1-.22-.53-.45-.46-.62-.47h-.53Z"/></symbol>
<symbol id="ic-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></symbol>
<symbol id="ic-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>
<symbol id="ic-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></symbol>
<symbol id="ic-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="ic-passport" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 17h6"/></symbol>
<symbol id="ic-headset" viewBox="0 0 24 24"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="2" y="13" width="4" height="6" rx="1.5"/><rect x="18" y="13" width="4" height="6" rx="1.5"/><path d="M20 19v1a3 3 0 0 1-3 3h-3"/></symbol>
<symbol id="ic-edit" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5Z"/></symbol>
<symbol id="ic-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></symbol>
<symbol id="ic-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="ic-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></symbol>
<symbol id="ic-out" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
<symbol id="ic-img" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 19 5-5 4 4 3-3 4 4"/></symbol>
<symbol id="ic-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></symbol>
<symbol id="ic-doc" viewBox="0 0 24 24"><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5M9 13h6M9 17h4"/></symbol>
<symbol id="ic-down" viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></symbol>
<symbol id="ic-right" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="ic-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></symbol>
<symbol id="ic-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 7M18 21a6.5 6.5 0 0 0-2-4.7"/></symbol>
<symbol id="ic-cash" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></symbol>
<symbol id="ic-print" viewBox="0 0 24 24"><path d="M7 8V3h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/></symbol>
<symbol id="ic-cog" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 14H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3Z"/></symbol>
<symbol id="ic-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/></symbol>
<symbol id="ic-chart" viewBox="0 0 24 24"><path d="M3 3v18h18M7 15v3M12 10v8M17 6v12"/></symbol>
<symbol id="ic-eye" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="ic-building" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M9 21v-3h6v3"/></symbol>
<symbol id="ic-pen" viewBox="0 0 24 24"><path d="M4 20l4-1 11-11a2 2 0 0 0-3-3L5 16Z"/><path d="M14 6l3 3"/></symbol>`;

const BRANDMARK = `<symbol id="brandmark" viewBox="0 0 400 300">
  <circle cx="200" cy="120" r="78" fill="#F5C518"/>
  <path d="M112 246c-26 0-46-20-46-44 0-23 18-42 41-44 6-27 30-47 58-47 9 0 18 2 26 6 11-17 30-28 52-28 33 0 60 26 60 59 0 3 0 6-1 9 21 5 36 23 36 45 0 25-21 44-46 44Z" fill="#0A6A94"/>
  <path d="M200 96c8 0 14 10 15 24l1 20 44 34 0 16-44-12 0 26 18 15 0 12-34-8-34 8 0-12 18-15 0-26-44 12 0-16 44-34 1-20c1-14 7-24 15-24Z" fill="#F5C518"/>
  <path d="M186 168 96 200l0 18 90-20Zm28 0 90 32 0 18-90-20Z" fill="#fff"/>
  <path d="M186 168h28v58l14 12v10l-28-6-28 6v-10l14-12Z" fill="#fff"/>
</symbol>`;

(function injectSprite() {
  const s = document.createElement('div');
  s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${SPRITE}${BRANDMARK}</svg>`;
  document.addEventListener('DOMContentLoaded', () => document.body.prepend(s));
})();

const icon = (name, cls = '') => `<svg class="i ${cls}"><use href="#${name}"/></svg>`;
const logo = (cls = 'w-12 h-9') => `<svg viewBox="0 0 400 300" class="${cls}"><use href="#brandmark"/></svg>`;
