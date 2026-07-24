# Test Plan — PR #2 dedupe shared utils (getSessionUser / inputClass / pluralize)

## Environment
- App: `npm run dev` on http://localhost:3000
- Backend: local self-hosted Supabase (docker), schema.sql applied, 3 warehouses seeded, email confirmation disabled.
- Pure refactor PR: no behavior change intended. Goal = prove the golden-path supply chain still works end-to-end across all 5 roles, forms submit cleanly, and pluralized labels read correctly.

## Accounts to create during run (signup form `/signup`)
- Farmer, Buyer, Transporter, Warehouse manager, Admin (one each). Password meeting strength rules e.g. `Agri2025Test`.

## Why each test is adversarial
- If `getSessionUser()` were broken, auth-gated server actions (create crop/harvest, place/confirm order, run scheduler, receive/dispatch stock, change role) would silently no-op or error → downstream data would never appear. Each step asserts the created row/state actually shows up.
- If `pluralize()` were broken (e.g. always append "s" or wrong branch), a count of exactly 1 would render "1 orders"/"1 crops" and a count of 2 would render "2 order". We deliberately create count==1 AND count>1 states to distinguish.
- If `inputClass` were broken the forms could fail to render/submit; every form step asserts a successful submit (new row appears, no error banner).

## Test Steps

### T1 — Signups (getSessionUser + inputClass on signup form)
1. Sign up Farmer. PASS: redirected to `/dashboard/farmer` (farmer dashboard), no error banner.
2. Repeat for Buyer → `/dashboard/buyer`, Transporter → `/dashboard/transport`, Warehouse manager → `/dashboard/warehouse`, Admin → `/dashboard/admin`.
   PASS: each lands on its role dashboard. FAIL: signup error / wrong dashboard / stuck.

### T2 — Farmer adds crop (crops.ts getSessionUser + crops form inputClass)
1. As Farmer, go to Crops, fill Add Crop form (name "Maize", category, quantity 500 kg, planting + harvest dates), submit.
   PASS: new "Maize" crop row appears in the crops list; subtitle reads **"1 crop recorded"** (singular — adversarial for pluralize). No error.

### T3 — Farmer records harvest (crops.ts createHarvest + harvests form)
1. As Farmer, go to Harvests, Add Harvest: select the Maize crop, harvest date, quantity 300 kg, grade A, price 1500, shelf life. Submit.
   PASS: harvest row appears; it becomes available to buyers (verified in T4). No error.

### T4 — Buyer browses + places 2 orders (orders.ts placeOrder + browse form)
1. As Buyer, go to Browse marketplace. PASS: the Maize listing from T3 is visible.
2. Place an order: quantity 100, delivery address, city select. Submit. PASS: order placed (buyer Orders shows it).
3. Buyer Orders page subtitle after 1 order = **"1 order"** (singular). Then place a 2nd order (any listing/qty) and confirm subtitle becomes **"2 orders"** (plural). This is the key pluralize assertion.
   FAIL: "1 orders" or "2 order".

### T5 — Farmer confirms order (orders.ts confirmOrder)
1. As Farmer, Orders page shows subtitle pluralized correctly for its order count. Click Confirm on a pending order.
   PASS: order status flips to "confirmed"; buyer receives "Order confirmed" notification.

### T6 — Admin runs scheduler (scheduling.ts pluralize in result message)
1. As Admin, Dashboard → Scheduling → Run scheduler.
   PASS: result message reports the number scheduled with correct pluralization (e.g. "Scheduled 1 delivery" / "2 deliveries"), order(s) move to "scheduled", a delivery is created & assigned to the transporter.

### T7 — Transporter advances delivery (deliveries update)
1. As Transporter, go to Routes/Deliveries. PASS: Routes subtitle uses pluralize ("1 route on the map" vs "N routes on the map"). Advance the delivery: assigned → picked up → in transit → delivered.
   PASS: status advances each click; final = delivered.

### T8 — Warehouse manager receive/dispatch stock (inventory.ts getSessionUser + inventory/locations forms)
1. As Warehouse manager, create/verify a warehouse (locations form) then add inventory (receive stock) and dispatch some.
   PASS: inventory item appears after receive; quantity/status updates after dispatch; stock movement logged. No form error.

### T9 — Notifications pluralize + mark read (notifications.ts getSessionUser)
1. As a role with unread notifications (e.g. Farmer/Buyer), open Notifications. PASS: subtitle reads "N unread notification(s)" pluralized correctly (singular when exactly 1). Mark one/all read.
   PASS: unread count decreases; subtitle updates (or "You're all caught up" when 0).

### T10 — Profile update + Admin role change (profile.ts + admin.ts getSessionUser)
1. As any user, Profile page: change a field (e.g. phone/location) and save. PASS: value persists after reload, no error.
2. As Admin, user management: change a user's role. PASS: role updates in the list.

## Pass/Fail summary criteria
- ALL golden-path steps must complete with data actually persisting (proves getSessionUser wiring intact).
- Every pluralized label observed must match count (singular at 1, plural at >1).
- No form submission errors on any refactored form.
