# AgriFlow AI 🌿

An intelligent agricultural supply chain management platform built with Next.js 14, Supabase, and Google Gemini.

AgriFlow connects **farmers, buyers, transporters, warehouse managers and administrators** on one platform — with deterministic demand forecasting, perishable-first delivery scheduling, shelf-life spoilage tracking, and an AI assistant that explains your live data in plain language.

## Highlights

- **Premium landing page** — fullscreen hero carousel, parallax floating cards, scroll-reveal sections, animated stat counters, testimonials, FAQ
- **Role-based authentication** — 5 user types, each with its own dashboard; show/hide password, strength meter, secure password generator, remember me, forgot/reset password
- **Farmer module** — crops CRUD, harvest records with pricing/grading/shelf life, harvest calendar
- **Buyer module** — searchable marketplace, in-card ordering, live order tracking, spending analytics
- **Warehouse module** — inventory with live shelf-life freshness (fresh / expiring / spoiled), stock movement log, capacity tracking
- **Transport module** — delivery workflow (assigned → picked up → in transit → delivered) with a Leaflet route map
- **Scheduling engine** — deterministic rules: most-perishable orders first, max 5 deliveries/day, nearest warehouse as pickup, least-busy transporter assignment
- **Demand forecasting** — moving average + weighted moving average over 8 weeks of real orders, per product, with trend indicators
- **Notifications** — rule-based alerts for every order, delivery and spoilage event
- **AI Assistant** — Google Gemini grounded in your live data; explains forecasts, flags spoilage risks, and degrades gracefully when unavailable
- **Reports & Admin** — Recharts analytics, user management with role changes, full order log, platform stats
- **Dark mode** — one-click toggle, persisted, respects system preference
- **PWA** — installable, offline page, app icons, theme color
- **Mobile-first** — responsive from 320px, touch-friendly controls, drawer navigation
- **Tested end-to-end** — a Playwright script drives all five roles through the complete supply chain in a real browser

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 (App Router, Server Components + Server Actions), TypeScript, Tailwind CSS |
| Animation | Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Row Level Security) |
| AI | Google Gemini (`gemini-flash-lite-latest`) — explanations only; all business logic is deterministic |
| Maps | Leaflet + OpenStreetMap |
| Charts | Recharts |
| Testing | Playwright (end-to-end) |
| Hosting | Vercel |

## Getting Started

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run all of [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS policies, the signup trigger and three seed warehouses.
3. In **Authentication → Sign In / Providers → Email**, disable *Confirm email* for a friction-free demo.

### 2. Configure environment

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=      # Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Project Settings → API → publishable/anon key
GEMINI_API_KEY=                # optional — aistudio.google.com/apikey
```

The Gemini key is optional: without it the assistant shows a helpful fallback and everything else works.

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and create one account per role.

### 4. Demo data (recommended)

After signing up at least one **Farmer** and one **Buyer**, run [`supabase/seed-demo.sql`](supabase/seed-demo.sql) in the SQL Editor. It creates crops, marketplace listings, six weeks of order history (so forecasting shows real trends), warehouse stock including expiring items, and an assigned delivery.

## The Demo Flow

1. **Farmer** adds a crop and records a harvest — it's listed to buyers automatically.
2. **Buyer** searches the marketplace and places an order.
3. **Farmer** confirms the order.
4. **Admin** runs the scheduling engine (Dashboard → Scheduling → *Run scheduler*).
5. **Transporter** advances the delivery: picked up → in transit → delivered.
6. **Warehouse manager** receives/dispatches stock and watches shelf-life alerts.

Notifications, forecasting and reports fill in live as you go.

## End-to-End Tests

With the app running on `localhost:3000`:

```bash
node scripts/e2e-demo.mjs
```

Playwright creates five fresh accounts (one per role) and walks the entire supply chain — 33 verified steps, with a screenshot captured on any failure.

## Deploy to Vercel

Push to GitHub, import the repo in Vercel, set the three environment variables — done. The production build is clean and the PWA install prompt activates automatically on HTTPS.

## Author

**Senpai Dark** (Daniel Atere)
- GitHub: [SenpaiDark](https://github.com/SenpaiDark)
- LinkedIn: [daniel-atere-b00727381](https://linkedin.com/in/daniel-atere-b00727381)

## License

MIT
