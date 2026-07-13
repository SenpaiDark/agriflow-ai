# AgriFlow AI

An intelligent agricultural supply chain management platform built with Next.js 14, Supabase, and Google Gemini.

AgriFlow connects **farmers, buyers, transporters, warehouse managers and administrators** on one platform, with deterministic demand forecasting, rule-based delivery scheduling, shelf-life spoilage tracking and an AI assistant that explains the data.

## Features

- **Role-based authentication** — 5 user types, each with its own dashboard
- **Farmer module** — crops CRUD, harvest records, harvest calendar
- **Buyer module** — marketplace browsing, ordering, live order tracking
- **Warehouse module** — inventory, stock movements, shelf-life spoilage rules, capacity tracking
- **Transport module** — delivery management with a Leaflet route map
- **Scheduling engine** — rule-based: most perishable first, nearest warehouse pickup, round-robin transporter assignment
- **Demand forecasting** — moving average + weighted moving average over weekly order history
- **Notifications** — rule-based alerts for orders, deliveries and spoilage
- **AI assistant** — Google Gemini explains and summarises the data (every feature works without it)
- **Reports & analytics** — Recharts dashboards for admins

## Tech Stack

- **Frontend:** Next.js 14 (App Router, Server Components + Server Actions), TypeScript, Tailwind CSS, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **AI:** Google Gemini API (explanations only — business logic is deterministic)
- **Maps:** Leaflet + OpenStreetMap
- **Hosting:** Vercel

## Getting Started

### 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the whole of [`supabase/schema.sql`](supabase/schema.sql) — it creates all tables, row-level-security policies, the signup trigger and three seed warehouses.
3. In **Authentication → Providers → Email**, disable *Confirm email* for a friction-free demo (optional but recommended).

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=      # Project Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Project Settings → API → anon public key
GEMINI_API_KEY=                # optional — aistudio.google.com/apikey
```

The Gemini key is optional: without it the AI assistant shows a fallback message and everything else works.

### 3. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up — pick a role on the signup form. Create one account per role to demo the full supply chain flow:

1. **Farmer** adds a crop, records a harvest (listed to buyers automatically).
2. **Buyer** browses the marketplace and places an order.
3. **Farmer** confirms the order.
4. **Admin** runs the scheduling engine (Dashboard → Scheduling → *Run scheduler*).
5. **Transporter** advances the delivery: picked up → in transit → delivered.
6. **Warehouse manager** receives/dispatches stock and watches shelf-life alerts.

## Deploy to Vercel

Push to GitHub, import the repo in Vercel and set the three environment variables. `npm run build` is clean — no extra configuration required.

## Author

**Senpai Dark**
- GitHub: [SenpaiDark](https://github.com/SenpaiDark)
- LinkedIn: [daniel-atere-b00727381](https://linkedin.com/in/daniel-atere-b00727381)

## License

MIT
