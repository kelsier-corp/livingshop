-- Rename "cancelled" to "voided" (its English-side name from now on; the UI label becomes
-- "Anulada"). A plain rename, no data conversion needed.
ALTER TYPE "OrderStatus" RENAME VALUE 'cancelled' TO 'voided';

-- Remove "confirmed": the draft/confirmed distinction is gone, orders are created straight into
-- draft and any role can move them to any remaining status. Existing "confirmed" orders fold back
-- into "draft" first, since that's the closer of the two removed states — nothing about them
-- implies factory work has actually started.
UPDATE "orders" SET "status" = 'draft' WHERE "status" = 'confirmed';

-- Prisma already runs this whole file in a single transaction, so no explicit BEGIN/COMMIT here.
-- The column's DEFAULT has to be dropped before its type can change, then re-added afterwards —
-- Postgres won't cast a column default across enum types on its own.
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "OrderStatus_new" AS ENUM ('draft', 'in_production', 'delivered', 'voided');
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'draft'::"OrderStatus";
DROP TYPE "OrderStatus_old";
