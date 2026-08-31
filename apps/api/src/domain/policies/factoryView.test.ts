import { describe, expect, it } from "vitest";
import { Order, OrderItem } from "../entities/Order";
import { OrderItemWithContext } from "../entities/Production";
import { toFactoryOrderView, toFactoryProductionItemView } from "./factoryView";

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

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    number: 1,
    date: new Date("2026-01-01"),
    printedAt: null,
    customerId: "customer-1",
    customerFullName: "Ana Test",
    salespersonId: "user-1",
    status: "draft",
    notes: null,
    items: [buildItem()],
    payments: [
      {
        id: "payment-1",
        orderId: "order-1",
        date: new Date("2026-01-05"),
        amount: 500,
        method: "Efectivo",
        feePct: null,
        note: null,
      },
    ],
    ...overrides,
  };
}

describe("toFactoryOrderView", () => {
  it("strips payments entirely, since factory users never see money", () => {
    const view = toFactoryOrderView(buildOrder());
    expect(view).not.toHaveProperty("payments");
  });

  it("strips unitPrice and totalPrice from every item", () => {
    const view = toFactoryOrderView(buildOrder());
    for (const item of view.items) {
      expect(item).not.toHaveProperty("unitPrice");
      expect(item).not.toHaveProperty("totalPrice");
    }
  });

  it("keeps every other item field intact", () => {
    const item = buildItem({ factoryNotes: "Reforzar patas" });
    const view = toFactoryOrderView(buildOrder({ items: [item] }));
    expect(view.items[0]).toMatchObject({
      id: item.id,
      productTypeId: item.productTypeId,
      quantity: item.quantity,
      factoryNotes: "Reforzar patas",
    });
  });
});

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
