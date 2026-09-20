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
| Airfare | Requests for a flight-only fare to any destination — click "Set fare" once you've checked it, then WhatsApp the customer |
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

## New-quote email alerts

Get an email the moment someone finishes the price planner on the website, so a
lead doesn't sit unread overnight. This uses [EmailJS](https://www.emailjs.com) —
a free account connected to your own Gmail, no server or environment variables
needed. 200 emails/month free, which comfortably covers most small agencies.

1. Sign up at emailjs.com.
2. **Email Services** → Add New Service → Gmail → connect `tours.supremebd@gmail.com`
   (or whichever inbox should get the alerts). Note the **Service ID** it gives you.
3. **Email Templates** → Create New Template. Set the "To email" field to `{{to_email}}`,
   the subject to something like `New quote — {{customer_name}} ({{ref}})`, and paste
   this into the content box:
   ```
   New quote request from the website.

   Reference: {{ref}}
   Name: {{customer_name}}
   Phone: {{customer_phone}}
   Email: {{customer_email}}

   Trip: {{package}}
   People: {{pax}} adults + {{children}} children
   Nights: {{nights}}
   Hotel: {{hotel_tier}}
   Estimated total: {{total}}

   Note from the customer: {{message}}

   Open the staff panel: {{admin_link}}
   ```
   Save it and note the **Template ID**.
4. **Account → General** → copy your **Public Key**.
5. Paste all three into `assets/js/config.js`:
   ```js
   EMAILJS_PUBLIC_KEY: 'your_public_key',
   EMAILJS_SERVICE_ID: 'your_service_id',
   EMAILJS_TEMPLATE_ID: 'your_template_id',
   ```
6. Push the change live. Submit a test quote on the site and check the inbox.

Leave any of the three blank and this feature quietly does nothing — the
quote still saves normally either way, so there's no risk in trying it.

A second, optional template covers airfare requests (see below) — set
`EMAILJS_AIRFARE_TEMPLATE_ID` the same way if you want a separate alert
for those. It can reuse the same Service ID and Public Key; only the
template itself needs to be different, since the fields differ (route,
dates, passengers, class instead of package, nights, hotel).

## Emailing the customer their own quote

Separate from the alerts above (which go to your office), the site can also
email the *customer* a confirmation of their own quote or airfare request —
in whichever language they were using, itinerary included when it matches
one of your packages. This only fires when the customer actually gave an
email address; it never blocks or delays anything if they didn't.

It uses **one more EmailJS template**, shared by both quote and airfare
confirmations, since the whole message body is built in JavaScript and
just dropped into the template as a single variable:

1. **Email Templates** → Create New Template.
2. "To email" → `{{to_email}}`. Subject → `{{subject}}`.
3. Content:
   ```
   {{body}}
   ```
   That's it — the subject and the entire message are generated in the
   customer's language before EmailJS ever sees them, so the template
   itself stays this simple.
4. Copy the Template ID and paste it into `EMAILJS_CUSTOMER_TEMPLATE_ID`
   in `assets/js/config.js`.

Leave it blank and customers simply don't get this email — everything
else keeps working exactly as before.

## Airfare quotes for any destination

Below the services on the website is an "Airfare quote" button that isn't tied
to the 8 tour packages — a customer picks any of about 40 common routes (the
Gulf, South and Southeast Asia, East Asia, Europe, North America, plus
domestic routes) or types in anywhere else, along with dates, passenger count
and class. It saves to its own **Airfare** tab in the staff panel, separate
from tour quotations, since a flight-only request has no hotel or nights.

There's no live fare shown to the customer — real-time GDS pricing needs a
paid flight API subscription, well beyond what a small agency's site needs.
Instead, the request lands in the Airfare tab, you check the fare the way you
normally would, click "Set fare" to record it, and reply on WhatsApp with
the icon next to each row.

If you'd rather not offer this yet, delete or hide the banner in the
Services section of `index.html` — the rest of the site works the same
without it.

If you ever outgrow EmailJS's free tier, or want an SMS instead of email
for either kind of alert, the sturdier option is a Supabase Database
Webhook calling a small Netlify Function — ask and it can be built when
you need it.

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
- `PAYMENT_METHODS` — bKash, Nagad and Upay numbers shown on invoices with
  an unpaid balance, and in the WhatsApp message when you send one. Each
  entry's `type` is `'personal'` (Send Money) or `'merchant'` (Payment) —
  this only changes the instruction text shown next to the number
- `QUOTE_WHATSAPP` / `AIRFARE_WHATSAPP` — optional separate numbers for
  tour quotes and airfare requests; leave blank to use `WHATSAPP`. All
  three are also editable from the Site info tab in the admin panel
- `QUOTE_WA_TEMPLATE_EN/BN` and `AIRFARE_WA_TEMPLATE_EN/BN` — the actual
  wording of the WhatsApp message a customer sends you, in both
  languages. Also editable from Site info, with a placeholder legend
  shown right under each box
- `DEMO_PASSWORD`
- `PROMO_TEMPLATES` — your own campaign messages

Also replace the placeholder reviews in `assets/js/data.js` and the stat figures
in the hero section of `index.html` with your real numbers.
