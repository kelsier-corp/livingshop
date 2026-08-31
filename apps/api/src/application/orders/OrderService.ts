import { AttachmentType, OrderStatus, ProductionStage, UserRole } from "@domain/entities/enums";
import {
  Attachment,
  Order,
  OrderCreateData,
  OrderInput,
  OrderItemCreateData,
  OrderItemInput,
  OrderListQuery,
  Payment,
  PaymentInput,
} from "@domain/entities/Order";
import { PageResult } from "@domain/entities/Pagination";
import { ForbiddenError, NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { ITEM_EDITABLE_STATUSES, canEditItems } from "@domain/policies/orderEditing";
import { CustomerRepository } from "@domain/repositories/CustomerRepository";
import { ProductTypeRepository } from "@domain/repositories/CatalogRepository";
import { OrderRepository } from "@domain/repositories/OrderRepository";
import { UserRepository } from "@domain/repositories/UserRepository";
import { FileStorage } from "@domain/repositories/FileStorage";

export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productTypeRepository: ProductTypeRepository,
    private readonly userRepository: UserRepository,
    private readonly fileStorage: FileStorage
  ) {}

  list(query: OrderListQuery): Promise<PageResult<Order>> {
    return this.orderRepository.list(query);
  }

  async getById(id: string): Promise<Order> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundError("Order", id);
    return order;
  }

  async create(input: OrderInput): Promise<Order> {
    const data = await this.buildCreateData(input);
    return this.orderRepository.create(data);
  }

  async updateStatus(id: string, status: OrderStatus, role: UserRole): Promise<Order> {
    const order = await this.getById(id);
    // Sales confirms an order but has no visibility into when the factory floor actually
    // starts building it, so factory needs to be able to toggle that transition themselves —
    // but only between confirmed and in_production, never into delivered/cancelled/draft.
    if (role === "factory") {
      const FACTORY_ALLOWED_STATUSES: OrderStatus[] = ["confirmed", "in_production"];
      if (
        !FACTORY_ALLOWED_STATUSES.includes(order.status) ||
        !FACTORY_ALLOWED_STATUSES.includes(status)
      ) {
        throw new ForbiddenError(
          "Factory can only toggle an order between confirmed and in_production"
        );
      }
    }
    return this.orderRepository.updateStatus(id, status);
  }

  async addItem(orderId: string, input: OrderItemInput): Promise<Order> {
    const order = await this.getById(orderId);
    this.assertItemsEditable(order);
    // Same snapshot rule as create(): the item takes the product's price as of right now, so
    // adding a product later picks up any price change since the order was opened.
    const data = await this.buildItemCreateData(input);
    return this.orderRepository.addItem(orderId, data);
  }

  // Takes a product off the order (active: false) or puts one back on (active: true). Both
  // directions are a plain update of the flag — the row is never deleted.
  async setItemActive(orderId: string, itemId: string, active: boolean): Promise<Order> {
    const order = await this.getById(orderId);
    this.assertItemsEditable(order);

    const item = await this.orderRepository.findItemById(itemId);
    // Treat an item from another order as missing rather than leaking that the id exists.
    if (!item || item.orderId !== orderId) throw new NotFoundError("OrderItem", itemId);
    if (item.active === active) {
      throw new ValidationError(
        active ? "That product is already on the order" : "That product is already off the order"
      );
    }
    // order.items only holds active items, and create() refuses an order with none — removal has
    // to honour the same floor or the order would end up in a state create() would have rejected.
    if (!active && order.items.length <= 1) {
      throw new ValidationError("An order needs at least one item");
    }

    return this.orderRepository.setItemActive(orderId, itemId, active);
  }

  async addPayment(orderId: string, input: PaymentInput): Promise<Payment> {
    this.assertValidPayment(input);
    await this.getById(orderId);
    return this.orderRepository.addPayment(orderId, input);
  }

  // Deliberately not gated on order status: a balance can get settled (or a wrong amount spotted)
  // after the order is delivered — see the note in domain/policies/orderEditing.ts.
  async updatePayment(orderId: string, paymentId: string, input: PaymentInput): Promise<Payment> {
    this.assertValidPayment(input);
    await this.getById(orderId);

    const payment = await this.orderRepository.findPaymentById(paymentId);
    if (!payment || payment.orderId !== orderId) throw new NotFoundError("Payment", paymentId);

    return this.orderRepository.updatePayment(paymentId, input);
  }

  async addAttachment(
    orderItemId: string,
    type: AttachmentType,
    file: { originalName: string; buffer: Buffer; mimeType: string }
  ): Promise<Attachment> {
    const stored = await this.fileStorage.save(file.originalName, file.buffer, file.mimeType);
    return this.orderRepository.addAttachment(orderItemId, type, stored.url, stored.fileName);
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.orderRepository.findAttachmentById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment", attachmentId);
    await this.orderRepository.deleteAttachment(attachmentId);
    await this.fileStorage.delete(attachment.url);
  }

  setProductionStage(
    orderItemId: string,
    stage: ProductionStage,
    completed: boolean,
    userId: string | null
  ) {
    return this.orderRepository.setProductionStage(orderItemId, stage, completed, userId);
  }

  async markPrinted(id: string): Promise<Order> {
    await this.getById(id);
    return this.orderRepository.markPrinted(id);
  }

  private async buildCreateData(input: OrderInput): Promise<OrderCreateData> {
    if (input.items.length === 0) {
      throw new ValidationError("An order needs at least one item");
    }

    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer) throw new NotFoundError("Customer", input.customerId);

    const salesperson = await this.userRepository.findById(input.salespersonId);
    if (!salesperson) throw new NotFoundError("User", input.salespersonId);

    const items: OrderItemCreateData[] = [];

    // Sequential on purpose: the first invalid item is the error the caller gets, and that has to
    // be the first one in the list, not whichever request happened to resolve first.
    for (const item of input.items) {
      items.push(await this.buildItemCreateData(item));
    }

    return {
      customerId: input.customerId,
      salespersonId: input.salespersonId,
      notes: input.notes,
      items,
    };
  }

  // Shared by create() and addItem() so a product added after the fact goes through exactly the
  // same quantity / product-exists / required-attribute checks as one added up front.
  private async buildItemCreateData(item: OrderItemInput): Promise<OrderItemCreateData> {
    if (item.quantity <= 0) throw new ValidationError("quantity must be greater than zero");

    const productType = await this.productTypeRepository.findById(item.productTypeId);
    if (!productType) throw new NotFoundError("ProductType", item.productTypeId);

    for (const attribute of productType.attributeDefinitions) {
      if (attribute.required) {
        const value = item.attributes[attribute.name];
        if (value === undefined || value === null || value === "") {
          throw new ValidationError(
            `Attribute "${attribute.name}" is required for product type "${productType.name}"`
          );
        }
      }
    }

    return {
      ...item,
      unitPrice: productType.basePrice,
      totalPrice: productType.basePrice * item.quantity,
    };
  }

  private assertItemsEditable(order: Order): void {
    if (!canEditItems(order.status)) {
      throw new ForbiddenError(
        `Products can only be added or removed while the order is ${ITEM_EDITABLE_STATUSES.join(
          " or "
        )} — this one is ${order.status}`
      );
    }
  }

  private assertValidPayment(input: PaymentInput): void {
    if (input.amount <= 0) throw new ValidationError("amount must be greater than zero");
    if (!input.method.trim()) throw new ValidationError("method is required");
  }
}
