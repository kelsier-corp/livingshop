# Livingshop

Orders, factory production tracking and sales for Livingshop's custom furniture workshop.

See [`docs/DISENO.md`](docs/DISENO.md) for the product/design write-up (in Spanish, as written with the client).

## Stack

- **API**: Node + Express + TypeScript, layered as domain / application / infrastructure / presentation (Prisma repositories, `@react-pdf/renderer` for PDF generation).
- **Database**: PostgreSQL via Prisma, with JSONB columns for the per-product-type dynamic attributes.
- **Web**: React + Vite + TypeScript + Tailwind, TanStack Query, React Router.
- **Auth**: none yet — a mock user switcher (admin / sales / factory) sends an `x-user-id` header the API resolves against 3 seeded users. See open items in `docs/DISENO.md`.

## Run locally with Docker (recommended)

```bash
docker compose up --build
```

This starts Postgres, runs migrations + seeds 3 mock users and demo data, and starts both the API (port 4000) and the web app (port 5173) with hot reload.

Open http://localhost:5173.

## Run without Docker

Requires Node 20+ and a local Postgres instance.

```bash
# API
cd apps/api
cp .env.example .env   # adjust DATABASE_URL if needed
npm install
npm run prisma:migrate
npm run seed
npm run dev             # http://localhost:4000

# Web (in another terminal)
cd apps/web
npm install
npm run dev              # http://localhost:5173
```

## Seeded users

The seed script creates one user per role — switch between them from the dropdown in the top bar:

- `admin@livingshop.test` — manages the product/attribute catalog, sees everything.
- `sales@livingshop.test` — creates orders, customers, payments.
- `factory@livingshop.test` — sees factory sheets and the production board only, no prices.
