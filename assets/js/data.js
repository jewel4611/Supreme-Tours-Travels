/* =====================================================================
   Data layer. Uses Supabase when CONFIG has credentials, otherwise the
   browser's own storage so the whole site still works offline / in demo.
   ===================================================================== */
let sb = null;
if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY && window.supabase) {
  try { sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY); }
  catch (e) { console.warn('Supabase init failed — demo mode', e); }
}
const ONLINE = () => !!sb;

const DB = {
  async list(table, seed, order) {
    if (ONLINE()) {
      const { data, error } = await sb.from(table).select('*').order(order || 'created_at', { ascending: false });
      if (error) { console.warn(table, error.message); return LS.get(table, seed || []); }
      if (data && data.length) return data;
      return seed || [];
    }
    return LS.get(table, seed || []);
  },
  async save(table, row) {
    if (ONLINE()) {
      const { data, error } = await sb.from(table).upsert(row).select();
      if (error) throw error;
      return (data && data[0]) || row;
    }
    const rows = LS.get(table, []);
    const i = rows.findIndex(r => r.id === row.id);
    if (i > -1) rows[i] = { ...rows[i], ...row }; else rows.unshift(row);
    LS.set(table, rows);
    return row;
  },
  async remove(table, id) {
    if (ONLINE()) { const { error } = await sb.from(table).delete().eq('id', id); if (error) throw error; return; }
    LS.set(table, LS.get(table, []).filter(r => r.id !== id));
  },
  async findBy(table, col, val) {
    if (ONLINE()) {
      const { data } = await sb.from(table).select('*').eq(col, val).limit(1);
      return data && data[0];
    }
    return LS.get(table, []).find(r => r[col] === val);
  },
  async upload(file) {
    const name = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    if (ONLINE()) {
      const { error } = await sb.storage.from(CONFIG.STORAGE_BUCKET).upload(name, file, { cacheControl: '3600' });
      if (error) throw error;
      return sb.storage.from(CONFIG.STORAGE_BUCKET).getPublicUrl(name).data.publicUrl;
    }
    return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }
};

/* Site-wide settings (phone, address, fees, …). Saved as one row so the
   admin panel can change any business detail without touching code.
   Falls back to localStorage in demo mode, same as everything else.    */
const SETTINGS_ID = 'site';
async function getSettings() {
  if (ONLINE()) {
    const { data, error } = await sb.from('settings').select('*').eq('id', SETTINGS_ID).limit(1);
    if (error) { console.warn('settings', error.message); return LS.get('settings_data', {}); }
    return (data && data[0] && data[0].data) || {};
  }
  return LS.get('settings_data', {});
}
async function saveSettings(patch) {
  const merged = { ...(await getSettings()), ...patch };
  if (ONLINE()) {
    const { error } = await sb.from('settings').upsert({ id: SETTINGS_ID, data: merged, updated_at: new Date().toISOString() });
    if (error) throw error;
  } else {
    LS.set('settings_data', merged);
  }
  return merged;
}
/* Overrides the defaults in config.js with anything saved from the admin
   panel. Must run before any page reads CONFIG.* values.               */
async function applySettings() {
  try { Object.assign(CONFIG, await getSettings()); }
  catch (e) { console.warn('applySettings', e); }
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2));
const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || ('item' + Date.now());

/* Keeps one row per mobile number, so the same traveller is never
   duplicated no matter how many quotes they ask for.                */
async function upsertCustomer({ name, phone, email, city, source, lang, consent }) {
  const key = waNumber(phone);
  const existing = await DB.findBy('customers', 'phone_key', key);
  const row = existing
    ? { ...existing, name: name || existing.name, email: email || existing.email, city: city || existing.city,
        quotes: (existing.quotes || 0) + 1, last_seen: new Date().toISOString(),
        consent: consent === undefined ? existing.consent : consent }
    : { id: uid(), created_at: new Date().toISOString(), last_seen: new Date().toISOString(),
        name: name || 'Unknown', phone, phone_key: key, email: email || null, city: city || null,
        source: source || 'website', lang: lang || 'en', consent: consent !== false,
        quotes: 1, bookings: 0, spent_bdt: 0, tags: [], notes: null };
  await DB.save('customers', row);
  return row;
}

/* Document numbers: QT-2026-0007, INV-2026-0007 */
async function nextNumber(table, prefix) {
  const rows = await DB.list(table, []);
  const year = new Date().getFullYear();
  const n = rows.filter(r => String(r.doc_no || '').includes('-' + year + '-')).length + 1;
  return `${prefix}-${year}-${String(n).padStart(4, '0')}`;
}

/* ---------------------------------------------------------------- seeds */
const DOM_EXCL_EN = ['Lunch and dinner unless added as an extra', 'Personal expenses and shopping', 'Entry tickets not named above'];
const DOM_EXCL_BN = ['লাঞ্চ ও ডিনার (আলাদা যোগ না করলে)', 'ব্যক্তিগত খরচ ও কেনাকাটা', 'উপরে উল্লেখ না করা প্রবেশ টিকিট'];
const INT_EXCL_EN = ['Visa fee unless added as an extra', 'Lunch and dinner unless added as an extra', 'Personal expenses and shopping', 'Travel insurance unless added as an extra'];
const INT_EXCL_BN = ['ভিসা ফি (আলাদা যোগ না করলে)', 'লাঞ্চ ও ডিনার (আলাদা যোগ না করলে)', 'ব্যক্তিগত খরচ ও কেনাকাটা', 'ট্রাভেল ইনস্যুরেন্স (আলাদা যোগ না করলে)'];

const SEED_PACKAGES = [
  { id: 'coxsbazar', cat: 'domestic', title_en: "Cox's Bazar and Marine Drive", title_bn: 'কক্সবাজার ও মেরিন ড্রাইভ',
    sum_en: 'Longest beach in the world, with an open-jeep run down Marine Drive to Inani and Himchari.',
    sum_bn: 'পৃথিবীর দীর্ঘতম সৈকত, সঙ্গে মেরিন ড্রাইভ ধরে ইনানী ও হিমছড়ি ভ্রমণ।',
    nights: 3, base: 2500, flight: 8500, from: 14500, rating: 4.9, img: '', hue: 198,
    inc_en: ['Beachfront hotel', 'Inani and Himchari day trip', 'Daily breakfast'],
    inc_bn: ['সৈকতের পাশে হোটেল', 'ইনানী ও হিমছড়ি ভ্রমণ', 'প্রতিদিন সকালের নাস্তা'],
    excl_en: DOM_EXCL_EN, excl_bn: DOM_EXCL_BN,
    itinerary_en: ["Arrive in Cox's Bazar, check in, evening walk on Laboni beach.", 'Full day at Inani Beach and Himchari waterfall by open jeep.', 'Free morning on the beach, afternoon at the Marine Drive viewpoints.', 'Breakfast, check out, transfer for the return journey.'],
    itinerary_bn: ['কক্সবাজার পৌঁছে হোটেলে চেক-ইন, সন্ধ্যায় লাবণী সৈকতে হাঁটা।', 'ওপেন জিপে সারাদিন ইনানী সৈকত ও হিমছড়ি জলপ্রপাত ভ্রমণ।', 'সকালে সৈকতে অবসর, বিকেলে মেরিন ড্রাইভের ভিউপয়েন্ট।', 'নাস্তা, চেক-আউট, ফিরতি যাত্রার ট্রান্সফার।'] },
  { id: 'sundarbans', cat: 'domestic', title_en: 'Sundarbans launch expedition', title_bn: 'সুন্দরবন লঞ্চ ভ্রমণ',
    sum_en: 'Three days aboard a cabin launch through Karamjal, Kotka and Jamtola, guided by a forest ranger.',
    sum_bn: 'কেবিন লঞ্চে তিন দিন — করমজল, কটকা ও জামতলা, সঙ্গে বনরক্ষী গাইড।',
    nights: 2, base: 3400, flight: 3500, from: 12900, rating: 4.8, img: '', hue: 150,
    inc_en: ['All meals on board', 'Forest permits and guard', 'Kotka watchtower walk'],
    inc_bn: ['লঞ্চে সব বেলার খাবার', 'বন বিভাগের অনুমতি ও গার্ড', 'কটকা ওয়াচটাওয়ার হাঁটা'],
    excl_en: ['Personal expenses and shopping', 'Any activity outside the forest department route', 'Tips for the crew and guide'],
    excl_bn: ['ব্যক্তিগত খরচ ও কেনাকাটা', 'বন বিভাগের নির্ধারিত পথের বাইরের কোনো কার্যক্রম', 'ক্রু ও গাইডের জন্য বকশিশ'],
    itinerary_en: ['Board the launch in the afternoon, sail towards the Sundarbans, evening on the Pashur river.', 'Karamjal and Kotka forest walks, watchtower for wildlife spotting.', 'Jamtola beach, cruise back towards Khulna, disembark.'],
    itinerary_bn: ['বিকেলে লঞ্চে ওঠা, সুন্দরবনের দিকে যাত্রা, সন্ধ্যায় পশুর নদীতে অবস্থান।', 'করমজল ও কটকা বনে হাঁটা, ওয়াচটাওয়ার থেকে বন্যপ্রাণী দেখা।', 'জামতলা সৈকত, খুলনার দিকে ফিরতি যাত্রা, লঞ্চ থেকে নামা।'] },
  { id: 'sylhet', cat: 'domestic', title_en: 'Sylhet, Sreemangal and Jaflong', title_bn: 'সিলেট, শ্রীমঙ্গল ও জাফলং',
    sum_en: 'Tea gardens, Ratargul swamp forest and the stone rivers along the Meghalaya border.',
    sum_bn: 'চা বাগান, রাতারগুল জলাবন আর মেঘালয় সীমান্তের পাথুরে নদী।',
    nights: 3, base: 2000, flight: 5000, from: 9900, rating: 4.7, img: '', hue: 120,
    inc_en: ['Ratargul boat ride', 'Tea estate walk', 'Jaflong and Bisnakandi'],
    inc_bn: ['রাতারগুলে নৌকা ভ্রমণ', 'চা বাগানে হাঁটা', 'জাফলং ও বিছনাকান্দি'],
    excl_en: DOM_EXCL_EN, excl_bn: DOM_EXCL_BN,
    itinerary_en: ['Arrive in Sylhet, check in, evening visit to a tea estate.', 'Ratargul swamp forest by boat, Bisnakandi in the afternoon.', 'Jaflong stone river and the Sylhet–Meghalaya border viewpoint.', 'Local sightseeing, breakfast, return journey.'],
    itinerary_bn: ['সিলেট পৌঁছে হোটেলে চেক-ইন, সন্ধ্যায় চা বাগান পরিদর্শন।', 'নৌকায় রাতারগুল জলাবন, বিকেলে বিছনাকান্দি।', 'জাফলং পাথুরে নদী ও সিলেট-মেঘালয় সীমান্তের ভিউপয়েন্ট।', 'স্থানীয় দর্শনীয় স্থান, নাস্তা, ফিরতি যাত্রা।'] },
  { id: 'bandarban', cat: 'domestic', title_en: 'Bandarban hills and Nafakhum', title_bn: 'বান্দরবান পাহাড় ও নাফাখুম',
    sum_en: 'Nilgiri sunrise, Sangu river trek and the waterfall at Nafakhum with local Marma guides.',
    sum_bn: 'নীলগিরির সূর্যোদয়, সাঙ্গু নদীর ট্রেক আর মারমা গাইডসহ নাফাখুম জলপ্রপাত।',
    nights: 3, base: 2200, flight: 4200, from: 11500, rating: 4.8, img: '', hue: 172,
    inc_en: ['Chander Gari hill transport', 'Guide and permits', 'Tribal home stay night'],
    inc_bn: ['চান্দের গাড়িতে পাহাড় ভ্রমণ', 'গাইড ও প্রয়োজনীয় অনুমতি', 'আদিবাসী বাড়িতে এক রাত'],
    excl_en: DOM_EXCL_EN, excl_bn: DOM_EXCL_BN,
    itinerary_en: ['Arrive in Bandarban, check in, walk through the local market.', 'Chander Gari hill trip to Nilgiri and Chimbuk for sweeping views.', 'Sangu river trek towards the Nafakhum waterfall.', 'Free morning, breakfast, return journey.'],
    itinerary_bn: ['বান্দরবান পৌঁছে হোটেলে চেক-ইন, স্থানীয় বাজার ঘুরে দেখা।', 'চান্দের গাড়িতে নীলগিরি ও চিম্বুক পাহাড়ে দৃশ্য উপভোগ।', 'সাঙ্গু নদী ধরে নাফাখুম জলপ্রপাতের দিকে ট্রেক।', 'সকালে অবসর, নাস্তা, ফিরতি যাত্রা।'] },
  { id: 'saintmartin', cat: 'domestic', title_en: "Saint Martin's island stay", title_bn: 'সেন্ট মার্টিন দ্বীপ ভ্রমণ',
    sum_en: 'Ship from Teknaf, a night on the Chera Dwip side of the island and all the coral you can walk to.',
    sum_bn: 'টেকনাফ থেকে জাহাজ, ছেঁড়া দ্বীপের পাশে রাত্রিযাপন আর হেঁটে দেখা প্রবাল।',
    nights: 2, base: 2800, flight: 9000, from: 13800, rating: 4.6, img: '', hue: 186,
    inc_en: ['Return ship tickets', 'Beach resort room', 'Chera Dwip boat'],
    inc_bn: ['যাওয়া-আসার জাহাজ টিকিট', 'সৈকত রিসোর্টে রুম', 'ছেঁড়া দ্বীপে নৌকা'],
    excl_en: DOM_EXCL_EN, excl_bn: DOM_EXCL_BN,
    itinerary_en: ["Ship from Teknaf to Saint Martin's, check in, sunset by the beach.", 'Walk or cycle to Chera Dwip, coral spotting, free evening.', 'Breakfast, return ship to Teknaf.'],
    itinerary_bn: ['টেকনাফ থেকে জাহাজে সেন্ট মার্টিন, হোটেলে চেক-ইন, সৈকতে সূর্যাস্ত।', 'হেঁটে বা সাইকেলে ছেঁড়া দ্বীপ ভ্রমণ, প্রবাল দেখা, সন্ধ্যা অবসর।', 'নাস্তা, টেকনাফের উদ্দেশ্যে ফিরতি জাহাজ।'] },
  { id: 'malaysia', cat: 'international', title_en: 'Kuala Lumpur and Genting', title_bn: 'কুয়ালালামপুর ও গেনটিং',
    sum_en: 'Twin Towers, Batu Caves and the cable car up to Genting Highlands, flights from Dhaka included.',
    sum_bn: 'টুইন টাওয়ার, বাটু কেভস আর গেনটিং হাইল্যান্ডের ক্যাবল কার — ঢাকা থেকে ফ্লাইটসহ।',
    nights: 4, base: 5500, flight: 32000, from: 48000, rating: 4.8, img: '', hue: 210,
    inc_en: ['Return air ticket', 'Genting cable car pass', 'City tour with guide'],
    inc_bn: ['যাওয়া-আসার এয়ার টিকিট', 'গেনটিং ক্যাবল কার পাস', 'গাইডসহ সিটি ট্যুর'],
    excl_en: INT_EXCL_EN, excl_bn: INT_EXCL_BN,
    itinerary_en: ['Arrive in Kuala Lumpur, check in, evening at the Petronas Twin Towers.', 'Batu Caves in the morning, city tour and KL Tower in the afternoon.', 'Genting Highlands cable car and a day at the hilltop.', 'Free day for shopping or an optional add-on.', 'Breakfast, transfer to the airport, return flight.'],
    itinerary_bn: ['কুয়ালালামপুর পৌঁছে হোটেলে চেক-ইন, সন্ধ্যায় পেট্রোনাস টুইন টাওয়ার।', 'সকালে বাটু কেভস, বিকেলে সিটি ট্যুর ও কেএল টাওয়ার।', 'গেনটিং হাইল্যান্ডে ক্যাবল কারে যাত্রা, পাহাড়ে একদিন।', 'কেনাকাটা বা ঐচ্ছিক ভ্রমণের জন্য ফ্রি দিন।', 'নাস্তা, এয়ারপোর্ট ট্রান্সফার, ফিরতি ফ্লাইট।'] },
  { id: 'thailand', cat: 'international', title_en: 'Bangkok and Pattaya', title_bn: 'ব্যাংকক ও পাতায়া',
    sum_en: 'Coral island speedboat, floating market morning and two nights each in the city and on the coast.',
    sum_bn: 'কোরাল আইল্যান্ডে স্পিডবোট, ভাসমান বাজারের সকাল — শহরে ও সমুদ্রে দুই রাত করে।',
    nights: 5, base: 6000, flight: 35000, from: 52000, rating: 4.7, img: '', hue: 16,
    inc_en: ['Return air ticket', 'Coral island tour', 'Airport transfers'],
    inc_bn: ['যাওয়া-আসার এয়ার টিকিট', 'কোরাল আইল্যান্ড ট্যুর', 'এয়ারপোর্ট ট্রান্সফার'],
    excl_en: INT_EXCL_EN, excl_bn: INT_EXCL_BN,
    itinerary_en: ['Arrive in Bangkok, check in, evening at a local night market.', 'Bangkok city and temple tour.', 'Transfer to Pattaya, evening free.', 'Coral island speedboat tour.', 'Floating market in the morning, free afternoon.', 'Breakfast, transfer to the airport, return flight.'],
    itinerary_bn: ['ব্যাংকক পৌঁছে হোটেলে চেক-ইন, সন্ধ্যায় নাইট মার্কেট।', 'ব্যাংকক সিটি ও মন্দির ভ্রমণ।', 'পাতায়ায় ট্রান্সফার, সন্ধ্যা অবসর।', 'কোরাল আইল্যান্ডে স্পিডবোট ট্যুর।', 'সকালে ভাসমান বাজার, বিকেল অবসর।', 'নাস্তা, এয়ারপোর্ট ট্রান্সফার, ফিরতি ফ্লাইট।'] },
  { id: 'nepal', cat: 'international', title_en: 'Kathmandu and Pokhara', title_bn: 'কাঠমান্ডু ও পোখারা',
    sum_en: 'Annapurna sunrise from Sarangkot, Phewa lake boats and the old durbar squares.',
    sum_bn: 'সারাংকোট থেকে অন্নপূর্ণার সূর্যোদয়, ফেওয়া হ্রদে নৌকা আর পুরনো দরবার স্কয়ার।',
    nights: 4, base: 4200, flight: 26000, from: 39500, rating: 4.8, img: '', hue: 266,
    inc_en: ['Return air ticket', 'Sarangkot sunrise drive', 'Visa on arrival support'],
    inc_bn: ['যাওয়া-আসার এয়ার টিকিট', 'সারাংকোট সূর্যোদয় ট্রিপ', 'অন-অ্যারাইভাল ভিসা সহায়তা'],
    excl_en: ['Lunch and dinner unless added as an extra', 'Personal expenses and shopping', 'Travel insurance unless added as an extra'],
    excl_bn: ['লাঞ্চ ও ডিনার (আলাদা যোগ না করলে)', 'ব্যক্তিগত খরচ ও কেনাকাটা', 'ট্রাভেল ইনস্যুরেন্স (আলাদা যোগ না করলে)'],
    itinerary_en: ['Arrive in Kathmandu, check in, evening walk around Durbar Square.', 'Kathmandu sightseeing — Pashupatinath and Boudhanath.', 'Travel to Pokhara, boating on Phewa Lake.', 'Sunrise over the Annapurna range from Sarangkot, free afternoon.', 'Breakfast, return to Kathmandu, departure.'],
    itinerary_bn: ['কাঠমান্ডু পৌঁছে হোটেলে চেক-ইন, সন্ধ্যায় দরবার স্কয়ার ভ্রমণ।', 'কাঠমান্ডু দর্শন — পশুপতিনাথ ও বৌদ্ধনাথ।', 'পোখারায় যাত্রা, ফেওয়া হ্রদে নৌকা ভ্রমণ।', 'সারাংকোট থেকে অন্নপূর্ণা রেঞ্জের সূর্যোদয়, বিকেল অবসর।', 'নাস্তা, কাঠমান্ডুতে ফিরে যাত্রা শেষ।'] }
];

const SEED_SERVICES = [
  { id: 's1', icon: 'ic-plane', title_en: 'Air ticketing', title_bn: 'এয়ার টিকিট', desc_en: 'Domestic and international tickets on every airline flying out of Dhaka, reissued and refunded by us.', desc_bn: 'ঢাকা থেকে ছেড়ে যাওয়া সব এয়ারলাইনের দেশি ও বিদেশি টিকিট — রিইস্যু ও রিফান্ডও আমরাই করি।' },
  { id: 's2', icon: 'ic-passport', title_en: 'Visa processing', title_bn: 'ভিসা প্রসেসিং', desc_en: 'Document checklist, appointment booking and form filling for India, Thailand, Malaysia, UAE and Schengen.', desc_bn: 'ভারত, থাইল্যান্ড, মালয়েশিয়া, আমিরাত ও শেনজেন ভিসার কাগজপত্র, অ্যাপয়েন্টমেন্ট ও ফর্ম পূরণ।' },
  { id: 's3', icon: 'ic-bed', title_en: 'Hotel booking', title_bn: 'হোটেল বুকিং', desc_en: 'Rooms held on our corporate rates, from beach resorts to city business hotels.', desc_bn: 'কর্পোরেট রেটে রুম বুকিং — সৈকতের রিসোর্ট থেকে শহরের বিজনেস হোটেল পর্যন্ত।' },
  { id: 's4', icon: 'ic-shield', title_en: 'Travel insurance', title_bn: 'ট্রাভেল ইনস্যুরেন্স', desc_en: 'Medical and baggage cover accepted by embassies, issued the same day you ask.', desc_bn: 'দূতাবাস গ্রহণ করে এমন মেডিকেল ও ব্যাগেজ কভার — চাওয়ার দিনেই ইস্যু।' }
];

const SEED_GALLERY = [
  { id: 'g1', caption_en: 'Marine Drive at low tide', caption_bn: 'ভাটার সময় মেরিন ড্রাইভ', img: '', hue: 198 },
  { id: 'g2', caption_en: 'Tea estate, Sreemangal', caption_bn: 'চা বাগান, শ্রীমঙ্গল', img: '', hue: 120 },
  { id: 'g3', caption_en: 'Nilgiri at dawn', caption_bn: 'ভোরের নীলগিরি', img: '', hue: 172 },
  { id: 'g4', caption_en: 'Batu Caves steps', caption_bn: 'বাটু কেভসের সিঁড়ি', img: '', hue: 16 }
];

/* Airfare quote destinations — covers the routes a Dhaka agency is asked
   for most. "Other" lets a customer type anything not on the list, so
   nothing is ever actually out of reach.                                */
const AIRFARE_ORIGINS = [
  { v: 'Dhaka (DAC)', en: 'Dhaka (DAC)', bn: 'ঢাকা (DAC)' },
  { v: 'Chattogram (CGP)', en: 'Chattogram (CGP)', bn: 'চট্টগ্রাম (CGP)' },
  { v: 'Sylhet (ZYL)', en: 'Sylhet (ZYL)', bn: 'সিলেট (ZYL)' }
];
const AIRFARE_DESTINATIONS = [
  { v: 'Dubai (DXB)', en: 'Dubai (DXB)', bn: 'দুবাই (DXB)' },
  { v: 'Abu Dhabi (AUH)', en: 'Abu Dhabi (AUH)', bn: 'আবুধাবি (AUH)' },
  { v: 'Sharjah (SHJ)', en: 'Sharjah (SHJ)', bn: 'শারজাহ (SHJ)' },
  { v: 'Doha (DOH)', en: 'Doha (DOH)', bn: 'দোহা (DOH)' },
  { v: 'Riyadh (RUH)', en: 'Riyadh (RUH)', bn: 'রিয়াদ (RUH)' },
  { v: 'Jeddah (JED)', en: 'Jeddah (JED)', bn: 'জেদ্দা (JED)' },
  { v: 'Dammam (DMM)', en: 'Dammam (DMM)', bn: 'দাম্মাম (DMM)' },
  { v: 'Kuwait City (KWI)', en: 'Kuwait City (KWI)', bn: 'কুয়েত সিটি (KWI)' },
  { v: 'Muscat (MCT)', en: 'Muscat (MCT)', bn: 'মাস্কাট (MCT)' },
  { v: 'Manama (BAH)', en: 'Manama (BAH)', bn: 'মানামা (BAH)' },
  { v: 'Kolkata (CCU)', en: 'Kolkata (CCU)', bn: 'কলকাতা (CCU)' },
  { v: 'Delhi (DEL)', en: 'Delhi (DEL)', bn: 'দিল্লি (DEL)' },
  { v: 'Mumbai (BOM)', en: 'Mumbai (BOM)', bn: 'মুম্বাই (BOM)' },
  { v: 'Chennai (MAA)', en: 'Chennai (MAA)', bn: 'চেন্নাই (MAA)' },
  { v: 'Kathmandu (KTM)', en: 'Kathmandu (KTM)', bn: 'কাঠমান্ডু (KTM)' },
  { v: 'Colombo (CMB)', en: 'Colombo (CMB)', bn: 'কলম্বো (CMB)' },
  { v: 'Malé (MLE)', en: 'Malé (MLE)', bn: 'মালে (MLE)' },
  { v: 'Kuala Lumpur (KUL)', en: 'Kuala Lumpur (KUL)', bn: 'কুয়ালালামপুর (KUL)' },
  { v: 'Singapore (SIN)', en: 'Singapore (SIN)', bn: 'সিঙ্গাপুর (SIN)' },
  { v: 'Bangkok (BKK)', en: 'Bangkok (BKK)', bn: 'ব্যাংকক (BKK)' },
  { v: 'Jakarta (CGK)', en: 'Jakarta (CGK)', bn: 'জাকার্তা (CGK)' },
  { v: 'Denpasar, Bali (DPS)', en: 'Denpasar, Bali (DPS)', bn: 'দেনপাসার, বালি (DPS)' },
  { v: 'Manila (MNL)', en: 'Manila (MNL)', bn: 'ম্যানিলা (MNL)' },
  { v: 'Ho Chi Minh City (SGN)', en: 'Ho Chi Minh City (SGN)', bn: 'হো চি মিন সিটি (SGN)' },
  { v: 'Hong Kong (HKG)', en: 'Hong Kong (HKG)', bn: 'হংকং (HKG)' },
  { v: 'Guangzhou (CAN)', en: 'Guangzhou (CAN)', bn: 'গুয়াংজু (CAN)' },
  { v: 'Tokyo (NRT)', en: 'Tokyo (NRT)', bn: 'টোকিও (NRT)' },
  { v: 'Seoul (ICN)', en: 'Seoul (ICN)', bn: 'সিউল (ICN)' },
  { v: 'Shanghai (PVG)', en: 'Shanghai (PVG)', bn: 'সাংহাই (PVG)' },
  { v: 'London (LHR)', en: 'London (LHR)', bn: 'লন্ডন (LHR)' },
  { v: 'Istanbul (IST)', en: 'Istanbul (IST)', bn: 'ইস্তাম্বুল (IST)' },
  { v: 'Rome (FCO)', en: 'Rome (FCO)', bn: 'রোম (FCO)' },
  { v: 'Paris (CDG)', en: 'Paris (CDG)', bn: 'প্যারিস (CDG)' },
  { v: 'Frankfurt (FRA)', en: 'Frankfurt (FRA)', bn: 'ফ্রাঙ্কফুর্ট (FRA)' },
  { v: 'Amsterdam (AMS)', en: 'Amsterdam (AMS)', bn: 'আমস্টারডাম (AMS)' },
  { v: 'New York (JFK)', en: 'New York (JFK)', bn: 'নিউ ইয়র্ক (JFK)' },
  { v: 'Toronto (YYZ)', en: 'Toronto (YYZ)', bn: 'টরন্টো (YYZ)' },
  { v: "Cox's Bazar (CXB)", en: "Cox's Bazar (CXB)", bn: 'কক্সবাজার (CXB)' },
  { v: 'Chattogram (CGP)', en: 'Chattogram (CGP)', bn: 'চট্টগ্রাম (CGP)' },
  { v: 'Sylhet (ZYL)', en: 'Sylhet (ZYL)', bn: 'সিলেট (ZYL)' },
  { v: 'Jessore (JSR)', en: 'Jessore (JSR)', bn: 'যশোর (JSR)' },
  { v: 'Rajshahi (RJH)', en: 'Rajshahi (RJH)', bn: 'রাজশাহী (RJH)' },
  { v: 'Barisal (BZL)', en: 'Barisal (BZL)', bn: 'বরিশাল (BZL)' },
  { v: 'Saidpur (SPD)', en: 'Saidpur (SPD)', bn: 'সৈয়দপুর (SPD)' },
  { v: 'other', en: 'Other — type it in', bn: 'অন্য কোনো গন্তব্য — লিখুন' }
];

const REVIEWS = [
  { n: 'Farhana Islam', c: 'Dhanmondi', en: 'They rebuilt our Cox\u2019s Bazar plan twice because my mother cannot climb stairs. The final invoice matched the quote to the taka.', bn: 'আমার মা সিঁড়ি ভাঙতে পারেন না বলে কক্সবাজারের প্ল্যান দুবার নতুন করে সাজিয়ে দিয়েছে। শেষ ইনভয়েস কোটেশনের সঙ্গে টাকায় টাকায় মিলেছে।' },
  { n: 'Tanvir Ahmed', c: 'Chattogram', en: 'Our Malaysia visa was rejected once before. They redid the file, and the second one came through in nine days.', bn: 'আগে একবার মালয়েশিয়ার ভিসা বাতিল হয়েছিল। ওরা ফাইল নতুন করে সাজিয়ে দেয়, দ্বিতীয়বার নয় দিনেই ভিসা হয়ে যায়।' }
];
