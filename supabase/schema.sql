-- =====================================================================
-- Supreme Tours & Travels — Supabase schema
-- Paste the whole file into Supabase → SQL Editor → Run. Safe to re-run.
-- =====================================================================

-- ---------- catalogue -------------------------------------------------
create table if not exists packages (
  id          text primary key,
  created_at  timestamptz default now(),
  cat         text default 'domestic',          -- domestic | international
  title_en    text, title_bn text,
  sum_en      text, sum_bn   text,
  inc_en      text[], inc_bn text[],
  nights      int     default 3,
  base        int     default 2500,             -- room per night, two sharing
  flight      int     default 8000,             -- per person
  "from"      int     default 12000,            -- headline price shown on the card
  rating      numeric default 4.7,
  img         text,
  hue         int     default 198,
  active      boolean default true
);

create table if not exists services (
  id          text primary key,
  created_at  timestamptz default now(),
  icon        text default 'ic-plane',
  title_en    text, title_bn text,
  desc_en     text, desc_bn  text
);

create table if not exists gallery (
  id          text primary key,
  created_at  timestamptz default now(),
  img         text,
  caption_en  text, caption_bn text,
  hue         int default 198
);

-- ---------- people ----------------------------------------------------
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  last_seen   timestamptz default now(),
  name        text not null,
  phone       text not null,
  phone_key   text unique,                      -- 8801XXXXXXXXX, stops duplicates
  email       text,
  city        text,
  source      text default 'website',
  lang        text default 'en',
  consent     boolean default true,             -- false = never send promotions
  quotes      int default 0,
  bookings    int default 0,
  spent_bdt   bigint default 0,
  tags        text[] default '{}',
  notes       text,
  last_promo  timestamptz
);
create index if not exists customers_phone_idx on customers (phone_key);

-- ---------- quotations (also the website's quote requests) -------------
create table if not exists quotations (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  doc_no       text,                            -- QT-2026-0001
  customer_id  uuid references customers (id) on delete set null,
  name         text not null,
  phone        text not null,
  email        text,
  message      text,
  consent      boolean default true,
  lang         text default 'en',
  source       text default 'website',
  package      text, package_id text,
  pax          int, children int, nights int,
  hotel_tier   text, travel_date date, addons text,
  lines        jsonb default '[]'::jsonb,       -- [{label, amount, qty, rate}]
  total_bdt    bigint, currency text default 'BDT',
  status       text default 'new'               -- new | called | confirmed | lost
);
create index if not exists quotations_created_idx on quotations (created_at desc);

-- ---------- invoices / bills ------------------------------------------
create table if not exists invoices (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  doc_no        text,                           -- INV-2026-0001
  quotation_id  uuid references quotations (id) on delete set null,
  customer_id   uuid references customers (id) on delete set null,
  name          text not null,
  phone         text not null,
  email         text, address text, subject text,
  issue_date    date default current_date,
  due_date      date,
  items         jsonb default '[]'::jsonb,      -- [{label, qty, rate}]
  subtotal_bdt  bigint default 0,
  vat_bdt       bigint default 0,
  discount      bigint default 0,
  total_bdt     bigint default 0,
  paid_bdt      bigint default 0,
  paid_at       timestamptz,
  note          text,
  status        text default 'unpaid'           -- unpaid | partial | paid
);
create index if not exists invoices_created_idx on invoices (created_at desc);

-- =====================================================================
-- Security. The public may read the catalogue and submit one quotation.
-- Everything else needs a signed-in staff account.
-- =====================================================================
alter table packages   enable row level security;
alter table services   enable row level security;
alter table gallery    enable row level security;
alter table customers  enable row level security;
alter table quotations enable row level security;
alter table invoices   enable row level security;

drop policy if exists "public read packages" on packages;
drop policy if exists "public read services" on services;
drop policy if exists "public read gallery"  on gallery;
create policy "public read packages" on packages for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read gallery"  on gallery  for select using (true);

drop policy if exists "staff write packages" on packages;
drop policy if exists "staff write services" on services;
drop policy if exists "staff write gallery"  on gallery;
create policy "staff write packages" on packages for all to authenticated using (true) with check (true);
create policy "staff write services" on services for all to authenticated using (true) with check (true);
create policy "staff write gallery"  on gallery  for all to authenticated using (true) with check (true);

-- A visitor may create a quotation and their own customer row, nothing else.
drop policy if exists "anyone submits a quotation" on quotations;
drop policy if exists "staff manage quotations"    on quotations;
create policy "anyone submits a quotation" on quotations for insert with check (true);
create policy "staff manage quotations"    on quotations for all to authenticated using (true) with check (true);

drop policy if exists "anyone creates a customer" on customers;
drop policy if exists "staff manage customers"    on customers;
create policy "anyone creates a customer" on customers for insert with check (true);
create policy "staff manage customers"    on customers for all to authenticated using (true) with check (true);

-- Invoices are staff-only, top to bottom.
drop policy if exists "staff manage invoices" on invoices;
create policy "staff manage invoices" on invoices for all to authenticated using (true) with check (true);

-- ---------- storage ----------------------------------------------------
-- Create a PUBLIC bucket called "media" in Storage first, then run these.
drop policy if exists "public read media"  on storage.objects;
drop policy if exists "staff upload media" on storage.objects;
create policy "public read media"  on storage.objects for select using (bucket_id = 'media');
create policy "staff upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media');
