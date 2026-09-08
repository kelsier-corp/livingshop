import { beforeEach, describe, expect, it, vi } from "vitest";
import { Customer } from "@domain/entities/Customer";
import { Order, OrderInput, OrderItem, OrderItemInput, Payment } from "@domain/entities/Order";
import { ORDER_STATUSES, OrderStatus } from "@domain/entities/enums";
import { ProductType } from "@domain/entities/Catalog";
import { User } from "@domain/entities/User";
import { ForbiddenError, NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { CustomerRepository } from "@domain/repositories/CustomerRepository";
import { ProductTypeRepository } from "@domain/repositories/CatalogRepository";
import { OrderRepository } from "@domain/repositories/OrderRepository";
import { UserRepository } from "@domain/repositories/UserRepository";
import { FileStorage } from "@domain/repositories/FileStorage";
import { OrderService } from "./OrderService";

const CUSTOMER: Customer = {
  id: "customer-1",
  firstName: "Ana",
  lastName: "Gómez",
  deliveryAddress: null,
  mobilePhone: null,
  phone: null,
  email: null,
  createdAt: new Date("2026-01-01"),
};

const SALESPERSON: User = {
  id: "user-1",
  name: "Paula",
  email: "paula@livingshop.test",
  role: "sales",
  active: true,
};

function buildProductType(overrides: Partial<ProductType> = {}): ProductType {
  return {
    id: "product-1",
    name: "Sofá",
    description: null,
    basePrice: 1000,
    active: true,
    sketchUrl: null,
    sketchFileName: null,
    includeInFactorySheet: true,
    categories: [],
    attributeDefinitions: [],
    ...overrides,
  };
}

function buildItemInput(overrides: Partial<OrderItemInput> = {}): OrderItemInput {
  return {
    productTypeId: "product-1",
    quantity: 1,
    deliveryDate: new Date("2026-03-01"),
    attributes: {},
    ...overrides,
  };
}

function buildOrderInput(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    customerId: "customer-1",
    salespersonId: "user-1",
    items: [buildItemInput()],
    ...overrides,
  };
}

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
    deliveryDate: new Date("2026-03-01"),
    attributes: {},
    factoryNotes: null,
    active: true,
    attachments: [],
    productionStages: [],
    ...overrides,
  };
}

function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    orderId: "order-1",
    date: new Date("2026-01-05"),
    amount: 500,
    method: "Efectivo",
    feePct: null,
    note: null,
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
    customerFullName: "Ana Gómez",
    salespersonId: "user-1",
    status: "draft",
    notes: null,
    items: [],
    payments: [],
    ...overrides,
  };
}

function buildService(options: { productType?: ProductType | null } = {}) {
  const orderRepository = {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(async (data) => ({ id: "order-1", number: 1, ...data }) as never),
    updateStatus: vi.fn(),
    markPrinted: vi.fn(),
    addItem: vi.fn(async (orderId, data) => ({ id: orderId, items: [data] }) as never),
    setItemActive: vi.fn(async (orderId) => ({ id: orderId }) as never),
    updateItemAttributes: vi.fn(async (orderId) => ({ id: orderId }) as never),
    findItemById: vi.fn(),
    addPayment: vi.fn(async (_orderId, input) => ({
      id: "payment-1",
      orderId: _orderId,
      date: new Date(),
      ...input,
    })),
    findPaymentById: vi.fn(),
    updatePayment: vi.fn(async (id, input) => ({
      id,
      orderId: "order-1",
      date: new Date(),
      feePct: null,
      note: null,
      ...input,
    })),
    addAttachment: vi.fn(),
    findAttachmentById: vi.fn(),
    deleteAttachment: vi.fn(),
    setProductionStage: vi.fn(),
    listItemsWithContext: vi.fn(),
    listAllItemsWithContext: vi.fn(),
    listSalesRows: vi.fn(),
    listAllSalesRows: vi.fn(),
  } satisfies OrderRepository;

  const customerRepository = {
    list: vi.fn(),
    findById: vi.fn(async (id: string) => (id === CUSTOMER.id ? CUSTOMER : null)),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } satisfies CustomerRepository;

  const productType = options.productType === undefined ? buildProductType() : options.productType;
  const productTypeRepository = {
    list: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(async (id: string) =>
      productType && id === productType.id ? productType : null
    ),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpdatePrices: vi.fn(),
    applyPercentageIncrease: vi.fn(),
    updateSketch: vi.fn(),
  } satisfies ProductTypeRepository;

  const userRepository = {
    findAll: vi.fn(),
    findById: vi.fn(async (id: string) => (id === SALESPERSON.id ? SALESPERSON : null)),
  } satisfies UserRepository;

  const fileStorage = { save: vi.fn(), delete: vi.fn() } satisfies FileStorage;

  const service = new OrderService(
    orderRepository,
    customerRepository,
    productTypeRepository,
    userRepository,
    fileStorage
  );
  return { service, orderRepository, customerRepository, productTypeRepository, userRepository };
}

describe("OrderService.create", () => {
  it("rejects an order with no items", async () => {
    const { service } = buildService();
    await expect(service.create(buildOrderInput({ items: [] }))).rejects.toThrow(ValidationError);
  });

  it("404s when the customer doesn't exist", async () => {
    const { service } = buildService();
    await expect(service.create(buildOrderInput({ customerId: "missing" }))).rejects.toThrow(
      NotFoundError
    );
  });

  it("404s when the salesperson doesn't exist", async () => {
    const { service } = buildService();
    await expect(service.create(buildOrderInput({ salespersonId: "missing" }))).rejects.toThrow(
      NotFoundError
    );
  });

  it("rejects an item with quantity 0", async () => {
    const { service } = buildService();
    await expect(
      service.create(buildOrderInput({ items: [buildItemInput({ quantity: 0 })] }))
    ).rejects.toThrow(ValidationError);
  });

  it("404s when an item references a product type that doesn't exist", async () => {
    const { service } = buildService({ productType: null });
    await expect(service.create(buildOrderInput())).rejects.toThrow(NotFoundError);
  });

  it("rejects an item missing a value for a required attribute", async () => {
    const productType = buildProductType({
      attributeDefinitions: [
        {
          id: "attr-1",
          productTypeId: "product-1",
          name: "Tela",
          dataType: "text",
          attributeCatalogId: null,
          sortOrder: 0,
          required: true,
        },
      ],
    });
    const { service } = buildService({ productType });
    await expect(
      service.create(buildOrderInput({ items: [buildItemInput({ attributes: {} })] }))
    ).rejects.toThrow(/Tela.*required|required.*Tela/);
  });

  it("accepts an item that does supply the required attribute", async () => {
    const productType = buildProductType({
      attributeDefinitions: [
        {
          id: "attr-1",
          productTypeId: "product-1",
          name: "Tela",
          dataType: "text",
          attributeCatalogId: null,
          sortOrder: 0,
          required: true,
        },
      ],
    });
    const { service } = buildService({ productType });
    await expect(
      service.create(buildOrderInput({ items: [buildItemInput({ attributes: { Tela: "Pana" } })] }))
    ).resolves.toBeDefined();
  });

  it("snapshots unitPrice/totalPrice from the product's current basePrice at creation time", async () => {
    const productType = buildProductType({ basePrice: 5000 });
    const { service, orderRepository } = buildService({ productType });
    await service.create(buildOrderInput({ items: [buildItemInput({ quantity: 3 })] }));

    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [expect.objectContaining({ unitPrice: 5000, totalPrice: 15000, quantity: 3 })],
      })
    );
  });
});

describe("OrderService.addPayment", () => {
  it("rejects an amount of 0", async () => {
    const { service } = buildService();
    await expect(service.addPayment("order-1", { amount: 0, method: "Efectivo" })).rejects.toThrow(
      ValidationError
    );
  });

  it("rejects a negative amount", async () => {
    const { service } = buildService();
    await expect(
      service.addPayment("order-1", { amount: -100, method: "Efectivo" })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a blank method", async () => {
    const { service } = buildService();
    await expect(service.addPayment("order-1", { amount: 100, method: "  " })).rejects.toThrow(
      ValidationError
    );
  });

  it("404s when the order doesn't exist", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => null);
    await expect(
      service.addPayment("missing", { amount: 100, method: "Efectivo" })
    ).rejects.toThrow(NotFoundError);
  });
});

describe("OrderService.updateStatus", () => {
  it("404s when the order doesn't exist", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => null);
    await expect(service.updateStatus("missing", "in_production")).rejects.toThrow(NotFoundError);
  });

  // Unrestricted by role on purpose: admin, sales and factory can all move an order to any
  // status, since sales confirms the sale but has no visibility into the factory floor's actual
  // progress, and vice versa. There's no per-role gating left to test — just that any transition
  // reaches the repository unmodified.
  it.each(ORDER_STATUSES)(
    "sets the order to %s regardless of its current status",
    async (status) => {
      const { service, orderRepository } = buildService();
      orderRepository.findById = vi.fn(async () => buildOrder({ status: "draft" }));
      await service.updateStatus("order-1", status);
      expect(orderRepository.updateStatus).toHaveBeenCalledWith("order-1", status);
    }
  );
});

// The whole point of the feature: the item list is editable exactly while the order is still a
// draft being agreed with the customer, and locked once the factory is building it or the order
// is closed.
const ITEM_EDITABLE: OrderStatus[] = ["draft"];
const ITEM_LOCKED: OrderStatus[] = ["in_production", "delivered", "voided"];

describe("OrderService.addItem", () => {
  it.each(ITEM_EDITABLE)("adds a product to a %s order", async (status) => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => buildOrder({ status, items: [buildItem()] }));

    await service.addItem("order-1", buildItemInput());

    expect(orderRepository.addItem).toHaveBeenCalledWith(
      "order-1",
      expect.objectContaining({ productTypeId: "product-1" })
    );
  });

  it.each(ITEM_LOCKED)("refuses to add a product to a %s order", async (status) => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => buildOrder({ status, items: [buildItem()] }));

    await expect(service.addItem("order-1", buildItemInput())).rejects.toThrow(ForbiddenError);
    expect(orderRepository.addItem).not.toHaveBeenCalled();
  });

  it("404s when the order doesn't exist", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => null);

    await expect(service.addItem("missing", buildItemInput())).rejects.toThrow(NotFoundError);
  });

  it("snapshots the product's price as of when it was added, not the order's original price", async () => {
    const productType = buildProductType({ basePrice: 7000 });
    const { service, orderRepository } = buildService({ productType });
    orderRepository.findById = vi.fn(async () =>
      buildOrder({ status: "draft", items: [buildItem({ unitPrice: 1000, totalPrice: 1000 })] })
    );

    await service.addItem("order-1", buildItemInput({ quantity: 2 }));

    expect(orderRepository.addItem).toHaveBeenCalledWith(
      "order-1",
      expect.objectContaining({ unitPrice: 7000, totalPrice: 14000 })
    );
  });

  it("rejects an item with quantity 0, same as create", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => buildOrder({ status: "draft" }));

    await expect(service.addItem("order-1", buildItemInput({ quantity: 0 }))).rejects.toThrow(
      ValidationError
    );
  });

  it("404s when the product type doesn't exist, same as create", async () => {
    const { service, orderRepository } = buildService({ productType: null });
    orderRepository.findById = vi.fn(async () => buildOrder({ status: "draft" }));

    await expect(service.addItem("order-1", buildItemInput())).rejects.toThrow(NotFoundError);
  });

  it("enforces required attributes, same as create", async () => {
    const productType = buildProductType({
      attributeDefinitions: [
        {
          id: "attr-1",
          productTypeId: "product-1",
          name: "Tela",
          dataType: "text",
          attributeCatalogId: null,
          sortOrder: 0,
          required: true,
        },
      ],
    });
    const { service, orderRepository } = buildService({ productType });
    orderRepository.findById = vi.fn(async () => buildOrder({ status: "draft" }));

    await expect(service.addItem("order-1", buildItemInput({ attributes: {} }))).rejects.toThrow(
      /Tela/
    );
  });
});

describe("OrderService.setItemActive", () => {
  // Two active items, so removing one doesn't trip the "an order needs at least one item" guard.
  function buildWithTwoItems(status: OrderStatus) {
    const built = buildService();
    built.orderRepository.findById = vi.fn(async () =>
      buildOrder({ status, items: [buildItem({ id: "item-1" }), buildItem({ id: "item-2" })] })
    );
    built.orderRepository.findItemById = vi.fn(async () => buildItem({ id: "item-1" }));
    return built;
  }

  it.each(ITEM_EDITABLE)("takes a product off a %s order", async (status) => {
    const { service, orderRepository } = buildWithTwoItems(status);

    await service.setItemActive("order-1", "item-1", false);

    expect(orderRepository.setItemActive).toHaveBeenCalledWith("order-1", "item-1", false);
  });

  it.each(ITEM_LOCKED)("refuses to take a product off a %s order", async (status) => {
    const { service, orderRepository } = buildWithTwoItems(status);

    await expect(service.setItemActive("order-1", "item-1", false)).rejects.toThrow(ForbiddenError);
    expect(orderRepository.setItemActive).not.toHaveBeenCalled();
  });

  it("404s when the item belongs to a different order", async () => {
    const { service, orderRepository } = buildWithTwoItems("draft");
    orderRepository.findItemById = vi.fn(async () => buildItem({ orderId: "order-2" }));

    await expect(service.setItemActive("order-1", "item-1", false)).rejects.toThrow(NotFoundError);
    expect(orderRepository.setItemActive).not.toHaveBeenCalled();
  });

  it("404s when the item doesn't exist", async () => {
    const { service, orderRepository } = buildWithTwoItems("draft");
    orderRepository.findItemById = vi.fn(async () => null);

    await expect(service.setItemActive("order-1", "missing", false)).rejects.toThrow(NotFoundError);
  });

  it("rejects taking off a product that's already off the order", async () => {
    const { service, orderRepository } = buildWithTwoItems("draft");
    orderRepository.findItemById = vi.fn(async () => buildItem({ active: false }));

    await expect(service.setItemActive("order-1", "item-1", false)).rejects.toThrow(
      ValidationError
    );
    expect(orderRepository.setItemActive).not.toHaveBeenCalled();
  });

  it("refuses to remove the last product, since create() would reject that same order", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () =>
      buildOrder({ status: "draft", items: [buildItem({ id: "item-1" })] })
    );
    orderRepository.findItemById = vi.fn(async () => buildItem({ id: "item-1" }));

    await expect(service.setItemActive("order-1", "item-1", false)).rejects.toThrow(
      ValidationError
    );
    expect(orderRepository.setItemActive).not.toHaveBeenCalled();
  });

  it("puts a previously removed product back on the order", async () => {
    const { service, orderRepository } = buildWithTwoItems("draft");
    orderRepository.findItemById = vi.fn(async () => buildItem({ id: "item-1", active: false }));

    await service.setItemActive("order-1", "item-1", true);

    expect(orderRepository.setItemActive).toHaveBeenCalledWith("order-1", "item-1", true);
  });

  it("rejects putting back a product that's already on the order", async () => {
    const { service, orderRepository } = buildWithTwoItems("draft");

    await expect(service.setItemActive("order-1", "item-1", true)).rejects.toThrow(ValidationError);
  });

  it("doesn't apply the minimum-items guard when putting a product back", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () =>
      buildOrder({ status: "draft", items: [buildItem({ id: "item-2" })] })
    );
    orderRepository.findItemById = vi.fn(async () => buildItem({ id: "item-1", active: false }));

    await service.setItemActive("order-1", "item-1", true);

    expect(orderRepository.setItemActive).toHaveBeenCalledWith("order-1", "item-1", true);
  });
});

describe("OrderService.updateItemAttributes", () => {
  // Unrestricted by order status on purpose — unlike addItem/setItemActive, this needs to work
  // no matter what state the order is in.
  it.each(ORDER_STATUSES)("updates attributes on a %s order", async (status) => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => buildOrder({ status, items: [buildItem()] }));
    orderRepository.findItemById = vi.fn(async () => buildItem());

    await service.updateItemAttributes("order-1", "item-1", {
      attributes: { Tela: "Pana" },
      factoryNotes: "Reforzar patas",
    });

    expect(orderRepository.updateItemAttributes).toHaveBeenCalledWith("order-1", "item-1", {
      attributes: { Tela: "Pana" },
      factoryNotes: "Reforzar patas",
    });
  });

  it("404s when the order doesn't exist", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => null);

    await expect(
      service.updateItemAttributes("missing", "item-1", { attributes: {} })
    ).rejects.toThrow(NotFoundError);
  });

  it("404s when the item belongs to a different order", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => buildOrder());
    orderRepository.findItemById = vi.fn(async () => buildItem({ orderId: "order-2" }));

    await expect(
      service.updateItemAttributes("order-1", "item-1", { attributes: {} })
    ).rejects.toThrow(NotFoundError);
    expect(orderRepository.updateItemAttributes).not.toHaveBeenCalled();
  });

  it("404s when the item doesn't exist", async () => {
    const { service, orderRepository } = buildService();
    orderRepository.findById = vi.fn(async () => buildOrder());
    orderRepository.findItemById = vi.fn(async () => null);

    await expect(
      service.updateItemAttributes("order-1", "missing", { attributes: {} })
    ).rejects.toThrow(NotFoundError);
  });

  it("enforces required attributes, same as create/addItem", async () => {
    const productType = buildProductType({
      attributeDefinitions: [
        {
          id: "attr-1",
          productTypeId: "product-1",
          name: "Tela",
          dataType: "text",
          attributeCatalogId: null,
          sortOrder: 0,
          required: true,
        },
      ],
    });
    const { service, orderRepository } = buildService({ productType });
    orderRepository.findById = vi.fn(async () => buildOrder());
    orderRepository.findItemById = vi.fn(async () => buildItem());

    await expect(
      service.updateItemAttributes("order-1", "item-1", { attributes: {} })
    ).rejects.toThrow(/Tela/);
    expect(orderRepository.updateItemAttributes).not.toHaveBeenCalled();
  });
});

describe("OrderService.updatePayment", () => {
  function buildWithPayment(status: OrderStatus) {
    const built = buildService();
    built.orderRepository.findById = vi.fn(async () =>
      buildOrder({ status, items: [buildItem()], payments: [buildPayment()] })
    );
    built.orderRepository.findPaymentById = vi.fn(async () => buildPayment());
    return built;
  }

  // Payments are intentionally editable in every status — a balance can be settled, or a wrong
  // amount spotted, long after the order was delivered or cancelled.
  it.each(ORDER_STATUSES)("updates a payment on a %s order", async (status) => {
    const { service, orderRepository } = buildWithPayment(status);

    await service.updatePayment("order-1", "payment-1", { amount: 900, method: "Transferencia" });

    expect(orderRepository.updatePayment).toHaveBeenCalledWith("payment-1", {
      amount: 900,
      method: "Transferencia",
    });
  });

  it("rejects an amount of 0", async () => {
    const { service } = buildWithPayment("draft");

    await expect(
      service.updatePayment("order-1", "payment-1", { amount: 0, method: "Efectivo" })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a negative amount", async () => {
    const { service } = buildWithPayment("draft");

    await expect(
      service.updatePayment("order-1", "payment-1", { amount: -50, method: "Efectivo" })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects a blank method", async () => {
    const { service } = buildWithPayment("draft");

    await expect(
      service.updatePayment("order-1", "payment-1", { amount: 100, method: "  " })
    ).rejects.toThrow(ValidationError);
  });

  it("404s when the order doesn't exist", async () => {
    const { service, orderRepository } = buildWithPayment("draft");
    orderRepository.findById = vi.fn(async () => null);

    await expect(
      service.updatePayment("missing", "payment-1", { amount: 100, method: "Efectivo" })
    ).rejects.toThrow(NotFoundError);
  });

  it("404s when the payment doesn't exist", async () => {
    const { service, orderRepository } = buildWithPayment("draft");
    orderRepository.findPaymentById = vi.fn(async () => null);

    await expect(
      service.updatePayment("order-1", "missing", { amount: 100, method: "Efectivo" })
    ).rejects.toThrow(NotFoundError);
  });

  it("404s when the payment belongs to a different order", async () => {
    const { service, orderRepository } = buildWithPayment("draft");
    orderRepository.findPaymentById = vi.fn(async () => buildPayment({ orderId: "order-2" }));

    await expect(
      service.updatePayment("order-1", "payment-1", { amount: 100, method: "Efectivo" })
    ).rejects.toThrow(NotFoundError);
    expect(orderRepository.updatePayment).not.toHaveBeenCalled();
  });
});
