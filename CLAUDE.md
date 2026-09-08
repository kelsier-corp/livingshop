# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Livingshop: orders, factory production tracking and sales for a custom furniture workshop. Monorepo with `apps/api` (Node/Express/TypeScript + PostgreSQL via Prisma) and `apps/web` (React/Vite/TypeScript). See `docs/DISENO.md` for the product/business write-up (in Spanish — that file and conversational replies are the only place Spanish belongs; see Conventions below) and `docs/ARCHITECTURE.md` / `docs/DECISIONS.md` for deeper technical context.

## Commands

Run everything via Docker (applies migrations, seeds demo data, starts both apps with hot reload):

```bash
docker compose up --build          # api on :4000, web on :5173, postgres on :5432
```

Without Docker (Node 20+, local Postgres):

```bash
cd apps/api && cp .env.example .env && npm install
npm run prisma:migrate             # apply schema, creates a migration if needed
npm run seed                       # seed 3 mock users + demo catalog/orders
npm run dev                        # http://localhost:4000

cd apps/web && npm install
npm run dev                        # http://localhost:5173
```

Other useful commands:

- `apps/api`: `npm run build` (tsc + tsc-alias), `npm run prisma:generate`, `npm run prisma:deploy` (prod migrate), `npx prisma studio`.
- `apps/web`: `npm run build` (tsc -b + vite build), `npm run lint` (oxlint).
- There is no test suite in either app yet.
- Package manager is **npm only** (no yarn/pnpm) in both apps.

Resetting the local database is destructive — confirm with the user before running `prisma migrate reset`.

## Architecture

### API (`apps/api/src`) — clean architecture, 4 layers

- `domain/` — entities, repository _interfaces_ (ports), domain errors, and pure policies (`domain/policies/orderTotals.ts`, `domain/policies/factoryView.ts`). No framework code here.
- `application/` — one `*Service` per module (`application/orders/OrderService.ts`, etc.) orchestrating domain logic against repository interfaces. This is where business validation lives (e.g. required-attribute checks, percentage-increase bounds).
- `infrastructure/` — concrete adapters: `infrastructure/repositories/Prisma*Repository.ts` implement the domain repository interfaces, `infrastructure/pdf/` renders the 4 PDF documents with `@react-pdf/renderer`, `infrastructure/storage/LocalFileStorage.ts` handles attachment uploads.
- `presentation/http/` — Express controllers, validators (Zod), routes, and middlewares. `presentation/http/middlewares/currentUser.ts` + `requireRole.ts` implement the mock-auth/role-gating described below.
- `src/app.ts` is the composition root: it manually wires every repository → service → controller → router. There is no DI container — new modules follow this same wiring pattern.

Path aliases (`@domain/*`, `@application/*`, `@infrastructure/*`, `@presentation/*`, `@config/*` → `src/<layer>/*`) are configured in `tsconfig.json` and resolved at runtime via `tsconfig-paths/register` (dev/seed) and at build time via `tsc-alias` (see `package.json` scripts). Use them for any cross-layer import; same-layer imports stay relative.

### Data model

Postgres via Prisma (`apps/api/prisma/schema.prisma`). Notable shapes:

- `ProductType` has a `basePrice`, a **many-to-many** relation to `ProductCategory` (a product's categories are optional and can be several — there is no single `categoryId`), and its own `sketchUrl`/`sketchFileName` (the technical sketch/croquis is reused across every order for that product, not re-uploaded per sale).
- `OrderItem` snapshots `unitPrice`/`totalPrice` from the product's price _at order-creation time_ — changing a product's price later never changes existing orders (see `application/orders/OrderService.ts#buildCreateData`). Its `Attachment`s are reference photos only (`type: "reference_photo"`) — the sketch lives on `ProductType`, not here. Every image upload (sketches and reference photos) is restricted to JPG/PNG, since both can end up embedded in a PDF and `@react-pdf/renderer` doesn't decode WEBP.
- `Order` API responses include a `customerFullName` (joined from the `customer` relation, not a stored column) so list/detail views never need a second lookup just to show a name.
- Each `OrderItem` carries its own `deliveryDate` (not the `Order`) and a free-form `attributes` JSON column, since attribute sets vary per product type (`AttributeDefinition` rows define the schema per `ProductType`, optionally backed by a shared `AttributeCatalog`/`AttributeCatalogValue` for dropdown-style values).
- `ProductionStageStatus` tracks the fixed factory pipeline (fabric → frame → foam → cutting → upholstery → ready) per `OrderItem`.
- **Any list that scales with business activity is paginated server-side** — `{ items, total, page, pageSize }` from a real `skip`/`take` + `count()` in the repository, not a `findMany` fetch-everything filtered client-side. This covers `orders`, `customers`, `sales`, and `production/board` (the last one also only returns `draft`/`in_production` orders). `product-types` and `product-categories` also support it, plus expose an unpaginated `/all` route for picker/autocomplete components — safe only because that catalog data is small and doesn't grow with order volume. `GET /orders` additionally supports `sortBy`/`sortDirection` (`number`, `date`, or `deliveryDate` — the last one runs a raw SQL query, since Prisma can't order by a `MIN` aggregate over a to-many relation). See `docs/ARCHITECTURE.md`'s "Pagination shape" section before adding a new list endpoint.

### Mock auth / roles

There is no real authentication yet. The frontend sends an `x-user-id` header (one of 3 seeded users: `admin`/`sales`/`factory`); `currentUserMiddleware` resolves it and `requireRole(...)` gates routes per-module. `factory` can read a full order (pricing and payments included, same shape as `admin`/`sales`) but can't write to one except its status — `requireRole` on each route is what enforces that, not any response-shaping. The one place pricing still gets stripped for `factory` is the production board (`domain/policies/factoryView.ts#toFactoryProductionItemView`), not the order views.

### Web (`apps/web/src`)

- `api/` — one file per resource (`orders.ts`, `productTypes.ts`, ...) wrapping `api/client.ts`'s `apiFetch`/`apiGet`/etc. helpers, which attach the mock `x-user-id` header from `api/currentUserStore.ts`. Paginated list calls take `{ page, pageSize, ...filters }` and use `toQueryString` from `client.ts`.
- `auth/CurrentUserContext.tsx` + `routeRoles.ts` + `homeRoute.ts` — the mock "session" (who's selected in the header dropdown) and per-route role gating (`RequireRole`); every route's allowed roles are declared once in `routeRoles.ts`.
- `components/` — shared primitives used across every list/form page: `DataTable` (fixed-width columns, server-mode pagination by default — client-mode only for small non-scaling lists; columns can be made sortable via `sortKey` + a `sort` prop), `Modal` (all create/edit forms open in a modal, never inline), `CategorySelector` (searchable multi-select with a "top N by product count" default and a select-all) and its single-select sibling `CategoryFilterSelect`, `CatalogValueSelect` (search-to-pick combobox for an attribute catalog's values, used instead of a native `<select>` once a catalog can have 100+ values), `CustomerPicker` (debounced server-side search — see `useDebouncedValue`) / `ProductTypePicker` (client-side filter over the small unpaginated product catalog, no inline create), `FileInput` (a `<input type="file">` styled via Tailwind's `file:` variant so it reads as a real button). `main.tsx`'s `QueryClient` skips retrying 4xx errors — they fail identically on retry, so retrying just delayed the "this is invalid" result.
- `pages/` — one page per route; product categories have their own tab/table (`ProductCategoriesTab.tsx`) reused from `ProductTypesPage.tsx`.
- Path alias `@/*` → `src/*` (Vite `resolve.alias` + `tsconfig.app.json`).

### PDF generation

Four documents are generated server-side with `@react-pdf/renderer` from `infrastructure/pdf/templates/`: the customer order sheet, the factory technical sheet (includes each item's product sketch and reference photos; order number is the large/prominent header element, customer name is secondary, and print date/delivery date use a bolder, larger style than other metadata), the production sheet, and the sales sheet. The production/sales sheets pull from `OrderRepository`'s unbounded `listAll*` methods (a printed sheet needs the full data set, unlike the paginated UI lists) — see `docs/ARCHITECTURE.md`. Each document gets a descriptive filename (`application/pdf/fileName.ts`) and is served with `Content-Disposition: attachment` rather than `inline`, since browsers ignore an `inline` filename hint once the user saves from the viewer's own controls. All copy in these documents (and in the web UI) is in Spanish — see Conventions.

### Sales XLSX export

`GET /api/sales/sheet.xlsx` generates a weekly sales spreadsheet with `exceljs`, meant to be pasted as-is into the staff's existing Google Sheets control sheet (not printed, unlike the PDFs above). It follows the same port/adapter shape as PDF generation: `application/sales/SalesExportRenderer.ts` is the interface, `infrastructure/xlsx/ExcelJsSalesExportRenderer.ts` the implementation, wired into `application/sales/SalesExportService.ts` alongside the same unbounded `listAllSalesRows()` the PDF sales sheet uses. Rows are flattened to one per order item (not one per order) and sorted by the Monday-Sunday ISO week of each item's own delivery date via `luxon` — `DateTime#startOf("week")`/`endOf("week")` are ISO (Monday-based) regardless of the runtime's locale, so this doesn't need any locale configuration. Several columns (`Proveedor`, `Pedido`, `Forma de pago`, `Comentarios`, `Tasas`, `Importe/Fecha de acreditación`) are intentionally left blank for staff to fill by hand — see issue #15/#16 — and `Datos de facturación`/`Tipo de` are serialized from `Customer`'s billing fields (`taxId`, `businessName`, `invoiceType`), falling back to the customer's full name when there's no `businessName` on file.

## Conventions

- **Code is English-only**: identifiers, DB table/column names, comments, commit messages, file names. Spanish is only for product copy visible to end users (UI text, PDF content) and for prose docs like `docs/DISENO.md` and conversational replies — never for anything structural.
- New backend module → mirror the existing layering: domain interface + entity, application service, Prisma repository implementation, controller/validator/route, then wire it in `app.ts`.
- New frontend list page → use `DataTable` with explicit column widths, `Modal` for create/edit, and add the route's allowed roles to `auth/routeRoles.ts`.
