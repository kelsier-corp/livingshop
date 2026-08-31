import { describe, expect, it } from "vitest";
import { Order } from "../entities/Order";
import { computeOrderTotals } from "./orderTotals";

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
    items: [],
    payments: [],
    ...overrides,
  };
}

function buildItem(unitPrice: number, quantity: number) {
  return {
    id: "item-1",
    orderId: "order-1",
    productTypeId: "product-1",
    productTypeSketchUrl: null,
    productTypeIncludeInFactorySheet: true,
    quantity,
    unitPrice,
    totalPrice: unitPrice * quantity,
    deliveryDate: new Date("2026-02-01"),
    attributes: {},
    factoryNotes: null,
    active: true,
    attachments: [],
    productionStages: [],
  };
}

function buildPayment(amount: number) {
  return {
    id: "payment-1",
    orderId: "order-1",
    date: new Date("2026-01-05"),
    amount,
    method: "Efectivo",
    feePct: null,
    note: null,
  };
}

describe("computeOrderTotals", () => {
  it("returns zero totals for an order with no items or payments", () => {
    const totals = computeOrderTotals(buildOrder());
    expect(totals).toEqual({ totalAmount: 0, amountPaid: 0, balance: 0 });
  });

  it("sums every item's totalPrice, ignoring quantity/unitPrice directly", () => {
    const order = buildOrder({ items: [buildItem(1000, 2), buildItem(500, 1)] });
    expect(computeOrderTotals(order).totalAmount).toBe(2500);
  });

  it("sums every payment's amount", () => {
    const order = buildOrder({ payments: [buildPayment(1000), buildPayment(250)] });
    expect(computeOrderTotals(order).amountPaid).toBe(1250);
  });

  it("computes balance as totalAmount minus amountPaid, which can go negative on overpayment", () => {
    const order = buildOrder({ items: [buildItem(1000, 1)], payments: [buildPayment(1500)] });
    expect(computeOrderTotals(order).balance).toBe(-500);
  });
});
