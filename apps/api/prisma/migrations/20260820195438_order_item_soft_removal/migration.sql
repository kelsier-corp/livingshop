-- Taking a product off an order is a soft removal (active = false), never a DELETE: the row holds
-- the unitPrice/totalPrice snapshot taken at order-creation time, which sales reporting still
-- needs. Existing rows default to true, so every item already on an order stays visible.
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;
