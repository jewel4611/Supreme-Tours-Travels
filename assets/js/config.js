/* =====================================================================
   SUPREME TOURS & TRAVELS — configuration
   This is the only file you normally need to edit.
   ===================================================================== */
window.CONFIG = {

  /* ---- Backend -----------------------------------------------------
     Leave both blank to run in DEMO MODE (everything saves in the
     browser only, nothing is lost but nothing is shared either).
     Fill them in and the whole site switches to Supabase.            */
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  STORAGE_BUCKET: 'media',

  /* ---- Business details -------------------------------------------- */
  COMPANY:    'Supreme Tours & Travels',
  WHATSAPP:   '8801700000000',            // digits only, country code first
  PHONE:      '+880 1700-000000',
  EMAIL:      'info@supremetours.com',
  ADDRESS_EN: 'Level 4, Kazi Tower, Motijheel, Dhaka 1000',
  ADDRESS_BN: 'লেভেল ৪, কাজী টাওয়ার, মতিঝিল, ঢাকা ১০০০',
  TRADE_LICENCE: 'TRAD/DSCC/000000/2024',
  BIN: '000000000-0000',

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
