-- Powers accent-insensitive search (see accentInsensitiveSearch.ts): unaccent(text) strips
-- diacritics so "gomez" matches "Gómez".
CREATE EXTENSION IF NOT EXISTS unaccent;

-- AlterTable
ALTER TABLE "product_types" ADD COLUMN     "includeInFactorySheet" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_name_key" ON "payment_methods"("name");

-- Attribute types are reduced from {text, number, catalog, color} to {text, catalog} — the order
-- form already rendered "number" and "color" attributes as plain text inputs, so this drops no
-- real behavior. Any existing rows using the removed values are converted to "text" first, since
-- Postgres won't let a column be retyped to an enum that's missing a value still in use.
UPDATE "attribute_definitions" SET "dataType" = 'text' WHERE "dataType" IN ('number', 'color');

BEGIN;
CREATE TYPE "AttributeDataType_new" AS ENUM ('text', 'catalog');
ALTER TABLE "attribute_definitions" ALTER COLUMN "dataType" TYPE "AttributeDataType_new" USING ("dataType"::text::"AttributeDataType_new");
ALTER TYPE "AttributeDataType" RENAME TO "AttributeDataType_old";
ALTER TYPE "AttributeDataType_new" RENAME TO "AttributeDataType";
DROP TYPE "AttributeDataType_old";
COMMIT;
