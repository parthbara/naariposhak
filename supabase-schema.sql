-- ============================================================================
-- NARI POSHAK — FINAL SUPABASE SCHEMA
-- ============================================================================
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Prerequisites:
--   1. Enable Email/Password Auth in Authentication → Providers
--   2. Create an Auth user first:
--        Email:    naariposhak@admin.com
--        Password: naariposhakadmin123
--      (Do this in Authentication → Users → Add User BEFORE running this SQL)
-- ============================================================================


-- ─── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. admin_users ─────────────────────────────────────────────────────────
-- Stores which auth emails have admin access.
-- Referenced by: Login.jsx, ProtectedRoute.jsx, is_admin() function
create table if not exists public.admin_users (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  role       text        not null check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);


-- ─── 2. products ────────────────────────────────────────────────────────────
-- Product catalogue. 
-- Referenced by: Shop.jsx, Home.jsx, ProductDetail.jsx, Checkout.jsx,
--   ChatAssistant.jsx, AdminStock.jsx, AdminLedger.jsx, AdminDashboard.jsx
create table if not exists public.products (
  id          uuid           primary key default gen_random_uuid(),
  title       text           not null,
  category    text           not null check (category in ('kurta', 'saree')),
  price       numeric(10,2)  not null check (price >= 0),
  description text           not null,
  stock_count integer        not null default 0 check (stock_count >= 0),
  image_url   text,
  image_urls  text[]         not null default '{}',
  ai_extra_info text         default '',
  created_at  timestamptz    not null default now()
);

-- Ensure columns exist if table was created in an older migration
alter table public.products add column if not exists image_urls text[] not null default '{}';
alter table public.products add column if not exists ai_extra_info text default '';


-- ─── 3. orders ──────────────────────────────────────────────────────────────
-- Guest checkout orders (no auth required for customers).
-- Referenced by: Checkout.jsx, AdminOrders.jsx, AdminDashboard.jsx,
--   AdminCustomers.jsx
create table if not exists public.orders (
  id                 uuid           primary key default gen_random_uuid(),
  customer_id        uuid           references auth.users(id) on delete set null,
  customer_name      text           not null,
  customer_phone     text,
  customer_email     text,
  customer_address   text,
  product_id         uuid           references public.products(id) on delete set null,
  product_title      text,
  item               text           not null,
  quantity           integer        not null default 1 check (quantity > 0),
  total_amount       numeric(10,2)  default 0 check (total_amount >= 0),
  payment_method     text,
  payment_proof_path text,
  notes              text,
  admin_notes        text,
  status             text           not null default 'pending',
  created_at         timestamptz    not null default now()
);

-- Ensure columns exist if table was created in an older migration
alter table public.orders add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_address text;
alter table public.orders add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.orders add column if not exists product_title text;
alter table public.orders add column if not exists quantity integer not null default 1;
alter table public.orders add column if not exists total_amount numeric(10,2) default 0;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_proof_path text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists admin_notes text;

-- Re-apply status constraint to include all statuses used in the app
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending','called','confirmed','in_progress','ready','completed','cancelled'));


-- ─── 4. site_settings ───────────────────────────────────────────────────────
-- Key-value JSONB store for dynamic site configuration.
-- Referenced by: useSiteSettings.js, AdminSettings.jsx
-- Keys used: payment_options, contact_info, announcement, site_meta,
--            ai_config, landing_page
create table if not exists public.site_settings (
  key        text        primary key,
  value      jsonb       not null default '{}',
  updated_at timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════

-- Product images — public (anyone can view)
insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
  on conflict (id) do update set public = true;

-- Payment proof screenshots — private (admin + uploader only)
insert into storage.buckets (id, name, public)
  values ('payment-proofs', 'payment-proofs', false)
  on conflict (id) do update set public = false;

-- Site assets (QR codes, hero images, etc.) — public
insert into storage.buckets (id, name, public)
  values ('site-assets', 'site-assets', true)
  on conflict (id) do update set public = true;


-- ═══════════════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.admin_users    enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.site_settings  enable row level security;


-- ═══════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTION: is_admin()
-- ═══════════════════════════════════════════════════════════════════════════
-- Returns true if the currently authenticated user's email is in admin_users.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — admin_users
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "Admins can read their admin profile" on public.admin_users;
create policy "Admins can read their admin profile"
  on public.admin_users for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — products
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone (including unauthenticated visitors) can browse products
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Only admins can create/edit/delete products
drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — orders
-- ═══════════════════════════════════════════════════════════════════════════

-- *** GUEST CHECKOUT: anon users can place orders (no login required) ***
drop policy if exists "Anyone can place guest orders" on public.orders;
create policy "Anyone can place guest orders"
  on public.orders for insert
  to anon, authenticated
  with check (status = 'pending');

-- Authenticated customers can also read their own orders (if they logged in)
drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders for select
  to authenticated
  using (customer_id = auth.uid());

-- Admins can do everything with orders
drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- Remove old policy that required customer_id = auth.uid() (blocked guest checkout)
drop policy if exists "Customers can create order requests" on public.orders;


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — site_settings
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone can read settings (used by the public site for footer, announcements, etc.)
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

-- Only admins can create/update/delete settings
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — Storage: product-images
-- ═══════════════════════════════════════════════════════════════════════════

-- Admins can upload/update/delete product images
drop policy if exists "Admins can manage product images" on storage.objects;
create policy "Admins can manage product images"
  on storage.objects for all
  to authenticated
  using  (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

-- Anyone can view product images (public bucket)
drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — Storage: payment-proofs
-- ═══════════════════════════════════════════════════════════════════════════

-- *** GUEST UPLOAD: anon users can upload payment proof screenshots ***
-- The checkout flow uploads to `guest/<orderId>.<ext>` path
drop policy if exists "Customers can upload payment proofs" on storage.objects;
drop policy if exists "Anyone can upload payment proofs" on storage.objects;
create policy "Anyone can upload payment proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

-- Admins can view all payment proofs (to verify orders)
drop policy if exists "Admins can read payment proofs" on storage.objects;
create policy "Admins can read payment proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Remove old authenticated-only policies
drop policy if exists "Customers can read their payment proofs" on storage.objects;


-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES — Storage: site-assets
-- ═══════════════════════════════════════════════════════════════════════════

-- Admins can upload/update/delete site assets (QR codes, hero images)
drop policy if exists "Admins can manage site assets" on storage.objects;
create policy "Admins can manage site assets"
  on storage.objects for all
  to authenticated
  using  (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

-- Anyone can view site assets (public bucket)
drop policy if exists "Public can view site assets" on storage.objects;
create policy "Public can view site assets"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-assets');


-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Bootstrap superadmin ───────────────────────────────────────────────────
-- IMPORTANT: You must first create the Auth user with this email in the
-- Supabase Dashboard (Authentication → Users → Add User):
--   Email:    naariposhak@admin.com
--   Password: naariposhakadmin123
insert into public.admin_users (email, role)
  values ('naariposhak@admin.com', 'superadmin')
  on conflict (email) do update set role = 'superadmin';


-- ─── Default site settings ──────────────────────────────────────────────────
insert into public.site_settings (key, value) values
  ('payment_options', '[]'::jsonb),
  ('contact_info',    '{
    "shopName": "Nari Poshak",
    "phone": "+977-9709611771",
    "whatsapp": "9779709611771",
    "address": "Boudha, Kathmandu, Nepal",
    "instagram": "nari_poshak2022",
    "facebook": "nari_poshak2022",
    "pan": "620357353",
    "category": "Ethnic and casual wears",
    "delivery": "Delivery all over Nepal"
  }'::jsonb),
  ('announcement',    '{"enabled": false, "text": "", "color": "#8A1C2A"}'::jsonb),
  ('site_meta',       '{
    "title": "Nari Poshak | Kurtas, Sarees & Tailoring",
    "description": "Elegant women''s wear — kurtas, sarees, and complete styling from Boudha, Kathmandu."
  }'::jsonb),
  ('ai_config',       '{"enabled": true, "model": "gemini-2.5-flash"}'::jsonb),
  ('landing_page',    '{
    "heroSubtitle": "Kurtas, sarees & complete women''s wear",
    "heroTitle": "Nari Poshak",
    "heroDescription": "Sophisticated women''s wear with elegant cuts, thoughtful fabric selection, and ready garments for everyday confidence and special moments.",
    "heroImages": [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1610189012035-7e3fcbdaeb1a?auto=format&fit=crop&w=900&q=85"
    ],
    "rudrakshyaAdEnabled": true
  }'::jsonb)
on conflict (key) do nothing;


-- ═══════════════════════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════════════════════
-- After running this SQL:
--   1. Add GEMINI_API_KEY to your .env file (for local dev)
--   2. Add GEMINI_API_KEY to Netlify Environment Variables (for production)
--   3. Optionally seed demo products via Admin → Stock → "Seed Demo Stock"
--   4. Set up payment QR codes in Admin → Settings → Payment Methods
-- ═══════════════════════════════════════════════════════════════════════════
