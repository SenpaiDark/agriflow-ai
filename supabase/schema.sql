-- AgriFlow AI — Supabase schema
-- Run this in the Supabase SQL editor of a fresh project.

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user, role decides the dashboard)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('farmer','buyer','transporter','warehouse_manager','admin')),
  phone text,
  location text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile from the metadata sent at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, phone, location)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', 'buyer'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'location'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by row-level-security policies.
create or replace function public.get_my_role()
returns text
language sql
security definer set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Farmer: crops and harvests
-- ---------------------------------------------------------------------------
create table public.crops (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null,
  planting_date date not null,
  expected_harvest_date date not null,
  quantity_estimate numeric not null default 0,
  unit text not null default 'kg',
  status text not null default 'planted' check (status in ('planted','growing','ready','harvested')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.harvests (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  product_name text not null,
  harvest_date date not null,
  quantity numeric not null,
  unit text not null default 'kg',
  quality_grade text not null default 'A' check (quality_grade in ('A','B','C')),
  price_per_unit numeric not null default 0,
  shelf_life_days integer not null default 7,
  status text not null default 'available' check (status in ('available','reserved','sold','stored')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Warehouse: locations, inventory, stock movements
-- ---------------------------------------------------------------------------
create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manager_id uuid references public.profiles(id) on delete set null,
  location text not null,
  lat double precision not null,
  lng double precision not null,
  capacity numeric not null default 10000,
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  harvest_id uuid references public.harvests(id) on delete set null,
  product_name text not null,
  quantity numeric not null,
  unit text not null default 'kg',
  entry_date date not null default current_date,
  shelf_life_days integer not null default 7,
  status text not null default 'in_storage' check (status in ('in_storage','dispatched','spoiled')),
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete cascade,
  type text not null check (type in ('in','out')),
  quantity numeric not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders and deliveries
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  farmer_id uuid not null references public.profiles(id) on delete cascade,
  harvest_id uuid not null references public.harvests(id) on delete cascade,
  product_name text not null,
  quantity numeric not null,
  unit text not null default 'kg',
  total_price numeric not null default 0,
  status text not null default 'pending'
    check (status in ('pending','confirmed','scheduled','in_transit','delivered','cancelled')),
  delivery_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  transporter_id uuid references public.profiles(id) on delete set null,
  pickup_label text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_label text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  scheduled_date date not null,
  distance_km numeric,
  status text not null default 'assigned'
    check (status in ('assigned','picked_up','in_transit','delivered')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info','warning','success','alert')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.crops enable row level security;
alter table public.harvests enable row level security;
alter table public.warehouses enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.orders enable row level security;
alter table public.deliveries enable row level security;
alter table public.notifications enable row level security;

-- Profiles: everyone signed in can read (names shown across the app);
-- users update their own row; admins update any.
create policy "profiles read" on public.profiles
  for select to authenticated using (true);
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid() or get_my_role() = 'admin');
create policy "profiles admin delete" on public.profiles
  for delete to authenticated using (get_my_role() = 'admin');

-- Crops: farmer owns; everyone signed in can read.
create policy "crops read" on public.crops
  for select to authenticated using (true);
create policy "crops insert" on public.crops
  for insert to authenticated with check (farmer_id = auth.uid());
create policy "crops update" on public.crops
  for update to authenticated using (farmer_id = auth.uid() or get_my_role() = 'admin');
create policy "crops delete" on public.crops
  for delete to authenticated using (farmer_id = auth.uid() or get_my_role() = 'admin');

-- Harvests: farmer owns; status changes also allowed to buyers/warehouse/admin
-- (order placement reserves stock, storage marks it stored).
create policy "harvests read" on public.harvests
  for select to authenticated using (true);
create policy "harvests insert" on public.harvests
  for insert to authenticated with check (farmer_id = auth.uid());
create policy "harvests update" on public.harvests
  for update to authenticated using (
    farmer_id = auth.uid()
    or get_my_role() in ('buyer','warehouse_manager','admin')
  );
create policy "harvests delete" on public.harvests
  for delete to authenticated using (farmer_id = auth.uid() or get_my_role() = 'admin');

-- Warehouses: managed by warehouse managers/admins, readable by all.
create policy "warehouses read" on public.warehouses
  for select to authenticated using (true);
create policy "warehouses write" on public.warehouses
  for insert to authenticated with check (get_my_role() in ('warehouse_manager','admin'));
create policy "warehouses update" on public.warehouses
  for update to authenticated using (get_my_role() in ('warehouse_manager','admin'));
create policy "warehouses delete" on public.warehouses
  for delete to authenticated using (get_my_role() in ('warehouse_manager','admin'));

-- Inventory + movements: warehouse managers/admins write, all read.
create policy "inventory read" on public.inventory_items
  for select to authenticated using (true);
create policy "inventory write" on public.inventory_items
  for insert to authenticated with check (get_my_role() in ('warehouse_manager','admin'));
create policy "inventory update" on public.inventory_items
  for update to authenticated using (get_my_role() in ('warehouse_manager','admin'));
create policy "inventory delete" on public.inventory_items
  for delete to authenticated using (get_my_role() in ('warehouse_manager','admin'));

create policy "movements read" on public.stock_movements
  for select to authenticated using (true);
create policy "movements write" on public.stock_movements
  for insert to authenticated with check (get_my_role() in ('warehouse_manager','admin'));

-- Orders: buyers create their own; parties involved can read; status updates
-- restricted to the buyer, the farmer, an assigned transporter, or an admin.
create policy "orders read" on public.orders
  for select to authenticated using (true);
create policy "orders insert" on public.orders
  for insert to authenticated with check (buyer_id = auth.uid());
create policy "orders update" on public.orders
  for update to authenticated using (
    buyer_id = auth.uid()
    or farmer_id = auth.uid()
    or get_my_role() in ('transporter','admin')
  );

-- Deliveries: created by scheduling (warehouse/admin); only the assigned
-- transporter (or an admin) advances status.
create policy "deliveries read" on public.deliveries
  for select to authenticated using (true);
create policy "deliveries insert" on public.deliveries
  for insert to authenticated with check (get_my_role() in ('warehouse_manager','admin'));
create policy "deliveries update" on public.deliveries
  for update to authenticated using (
    transporter_id = auth.uid() or get_my_role() = 'admin'
  );

-- Notifications: private to the recipient; anyone signed in can create one
-- for another user (rule-based notifications fired from server actions).
create policy "notifications read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications insert" on public.notifications
  for insert to authenticated with check (true);
create policy "notifications update own" on public.notifications
  for update to authenticated using (user_id = auth.uid());
create policy "notifications delete own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Seed: three demo warehouses (Lagos, Ibadan, Abuja)
-- ---------------------------------------------------------------------------
insert into public.warehouses (name, location, lat, lng, capacity) values
  ('Lagos Central Warehouse', 'Ikeja, Lagos', 6.6018, 3.3515, 50000),
  ('Ibadan Storage Hub', 'Ibadan, Oyo', 7.3775, 3.9470, 30000),
  ('Abuja Distribution Center', 'Garki, Abuja', 9.0579, 7.4951, 40000);
