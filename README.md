# Supreme Tours & Travels — website and staff panel

A bilingual (English / বাংলা) tour operator website with a live price planner,
a quote-capture flow, and a staff panel holding customers, quotations and invoices.
Plain HTML, CSS and JavaScript — no build step, no framework, no npm install.

---

## Run it right now

Open `index.html` in a browser. Everything works in **demo mode**: data is kept in
that browser's own storage. The staff panel is at `admin.html`.

- Staff login (demo): any email, password `supreme2026` — change it in `assets/js/config.js`.

---

## Files

```
index.html              the public website
admin.html              the staff panel
assets/css/styles.css   all custom styling, including the printable invoice
assets/js/config.js     ← the only file you normally edit
assets/js/tailwind.js   brand colours and fonts
assets/js/ui.js         shared helpers, icon sprite, logo
assets/js/i18n.js       every English and Bangla string
assets/js/data.js       Supabase adapter + starter packages
assets/js/site.js       public site behaviour
assets/js/admin.js      dashboard, quotations, invoices, customers, catalogue
assets/img/logo.svg     the logo as a standalone file / favicon
supabase/schema.sql     tables, indexes and security policies
netlify.toml            deploy settings and security headers
robots.txt              keeps the staff panel out of search results
```

---

## Going live

### 1. Supabase

1. Create a project at supabase.com.
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Storage → create a **public** bucket named `media`.
4. Authentication → Users → add your staff email and password.
5. Project Settings → API → copy the Project URL and the `anon` key into
   `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `assets/js/config.js`.

The anon key is meant to be public. Row level security in the schema means a
visitor can read packages and insert one quotation, and nothing else. Customers,
invoices and every edit require a signed-in staff account.

### 2. Netlify

Push the folder to GitHub → Netlify → Add new site → Import from GitHub.
No build command; publish directory `.`. Or drag the folder onto
app.netlify.com/drop. Add your domain under Domain settings; HTTPS is automatic.

---

## What the staff panel does

| Tab | What it is for |
|---|---|
| Dashboard | Quotes waiting for a call, customers on file, money collected, outstanding due |
| Site info | Every business detail — phone, WhatsApp, email, address, trade licence, exchange rate, and every price planner fee — editable without touching code |
| Quotations | Every price planner submission, plus quotations you write by hand. Preview with a chosen signature, print, WhatsApp, or convert to an invoice in one click |
| Bills | Invoices with line items, discount, advance and balance. Record payments, preview and print with a signature, chase the due on WhatsApp |
| Ledger | Running balance for every customer (invoiced vs paid) and every vendor (billed vs paid), each with a printable statement of account |
| Customers | One row per mobile number, never duplicated. Search, tag, export, and send personalised WhatsApp promotions |
| Vendors | Airlines, hotels, visa agents and other suppliers you pay — add bills, record payments, see what you owe each one |
| Signatories | Authorised signers with a saved signature image. Pick who signs each quotation or invoice from a dropdown when previewing it |
| Staff accounts | Give someone a booking-only login — hides Bills, Ledger, Vendors, Signatories, Site info and Setup |
| Packages / Services / Photos | The website's content, in both languages |
| Setup | Connection status and deployment steps |

Previewing a quotation or invoice opens it on screen first — choose a signatory from
the dropdown at the top, see the signature appear on the document live, then print
or save as PDF. The choice is remembered on that document for next time.

### Staff roles
Everyone who signs in has full access by default. Add someone in the Staff accounts
tab with the role "Booking staff" and their login sees only Dashboard, Quotations,
Customers, Packages, Services and Photos — no money figures, no site settings. This
hides those screens in the interface; every signed-in account still has the same
underlying database permissions (see the note above `staff_profiles` in
`supabase/schema.sql`), so it's meant for a small trusted team, not as a hard
security wall.

Printing a quotation or invoice uses the browser's print dialogue — choose
"Save as PDF" to get a file you can email or send on WhatsApp.

---

## Notes on WhatsApp promotions

`wa.me` links open one chat at a time. That is WhatsApp's rule, not a limitation
of this site. The Customers tab therefore builds a click-through queue with each
message already personalised. It is safe for roughly fifty messages a day.

For real bulk sending, apply for the **WhatsApp Business Platform** through Meta
or a provider (360dialog, Twilio, Interakt), get your promotional templates
approved, and push the same customer list through their API. Blasting from an
ordinary number gets the number banned.

---

## Things to change before launch

In `assets/js/config.js`:

- `PHONE`, `WHATSAPP`, `EMAIL`, `ADDRESS_EN`, `ADDRESS_BN`
- `TRADE_LICENCE` and `BIN` — these print on every invoice
- `USD_RATE`, `VAT_PERCENT`
- The add-on prices: transfers, meals, guide, insurance, visa, room upgrades
- `DEMO_PASSWORD`
- `PROMO_TEMPLATES` — your own campaign messages

Also replace the placeholder reviews in `assets/js/data.js` and the stat figures
in the hero section of `index.html` with your real numbers.
