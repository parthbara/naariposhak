# Nari Poshak

Production-ready Vite + React frontend and admin panel for Nari Poshak.

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add your Supabase project URL and anon key.

## Build

```bash
npm run build
```

The Netlify-ready output is generated in `dist`.

## Supabase

Run the SQL in `supabase-schema.sql` inside the Supabase SQL editor once, then plug the keys into `.env`. After that, stock upload with photo carousels, product ledger updates, customer checkout with payment proof uploads, and order ticket management all happen inside the website.

Public contact details used in the site:

- WhatsApp: `+977-9709611771`
- Address: `Boudha, Kathmandu, Nepal`
- Instagram: `nari_poshak2022`
- Facebook: `nari_poshak2022`
- PAN: `620357353`

Checkout QR placeholders live in `src/data/paymentOptions.js`. Replace the placeholder account text and image data there when the real payment QR images are ready.

Initial superadmin:

- Email: `naariposhak@admin.com`
- Password: `naariposhakadmin123`

Create this user in Supabase Auth manually, then ensure the same email exists in `admin_users` with the `superadmin` role. Do not commit real production passwords beyond this initial local setup note.
