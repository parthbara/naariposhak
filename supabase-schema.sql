-- Nari Poshak Supabase setup
-- Run this in the Supabase SQL editor after enabling Email/Password Auth.

create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'superadmin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('kurta', 'saree')),
  price numeric(10, 2) not null check (price >= 0),
  description text not null,
  stock_count integer not null default 0 check (stock_count >= 0),
  image_url text,
  image_urls text[] not null default '{}',
  ai_extra_info text default '',
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists image_urls text[] not null default '{}';
alter table public.products add column if not exists ai_extra_info text default '';

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_address text,
  product_id uuid references public.products(id) on delete set null,
  product_title text,
  item text not null,
  quantity integer not null default 1 check (quantity > 0),
  total_amount numeric(10, 2) default 0 check (total_amount >= 0),
  payment_method text,
  payment_proof_path text,
  notes text,
  admin_notes text,
  status text not null default 'pending' check (status in ('pending', 'called', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_id uuid references auth.users(id) on delete set null;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_address text;
alter table public.orders add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.orders add column if not exists product_title text;
alter table public.orders add column if not exists quantity integer not null default 1 check (quantity > 0);
alter table public.orders add column if not exists total_amount numeric(10, 2) default 0 check (total_amount >= 0);
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_proof_path text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists admin_notes text;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
add constraint orders_status_check
check (status in ('pending', 'called', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled'));

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do update set public = false;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

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

drop policy if exists "Admins can read their admin profile" on public.admin_users;
create policy "Admins can read their admin profile"
on public.admin_users
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Customers can create order requests" on public.orders;
create policy "Customers can create order requests"
on public.orders
for insert
to authenticated
with check (status = 'pending' and customer_id = auth.uid());

drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
on public.orders
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage product images" on storage.objects;
create policy "Admins can manage product images"
on storage.objects
for all
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Customers can upload payment proofs" on storage.objects;
create policy "Customers can upload payment proofs"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Customers can read their payment proofs" on storage.objects;
create policy "Customers can read their payment proofs"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Admins can read payment proofs" on storage.objects;
create policy "Admins can read payment proofs"
on storage.objects
for select
to authenticated
using (bucket_id = 'payment-proofs' and public.is_admin());

-- Manual superadmin bootstrap:
-- 1. Create an Auth user in Supabase Dashboard:
--    email: naariposhak@admin.com
--    password: naariposhakadmin123
-- 2. Insert the same email here:
insert into public.admin_users (email, role)
values ('naariposhak@admin.com', 'superadmin')
on conflict (email) do update set role = 'superadmin';
