import { describe, expect, it } from "vitest";
import { OrderItem } from "../entities/Order";
import { OrderItemWithContext } from "../entities/Production";
import { toFactoryProductionItemView } from "./factoryView";

function buildItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-1",
    orderId: "order-1",
    productTypeId: "product-1",
    productTypeSketchUrl: null,
    productTypeIncludeInFactorySheet: true,
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
    deliveryDate: new Date("2026-02-01"),
    attributes: {},
    factoryNotes: null,
    active: true,
    attachments: [],
    productionStages: [],
    ...overrides,
  };
}

function buildItemWithContext(overrides: Partial<OrderItemWithContext> = {}): OrderItemWithContext {
  return {
    ...buildItem(),
    orderNumber: 1,
    orderDate: new Date("2026-01-01"),
    orderStatus: "draft",
    customerFullName: "Ana Test",
    ...overrides,
  };
}

describe("toFactoryProductionItemView", () => {
  it("strips unitPrice and totalPrice", () => {
    const view = toFactoryProductionItemView(buildItemWithContext());
    expect(view).not.toHaveProperty("unitPrice");
    expect(view).not.toHaveProperty("totalPrice");
  });

  it("keeps the production-board context fields (order number, status, customer)", () => {
    const view = toFactoryProductionItemView(
      buildItemWithContext({ orderNumber: 42, orderStatus: "in_production" })
    );
    expect(view).toMatchObject({
      orderNumber: 42,
      orderStatus: "in_production",
      customerFullName: "Ana Test",
    });
  });
});
