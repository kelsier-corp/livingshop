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
    status: "confirmed",
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

// Both routes are gated to admin/sales in orders.routes.ts today, so a factory user never
// actually reaches these handlers. These tests pin the response shape to the caller's role
// anyway, so loosening that gate later (e.g. to let the factory confirm a product swap) can't
// silently start leaking unitPrice/totalPrice the way a hardcoded `false` would have.
describe("OrdersController item endpoints — response shape follows the caller's role", () => {
  let orderService: OrderService;
  let controller: OrdersController;

  beforeEach(() => {
    orderService = {
      addItem: vi.fn(async () => buildOrder()),
      setItemActive: vi.fn(async () => buildOrder()),
    } as unknown as OrderService;
    controller = new OrdersController(orderService);
  });

  describe("addItem", () => {
    it("returns the full order with totals for a sales user", async () => {
      const { res, json } = buildResponse();
      await controller.addItem(buildRequest("sales", { body: validItemBody }), res);

      const payload = json.mock.calls[0][0];
      expect(payload.totals).toBeDefined();
      expect(payload.payments).toBeDefined();
      expect(payload.items[0].totalPrice).toBe(1000);
    });

    it("returns the factory-safe view for a factory user", async () => {
      const { res, json } = buildResponse();
      await controller.addItem(buildRequest("factory", { body: validItemBody }), res);

      const payload = json.mock.calls[0][0];
      expect(payload).not.toHaveProperty("payments");
      expect(payload).not.toHaveProperty("totals");
      expect(payload.items[0]).not.toHaveProperty("unitPrice");
      expect(payload.items[0]).not.toHaveProperty("totalPrice");
    });
  });

  describe("setItemActive", () => {
    it("returns the full order with totals for a sales user", async () => {
      const { res, json } = buildResponse();
      await controller.setItemActive(buildRequest("sales", { body: { active: false } }), res);

      const payload = json.mock.calls[0][0];
      expect(payload.totals).toBeDefined();
      expect(payload.payments).toBeDefined();
      expect(payload.items[0].totalPrice).toBe(1000);
    });

    it("returns the factory-safe view for a factory user", async () => {
      const { res, json } = buildResponse();
      await controller.setItemActive(buildRequest("factory", { body: { active: false } }), res);

      const payload = json.mock.calls[0][0];
      expect(payload).not.toHaveProperty("payments");
      expect(payload).not.toHaveProperty("totals");
      expect(payload.items[0]).not.toHaveProperty("unitPrice");
      expect(payload.items[0]).not.toHaveProperty("totalPrice");
    });
  });

  // getById already derived isFactory from the role; keeping it in the same suite documents that
  // the item endpoints now agree with it rather than each handler deciding on its own.
  describe("getById", () => {
    it("agrees with the item endpoints for a factory user", async () => {
      orderService = {
        getById: vi.fn(async () => buildOrder()),
      } as unknown as OrderService;
      const { res, json } = buildResponse();
      await new OrdersController(orderService).getById(buildRequest("factory"), res);

      const payload = json.mock.calls[0][0];
      expect(payload).not.toHaveProperty("payments");
      expect(payload.items[0]).not.toHaveProperty("totalPrice");
    });
  });
});
