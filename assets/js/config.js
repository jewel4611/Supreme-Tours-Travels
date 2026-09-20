/* =====================================================================
   SUPREME TOURS & TRAVELS — configuration
   This is the only file you normally need to edit.
   ===================================================================== */
window.CONFIG = {

  /* ---- Backend -----------------------------------------------------
     Leave both blank to run in DEMO MODE (everything saves in the
     browser only, nothing is lost but nothing is shared either).
     Fill them in and the whole site switches to Supabase.            */
  SUPABASE_URL: 'https://rjfobeowcrhsgefpuhbf.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_XJZND0TUNPQFlP8DJvvIdg_AKFxHxa9',
  STORAGE_BUCKET: 'media',

  /* ---- New quote alerts (optional) -----------------------------------
     Get you an email the moment someone finishes the price planner, so
     a hot lead doesn't sit unread overnight. Free account at emailjs.com,
     connected to your own Gmail — no server, no environment variables.
     Setup steps are in README.md. Leave any of these blank to turn it off. */
  EMAILJS_PUBLIC_KEY: '',
  EMAILJS_SERVICE_ID: '',
  EMAILJS_TEMPLATE_ID: '',
  EMAILJS_AIRFARE_TEMPLATE_ID: '',   // optional — a second template for staff alerts on airfare requests; leave blank to skip that alert
  EMAILJS_CUSTOMER_TEMPLATE_ID: '',  // optional — sends a confirmation email to the CUSTOMER (quote or airfare), only when they gave an email address
  ALERT_EMAIL: '',              // leave blank to send alerts to EMAIL above

  /* ---- Business details -------------------------------------------- */
  COMPANY:    'Supreme Tours & Travels',
  WHATSAPP:   '8801614501860',            // digits only, country code first
  QUOTE_WHATSAPP: '',                     // optional — separate WhatsApp number for tour price quotes; leave blank to use WHATSAPP above
  AIRFARE_WHATSAPP: '',                   // optional — separate WhatsApp number for airfare requests; leave blank to use WHATSAPP above

  /* ---- WhatsApp message wording -------------------------------------
     Shown when a customer taps "Send it on WhatsApp" after building a
     tour quote, or "Also message us now" after an airfare request.
     Edit the wording here or from Site info in the admin panel. Use
     {curly braces} for the placeholders — they get filled in per quote:
       Quote template:   {company} {package} {pax} {children} {nights} {hotel} {total}
       Airfare template: {route} {date} {passengers}                          */
  QUOTE_WA_TEMPLATE_EN: 'Hello {company},\n\nTrip: {package}\nPeople: {pax}{children}\nNights: {nights}\nHotel: {hotel}\nEstimate: {total}\n\nPlease confirm the final rate.',
  QUOTE_WA_TEMPLATE_BN: 'আসসালামু আলাইকুম, {company}।\n\nভ্রমণ: {package}\nযাত্রী: {pax}{children}\nরাত: {nights}\nহোটেল: {hotel}\nআনুমানিক: {total}\n\nঅনুগ্রহ করে চূড়ান্ত রেট জানাবেন।',
  AIRFARE_WA_TEMPLATE_EN: 'Hello, I would like an airfare quote.\n\nRoute: {route}\nDate: {date}\nPassengers: {passengers}',
  AIRFARE_WA_TEMPLATE_BN: 'আসসালামু আলাইকুম, এয়ার টিকিটের ভাড়া জানতে চাই।\n\nরুট: {route}\nতারিখ: {date}\nযাত্রী: {passengers}',
  PHONE:      '+880 1614-501860',
  EMAIL:      'tours@supremegroup.xyz',
  ADDRESS_EN: '147/A (3rd Floor), Airport Road, Dhaka 1215',
  ADDRESS_BN: '১৪৭/এ (৩য় তলা), এয়ারপোর্ট রোড, ঢাকা ১২১৫',
  TRADE_LICENCE: 'TRAD/DSCC/000000/2024',
  BIN: '000000000-0000',

  /* ---- Payment methods shown on invoices and in WhatsApp messages ---
     "personal" means customers use Send Money (not the Payment button),
     so remind them to note the invoice number in the reference field.  */
  PAYMENT_METHODS: [
    { name: 'bKash', number: '01611464611', type: 'personal' },
    { name: 'Nagad', number: '01611464611', type: 'personal' },
    { name: 'Upay',  number: '01611464611', type: 'personal' }
  ],

  /* ---- Money -------------------------------------------------------- */
  USD_RATE: 122,                 // 1 USD = x BDT, display only
  VAT_PERCENT: 0,                // set to 5 or 15 if you must show VAT on invoices

  /* ---- Package pricing rules ---------------------------------------- */
  TRANSFER_FEE:  2500,           // per booking
  MEAL_FEE:      1500,           // per person per day
  GUIDE_FEE:     3000,           // per booking
  INSURANCE_FEE:  900,           // per person
  VISA_FEE:      4500,           // per person, overseas only
  UPGRADE_4STAR: 3500,           // per room per night
  UPGRADE_5STAR: 8000,
  CHILD_DISCOUNT: 0.5,           // children under 11 pay half of flight + meals

  /* ---- Staff panel --------------------------------------------------
     Used ONLY in demo mode. Once Supabase is connected, login goes
     through Supabase Auth and this value is ignored.                 */
  DEMO_PASSWORD: 'supreme2026',

  /* ---- Ready-made promotional messages (admin → Customers) ---------- */
  PROMO_TEMPLATES: [
    { name: 'Eid offer',
      en: 'Assalamu alaikum {name}, Supreme Tours & Travels here. Our Eid packages are open now — Cox\'s Bazar from BDT 14,500 and Sylhet from BDT 9,900 per person. Reply here and we will hold a room for you.',
      bn: 'আসসালামু আলাইকুম {name}, সুপ্রিম ট্যুরস অ্যান্ড ট্রাভেলস থেকে বলছি। ঈদের প্যাকেজ চালু হয়েছে — কক্সবাজার জনপ্রতি ১৪,৫০০৳ এবং সিলেট ৯,৯০০৳ থেকে। আগ্রহী হলে জানান, রুম আটকে রাখব।' },
    { name: 'Winter season',
      en: 'Hello {name}, winter rates are out at Supreme Tours & Travels. Sundarbans launch trips and Bandarban packages are filling fast for December and January. Want the price list?',
      bn: 'হ্যালো {name}, সুপ্রিম ট্যুরস অ্যান্ড ট্রাভেলসে শীতের রেট এসে গেছে। ডিসেম্বর-জানুয়ারির সুন্দরবন ও বান্দরবান প্যাকেজ দ্রুত পূর্ণ হচ্ছে। রেট লিস্ট পাঠাব?' },
    { name: 'Follow up on old quote',
      en: 'Hello {name}, this is Supreme Tours & Travels. You asked us for a quote a while back. Dates are still open if you would like to revisit the plan — the rate has not changed much.',
      bn: 'হ্যালো {name}, সুপ্রিম ট্যুরস অ্যান্ড ট্রাভেলস থেকে বলছি। কিছুদিন আগে আপনি একটি কোটেশন নিয়েছিলেন। এখনো তারিখ খালি আছে, চাইলে আবার পরিকল্পনা করতে পারি — রেটও প্রায় একই আছে।' },
    { name: 'Visa service',
      en: 'Hello {name}, Supreme Tours & Travels now files Thailand, Malaysia, UAE and India visas with document checking included. Shall we send you the checklist?',
      bn: 'হ্যালো {name}, সুপ্রিম ট্যুরস অ্যান্ড ট্রাভেলস এখন থাইল্যান্ড, মালয়েশিয়া, আমিরাত ও ভারতের ভিসা প্রসেস করছে, কাগজপত্র যাচাইসহ। চেকলিস্ট পাঠাব?' }
  ]
};
