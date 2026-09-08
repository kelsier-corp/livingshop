import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderService } from "@application/orders/OrderService";
import { Order, OrderItem } from "@domain/entities/Order";
import { UserRole } from "@domain/entities/enums";
import { OrdersController } from "./orders.controller";

function buildItem(): OrderItem {
  return {
    id: "item-1",
    orderId: "order-1",
    productTypeId: "11111111-1111-4111-8111-111111111111",
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
  };
}

function buildOrder(): Order {
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
  };
}

function buildRequest(role: UserRole, extra: Partial<Request> = {}): Request {
  return {
    currentUser: { id: "user-1", role },
    params: { id: "order-1", itemId: "item-1" },
    body: {},
    ...extra,
  } as unknown as Request;
}

function buildResponse() {
  const json = vi.fn();
  const res = { json, status: vi.fn(() => ({ json })) };
  return { res: res as unknown as Response, json };
}

const validItemBody = {
  productTypeId: "11111111-1111-4111-8111-111111111111",
  quantity: 1,
  deliveryDate: "2026-02-01",
  attributes: {},
};

// Factory can view full order detail (pricing and payments) now, same as admin/sales — the only
// thing that keeps factory from writing to an order is route-level requireRole(...) in
// orders.routes.ts, not any response-shaping in this controller. These tests just pin that every
// handler always includes totals/payments, regardless of who's asking.
describe("OrdersController — every handler returns the full order", () => {
  let orderService: OrderService;
  let controller: OrdersController;

  beforeEach(() => {
    orderService = {
      getById: vi.fn(async () => buildOrder()),
      addItem: vi.fn(async () => buildOrder()),
      setItemActive: vi.fn(async () => buildOrder()),
      updateItemAttributes: vi.fn(async () => buildOrder()),
      updateStatus: vi.fn(async () => buildOrder()),
    } as unknown as OrderService;
    controller = new OrdersController(orderService);
  });

  it.each(["admin", "sales", "factory"] as const)(
    "getById includes totals and payments for %s",
    async (role) => {
      const { res, json } = buildResponse();
      await controller.getById(buildRequest(role), res);

      const payload = json.mock.calls[0][0];
      expect(payload.totals).toBeDefined();
      expect(payload.payments).toBeDefined();
      expect(payload.items[0].unitPrice).toBe(1000);
    }
  );

  it.each(["admin", "sales", "factory"] as const)(
    "addItem includes totals and payments for %s",
    async (role) => {
      const { res, json } = buildResponse();
      await controller.addItem(buildRequest(role, { body: validItemBody }), res);

      const payload = json.mock.calls[0][0];
      expect(payload.totals).toBeDefined();
      expect(payload.payments).toBeDefined();
    }
  );

  it.each(["admin", "sales", "factory"] as const)(
    "setItemActive includes totals and payments for %s",
    async (role) => {
      const { res, json } = buildResponse();
      await controller.setItemActive(buildRequest(role, { body: { active: false } }), res);

      const payload = json.mock.calls[0][0];
      expect(payload.totals).toBeDefined();
      expect(payload.payments).toBeDefined();
    }
  );

  it("updateItemAttributes forwards attributes and factoryNotes, and includes totals", async () => {
    const { res, json } = buildResponse();
    await controller.updateItemAttributes(
      buildRequest("sales", { body: { attributes: { Tela: "Pana" }, factoryNotes: "Ojo" } }),
      res
    );

    expect(orderService.updateItemAttributes).toHaveBeenCalledWith("order-1", "item-1", {
      attributes: { Tela: "Pana" },
      factoryNotes: "Ojo",
    });
    const payload = json.mock.calls[0][0];
    expect(payload.totals).toBeDefined();
  });

  it("updateStatus includes totals and payments regardless of who's asking", async () => {
    const { res, json } = buildResponse();
    await controller.updateStatus(
      buildRequest("factory", { body: { status: "in_production" } }),
      res
    );

    const payload = json.mock.calls[0][0];
    expect(payload.totals).toBeDefined();
    expect(payload.payments).toBeDefined();
  });
});
