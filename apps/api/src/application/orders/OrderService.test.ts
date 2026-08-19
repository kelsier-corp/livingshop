import { beforeEach, describe, expect, it, vi } from "vitest";
import { Customer } from "@domain/entities/Customer";
import { OrderInput, OrderItemInput } from "@domain/entities/Order";
import { ProductType } from "@domain/entities/Catalog";
import { User } from "@domain/entities/User";
import { NotFoundError, ValidationError } from "@domain/errors/DomainError";
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

function buildService(options: { productType?: ProductType | null } = {}) {
  const orderRepository = {
    list: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(async (data) => ({ id: "order-1", number: 1, ...data }) as never),
    updateStatus: vi.fn(),
    markPrinted: vi.fn(),
    addPayment: vi.fn(async (_orderId, input) => ({
      id: "payment-1",
      orderId: _orderId,
      date: new Date(),
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
