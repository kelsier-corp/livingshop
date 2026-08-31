# Decisions

Why things are built the way they are. Each entry is a decision + the reasoning behind it, so it doesn't have to be re-derived (or re-litigated) by whoever reads the code next. Grouped by theme, not strictly chronological. See `ARCHITECTURE.md` for how these decisions show up in the code, and `DISENO.md` for the original product framing.

## Data model

**PostgreSQL, not MongoDB, despite the "MERN" starting point.** The catalog's variable attribute sets per product type look like a document-store problem, but the rest of the domain — payments/balances, roles, and the reporting the client wants (cost control, weekly/monthly/annual reports) — is relational aggregation (`SUM`, `GROUP BY`, joins across orders/production/customers). A single JSONB column (`OrderItem.attributes`) gives the flexibility where it's actually needed without giving up relational integrity everywhere else. Revisit only if the attribute schema needs to become far more dynamic than "a flat list of typed fields."

**Order item price is snapshotted at creation, never looked up live.** `OrderService.buildCreateData` copies `ProductType.basePrice` into `OrderItem.unitPrice`/`totalPrice` once. This was an explicit requirement: if a product's price changes after a sale, the existing order must keep showing the price the customer actually paid. The individual-edit and percentage-increase price endpoints only ever touch `ProductType.basePrice`, never past orders.

**`deliveryDate` belongs to `OrderItem`, not `Order`.** Some products in the same order ship immediately (e.g. decorative items in stock), others are made to order weeks later. Modeling one delivery date per order would have forced a lossy workaround. The order form still offers a "same date for all items" convenience toggle purely as UI sugar over per-item dates.

**`ProductType` ↔ `ProductCategory` is many-to-many and optional.** A product can belong to zero, one, or several categories, and there is no single `categoryId` column, because real catalog data includes products that legitimately fit more than one grouping (e.g. a chester that's both a "sofa" and an "armchair" line) and products that don't need a category at all. Anything filtering or displaying by category must treat "no category" and "several categories" as normal, not edge cases.

**Production stages are a fixed enum, not configurable per product type.** The factory pipeline (fabric → frame → foam → cutting → upholstery → ready) is the same checklist for every product. Making it configurable per product type isn't worth the modeling cost unless a product type actually needs a different sequence of stages.

**The technical sketch/croquis belongs to `ProductType`, not to each order's item.** The same product gets sold repeatedly, and re-uploading an identical sketch on every sale is pure manual overhead — so `ProductType.sketchUrl`/`sketchFileName` hold one image per product, managed once from the product's own edit form and reused automatically by every order that includes it. An `OrderItem`'s own `Attachment`s are reference photos only (`type: "reference_photo"`) — evidence specific to that particular sale (the fabric that actually arrived, a custom detail the customer asked for), not the product's design. The `sketch` attachment type still exists in the Postgres enum for historical rows, but the API no longer accepts it.

**Every image upload (product sketches, order-item reference photos) is restricted to JPG/PNG — never WEBP.** Both kinds of images can end up embedded in a printed PDF via `@react-pdf/renderer`, which only decodes JPEG/PNG. Allowing WEBP would let a file upload succeed in the browser and then silently fail to render (or render blank) the moment someone prints the factory sheet.

**`Order` API responses always include a `customerFullName`, joined from the customer relation rather than stored as a column.** List and detail views can show who placed an order without a second round-trip just to resolve one name.

## Scope (v1)

**Single-tenant.** This system is built for Livingshop specifically, not as a multi-client product. No tenant isolation exists anywhere in the schema or auth.

**No real authentication.** A mock user switcher sends an `x-user-id` header resolved against 3 seeded users (one per role), which is enough to model role-based behavior (pricing and payments hidden from the `factory` role, etc.) without building real auth before the workflow itself is validated. Real auth is a known gap to close before this goes anywhere near production, not an oversight.

**External suppliers are out of scope.** The legacy sales spreadsheet tracks goods Livingshop resells but doesn't manufacture (rugs, imported pieces, third-party workshops). That whole flow — supplier field, "order placed" checkbox, invoicing details — was explicitly excluded from v1 to keep the model focused on in-house manufacturing.

**Croquis/sketches are uploaded files, not generated drawings.** Auto-generating the technical sketch from a product's attributes (measurements, orientation, arm type) would need a real drawing engine and was pushed to a possible future phase. v1 just lets the salesperson/designer attach an image file, with an instant client-side preview while it uploads.

**Only the current factory-sheet version is kept — no version history.** The legacy paper process re-prints the technical sheet on every change and trusts the newest print date; v1 mirrors that. `Order.printedAt` just gets bumped whenever the factory sheet is (re)generated, and the UI and the printed sheet both show date _and_ time (not just the date), since a sheet reprinted twice in one day needs to be tellable apart. There's no snapshot table of past versions — full version history isn't worth the added complexity for v1.

**Google Sheets export is deferred; PDF is the only export format in v1.** The production and sales boards replace the old Google Sheets, but export from them today is PDF-only (matching the printable paper workflows already in place). Sheets export needs a Google service account / OAuth decision that hasn't been made yet.

**No concurrency handling.** Orders are registered one at a time by a small team, with plenty of time between them — there's no realistic concurrent-write scenario. Read-then-write patterns (status guards, item-count checks, etc.) aren't hardened against races on purpose. Concretely, `OrderService.setItemActive` checks the order's status and its remaining item count before flipping the flag, without a lock or a transaction, so two simultaneous removals could in theory leave an order with zero active items; the repository likewise writes in two non-atomic steps in places. These are known and accepted, not oversights — a reviewer running into one of these patterns should read it as deliberate rather than as a bug to fix.

## Frontend

**Shared `DataTable` / `Modal` / `CategorySelector` components instead of ad hoc `<table>`s and inline forms.** Every list/form page is built from the same small set of primitives — `DataTable`, `Modal`, `CategorySelector` (plus `CategoryFilterSelect` for a single-value category filter and `CatalogValueSelect` for searching an attribute catalog's values) — so column widths line up and every edit opens in a focused modal, consistently across pages, without each page reinventing its own table or form chrome.

**Every list backed by data that scales with business activity uses server-mode pagination — no `findMany` without `skip`/`take`.** `DataTable`'s client mode (fetch everything, page through it in the browser) is indistinguishable from real pagination at seed-data scale but means every page load joins/serializes the _entire_ table once real data accumulates — orders, customers, sales, and the production board all page at the database query (`skip`/`take` + `count()` in the repository). Search inputs debounce (`useDebouncedValue`) so the added server round-trip doesn't fire on every keystroke, and sorting the orders list follows the same rule (see Infrastructure below on why "sort by delivery date" needs a raw query). `DataTable`'s client mode is reserved for genuinely small, non-scaling lists (e.g. attribute catalog values). PDF generation is the one deliberate exception — a printed sheet needs the complete matching data set in one document, so `OrderRepository` exposes separate unbounded methods (`listAllItemsWithContext`, `listAllSalesRows`) just for that, instead of forcing the interactive list to load everything too.

**`CustomerPicker` searches the server (debounced) instead of filtering a fully-loaded customer list.** It calls the paginated `GET /customers?search=...` endpoint itself, the same way `OrderDetailPage` fetches a single customer by id (`GET /customers/:id`) instead of loading everyone to find one — customer count scales with order volume, so anything that loads "all customers" client-side doesn't hold up.

**The `QueryClient`'s default retry policy skips 4xx errors.** A bad request or a failed validation will fail identically on a retry, so retrying it three times with exponential backoff only makes the UI look stuck "loading" for several seconds after what is actually an instant, correct rejection. Only potentially transient failures (network errors, 5xx) get retried.

**A distinctive visual identity instead of default Tailwind grays.** The UI uses a warm, workshop-appropriate palette (paper/ink/bottle-green/rust) and a Fraunces + IBM Plex Sans/Mono type pairing, following the `frontend-design` skill's guidance to avoid the generic-AI-tool look for a client-facing tool.

**Path aliases (`@domain/*`, `@application/*`, ... in the API; `@/*` in the web app) instead of relative imports.** Deep relative imports (`../../../domain/...`) get hard to follow as the tree grows. `tsconfig-paths` (dev/seed runtime) + `tsc-alias` (build) resolve them in the API; Vite's `resolve.alias` + `tsconfig.app.json` in the web app.

## Code language

**All code is English-only; Spanish is reserved for product-facing text and conversational replies.** See root `CLAUDE.md`: identifiers, schema, comments, commit messages → English, always. UI copy, PDF content, `DISENO.md`, and chat replies → Spanish, because the business and its staff are Spanish-speaking.

## Infrastructure

**Prisma pinned to `6.x`, not the newer `7.x`.** Prisma 7 moved the datasource URL out of `schema.prisma` and into a separate `prisma.config.ts` + client-constructor adapter, breaking the conventional, well-documented schema format. For a small team maintaining this, the stable/well-trodden major version was chosen over the newest one.

**TypeScript pinned to `5.9.x` in both apps**, even though newer majors were available at scaffold time, to avoid unknown compatibility issues with `ts-node-dev` and Vite's toolchain rather than debug bleeding-edge tooling issues on a business-critical MVP.

**PDF generation uses `@react-pdf/renderer`, not a headless-browser HTML-to-PDF approach.** It renders PDFs natively in Node without bundling Chromium, keeping the API's Docker image small and avoiding headless-browser flakiness in a containerized environment — at the cost of writing layouts with `@react-pdf/renderer`'s own primitives instead of plain HTML/CSS.

**Sorting the orders list by delivery date runs a raw SQL query instead of Prisma's `orderBy`.** "Delivery date" for an order is the earliest `deliveryDate` across that order's items — a `MIN` aggregate over a to-many relation — and Prisma's query builder only supports ordering a parent list by a relation aggregate for `_count`, not `_min`/`_max`. `PrismaOrderRepository` runs a parameterized raw query to get the sorted, paged order ids, then loads the full `Order` objects through the normal Prisma API and reapplies that order, since `findMany({ where: { id: { in: [...] } } })` doesn't preserve the input array's order.

**Generated PDFs get a descriptive filename and are served as `attachment`, not `inline`.** The filename encodes the document type, order number, customer, and date (plus time for the factory sheet, since it can be reprinted the same day) instead of a generic name like `factory-sheet.pdf`. `inline` would let the PDF render in the browser tab, but browsers largely ignore an `inline` disposition's filename hint once the user actually saves the file from the viewer's own controls — they fall back to the URL's last path segment (`sheet.pdf`). `attachment` is the only disposition that reliably keeps the generated name on disk, at the cost of downloading immediately instead of previewing in the tab first.

**Hosting stays on DigitalOcean.** The client already pays for and knows DigitalOcean from the legacy system. Recommendation is a Droplet (or App Platform) for the app, DigitalOcean Managed PostgreSQL for the database, and DigitalOcean Spaces for uploaded attachments/PDFs — reusing an existing vendor relationship rather than introducing a new one without a concrete reason to.

**Everything runs through Docker Compose**, including local development (`docker compose up --build` starts Postgres + both apps with hot reload). This was an explicit standing requirement — the project should always be dockerizable, not just deployable.
