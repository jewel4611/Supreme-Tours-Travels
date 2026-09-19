/* =====================================================================
   Public website behaviour
   ===================================================================== */
let tier = '3star', filter = 'all';
let packages = [], services = [], gallery = [], wishlist = LS.get('wish', []);
let addonState = {}, lastQuote = null;

/* ---------------------------------------------------- language + money */
function setLang(l) {
  APP.lang = l; LS.set('lang', l);
  document.documentElement.lang = l === 'bn' ? 'bn' : 'en';
  document.body.classList.toggle('lang-bn', l === 'bn');
  $('lng-en').className = 'px-3 py-1 rounded-full text-[12px] font-semibold ' + (l === 'en' ? 'bg-sun text-ink' : 'text-white/70');
  $('lng-bn').className = 'px-3 py-1 rounded-full text-[12px] font-semibold font-bangla ' + (l === 'bn' ? 'bg-sun text-ink' : 'text-white/70');
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-ph]').forEach(el => el.placeholder = t(el.dataset.ph));
  document.querySelectorAll('[data-num]').forEach(el => { el.dataset.raw = el.dataset.raw || el.textContent; el.textContent = num(el.dataset.raw); });
  $('ft-addr').textContent = l === 'bn' ? CONFIG.ADDRESS_BN : CONFIG.ADDRESS_EN;
  renderPackages(); renderServices(); renderGallery(); renderReviews(); renderAddons(); fillDestSelects(); calc();
}
function setCurrency(c) { APP.currency = c; LS.set('currency', c); renderPackages(); renderAddons(); calc(); }

/* ------------------------------------------------------------ rendering */
function renderPackages() {
  const grid = $('pkgrid');
  const rows = packages.filter(p => filter === 'all' || p.cat === filter);
  if (!rows.length) { grid.innerHTML = `<p class="text-[#5C7688] text-[15px]">${t('pk.empty')}</p>`; return; }
  grid.innerHTML = rows.map(p => {
    const inc = (APP.lang === 'bn' ? (p.inc_bn || p.inc_en) : p.inc_en) || [];
    const saved = wishlist.includes(p.id);
    return `<article class="bg-white rounded-[20px] shadow-lift flex flex-col">
      <div class="relative h-44 rounded-t-[20px] overflow-hidden">
        ${picture(p.img, p.hue, L(p, 'title'), 176)}
        <span class="absolute top-3 left-3 bg-white/95 text-deep text-[11.5px] font-bold px-2.5 py-1 rounded-lg">${p.cat === 'domestic' ? t('pk.f.dom') : t('pk.f.int')}</span>
        <button onclick="toggleWish('${p.id}')" aria-label="Save" class="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/90 ${saved ? 'text-[#D4463A]' : 'text-[#3A5568]'}">
          ${icon('ic-heart', 'text-[18px] ' + (saved ? 'i-fill' : ''))}</button>
      </div>
      <div class="p-5 flex-1 flex flex-col">
        <div class="flex items-center gap-2 text-[12.5px] text-[#5C7688]">
          <span class="flex items-center gap-1 text-sun">${icon('ic-star', 'i-fill text-[13px]')}<span class="text-ink font-bold">${num(p.rating || 4.7)}</span></span>
          <span>·</span><span>${num(p.nights)} ${t('pk.nights')} / ${num(p.nights + 1)} ${t('pk.days')}</span>
        </div>
        <h3 class="font-display font-bold text-[18.5px] leading-snug mt-2">${esc(L(p, 'title'))}</h3>
        <p class="text-[13.5px] text-[#5C7688] leading-relaxed mt-1.5">${esc(L(p, 'sum'))}</p>
        <ul class="mt-4 grid gap-1.5 text-[13px] text-[#3A5568]">
          ${inc.slice(0, 3).map(i => `<li class="flex gap-2">${icon('ic-check', 'text-leaf text-[15px] shrink-0 mt-0.5')}<span>${esc(i)}</span></li>`).join('')}
        </ul>
        <button onclick="openItinerary('${p.id}')" class="mt-2.5 self-start text-[12.5px] font-semibold text-sea hover:text-deep flex items-center gap-1">${t('pk.itin')} ${icon('ic-right', 'text-[12px]')}</button>
        <div class="flex-1"></div>
        <div class="stub-foot mt-5 pt-4 flex items-end justify-between gap-3">
          <div>
            <span class="block text-[11.5px] text-[#5C7688]">${t('pk.from')}</span>
            <span class="font-display font-extrabold text-[21px] text-deep">${money(p.from)}</span>
            <span class="block text-[11.5px] text-[#5C7688]">${t('pk.pp')}</span>
          </div>
          <button onclick="pickPackage('${p.id}')" class="bg-deep hover:bg-ink text-white text-[13px] font-bold px-4 py-2.5 rounded-xl">${t('pk.cta')}</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderServices() {
  $('svgrid').innerHTML = services.map(s => `
    <div class="bg-white rounded-2xl p-6 shadow-lift">
      <span class="w-11 h-11 rounded-xl bg-sand text-deep grid place-items-center">${icon(s.icon || 'ic-plane', 'text-[21px]')}</span>
      <h3 class="font-display font-bold text-[16.5px] mt-4">${esc(L(s, 'title'))}</h3>
      <p class="text-[13.5px] text-[#5C7688] leading-relaxed mt-1.5">${esc(L(s, 'desc'))}</p>
    </div>`).join('');
}

function renderGallery() {
  $('glgrid').innerHTML = gallery.map(g => `
    <figure class="relative rounded-2xl overflow-hidden aspect-[4/5]">
      ${picture(g.img, g.hue, L(g, 'caption'), 300)}
      <figcaption class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent text-white text-[12.5px] font-semibold p-3">${esc(L(g, 'caption'))}</figcaption>
    </figure>`).join('');
}

function renderReviews() {
  $('reviews').innerHTML = REVIEWS.map(r => `
    <blockquote class="bg-white rounded-2xl p-6 shadow-lift">
      <div class="flex gap-0.5 text-sun">${icon('ic-star', 'i-fill text-[15px]').repeat(5)}</div>
      <p class="text-[14px] leading-relaxed mt-3">${esc(APP.lang === 'bn' ? r.bn : r.en)}</p>
      <footer class="text-[12.5px] text-[#5C7688] mt-4 font-semibold">${esc(r.n)} · ${esc(r.c)}</footer>
    </blockquote>`).join('');
  $('ftdest').innerHTML = packages.slice(0, 5).map(p =>
    `<li><a href="#packages" onclick="pickPackage('${p.id}')" class="hover:text-sun">${esc(L(p, 'title'))}</a></li>`).join('');
}

const ADDONS = [
  { id: 'flights',   key: 'flight', en: ['Flights or express transit', 'Ticket, tax and luggage'],      bn: ['ফ্লাইট বা এক্সপ্রেস যাতায়াত', 'টিকিট, ট্যাক্স ও লাগেজসহ'], on: true },
  { id: 'transfers', key: 'fixed',  en: ['Private airport transfers', 'Air-conditioned car both ways'], bn: ['ব্যক্তিগত এয়ারপোর্ট ট্রান্সফার', 'দুই দিকেই এসি গাড়ি'],   on: true,  amt: () => CONFIG.TRANSFER_FEE },
  { id: 'meals',     key: 'perday', en: ['Lunch and dinner daily', 'Set menu at the hotel'],            bn: ['প্রতিদিন দুপুর ও রাতের খাবার', 'হোটেলে সেট মেন্যু'],       on: false, amt: () => CONFIG.MEAL_FEE },
  { id: 'guide',     key: 'fixed',  en: ['Guide and entry tickets', 'Bangla or English speaking'],      bn: ['গাইড ও প্রবেশ টিকিট', 'বাংলা বা ইংরেজি ভাষায়'],          on: false, amt: () => CONFIG.GUIDE_FEE },
  { id: 'insurance', key: 'perpax', en: ['Travel insurance', 'Medical and baggage cover'],              bn: ['ট্রাভেল ইনস্যুরেন্স', 'মেডিকেল ও ব্যাগেজ কভার'],         on: false, amt: () => CONFIG.INSURANCE_FEE },
  { id: 'visa',      key: 'perpax', en: ['Visa filing', 'Overseas trips only'],                          bn: ['ভিসা প্রসেসিং', 'শুধু বিদেশ ভ্রমণে'],                    on: false, amt: () => CONFIG.VISA_FEE, intl: true }
];

function renderAddons() {
  const p = current();
  $('addons').innerHTML = ADDONS.filter(a => !a.intl || (p && p.cat === 'international')).map(a => {
    const txt = APP.lang === 'bn' ? a.bn : a.en;
    const per = s => ' / ' + (APP.lang === 'bn' ? s[1] : s[0]);
    let tag;
    if (a.key === 'flight') tag = p ? money(p.flight) + per(['person', 'জন']) : '—';
    else if (a.key === 'perday') tag = money(a.amt()) + per(['person / day', 'জন / দিন']);
    else if (a.key === 'perpax') tag = money(a.amt()) + per(['person', 'জন']);
    else tag = money(a.amt());
    const on = addonState[a.id] ?? a.on;
    return `<label class="flex items-center justify-between gap-3 bg-white border-[1.5px] border-[#D7E2E9] rounded-xl px-4 py-3 cursor-pointer">
      <span class="flex items-start gap-3">
        <input type="checkbox" ${on ? 'checked' : ''} onchange="setAddon('${a.id}',this.checked)" class="mt-0.5 w-4 h-4 accent-[#0A6A94]">
        <span><span class="block font-semibold text-[13.5px]">${esc(txt[0])}</span><span class="block text-[12px] text-[#5C7688]">${esc(txt[1])}</span></span>
      </span>
      <span class="text-[12.5px] font-bold text-deep whitespace-nowrap">${tag}</span>
    </label>`;
  }).join('');
}
function setAddon(id, v) { addonState[id] = v; calc(); }

function fillDestSelects() {
  ['q-dest', 'c-dest'].forEach(id => {
    const el = $(id); if (!el) return;
    const keep = el.value;
    el.innerHTML = packages.map(p => `<option value="${p.id}">${esc(L(p, 'title'))}</option>`).join('');
    if (keep && packages.some(p => p.id === keep)) el.value = keep;
  });
  document.querySelectorAll('[data-tier-price]').forEach(el => {
    const v = el.dataset.tierPrice === '4' ? CONFIG.UPGRADE_4STAR : CONFIG.UPGRADE_5STAR;
    el.textContent = '+' + money(v) + ' / ' + (APP.lang === 'bn' ? 'রাত' : 'night');
  });
}

/* ----------------------------------------------------------- calculator */
const current = () => packages.find(p => p.id === $('c-dest').value) || packages[0];
function step(id, d) { const el = $(id); el.value = Math.max(+el.min || 0, (+el.value || 0) + d); calc(); }
function setTier(v) { tier = v; document.querySelectorAll('#tiers .opt').forEach(b => b.classList.toggle('sel', b.dataset.t === v)); calc(); }

function calc() {
  const p = current(); if (!p) return;
  const adults = Math.max(1, +$('c-pax').value || 1);
  const kids = Math.max(0, +$('c-kids').value || 0);
  const nights = Math.max(1, +$('c-nights').value || 1);
  const heads = adults + kids, rooms = Math.ceil(heads / 2);

  const upPerNight = tier === '4star' ? CONFIG.UPGRADE_4STAR : tier === '5star' ? CONFIG.UPGRADE_5STAR : 0;
  const hotel = (p.base + upPerNight) * nights * rooms;
  const upgrade = upPerNight * nights * rooms;

  const on = id => addonState[id] ?? (ADDONS.find(a => a.id === id) || {}).on;
  const flight = on('flights') ? p.flight * heads : 0;

  let extras = 0;
  if (on('transfers')) extras += CONFIG.TRANSFER_FEE;
  if (on('meals')) extras += CONFIG.MEAL_FEE * heads * nights;
  if (on('guide')) extras += CONFIG.GUIDE_FEE;
  if (on('insurance')) extras += CONFIG.INSURANCE_FEE * heads;
  if (on('visa') && p.cat === 'international') extras += CONFIG.VISA_FEE * heads;

  const kidCut = kids ? Math.round(((on('flights') ? p.flight : 0) + (on('meals') ? CONFIG.MEAL_FEE * nights : 0)) * kids * CONFIG.CHILD_DISCOUNT) : 0;
  const total = Math.max(0, hotel + flight + extras - kidCut);

  $('sum-name').textContent = L(p, 'title');
  $('sum-hotel-total').textContent = money(hotel);
  $('sum-upgrade').textContent = upPerNight ? '+' + money(upgrade) : (APP.lang === 'bn' ? 'নেই' : 'None');
  $('sum-flight').textContent = flight ? money(flight) : (APP.lang === 'bn' ? 'বাদ' : 'Not included');
  $('sum-extras').textContent = money(extras);
  $('row-kids').classList.toggle('hide', !kidCut);
  $('sum-kids').textContent = '−' + money(kidCut);
  $('sum-meta').textContent = num(adults) + ' ' + (APP.lang === 'bn' ? 'জন' : 'adults') +
    (kids ? ' · ' + num(kids) + ' ' + (APP.lang === 'bn' ? 'শিশু' : 'children') : '') + ' · ' + num(nights) + ' ' + t('pk.nights');
  $('sum-rooms').textContent = num(rooms) + ' ' + (APP.lang === 'bn' ? 'রুম' : rooms > 1 ? 'rooms' : 'room');
  $('sum-total').textContent = money(total);
  $('sum-pp').textContent = money(Math.round(total / heads)) + ' ' + t('pk.pp');

  const tierLabel = tier === '3star' ? t('tier.3') : tier === '4star' ? t('tier.4') : t('tier.5');
  $('qm-dest').textContent = L(p, 'title');
  $('qm-meta').textContent = $('sum-meta').textContent;
  $('qm-hotel').textContent = tierLabel;
  $('qm-total').textContent = money(total);

  lastQuote = {
    package: p.title_en, package_id: p.id, pax: adults, children: kids, nights,
    hotel_tier: tier, travel_date: $('c-date2').value || null,
    addons: ADDONS.filter(a => on(a.id)).map(a => a.id).join(', '),
    lines: [
      { label: 'Accommodation, ' + rooms + ' room(s) × ' + nights + ' night(s)', amount: hotel },
      { label: on('flights') ? 'Flights / transit × ' + heads : 'Flights not included', amount: flight },
      { label: 'Transfers and add-on services', amount: extras },
      ...(kidCut ? [{ label: 'Child discount', amount: -kidCut }] : [])
    ],
    total_bdt: total, currency: APP.currency
  };
}

function sendQuickToPlanner() {
  $('c-dest').value = $('q-dest').value;
  $('c-pax').value = $('q-pax').value;
  $('c-nights').value = $('q-nights').value;
  $('c-date2').value = $('q-date').value;
  renderAddons(); calc();
  $('planner').scrollIntoView({ behavior: 'smooth' });
}
function pickPackage(id) {
  $('c-dest').value = id;
  const p = packages.find(x => x.id === id);
  if (p) $('c-nights').value = p.nights;
  renderAddons(); calc();
  $('planner').scrollIntoView({ behavior: 'smooth' });
}

/* --------------------------------------------------------- itinerary modal */
function openItinerary(id) {
  const p = packages.find(x => x.id === id);
  if (!p) return;
  const days = (APP.lang === 'bn' && p.itinerary_bn && p.itinerary_bn.length) ? p.itinerary_bn : (p.itinerary_en || []);
  const inc = (APP.lang === 'bn' ? (p.inc_bn || p.inc_en) : p.inc_en) || [];
  const excl = (APP.lang === 'bn' ? (p.excl_bn || p.excl_en) : p.excl_en) || [];

  $('itin-title').textContent = L(p, 'title');
  $('itin-days').innerHTML = days.length
    ? days.map((d, i) => `<li class="flex gap-3">
        <span class="shrink-0 w-7 h-7 rounded-full bg-sea text-white text-[12px] font-bold grid place-items-center">${num(i + 1)}</span>
        <span class="text-[13.5px] text-[#3A5568] pt-0.5">${esc(d)}</span>
      </li>`).join('')
    : `<li class="text-[13.5px] text-[#5C7688]">${t('itin.empty')}</li>`;
  $('itin-inc').innerHTML = inc.length
    ? inc.map(i => `<li class="flex gap-2">${icon('ic-check', 'text-leaf text-[14px] shrink-0 mt-0.5')}<span>${esc(i)}</span></li>`).join('')
    : `<li class="text-[#5C7688]">—</li>`;
  $('itin-excl').innerHTML = excl.length
    ? excl.map(i => `<li class="flex gap-2">${icon('ic-x', 'text-[#B4361F] text-[14px] shrink-0 mt-0.5')}<span>${esc(i)}</span></li>`).join('')
    : `<li class="text-[#5C7688]">—</li>`;
  $('itin-price-btn').onclick = () => { closeItinerary(); pickPackage(id); };
  $('itin-modal').classList.remove('hide');
}
function closeItinerary() { $('itin-modal').classList.add('hide'); }

/* ---------------------------------------------- wishlist, menu, whatsapp */
function toggleWish(id) {
  const i = wishlist.indexOf(id);
  if (i > -1) wishlist.splice(i, 1); else wishlist.push(id);
  LS.set('wish', wishlist);
  const b = $('wish-badge'); b.textContent = num(wishlist.length); b.classList.toggle('hide', !wishlist.length);
  renderPackages();
}
function openWishlist() {
  if (!wishlist.length) { toast(t('wish.empty')); return; }
  const names = wishlist.map(id => { const p = packages.find(x => x.id === id); return p ? L(p, 'title') : ''; }).filter(Boolean);
  alert(t('wish.h') + '\n\n• ' + names.join('\n• '));
}
function toggleMenu() { $('menu').classList.toggle('hide'); }

function waQuote() {
  const q = lastQuote, bn = APP.lang === 'bn';
  const lines = q ? [
    bn ? 'আসসালামু আলাইকুম, সুপ্রিম ট্যুরস অ্যান্ড ট্রাভেলস।' : 'Hello Supreme Tours & Travels,', '',
    (bn ? 'ভ্রমণ: ' : 'Trip: ') + q.package,
    (bn ? 'যাত্রী: ' : 'People: ') + q.pax + (q.children ? ' + ' + q.children + (bn ? ' শিশু' : ' children') : ''),
    (bn ? 'রাত: ' : 'Nights: ') + q.nights,
    (bn ? 'হোটেল: ' : 'Hotel: ') + q.hotel_tier,
    (bn ? 'আনুমানিক: ' : 'Estimate: ') + money(q.total_bdt), '',
    bn ? 'অনুগ্রহ করে চূড়ান্ত রেট জানাবেন।' : 'Please confirm the final rate.'
  ] : [bn ? 'আমি একটি ট্যুর প্যাকেজ সম্পর্কে জানতে চাই।' : 'I would like to ask about a tour package.'];
  window.open(waLink(CONFIG.WHATSAPP, lines.join('\n')), '_blank');
}

/* ------------------------------------------------------- lead capture */
function openQuote() { calc(); $('qm-body').classList.remove('hide'); $('qm-done').classList.add('hide'); $('quote-modal').classList.remove('hide'); $('lead-name').focus(); }
function closeQuote() { $('quote-modal').classList.add('hide'); }

async function submitLead(e) {
  e.preventDefault();
  const btn = $('lead-btn'); btn.disabled = true;
  btn.textContent = APP.lang === 'bn' ? 'পাঠানো হচ্ছে…' : 'Sending…';

  const name = $('lead-name').value.trim();
  const phone = $('lead-phone').value.trim();
  const email = $('lead-email').value.trim() || null;
  const consent = $('lead-consent').checked;

  try {
    const customer = await upsertCustomer({ name, phone, email, source: 'website', lang: APP.lang, consent });
    const doc_no = await nextNumber('quotations', 'QT');
    const row = {
      id: uid(), created_at: new Date().toISOString(), doc_no,
      customer_id: customer.id, name, phone, email,
      message: $('lead-note').value.trim() || null,
      consent, lang: APP.lang, status: 'new', source: 'website',
      ...lastQuote, lines: JSON.stringify(lastQuote.lines)
    };
    await DB.save('quotations', row);
    $('qm-ref').textContent = doc_no;
    $('qm-okmsg').textContent = APP.lang === 'bn'
      ? 'ধন্যবাদ ' + name + '। আপনার কোটেশন ' + doc_no + ' নম্বরে সংরক্ষিত হয়েছে। অফিস সময়ের মধ্যে ' + phone + ' নম্বরে আমরা কল করব।'
      : 'Thank you ' + name + '. Your quotation is saved as ' + doc_no + '. We will call ' + phone + ' within office hours today.';
  } catch (err) {
    console.warn(err);
    $('qm-okmsg').textContent = APP.lang === 'bn'
      ? 'ধন্যবাদ। আপনার অনুরোধ নেওয়া হয়েছে, আমরা শীঘ্রই যোগাযোগ করব।'
      : 'Thank you. Your request has been taken and we will contact you shortly.';
  }

  btn.disabled = false; btn.textContent = t('qm.cta');
  $('qm-body').classList.add('hide'); $('qm-done').classList.remove('hide');
}

/* -------------------------------------------------------------- startup */
(async function boot() {
  await applySettings();
  $('year').textContent = new Date().getFullYear();
  $('bar-phone').textContent = CONFIG.PHONE; $('ft-phone').textContent = CONFIG.PHONE;
  $('bar-mail').textContent = CONFIG.EMAIL; $('ft-mail').textContent = CONFIG.EMAIL;
  document.querySelectorAll('a[href^="tel:"]').forEach(a => a.href = 'tel:' + CONFIG.PHONE.replace(/[^\d+]/g, ''));
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => a.href = 'mailto:' + CONFIG.EMAIL);

  const d = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  $('q-date').value = d; $('c-date2').value = d;

  packages = await DB.list('packages', SEED_PACKAGES);
  services = await DB.list('services', SEED_SERVICES);
  gallery = await DB.list('gallery', SEED_GALLERY);

  document.querySelectorAll('.flt').forEach(b => b.onclick = () => {
    filter = b.dataset.f;
    document.querySelectorAll('.flt').forEach(x => {
      const on = x.dataset.f === filter;
      x.className = 'flt text-[13px] font-semibold px-4 py-2 rounded-full ' + (on ? 'tab-on' : 'bg-white border border-[#DDE7EC] text-[#3A5568]');
    });
    renderPackages();
  });

  APP.currency = LS.get('currency', 'BDT');
  $('currency').value = APP.currency;
  if (wishlist.length) { $('wish-badge').classList.remove('hide'); $('wish-badge').textContent = wishlist.length; }

  fillDestSelects(); renderAddons(); setLang(LS.get('lang', 'en'));
  $('c-dest').addEventListener('change', () => { renderAddons(); calc(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeQuote(); closeItinerary(); } });
  $('quote-modal').addEventListener('click', e => { if (e.target.id === 'quote-modal') closeQuote(); });
  $('itin-modal').addEventListener('click', e => { if (e.target.id === 'itin-modal') closeItinerary(); });
})();
