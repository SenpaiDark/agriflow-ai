-- AgriFlow AI — demo data seeder
--
-- Run this in the Supabase SQL editor AFTER you have signed up at least:
--   • one Farmer account
--   • one Buyer account
-- (a Transporter and Warehouse Manager are optional but recommended).
--
-- It fills the platform with realistic crops, harvests, six weeks of orders
-- (so demand forecasting has history), inventory with expiring stock, stock
-- movements and notifications. Safe to run once; running twice duplicates data.

do $$
declare
  v_farmer uuid;
  v_buyer uuid;
  v_transporter uuid;
  v_wh uuid;
  v_crop_tomato uuid;
  v_crop_maize uuid;
  v_crop_pepper uuid;
  v_h_tomato uuid;
  v_h_maize uuid;
  v_h_pepper uuid;
  v_item uuid;
  wk int;
  v_order uuid;
begin
  select id into v_farmer from public.profiles where role = 'farmer' limit 1;
  select id into v_buyer from public.profiles where role = 'buyer' limit 1;
  select id into v_transporter from public.profiles where role = 'transporter' limit 1;
  select id into v_wh from public.warehouses limit 1;

  if v_farmer is null or v_buyer is null then
    raise exception 'Sign up at least one Farmer and one Buyer account first, then run this again.';
  end if;

  -- ── Crops ────────────────────────────────────────────────────────────────
  insert into public.crops (farmer_id, name, category, planting_date, expected_harvest_date, quantity_estimate, unit, status, notes)
  values (v_farmer, 'Tomatoes', 'Vegetables', current_date - 70, current_date - 5, 900, 'kg', 'harvested', 'Roma variety, drip irrigated')
  returning id into v_crop_tomato;

  insert into public.crops (farmer_id, name, category, planting_date, expected_harvest_date, quantity_estimate, unit, status, notes)
  values (v_farmer, 'Maize', 'Grains', current_date - 95, current_date - 10, 2000, 'kg', 'harvested', null)
  returning id into v_crop_maize;

  insert into public.crops (farmer_id, name, category, planting_date, expected_harvest_date, quantity_estimate, unit, status, notes)
  values (v_farmer, 'Bell Peppers', 'Vegetables', current_date - 40, current_date + 12, 400, 'kg', 'growing', 'Greenhouse batch')
  returning id into v_crop_pepper;

  insert into public.crops (farmer_id, name, category, planting_date, expected_harvest_date, quantity_estimate, unit, status)
  values (v_farmer, 'Cassava', 'Tubers', current_date - 20, current_date + 160, 5000, 'kg', 'planted');

  -- ── Harvests (listed on the marketplace) ─────────────────────────────────
  insert into public.harvests (crop_id, farmer_id, product_name, harvest_date, quantity, unit, quality_grade, price_per_unit, shelf_life_days, status)
  values (v_crop_tomato, v_farmer, 'Tomatoes', current_date - 4, 350, 'kg', 'A', 1800, 6, 'available')
  returning id into v_h_tomato;

  insert into public.harvests (crop_id, farmer_id, product_name, harvest_date, quantity, unit, quality_grade, price_per_unit, shelf_life_days, status)
  values (v_crop_maize, v_farmer, 'Maize', current_date - 9, 1500, 'kg', 'B', 950, 30, 'available')
  returning id into v_h_maize;

  insert into public.harvests (crop_id, farmer_id, product_name, harvest_date, quantity, unit, quality_grade, price_per_unit, shelf_life_days, status)
  values (v_crop_pepper, v_farmer, 'Bell Peppers', current_date - 3, 120, 'kg', 'A', 2500, 8, 'available')
  returning id into v_h_pepper;

  -- ── Six weeks of delivered order history (feeds forecasting/reports) ─────
  for wk in 1..6 loop
    insert into public.orders (buyer_id, farmer_id, harvest_id, product_name, quantity, unit, total_price, status, delivery_address, delivery_lat, delivery_lng, created_at)
    values
      (v_buyer, v_farmer, v_h_tomato, 'Tomatoes', 40 + wk * 12, 'kg', (40 + wk * 12) * 1800, 'delivered', 'Balogun Market, Lagos Island', 6.5244, 3.3792, now() - (interval '1 week' * (7 - wk))),
      (v_buyer, v_farmer, v_h_maize, 'Maize', 180 - wk * 15, 'kg', (180 - wk * 15) * 950, 'delivered', 'Bodija Market, Ibadan', 7.3775, 3.9470, now() - (interval '1 week' * (7 - wk)));
  end loop;

  -- A pending and a confirmed order so the demo has live workflow to show.
  insert into public.orders (buyer_id, farmer_id, harvest_id, product_name, quantity, unit, total_price, status, delivery_address, delivery_lat, delivery_lng)
  values (v_buyer, v_farmer, v_h_pepper, 'Bell Peppers', 30, 'kg', 30 * 2500, 'pending', 'Wuse Market, Abuja', 9.0765, 7.3986);

  insert into public.orders (buyer_id, farmer_id, harvest_id, product_name, quantity, unit, total_price, status, delivery_address, delivery_lat, delivery_lng)
  values (v_buyer, v_farmer, v_h_tomato, 'Tomatoes', 60, 'kg', 60 * 1800, 'confirmed', 'Mile 12 Market, Lagos', 6.6018, 3.3515)
  returning id into v_order;

  -- ── Warehouse inventory + movements ──────────────────────────────────────
  if v_wh is not null then
    insert into public.inventory_items (warehouse_id, harvest_id, product_name, quantity, unit, entry_date, shelf_life_days, status)
    values (v_wh, v_h_maize, 'Maize', 600, 'kg', current_date - 5, 30, 'in_storage')
    returning id into v_item;
    insert into public.stock_movements (warehouse_id, inventory_item_id, type, quantity, note)
    values (v_wh, v_item, 'in', 600, 'Seed data: received from farm');

    insert into public.inventory_items (warehouse_id, harvest_id, product_name, quantity, unit, entry_date, shelf_life_days, status)
    values (v_wh, v_h_tomato, 'Tomatoes', 90, 'kg', current_date - 4, 6, 'in_storage')
    returning id into v_item;
    insert into public.stock_movements (warehouse_id, inventory_item_id, type, quantity, note)
    values (v_wh, v_item, 'in', 90, 'Seed data: received from farm');

    -- Expiring soon — shows the amber shelf-life alert.
    insert into public.inventory_items (warehouse_id, product_name, quantity, unit, entry_date, shelf_life_days, status)
    values (v_wh, 'Leafy Greens', 45, 'kg', current_date - 4, 5, 'in_storage')
    returning id into v_item;
    insert into public.stock_movements (warehouse_id, inventory_item_id, type, quantity, note)
    values (v_wh, v_item, 'in', 45, 'Seed data: received from farm');
  end if;

  -- ── A delivery assigned to the transporter (if one exists) ───────────────
  if v_transporter is not null and v_wh is not null then
    insert into public.deliveries (order_id, transporter_id, pickup_label, pickup_lat, pickup_lng, dropoff_label, dropoff_lat, dropoff_lng, scheduled_date, distance_km, status)
    select v_order, v_transporter, w.name, w.lat, w.lng, 'Mile 12 Market, Lagos', 6.6018, 3.3515, current_date + 1, 4.2, 'assigned'
    from public.warehouses w where w.id = v_wh;

    update public.orders set status = 'scheduled' where id = v_order;

    insert into public.notifications (user_id, title, message, type)
    values (v_transporter, 'New delivery assigned', 'Deliver Tomatoes to Mile 12 Market, Lagos tomorrow.', 'info');
  end if;

  -- ── Welcome notifications ─────────────────────────────────────────────────
  insert into public.notifications (user_id, title, message, type)
  values
    (v_farmer, 'Demo data loaded', 'Your farm now has crops, harvests and six weeks of order history.', 'success'),
    (v_buyer, 'Demo data loaded', 'Your account now has order history — check Forecasting to see demand trends.', 'success');

  raise notice 'Demo data created successfully.';
end $$;
