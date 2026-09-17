/* =====================================================================
   Staff panel
   ===================================================================== */
const TABS = [
  { id: 'dash', name: 'Dashboard' }, { id: 'quotations', name: 'Quotations' },
  { id: 'invoices', name: 'Bills' }, { id: 'customers', name: 'Customers' },
  { id: 'packages', name: 'Packages' }, { id: 'services', name: 'Services' },
  { id: 'gallery', name: 'Photos' }, { id: 'setup', name: 'Setup' }
];
const S = { quotations: [], invoices: [], customers: [], packages: [], services: [], gallery: [] };
let tab = 'dash', custSearch = '', promoPicked = [];

const STATUS = {
  new: 'bg-[#FFF4D0] text-[#8A6A00]', called: 'bg-[#E4F1F8] text-[#0A6A94]',
  confirmed: 'bg-[#E8F6EE] text-[#2F6A4E]', lost: 'bg-[#EEF1F3] text-[#5C7688]',
  unpaid: 'bg-[#FDECE8] text-[#B4361F]', partial: 'bg-[#FFF4D0] text-[#8A6A00]', paid: 'bg-[#E8F6EE] text-[#2F6A4E]'
};
const chip = s => `<span class="chip ${STATUS[s] || STATUS.lost}">${esc(s)}</span>`;
const dt = v => v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const lines = q => { try { return typeof q.lines === 'string' ? JSON.parse(q.lines) : (q.lines || []); } catch { return []; } };
const items = i => { try { return typeof i.items === 'string' ? JSON.parse(i.items) : (i.items || []); } catch { return []; } };

/* ------------------------------------------------------------- sign in */
async function signIn(e) {
  e.preventDefault();
  const email = $('ad-email').value.trim(), pass = $('ad-pass').value, err = $('ad-err');
  err.classList.add('hide');
  if (ONLINE()) {
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) { err.textContent = error.message; err.classList.remove('hide'); return; }
  } else if (pass !== CONFIG.DEMO_PASSWORD) {
    err.textContent = 'Wrong password. In demo mode the password lives in assets/js/config.js.';
    err.classList.remove('hide'); return;
  }
  LS.set('adm', 1); start();
}
async function signOut() { if (ONLINE()) await sb.auth.signOut(); LS.set('adm', 0); location.reload(); }

async function start() {
  $('login').classList.add('hide'); $('panel').classList.remove('hide');
  $('mode').textContent = ONLINE() ? 'Supabase connected' : 'Demo mode · this browser only';
  $('tabs').innerHTML = TABS.map(x => `<button onclick="go('${x.id}')" data-tab="${x.id}"
    class="adtab text-[13px] font-semibold px-4 py-2 rounded-lg whitespace-nowrap ${x.id === tab ? 'tab-on' : 'text-white/70 hover:text-white'}">${x.name}</button>`).join('');
  await reload();
  go(tab);
}
async function reload() {
  S.quotations = await DB.list('quotations', []);
  S.invoices = await DB.list('invoices', []);
  S.customers = await DB.list('customers', []);
  S.packages = await DB.list('packages', SEED_PACKAGES);
  S.services = await DB.list('services', SEED_SERVICES);
  S.gallery = await DB.list('gallery', SEED_GALLERY);
}
function go(id) {
  tab = id;
  document.querySelectorAll('.adtab').forEach(b => {
    const on = b.dataset.tab === id;
    b.className = 'adtab text-[13px] font-semibold px-4 py-2 rounded-lg whitespace-nowrap ' + (on ? 'tab-on' : 'text-white/70 hover:text-white');
  });
  ({ dash: viewDash, quotations: viewQuotations, invoices: viewInvoices, customers: viewCustomers,
     packages: viewPackages, services: viewServices, gallery: viewGallery, setup: viewSetup })[id]();
}
const head = (title, sub, actions = '') => `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
    <div><h1 class="font-display font-extrabold text-[23px]">${title}</h1>
    <p class="text-[13.5px] text-[#5C7688]">${sub}</p></div>
    <div class="flex flex-wrap gap-2">${actions}</div>
  </div>`;
const btnPrimary = (label, onclick, ic = 'ic-plus') =>
  `<button onclick="${onclick}" class="bg-deep text-white text-[13px] font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">${icon(ic, 'text-[16px]')}${label}</button>`;
const btnGhost = (label, onclick, ic = 'ic-down') =>
  `<button onclick="${onclick}" class="bg-white border border-[#DDE7EC] text-[13px] font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2">${icon(ic, 'text-[16px]')}${label}</button>`;

/* ----------------------------------------------------------- dashboard */
function viewDash() {
  const now = new Date(), month = now.getMonth(), year = now.getFullYear();
  const thisMonth = r => { const d = new Date(r.created_at); return d.getMonth() === month && d.getFullYear() === year; };
  const paid = S.invoices.filter(i => i.status === 'paid');
  const revenue = S.invoices.filter(thisMonth).reduce((a, i) => a + (+i.paid_bdt || 0), 0);
  const due = S.invoices.reduce((a, i) => a + Math.max(0, (+i.total_bdt || 0) - (+i.paid_bdt || 0)), 0);
  const fresh = S.quotations.filter(q => q.status === 'new');
  const conv = S.quotations.length ? Math.round(S.invoices.length / S.quotations.length * 100) : 0;

  $('pane').innerHTML = head('Dashboard', dt(now)) + `
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
      ${[['Quotes waiting', fresh.length, fresh.length ? 'Call these first' : 'All followed up'],
         ['Customers on file', S.customers.length, 'Reachable on WhatsApp'],
         ['Collected this month', taka(revenue), paid.length + ' invoices paid'],
         ['Outstanding due', taka(due), 'Across all invoices']]
        .map(([l, v, s]) => `<div class="stat"><p class="text-[12.5px] text-[#5C7688]">${l}</p>
          <p class="font-display font-extrabold text-[26px] text-deep mt-1">${v}</p>
          <p class="text-[12px] text-[#5C7688] mt-0.5">${s}</p></div>`).join('')}
    </div>
    <div class="grid lg:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl shadow-lift p-5">
        <h2 class="font-display font-bold text-[16px] mb-3">Latest quote requests</h2>
        ${S.quotations.length ? `<table class="adm"><tbody>${S.quotations.slice(0, 6).map(q => `<tr>
          <td><strong>${esc(q.name)}</strong><br><span class="text-[11.5px] text-[#5C7688]">${esc(q.doc_no || '')} · ${dt(q.created_at)}</span></td>
          <td>${esc(q.package || '')}</td>
          <td class="whitespace-nowrap">${taka(q.total_bdt)}</td>
          <td>${chip(q.status || 'new')}</td>
          <td><a class="text-[#1FA855] font-semibold" target="_blank" href="${waLink(q.phone, waQuoteText(q))}">WhatsApp</a></td>
        </tr>`).join('')}</tbody></table>`
        : `<p class="text-[13.5px] text-[#5C7688] py-6 text-center">Nothing yet. Requests land here the moment someone finishes the price planner.</p>`}
      </div>
      <div class="bg-white rounded-2xl shadow-lift p-5">
        <h2 class="font-display font-bold text-[16px] mb-3">Money this month</h2>
        <p class="text-[13.5px] text-[#5C7688] leading-relaxed">${S.invoices.filter(thisMonth).length} invoices raised, ${taka(revenue)} collected.
        ${due ? `<strong class="text-[#B4361F]">${taka(due)} still outstanding</strong> — the Bills tab shows who owes it.` : 'Nothing outstanding.'}</p>
        <div class="mt-4 grid gap-2">
          ${btnPrimary('New quotation', "editQuotation()", 'ic-doc')}
          ${btnGhost('New invoice', "editInvoice()", 'ic-cash')}
        </div>
      </div>
    </div>`;
}

/* ---------------------------------------------------------- quotations */
function waQuoteText(q) {
  return [`${CONFIG.COMPANY} — quotation ${q.doc_no || ''}`, '',
    `Dear ${q.name},`, `Trip: ${q.package}`,
    `People: ${q.pax}${q.children ? ' + ' + q.children + ' children' : ''} · ${q.nights} nights · ${q.hotel_tier || ''}`,
    `Total: ${taka(q.total_bdt)}`, '',
    'Reply here to confirm and we will hold the booking.', CONFIG.PHONE].join('\n');
}
function viewQuotations() {
  $('pane').innerHTML = head('Quotations', `${S.quotations.length} on file · ${S.quotations.filter(q => q.status === 'new').length} waiting for a call`,
    btnPrimary('New quotation', 'editQuotation()', 'ic-doc') + btnGhost('Download CSV', "csv('quotations')")) + `
    <div class="bg-white rounded-2xl shadow-lift overflow-x-auto">
    ${S.quotations.length ? `<table class="adm"><thead><tr>
      <th>Number</th><th>Customer</th><th>Trip</th><th>Party</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${S.quotations.map(q => `<tr>
        <td class="whitespace-nowrap"><strong>${esc(q.doc_no || '—')}</strong><br><span class="text-[11.5px] text-[#5C7688]">${dt(q.created_at)}</span></td>
        <td><strong>${esc(q.name)}</strong><br><a href="tel:${esc(q.phone)}" class="text-sea text-[12.5px] font-semibold">${esc(q.phone)}</a></td>
        <td>${esc(q.package || '')}<br><span class="text-[11.5px] text-[#5C7688]">${esc(q.hotel_tier || '')} ${q.travel_date ? '· ' + dt(q.travel_date) : ''}</span>
            ${q.message ? `<div class="text-[11.5px] text-[#5C7688] mt-1 max-w-[220px]">“${esc(q.message)}”</div>` : ''}</td>
        <td class="whitespace-nowrap">${q.pax || 0}${q.children ? '+' + q.children : ''} pax<br><span class="text-[11.5px] text-[#5C7688]">${q.nights || 0} nights</span></td>
        <td class="font-semibold whitespace-nowrap">${taka(q.total_bdt)}</td>
        <td><select onchange="setStatus('quotations','${q.id}',this.value)" class="chip ${STATUS[q.status] || STATUS.new} border-0">
          ${['new', 'called', 'confirmed', 'lost'].map(s => `<option ${q.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td><div class="flex gap-1">
          <a target="_blank" href="${waLink(q.phone, waQuoteText(q))}" title="WhatsApp" class="p-2 rounded-lg hover:bg-paper text-[#1FA855]">${icon('ic-wa', 'i-fill text-[17px]')}</a>
          <button onclick="printQuotation('${q.id}')" title="Print or PDF" class="p-2 rounded-lg hover:bg-paper text-deep">${icon('ic-print', 'text-[17px]')}</button>
          <button onclick="invoiceFromQuote('${q.id}')" title="Turn into an invoice" class="p-2 rounded-lg hover:bg-paper text-sea">${icon('ic-cash', 'text-[17px]')}</button>
          <button onclick="editQuotation('${q.id}')" title="Edit" class="p-2 rounded-lg hover:bg-paper text-[#3A5568]">${icon('ic-edit', 'text-[17px]')}</button>
          <button onclick="del('quotations','${q.id}')" title="Delete" class="p-2 rounded-lg hover:bg-paper text-[#B4361F]">${icon('ic-trash', 'text-[17px]')}</button>
        </div></td></tr>`).join('')}</tbody></table>`
      : `<p class="p-10 text-center text-[#5C7688] text-[14px]">No quotations yet. Every price planner submission from the website appears here automatically.</p>`}
    </div>`;
}

/* ------------------------------------------------------------- invoices */
function waInvoiceText(v) {
  const due = (+v.total_bdt || 0) - (+v.paid_bdt || 0);
  return [`${CONFIG.COMPANY} — invoice ${v.doc_no}`, '', `Dear ${v.name},`,
    `Amount: ${taka(v.total_bdt)}`, `Paid: ${taka(v.paid_bdt)}`, `Due: ${taka(due)}`,
    v.due_date ? `Please clear the due by ${dt(v.due_date)}.` : '', '', CONFIG.COMPANY, CONFIG.PHONE]
    .filter(Boolean).join('\n');
}
function viewInvoices() {
  const total = S.invoices.reduce((a, i) => a + (+i.total_bdt || 0), 0);
  const paid = S.invoices.reduce((a, i) => a + (+i.paid_bdt || 0), 0);
  $('pane').innerHTML = head('Bills and invoices', `${S.invoices.length} invoices · ${taka(paid)} collected of ${taka(total)}`,
    btnPrimary('New invoice', 'editInvoice()', 'ic-cash') + btnGhost('Download CSV', "csv('invoices')")) + `
    <div class="bg-white rounded-2xl shadow-lift overflow-x-auto">
    ${S.invoices.length ? `<table class="adm"><thead><tr>
      <th>Number</th><th>Customer</th><th>For</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${S.invoices.map(v => { const due = (+v.total_bdt || 0) - (+v.paid_bdt || 0); return `<tr>
        <td class="whitespace-nowrap"><strong>${esc(v.doc_no)}</strong><br><span class="text-[11.5px] text-[#5C7688]">${dt(v.created_at)}</span></td>
        <td><strong>${esc(v.name)}</strong><br><a href="tel:${esc(v.phone)}" class="text-sea text-[12.5px] font-semibold">${esc(v.phone)}</a></td>
        <td>${esc(v.subject || '')}<br><span class="text-[11.5px] text-[#5C7688]">${items(v).length} line items</span></td>
        <td class="font-semibold whitespace-nowrap">${taka(v.total_bdt)}</td>
        <td class="whitespace-nowrap">${taka(v.paid_bdt)}</td>
        <td class="whitespace-nowrap ${due > 0 ? 'text-[#B4361F] font-semibold' : 'text-[#5C7688]'}">${taka(due)}</td>
        <td>${chip(v.status || 'unpaid')}</td>
        <td><div class="flex gap-1">
          <button onclick="recordPayment('${v.id}')" title="Record a payment" class="p-2 rounded-lg hover:bg-paper text-leaf">${icon('ic-cash', 'text-[17px]')}</button>
          <a target="_blank" href="${waLink(v.phone, waInvoiceText(v))}" title="WhatsApp" class="p-2 rounded-lg hover:bg-paper text-[#1FA855]">${icon('ic-wa', 'i-fill text-[17px]')}</a>
          <button onclick="printInvoice('${v.id}')" title="Print or PDF" class="p-2 rounded-lg hover:bg-paper text-deep">${icon('ic-print', 'text-[17px]')}</button>
          <button onclick="editInvoice('${v.id}')" title="Edit" class="p-2 rounded-lg hover:bg-paper text-[#3A5568]">${icon('ic-edit', 'text-[17px]')}</button>
          <button onclick="del('invoices','${v.id}')" title="Delete" class="p-2 rounded-lg hover:bg-paper text-[#B4361F]">${icon('ic-trash', 'text-[17px]')}</button>
        </div></td></tr>`; }).join('')}</tbody></table>`
      : `<p class="p-10 text-center text-[#5C7688] text-[14px]">No invoices yet. Open a quotation and use the money icon to turn it into one.</p>`}
    </div>`;
}

async function recordPayment(id) {
  const v = S.invoices.find(x => x.id === id);
  const due = (+v.total_bdt || 0) - (+v.paid_bdt || 0);
  const amt = prompt(`How much did ${v.name} pay just now?  (due ${taka(due)})`, String(due));
  if (amt === null) return;
  const paid = (+v.paid_bdt || 0) + (+amt || 0);
  const status = paid >= (+v.total_bdt || 0) ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
  await DB.save('invoices', { ...v, paid_bdt: paid, status, paid_at: new Date().toISOString() });
  if (status === 'paid' && v.customer_id) {
    const c = S.customers.find(x => x.id === v.customer_id);
    if (c) await DB.save('customers', { ...c, bookings: (c.bookings || 0) + 1, spent_bdt: (c.spent_bdt || 0) + (+v.total_bdt || 0) });
  }
  await reload(); go('invoices'); toast('Payment recorded');
}

async function invoiceFromQuote(id) {
  const q = S.quotations.find(x => x.id === id);
  const its = lines(q).filter(l => l.amount).map(l => ({ label: l.label, qty: 1, rate: l.amount }));
  editInvoice(null, {
    name: q.name, phone: q.phone, email: q.email, customer_id: q.customer_id,
    quotation_id: q.id, subject: q.package, items: its
  });
}

/* ------------------------------------------------------------ customers */
function viewCustomers() {
  const q = custSearch.toLowerCase();
  const rows = S.customers.filter(c => !q ||
    (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) ||
    (c.city || '').toLowerCase().includes(q) || (c.tags || []).join(' ').toLowerCase().includes(q));
  $('pane').innerHTML = head('Customers', `${S.customers.length} people on file · ${S.customers.filter(c => c.consent !== false).length} agreed to be contacted`,
    btnPrimary('Send a promotion', 'openPromo()', 'ic-wa') +
    btnGhost('Rebuild from quotations', 'rebuildCustomers()', 'ic-users') +
    btnGhost('Download CSV', "csv('customers')") +
    btnGhost('Add customer', 'editCustomer()', 'ic-plus')) + `
    <div class="bg-white rounded-2xl shadow-lift p-3 mb-4 flex items-center gap-2">
      ${icon('ic-search', 'text-[18px] text-[#5C7688] ml-2')}
      <input value="${esc(custSearch)}" oninput="custSearch=this.value;viewCustomers();document.getElementById('cs').focus()" id="cs"
        placeholder="Search by name, mobile, city or tag" class="w-full outline-none text-[14px] py-1.5">
    </div>
    <div class="bg-white rounded-2xl shadow-lift overflow-x-auto">
    ${rows.length ? `<table class="adm"><thead><tr>
      <th><input type="checkbox" onchange="pickAll(this.checked)"></th>
      <th>Name</th><th>Mobile</th><th>Quotes</th><th>Trips</th><th>Spent</th><th>Last seen</th><th>Actions</th></tr></thead><tbody>
      ${rows.map(c => `<tr>
        <td><input type="checkbox" ${promoPicked.includes(c.id) ? 'checked' : ''} onchange="pick('${c.id}',this.checked)"></td>
        <td><strong>${esc(c.name)}</strong>${c.city ? `<br><span class="text-[11.5px] text-[#5C7688]">${esc(c.city)}</span>` : ''}
            ${(c.tags || []).map(x => `<span class="chip bg-[#E4F1F8] text-[#0A6A94] ml-1">${esc(x)}</span>`).join('')}
            ${c.consent === false ? '<span class="chip bg-[#FDECE8] text-[#B4361F] ml-1">no contact</span>' : ''}</td>
        <td><a href="tel:${esc(c.phone)}" class="text-sea font-semibold">${esc(c.phone)}</a>${c.email ? `<br><span class="text-[11.5px] text-[#5C7688]">${esc(c.email)}</span>` : ''}</td>
        <td>${c.quotes || 0}</td><td>${c.bookings || 0}</td>
        <td class="whitespace-nowrap">${taka(c.spent_bdt)}</td>
        <td class="whitespace-nowrap text-[#5C7688]">${dt(c.last_seen || c.created_at)}</td>
        <td><div class="flex gap-1">
          <a target="_blank" href="${waLink(c.phone, 'Assalamu alaikum ' + (c.name || '') + ', ' + CONFIG.COMPANY + ' here.')}" title="WhatsApp" class="p-2 rounded-lg hover:bg-paper text-[#1FA855]">${icon('ic-wa', 'i-fill text-[17px]')}</a>
          <button onclick="editCustomer('${c.id}')" title="Edit" class="p-2 rounded-lg hover:bg-paper text-[#3A5568]">${icon('ic-edit', 'text-[17px]')}</button>
          <button onclick="del('customers','${c.id}')" title="Delete" class="p-2 rounded-lg hover:bg-paper text-[#B4361F]">${icon('ic-trash', 'text-[17px]')}</button>
        </div></td></tr>`).join('')}</tbody></table>`
      : `<p class="p-10 text-center text-[#5C7688] text-[14px]">No one matches that search.</p>`}
    </div>
    <p class="text-[12px] text-[#5C7688] mt-3 max-w-[70ch]">People who ask for a quote are saved here automatically, one row per mobile number. Anyone who unticked the consent box is marked “no contact” and is skipped when you send a promotion.</p>`;
}
function pick(id, on) { promoPicked = on ? [...new Set([...promoPicked, id])] : promoPicked.filter(x => x !== id); }
function pickAll(on) { promoPicked = on ? S.customers.filter(c => c.consent !== false).map(c => c.id) : []; viewCustomers(); }

async function rebuildCustomers() {
  let made = 0;
  for (const q of S.quotations) {
    if (!q.phone) continue;
    const before = S.customers.length;
    await upsertCustomer({ name: q.name, phone: q.phone, email: q.email, source: q.source || 'website', lang: q.lang, consent: q.consent });
    made++;
  }
  await reload(); viewCustomers(); toast(made + ' quotations checked');
}

/* WhatsApp promotions. wa.me opens one chat at a time — that is WhatsApp's
   own rule — so this builds a queue you click through, personalising each
   message with the customer's name.                                      */
function openPromo() {
  const picked = S.customers.filter(c => promoPicked.includes(c.id) && c.consent !== false);
  if (!picked.length) { toast('Tick some customers first'); return; }
  const tpl = CONFIG.PROMO_TEMPLATES;
  $('pane').innerHTML = head('Send a promotion', `${picked.length} customers selected`,
    btnGhost('Back to customers', "go('customers')", 'ic-users')) + `
    <div class="grid lg:grid-cols-[1fr_1.1fr] gap-5">
      <div class="bg-white rounded-2xl shadow-lift p-5">
        <label class="lbl">Ready-made message</label>
        <select class="field" onchange="useTemplate(this.value)">
          <option value="">Write my own</option>
          ${tpl.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}
        </select>
        <div class="grid grid-cols-2 gap-2 mt-3">
          <button onclick="promoLang='en';toast('English selected')" class="opt sel rounded-xl py-2 text-[13px] font-semibold" id="pl-en">English</button>
          <button onclick="promoLang='bn';toast('বাংলা নির্বাচিত')" class="opt rounded-xl py-2 text-[13px] font-semibold font-bangla" id="pl-bn">বাংলা</button>
        </div>
        <label class="lbl mt-4">Message — {name} is replaced with each person's name</label>
        <textarea id="promo-text" rows="7" class="field" placeholder="Assalamu alaikum {name}, …"></textarea>
        <p class="text-[12px] text-[#5C7688] mt-2">WhatsApp opens one chat at a time, so click through the list on the right. Each one is pre-written — you just press send.</p>
      </div>
      <div class="bg-white rounded-2xl shadow-lift p-5">
        <h2 class="font-display font-bold text-[16px] mb-3">Queue</h2>
        <div class="grid gap-2 max-h-[460px] overflow-y-auto" id="promo-queue">
          ${picked.map(c => `<div class="flex items-center justify-between gap-3 border border-[#E2EAEF] rounded-xl px-4 py-2.5" id="pq-${c.id}">
            <div><p class="font-semibold text-[13.5px]">${esc(c.name)}</p><p class="text-[12px] text-[#5C7688]">${esc(c.phone)}</p></div>
            <button onclick="sendPromo('${c.id}')" class="bg-[#1FA855] text-white text-[12.5px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">${icon('ic-wa', 'i-fill text-[15px]')}Open</button>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="bg-white rounded-2xl shadow-lift p-5 mt-5 max-w-[72ch]">
      <h2 class="font-display font-bold text-[16px] mb-2">Sending to hundreds at once</h2>
      <p class="text-[13.5px] text-[#5C7688] leading-relaxed">This click-through queue is fine up to roughly fifty people a day and it never risks your number.
      Beyond that, apply for the <strong>WhatsApp Business Platform</strong> through a provider such as 360dialog, Twilio or Meta directly, get your promotional templates approved,
      and the same customer list can be pushed in one go. Blasting from an ordinary number gets it banned.</p>
    </div>`;
  window.promoLang = 'en';
}
function useTemplate(i) {
  if (i === '') { $('promo-text').value = ''; return; }
  const x = CONFIG.PROMO_TEMPLATES[+i];
  $('promo-text').value = (window.promoLang === 'bn' ? x.bn : x.en);
}
async function sendPromo(id) {
  const c = S.customers.find(x => x.id === id);
  const text = ($('promo-text').value || 'Hello {name}, ' + CONFIG.COMPANY + ' here.').replace(/\{name\}/g, c.name || '');
  window.open(waLink(c.phone, text), '_blank');
  const row = $('pq-' + id); if (row) { row.style.opacity = '.45'; row.querySelector('button').textContent = 'Opened'; }
  await DB.save('customers', { ...c, last_promo: new Date().toISOString() });
}

/* ------------------------------------------------- catalogue management */
function viewPackages() {
  $('pane').innerHTML = head('Packages', `${S.packages.length} live on the website`, btnPrimary('Add package', 'editPackage()')) +
    `<div class="grid gap-3">${S.packages.map(p => `
      <div class="bg-white rounded-2xl p-4 shadow-lift flex flex-wrap items-center gap-4">
        <div class="w-20 h-16 rounded-xl overflow-hidden shrink-0">${picture(p.img, p.hue, p.title_en, 64)}</div>
        <div class="flex-1 min-w-[200px]">
          <p class="font-bold text-[14.5px]">${esc(p.title_en)}</p>
          <p class="text-[12.5px] text-[#5C7688] font-bangla">${esc(p.title_bn || '—')}</p>
          <p class="text-[12px] text-[#5C7688] mt-1">${esc(p.cat)} · ${p.nights}n · room ${taka(p.base)}/night · flight ${taka(p.flight)}/pax · from ${taka(p.from)}</p>
        </div>
        <div class="flex gap-1.5">
          <button onclick="editPackage('${p.id}')" class="p-2.5 rounded-lg hover:bg-paper text-sea">${icon('ic-edit', 'text-[17px]')}</button>
          <button onclick="del('packages','${p.id}')" class="p-2.5 rounded-lg hover:bg-paper text-[#B4361F]">${icon('ic-trash', 'text-[17px]')}</button>
        </div></div>`).join('')}</div>`;
}
function viewServices() {
  $('pane').innerHTML = head('Services', 'Shown in the services grid on the website', btnPrimary('Add service', 'editService()')) +
    `<div class="grid gap-3">${S.services.map(s => `
      <div class="bg-white rounded-2xl p-4 shadow-lift flex items-center gap-4">
        <span class="w-11 h-11 rounded-xl bg-sand text-deep grid place-items-center shrink-0">${icon(s.icon || 'ic-plane', 'text-[20px]')}</span>
        <div class="flex-1"><p class="font-bold text-[14.5px]">${esc(s.title_en)}</p>
          <p class="text-[12.5px] text-[#5C7688] font-bangla">${esc(s.title_bn || '—')}</p></div>
        <div class="flex gap-1.5">
          <button onclick="editService('${s.id}')" class="p-2.5 rounded-lg hover:bg-paper text-sea">${icon('ic-edit', 'text-[17px]')}</button>
          <button onclick="del('services','${s.id}')" class="p-2.5 rounded-lg hover:bg-paper text-[#B4361F]">${icon('ic-trash', 'text-[17px]')}</button>
        </div></div>`).join('')}</div>`;
}
function viewGallery() {
  $('pane').innerHTML = head('Photos', ONLINE() ? 'Uploaded to Supabase Storage' : 'Demo mode keeps photos in this browser only', btnPrimary('Add photo', 'editPhoto()')) +
    `<div class="grid grid-cols-2 md:grid-cols-4 gap-4">${S.gallery.map(g => `
      <div class="bg-white rounded-2xl overflow-hidden shadow-lift">
        <div class="aspect-[4/3]">${picture(g.img, g.hue, g.caption_en, 200)}</div>
        <div class="p-3 flex items-center justify-between gap-2">
          <p class="text-[12.5px] font-semibold truncate">${esc(g.caption_en)}</p>
          <div class="flex gap-1">
            <button onclick="editPhoto('${g.id}')" class="p-1.5 text-sea">${icon('ic-edit', 'text-[16px]')}</button>
            <button onclick="del('gallery','${g.id}')" class="p-1.5 text-[#B4361F]">${icon('ic-trash', 'text-[16px]')}</button>
          </div></div></div>`).join('')}</div>`;
}

/* --------------------------------------------------------- editor forms */
let edSave = null, edItems = [];
const ICONS = ['ic-plane', 'ic-passport', 'ic-bed', 'ic-shield', 'ic-headset', 'ic-globe', 'ic-doc', 'ic-star', 'ic-cash'];

function fieldHTML(f) {
  if (f.type === 'hr') return `<hr class="border-[#E2EAEF] my-1">`;
  if (f.type === 'items') return `<div><label class="lbl">${f.label}</label><div id="ed-items"></div></div>`;
  if (f.type === 'textarea') return `<div><label class="lbl">${f.label}</label><textarea name="${f.k}" rows="${f.rows || 2}" class="field">${esc(f.v || '')}</textarea></div>`;
  if (f.type === 'select') return `<div><label class="lbl">${f.label}</label><select name="${f.k}" class="field">${f.opts.map(o => `<option value="${o[0]}" ${String(f.v) === String(o[0]) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
  if (f.type === 'image') return `<div><label class="lbl">${f.label}</label>
      <div class="flex gap-2 items-center">
        <input name="${f.k}" value="${esc(f.v || '')}" placeholder="https://… or upload" class="field">
        <label class="shrink-0 bg-paper border-[1.5px] border-[#D7E2E9] rounded-xl px-3 py-2.5 cursor-pointer text-[12.5px] font-semibold flex items-center gap-1.5">
          ${icon('ic-img', 'text-[16px]')}Upload
          <input type="file" accept="image/*" class="hidden" onchange="uploadInto(this,'${f.k}')"></label>
      </div><p class="text-[11.5px] text-[#5C7688] mt-1">${f.hint || ''}</p></div>`;
  const wide = f.half ? '' : 'sm:col-span-2';
  return `<div class="${wide}"><label class="lbl">${f.label}</label>
    <input name="${f.k}" type="${f.type || 'text'}" value="${esc(f.v == null ? '' : f.v)}" class="field" ${f.req ? 'required' : ''} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}></div>`;
}
function openEditor(title, fields, onsave, startItems) {
  edSave = onsave; edItems = startItems ? JSON.parse(JSON.stringify(startItems)) : [];
  $('ed-title').textContent = title;
  $('ed-form').innerHTML = `<div class="grid sm:grid-cols-2 gap-4">${fields.map(fieldHTML).join('')}</div>
    <div class="flex gap-2 pt-1"><button class="flex-1 bg-deep text-white font-bold py-3 rounded-xl">Save</button>
    <button type="button" onclick="closeEditor()" class="px-5 border-[1.5px] border-[#D7E2E9] rounded-xl font-semibold">Cancel</button></div>`;
  if ($('ed-items')) paintItems();
  $('editor').classList.remove('hide');
}
function closeEditor() { $('editor').classList.add('hide'); edSave = null; }

function paintItems() {
  const box = $('ed-items'); if (!box) return;
  const total = edItems.reduce((a, i) => a + (+i.qty || 0) * (+i.rate || 0), 0);
  box.innerHTML = edItems.map((it, i) => `
    <div class="flex gap-2 mb-2">
      <input value="${esc(it.label)}" oninput="edItems[${i}].label=this.value" placeholder="Description" class="field field-sm flex-1">
      <input value="${it.qty}" type="number" min="0" step="1" oninput="edItems[${i}].qty=+this.value;paintItems()" class="field field-sm w-16 text-center">
      <input value="${it.rate}" type="number" min="0" oninput="edItems[${i}].rate=+this.value;paintItems()" class="field field-sm w-28 text-right">
      <button type="button" onclick="edItems.splice(${i},1);paintItems()" class="px-2 text-[#B4361F]">${icon('ic-trash', 'text-[16px]')}</button>
    </div>`).join('') + `
    <div class="flex items-center justify-between mt-2">
      <button type="button" onclick="edItems.push({label:'',qty:1,rate:0});paintItems()" class="text-[13px] font-semibold text-sea flex items-center gap-1">${icon('ic-plus', 'text-[15px]')}Add a line</button>
      <span class="text-[13.5px] font-bold">Subtotal ${taka(total)}</span>
    </div>`;
}
async function uploadInto(input, key) {
  const f = input.files[0]; if (!f) return;
  if (!ONLINE() && f.size > 400000) { toast('Demo mode: choose an image under 400 KB'); return; }
  toast('Uploading…');
  try { const url = await DB.upload(f); $('ed-form').querySelector(`[name="${key}"]`).value = url; toast('Photo ready'); }
  catch (e) { toast('Upload failed: ' + e.message); }
}
async function saveEditor(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target).entries());
  await edSave(d);
  closeEditor();
}

/* quotations ------------------------------------------------------------ */
function editQuotation(id) {
  const q = S.quotations.find(x => x.id === id) || { pax: 2, children: 0, nights: 3, hotel_tier: '3star', status: 'new' };
  openEditor(id ? 'Edit quotation ' + (q.doc_no || '') : 'New quotation', [
    { k: 'name', label: 'Customer name', v: q.name, req: true, half: true },
    { k: 'phone', label: 'Mobile number', v: q.phone, req: true, half: true, ph: '017XXXXXXXX' },
    { k: 'email', label: 'Email', v: q.email, half: true },
    { k: 'package', label: 'Trip or package', v: q.package, half: true },
    { k: 'pax', label: 'Adults', v: q.pax, type: 'number', half: true },
    { k: 'children', label: 'Children', v: q.children, type: 'number', half: true },
    { k: 'nights', label: 'Nights', v: q.nights, type: 'number', half: true },
    { k: 'travel_date', label: 'Travel date', v: q.travel_date, type: 'date', half: true },
    { k: 'hotel_tier', label: 'Hotel standard', v: q.hotel_tier, type: 'select', half: true, opts: [['3star', '3-star'], ['4star', '4-star'], ['5star', '5-star']] },
    { k: 'status', label: 'Status', v: q.status, type: 'select', half: true, opts: [['new', 'new'], ['called', 'called'], ['confirmed', 'confirmed'], ['lost', 'lost']] },
    { k: 'items', label: 'Cost lines (description, qty, rate)', type: 'items' },
    { k: 'message', label: 'Notes', v: q.message, type: 'textarea' }
  ], async d => {
    const total = edItems.reduce((a, i) => a + (+i.qty || 0) * (+i.rate || 0), 0);
    const customer = await upsertCustomer({ name: d.name, phone: d.phone, email: d.email, source: q.source || 'office' });
    const row = { ...q, ...d, id: q.id || uid(), created_at: q.created_at || new Date().toISOString(),
      doc_no: q.doc_no || await nextNumber('quotations', 'QT'), customer_id: customer.id,
      pax: +d.pax, children: +d.children, nights: +d.nights,
      lines: JSON.stringify(edItems.map(i => ({ label: i.label, amount: (+i.qty || 0) * (+i.rate || 0), qty: i.qty, rate: i.rate }))),
      total_bdt: total };
    await DB.save('quotations', row);
    await reload(); go('quotations'); toast('Quotation saved');
  }, lines(q).length ? lines(q).map(l => ({ label: l.label, qty: l.qty || 1, rate: l.rate || l.amount })) : [{ label: 'Tour package', qty: 1, rate: 0 }]);
}

/* invoices -------------------------------------------------------------- */
function editInvoice(id, prefill) {
  const v = S.invoices.find(x => x.id === id) || prefill || { status: 'unpaid', paid_bdt: 0 };
  const today = new Date().toISOString().slice(0, 10);
  openEditor(id ? 'Edit invoice ' + (v.doc_no || '') : 'New invoice', [
    { k: 'name', label: 'Customer name', v: v.name, req: true, half: true },
    { k: 'phone', label: 'Mobile number', v: v.phone, req: true, half: true },
    { k: 'email', label: 'Email', v: v.email, half: true },
    { k: 'subject', label: 'For (trip or service)', v: v.subject, half: true },
    { k: 'address', label: 'Billing address', v: v.address },
    { k: 'issue_date', label: 'Invoice date', v: v.issue_date || today, type: 'date', half: true },
    { k: 'due_date', label: 'Payment due by', v: v.due_date, type: 'date', half: true },
    { k: 'items', label: 'Line items (description, qty, rate)', type: 'items' },
    { k: 'discount', label: 'Discount (৳)', v: v.discount || 0, type: 'number', half: true },
    { k: 'paid_bdt', label: 'Amount already paid (৳)', v: v.paid_bdt || 0, type: 'number', half: true },
    { k: 'note', label: 'Note printed on the invoice', v: v.note || 'Booking is confirmed once the advance is received. Cancellation within 7 days of travel is non-refundable.', type: 'textarea' }
  ], async d => {
    const sub = edItems.reduce((a, i) => a + (+i.qty || 0) * (+i.rate || 0), 0);
    const vat = Math.round(sub * (CONFIG.VAT_PERCENT || 0) / 100);
    const total = Math.max(0, sub + vat - (+d.discount || 0));
    const paid = +d.paid_bdt || 0;
    const customer = await upsertCustomer({ name: d.name, phone: d.phone, email: d.email, source: 'invoice' });
    const row = { ...v, ...d, id: v.id || uid(), created_at: v.created_at || new Date().toISOString(),
      doc_no: v.doc_no || await nextNumber('invoices', 'INV'), customer_id: customer.id,
      items: JSON.stringify(edItems), subtotal_bdt: sub, vat_bdt: vat,
      discount: +d.discount || 0, total_bdt: total, paid_bdt: paid,
      status: paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid' };
    await DB.save('invoices', row);
    await reload(); go('invoices'); toast('Invoice saved');
  }, items(v).length ? items(v) : [{ label: 'Tour package', qty: 1, rate: 0 }]);
}

/* customers ------------------------------------------------------------- */
function editCustomer(id) {
  const c = S.customers.find(x => x.id === id) || { consent: true };
  openEditor(id ? 'Edit customer' : 'Add customer', [
    { k: 'name', label: 'Name', v: c.name, req: true, half: true },
    { k: 'phone', label: 'Mobile number', v: c.phone, req: true, half: true },
    { k: 'email', label: 'Email', v: c.email, half: true },
    { k: 'city', label: 'City or area', v: c.city, half: true },
    { k: 'tags', label: 'Tags, separated by commas', v: (c.tags || []).join(', '), half: true },
    { k: 'consent', label: 'May we contact them?', v: c.consent === false ? 'no' : 'yes', type: 'select', half: true, opts: [['yes', 'Yes'], ['no', 'No, do not contact']] },
    { k: 'notes', label: 'Notes', v: c.notes, type: 'textarea' }
  ], async d => {
    await DB.save('customers', { ...c, ...d, id: c.id || uid(), created_at: c.created_at || new Date().toISOString(),
      phone_key: waNumber(d.phone), consent: d.consent === 'yes',
      tags: d.tags.split(',').map(x => x.trim()).filter(Boolean) });
    await reload(); viewCustomers(); toast('Customer saved');
  });
}

/* catalogue ------------------------------------------------------------- */
function editPackage(id) {
  const p = S.packages.find(x => x.id === id) || { cat: 'domestic', nights: 3, base: 2500, flight: 8000, from: 12000, rating: 4.7, hue: 198, inc_en: [], inc_bn: [] };
  openEditor(id ? 'Edit package' : 'New package', [
    { k: 'title_en', label: 'Title (English)', v: p.title_en, req: true, half: true },
    { k: 'title_bn', label: 'শিরোনাম (বাংলা)', v: p.title_bn, half: true },
    { k: 'sum_en', label: 'Short description (English)', v: p.sum_en, type: 'textarea' },
    { k: 'sum_bn', label: 'সংক্ষিপ্ত বিবরণ (বাংলা)', v: p.sum_bn, type: 'textarea' },
    { k: 'cat', label: 'Category', v: p.cat, type: 'select', half: true, opts: [['domestic', 'Inside Bangladesh'], ['international', 'Overseas']] },
    { k: 'nights', label: 'Nights', v: p.nights, type: 'number', half: true },
    { k: 'base', label: 'Room per night, 3-star (৳)', v: p.base, type: 'number', half: true },
    { k: 'flight', label: 'Flight or transit per person (৳)', v: p.flight, type: 'number', half: true },
    { k: 'from', label: 'Headline “from” price (৳)', v: p.from, type: 'number', half: true },
    { k: 'rating', label: 'Rating out of 5', v: p.rating, type: 'number', half: true },
    { k: 'img', label: 'Cover photo', v: p.img, type: 'image', hint: 'Leave empty to use the generated artwork.' },
    { k: 'inc_en', label: 'What is included (English, one per line)', v: (p.inc_en || []).join('\n'), type: 'textarea', rows: 3 },
    { k: 'inc_bn', label: 'যা যা থাকছে (বাংলা, প্রতি লাইনে একটি)', v: (p.inc_bn || []).join('\n'), type: 'textarea', rows: 3 }
  ], async d => {
    await DB.save('packages', { ...p, ...d, id: p.id || slug(d.title_en), created_at: p.created_at || new Date().toISOString(),
      nights: +d.nights, base: +d.base, flight: +d.flight, from: +d.from, rating: +d.rating,
      inc_en: d.inc_en.split('\n').filter(Boolean), inc_bn: d.inc_bn.split('\n').filter(Boolean) });
    await reload(); viewPackages(); toast('Package saved');
  });
}
function editService(id) {
  const s = S.services.find(x => x.id === id) || { icon: 'ic-plane' };
  openEditor(id ? 'Edit service' : 'New service', [
    { k: 'title_en', label: 'Title (English)', v: s.title_en, req: true, half: true },
    { k: 'title_bn', label: 'শিরোনাম (বাংলা)', v: s.title_bn, half: true },
    { k: 'desc_en', label: 'Description (English)', v: s.desc_en, type: 'textarea' },
    { k: 'desc_bn', label: 'বিবরণ (বাংলা)', v: s.desc_bn, type: 'textarea' },
    { k: 'icon', label: 'Icon', v: s.icon, type: 'select', opts: ICONS.map(i => [i, i.replace('ic-', '')]) }
  ], async d => {
    await DB.save('services', { ...s, ...d, id: s.id || slug(d.title_en), created_at: s.created_at || new Date().toISOString() });
    await reload(); viewServices(); toast('Service saved');
  });
}
function editPhoto(id) {
  const g = S.gallery.find(x => x.id === id) || { hue: 198 };
  openEditor(id ? 'Edit photo' : 'Add photo', [
    { k: 'img', label: 'Photo', v: g.img, type: 'image', hint: ONLINE() ? 'Goes to the ' + CONFIG.STORAGE_BUCKET + ' bucket.' : 'Demo mode stores it in this browser.' },
    { k: 'caption_en', label: 'Caption (English)', v: g.caption_en, req: true, half: true },
    { k: 'caption_bn', label: 'ক্যাপশন (বাংলা)', v: g.caption_bn, half: true }
  ], async d => {
    await DB.save('gallery', { ...g, ...d, id: g.id || 'g' + Date.now(), created_at: g.created_at || new Date().toISOString() });
    await reload(); viewGallery(); toast('Photo saved');
  });
}

/* ------------------------------------------------------ shared actions */
async function setStatus(table, id, status) {
  const row = S[table].find(r => r.id === id);
  await DB.save(table, { ...row, status });
  await reload(); toast('Updated');
}
async function del(table, id) {
  if (!confirm('Delete this permanently?')) return;
  await DB.remove(table, id);
  await reload(); go(tab); toast('Deleted');
}
function csv(table) {
  const rows = S[table]; if (!rows.length) { toast('Nothing to export'); return; }
  const cols = [...new Set(rows.flatMap(Object.keys))].filter(c => c !== 'lines' && c !== 'items');
  const body = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c] == null ? '' : r[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + body], { type: 'text/csv;charset=utf-8' }));
  a.download = 'supreme-' + table + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
}

/* ------------------------------------------- printable documents (PDF) */
function docShell(kind, d, rows, totals, footNote) {
  return `<div class="sheet">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:3px solid #0A6A94;padding-bottom:16px">
      <div style="display:flex;gap:12px;align-items:center">
        <svg viewBox="0 0 400 300" style="width:74px;height:56px"><use href="#brandmark"/></svg>
        <div>
          <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:19px;color:#064A68">${esc(CONFIG.COMPANY)}</div>
          <div style="font-size:11px;color:#4A6373;margin-top:2px">${esc(CONFIG.ADDRESS_EN)}</div>
          <div style="font-size:11px;color:#4A6373">${esc(CONFIG.PHONE)} · ${esc(CONFIG.EMAIL)}</div>
          <div style="font-size:10.5px;color:#7A8E9B;margin-top:2px">Trade licence ${esc(CONFIG.TRADE_LICENCE)} · BIN ${esc(CONFIG.BIN)}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:22px;letter-spacing:.5px">${kind}</div>
        <div style="font-size:12.5px;font-weight:700;color:#0A6A94">${esc(d.doc_no || '')}</div>
        <div style="font-size:11.5px;color:#4A6373;margin-top:4px">Date ${dt(d.issue_date || d.created_at)}</div>
        ${d.due_date ? `<div style="font-size:11.5px;color:#4A6373">Due ${dt(d.due_date)}</div>` : ''}
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;gap:24px;margin:20px 0 14px">
      <div>
        <div style="font-size:11px;color:#7A8E9B;margin-bottom:3px">Billed to</div>
        <div style="font-weight:700;font-size:14.5px">${esc(d.name || '')}</div>
        <div style="font-size:12.5px;color:#4A6373">${esc(d.phone || '')}</div>
        ${d.email ? `<div style="font-size:12.5px;color:#4A6373">${esc(d.email)}</div>` : ''}
        ${d.address ? `<div style="font-size:12.5px;color:#4A6373;max-width:34ch">${esc(d.address)}</div>` : ''}
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#7A8E9B;margin-bottom:3px">Trip</div>
        <div style="font-weight:600;font-size:13.5px">${esc(d.package || d.subject || '')}</div>
        ${d.travel_date ? `<div style="font-size:12.5px;color:#4A6373">Travel ${dt(d.travel_date)}</div>` : ''}
        ${d.pax ? `<div style="font-size:12.5px;color:#4A6373">${d.pax} adults${d.children ? ' + ' + d.children + ' children' : ''} · ${d.nights || 0} nights</div>` : ''}
      </div>
    </div>

    <table><thead><tr><th>Description</th><th class="right" style="width:60px">Qty</th>
      <th class="right" style="width:110px">Rate</th><th class="right" style="width:120px">Amount</th></tr></thead>
      <tbody>${rows}</tbody></table>

    <div style="display:flex;justify-content:flex-end;margin-top:14px">
      <table style="width:300px">${totals}</table>
    </div>

    <div style="margin-top:26px;font-size:11.5px;color:#4A6373;line-height:1.6;border-top:1px solid #E6EDF1;padding-top:12px">
      ${esc(footNote || '')}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:46px;font-size:11.5px;color:#4A6373">
      <div style="border-top:1px solid #9FB3BF;padding-top:6px;width:200px">Customer signature</div>
      <div style="border-top:1px solid #9FB3BF;padding-top:6px;width:200px;text-align:right">For ${esc(CONFIG.COMPANY)}</div>
    </div>
  </div>`;
}
function rowsHTML(list) {
  return list.map(i => {
    const qty = i.qty == null ? 1 : i.qty, rate = i.rate == null ? i.amount : i.rate;
    const amt = i.amount != null ? i.amount : qty * rate;
    return `<tr><td>${esc(i.label)}</td><td class="right">${qty}</td><td class="right">${taka(rate)}</td><td class="right">${taka(amt)}</td></tr>`;
  }).join('');
}
const totalRow = (l, v, bold) => `<tr><td style="border:0;padding:5px 6px;${bold ? 'font-weight:700' : 'color:#4A6373'}">${l}</td>
  <td class="right" style="border:0;padding:5px 6px;${bold ? 'font-weight:800;font-size:15px;color:#064A68' : ''}">${v}</td></tr>`;

function paper(html) {
  $('doc').innerHTML = html;
  document.body.classList.add('printing');
  window.print();
  setTimeout(() => document.body.classList.remove('printing'), 600);
}
function printQuotation(id) {
  const q = S.quotations.find(x => x.id === id);
  const ls = lines(q);
  paper(docShell('QUOTATION', q, rowsHTML(ls.length ? ls : [{ label: q.package || 'Tour package', amount: q.total_bdt }]),
    totalRow('Total', taka(q.total_bdt), true) + totalRow('Valid for', '14 days from the date above'),
    'This quotation covers the services listed above only. Air fares and hotel rates are held for 14 days and are subject to availability at the time of confirmation. Government taxes and our service charge are included.'));
}
function printInvoice(id) {
  const v = S.invoices.find(x => x.id === id);
  const due = (+v.total_bdt || 0) - (+v.paid_bdt || 0);
  paper(docShell('INVOICE', v, rowsHTML(items(v)),
    totalRow('Subtotal', taka(v.subtotal_bdt)) +
    (v.vat_bdt ? totalRow('VAT ' + CONFIG.VAT_PERCENT + '%', taka(v.vat_bdt)) : '') +
    (v.discount ? totalRow('Discount', '− ' + taka(v.discount)) : '') +
    totalRow('Total', taka(v.total_bdt), true) +
    totalRow('Paid', taka(v.paid_bdt)) +
    totalRow('Balance due', taka(due), true),
    v.note || ''));
}

/* ----------------------------------------------------------------- setup */
function viewSetup() {
  $('pane').innerHTML = head('Setup', ONLINE() ? 'Connected to Supabase' : 'Demo mode — everything is saved in this browser only') + `
    <div class="grid lg:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl p-6 shadow-lift">
        <h2 class="font-display font-bold text-[16px] mb-3">Connect Supabase</h2>
        <ol class="text-[13.5px] text-[#3A5568] grid gap-2 list-decimal pl-4 leading-relaxed">
          <li>Create a project at supabase.com, open <strong>SQL Editor</strong>, paste the contents of <code>supabase/schema.sql</code> and run it.</li>
          <li>In <strong>Storage</strong>, create a public bucket named <code>media</code>.</li>
          <li>In <strong>Authentication → Users</strong>, add a staff email and password. That becomes the login for this panel.</li>
          <li>In <strong>Project Settings → API</strong>, copy the Project URL and the anon key into <code>assets/js/config.js</code>.</li>
          <li>Reload. The badge at the top will read “Supabase connected”.</li>
        </ol>
        <p class="text-[12.5px] text-[#5C7688] mt-4">The anon key is safe in the browser because row level security only lets the public read packages and insert a quotation. Customers, invoices and edits all require a signed-in staff account.</p>
      </div>
      <div class="grid gap-5">
        <div class="bg-white rounded-2xl p-6 shadow-lift">
          <h2 class="font-display font-bold text-[16px] mb-3">Publish on Netlify</h2>
          <ol class="text-[13.5px] text-[#3A5568] grid gap-2 list-decimal pl-4 leading-relaxed">
            <li>Push this folder to GitHub, then Netlify → Add new site → Import from GitHub. No build command, publish directory <code>.</code></li>
            <li>Or drag the folder onto app.netlify.com/drop for an instant deploy.</li>
            <li>Point your domain at it under Domain settings. HTTPS is issued automatically.</li>
          </ol>
        </div>
        <div class="bg-white rounded-2xl p-6 shadow-lift">
          <h2 class="font-display font-bold text-[16px] mb-3">Move demo data into Supabase</h2>
          <p class="text-[13.5px] text-[#5C7688] leading-relaxed">Anything entered before you connected Supabase is sitting in this browser. Export each tab to CSV first, connect Supabase, then import the CSVs from the Supabase table editor.</p>
          <div class="flex flex-wrap gap-2 mt-3">
            ${['quotations', 'invoices', 'customers', 'packages'].map(x => btnGhost(x, `csv('${x}')`)).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

/* ------------------------------------------------------------- start up */
(async function () {
  $('ad-hint').textContent = ONLINE()
    ? 'Sign in with the staff account you created in Supabase.'
    : 'Demo mode: any email works, the password is the one in assets/js/config.js.';
  if (ONLINE()) { const { data } = await sb.auth.getSession(); if (data.session) start(); }
  else if (LS.get('adm', 0)) start();
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeEditor(); });
})();
