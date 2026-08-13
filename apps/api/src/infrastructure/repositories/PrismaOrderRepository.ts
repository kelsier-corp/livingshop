import { Prisma, PrismaClient } from "@prisma/client";
import { AttachmentType, ProductionStage } from "@domain/entities/enums";
import {
  Attachment,
  Order,
  OrderCreateData,
  OrderItem,
  OrderListQuery,
  Payment,
  PaymentInput,
  ProductionStageStatus,
} from "@domain/entities/Order";
import { PageResult } from "@domain/entities/Pagination";
import { OrderItemWithContext, ProductionListQuery } from "@domain/entities/Production";
import { OrderRepository } from "@domain/repositories/OrderRepository";
import { SalesListQuery, SalesRow } from "@domain/entities/Sales";
import { OrderStatus } from "@domain/entities/enums";
import { findIdsByUnaccentedSearch } from "./accentInsensitiveSearch";

const orderInclude = {
  customer: true,
  items: {
    include: {
      productType: true,
      attachments: true,
      productionStages: true,
    },
  },
  payments: true,
};

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
type OrderItemRow = OrderRow["items"][number];

const productionItemInclude = {
  productType: true,
  attachments: true,
  productionStages: true,
  order: { include: { customer: true } },
};

type ProductionItemRow = Prisma.OrderItemGetPayload<{ include: typeof productionItemInclude }>;

const salesRowInclude = {
  customer: true,
  items: { include: { productType: true } },
  payments: true,
};

type SalesOrderRow = Prisma.OrderGetPayload<{ include: typeof salesRowInclude }>;

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: OrderListQuery): Promise<PageResult<Order>> {
    if (query.sortBy === "deliveryDate") {
      return this.listSortedByDeliveryDate(query);
    }

    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.dateFrom) dateFilter.gte = query.dateFrom;
    if (query.dateTo) dateFilter.lte = query.dateTo;

    const matchingCustomerIds = query.customerQuery
      ? await findIdsByUnaccentedSearch(this.prisma, "customers", ["firstName", "lastName"], query.customerQuery)
      : null;

    const where: Prisma.OrderWhereInput = {
      ...(query.number ? { number: query.number } : {}),
      ...(matchingCustomerIds ? { customerId: { in: matchingCustomerIds } } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    const sortField = query.sortBy === "number" ? "number" : "date";
    const sortDirection = query.sortDirection ?? "desc";

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { [sortField]: sortDirection },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items: rows.map(toOrderDomain), total, page: query.page, pageSize: query.pageSize };
  }

  // Prisma can't order a findMany by an aggregate (MIN) of a to-many relation, so sorting by
  // "earliest delivery date across an order's items" needs a raw query: fetch the sorted/paged
  // ids first, then load the full Order objects (with their usual includes) and re-apply that
  // order, since `findMany({ where: { id: { in } } })` doesn't preserve the input array's order.
  private async listSortedByDeliveryDate(query: OrderListQuery): Promise<PageResult<Order>> {
    const direction = query.sortDirection === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const conditions: Prisma.Sql[] = [];
    if (query.number) conditions.push(Prisma.sql`o.number = ${query.number}`);
    if (query.customerQuery) {
      const term = `%${query.customerQuery}%`;
      conditions.push(
        Prisma.sql`(unaccent(c."firstName") ILIKE unaccent(${term}) OR unaccent(c."lastName") ILIKE unaccent(${term}))`
      );
    }
    if (query.dateFrom) conditions.push(Prisma.sql`o.date >= ${query.dateFrom}`);
    if (query.dateTo) conditions.push(Prisma.sql`o.date <= ${query.dateTo}`);
    const whereSql = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.sql``;

    const countRows = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM orders o
      JOIN customers c ON c.id = o."customerId"
      ${whereSql}
    `;
    const total = Number(countRows[0]?.count ?? 0);

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT o.id
      FROM orders o
      JOIN customers c ON c.id = o."customerId"
      LEFT JOIN order_items oi ON oi."orderId" = o.id
      ${whereSql}
      GROUP BY o.id
      ORDER BY MIN(oi."deliveryDate") ${direction} NULLS LAST
      LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}
    `;

    const ids = idRows.map((row) => row.id);
    const rows = await this.prisma.order.findMany({ where: { id: { in: ids } }, include: orderInclude });
    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const ordered = ids.map((id) => rowsById.get(id)).filter((row): row is OrderRow => row !== undefined);

    return { items: ordered.map(toOrderDomain), total, page: query.page, pageSize: query.pageSize };
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    return row ? toOrderDomain(row) : null;
  }

  async create(data: OrderCreateData): Promise<Order> {
    const row = await this.prisma.order.create({
      data: {
        customerId: data.customerId,
        salespersonId: data.salespersonId,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            productTypeId: item.productTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            deliveryDate: item.deliveryDate,
            attributes: item.attributes as Prisma.InputJsonValue,
            factoryNotes: item.factoryNotes ?? null,
          })),
        },
      },
      include: orderInclude,
    });
    return toOrderDomain(row);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const row = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
    return toOrderDomain(row);
  }

  async markPrinted(id: string): Promise<Order> {
    const row = await this.prisma.order.update({
      where: { id },
      data: { printedAt: new Date() },
      include: orderInclude,
    });
    return toOrderDomain(row);
  }

  async addPayment(orderId: string, input: PaymentInput): Promise<Payment> {
    const row = await this.prisma.payment.create({
      data: {
        orderId,
        amount: input.amount,
        method: input.method,
        feePct: input.feePct ?? null,
        note: input.note ?? null,
      },
    });
    return toPaymentDomain(row);
  }

  async addAttachment(
    orderItemId: string,
    type: AttachmentType,
    url: string,
    fileName: string
  ): Promise<Attachment> {
    const row = await this.prisma.attachment.create({
      data: { orderItemId, type, url, fileName },
    });
    return toAttachmentDomain(row);
  }

  async findAttachmentById(id: string): Promise<Attachment | null> {
    const row = await this.prisma.attachment.findUnique({ where: { id } });
    return row ? toAttachmentDomain(row) : null;
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.prisma.attachment.delete({ where: { id } });
  }

  async setProductionStage(
    orderItemId: string,
    stage: ProductionStage,
    completed: boolean,
    userId: string | null
  ): Promise<ProductionStageStatus> {
    const completedAt = completed ? new Date() : null;
    const row = await this.prisma.productionStageStatus.upsert({
      where: { orderItemId_stage: { orderItemId, stage } },
      create: { orderItemId, stage, completed, completedAt, userId },
      update: { completed, completedAt, userId },
    });
    return toStageDomain(row);
  }

  async listItemsWithContext(query: ProductionListQuery): Promise<PageResult<OrderItemWithContext>> {
    const where: Prisma.OrderItemWhereInput = { order: { status: { in: ["confirmed", "in_production"] } } };

    const [rows, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where,
        include: productionItemInclude,
        orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.orderItem.count({ where }),
    ]);

    return { items: rows.map(toOrderItemWithContext), total, page: query.page, pageSize: query.pageSize };
  }

  async listAllItemsWithContext(): Promise<OrderItemWithContext[]> {
    const rows = await this.prisma.orderItem.findMany({
      where: { order: { status: { in: ["confirmed", "in_production"] } } },
      include: productionItemInclude,
      orderBy: [{ deliveryDate: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(toOrderItemWithContext);
  }

  async listSalesRows(query: SalesListQuery): Promise<PageResult<SalesRow>> {
    const matchingCustomerIds = query.customerQuery
      ? await findIdsByUnaccentedSearch(this.prisma, "customers", ["firstName", "lastName"], query.customerQuery)
      : null;

    const where: Prisma.OrderWhereInput = {
      ...(query.orderNumber !== undefined ? { number: query.orderNumber } : {}),
      ...(matchingCustomerIds ? { customerId: { in: matchingCustomerIds } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: salesRowInclude,
        orderBy: { date: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items: rows.map(toSalesRow), total, page: query.page, pageSize: query.pageSize };
  }

  async listAllSalesRows(): Promise<SalesRow[]> {
    const rows = await this.prisma.order.findMany({
      include: salesRowInclude,
      orderBy: { date: "desc" },
    });
    return rows.map(toSalesRow);
  }
}

function toOrderItemWithContext(row: ProductionItemRow): OrderItemWithContext {
  return {
    ...toOrderItemDomain(row),
    orderNumber: row.order.number,
    orderDate: row.order.date,
    orderStatus: row.order.status as OrderStatus,
    customerFullName: `${row.order.customer.firstName} ${row.order.customer.lastName}`,
  };
}

function toSalesRow(row: SalesOrderRow): SalesRow {
  const totalAmount = row.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const amountPaid = row.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  return {
    orderId: row.id,
    orderNumber: row.number,
    orderDate: row.date,
    customerFullName: `${row.customer.firstName} ${row.customer.lastName}`,
    items: row.items.map((item) => ({
      productTypeName: item.productType.name,
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
      deliveryDate: item.deliveryDate,
    })),
    totalAmount,
    amountPaid,
    balance: totalAmount - amountPaid,
    status: row.status as OrderStatus,
  };
}

function toOrderDomain(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    date: row.date,
    printedAt: row.printedAt,
    customerId: row.customerId,
    customerFullName: `${row.customer.firstName} ${row.customer.lastName}`,
    salespersonId: row.salespersonId,
    status: row.status as OrderStatus,
    notes: row.notes,
    items: row.items.map(toOrderItemDomain),
    payments: row.payments.map(toPaymentDomain),
  };
}

function toOrderItemDomain(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.orderId,
    productTypeId: row.productTypeId,
    productTypeName: row.productType.name,
    productTypeSketchUrl: row.productType.sketchUrl,
    quantity: row.quantity,
    unitPrice: Number(row.unitPrice),
    totalPrice: Number(row.totalPrice),
    deliveryDate: row.deliveryDate,
    attributes: row.attributes as OrderItem["attributes"],
    factoryNotes: row.factoryNotes,
    attachments: row.attachments.map(toAttachmentDomain),
    productionStages: row.productionStages.map(toStageDomain),
  };
}

function toAttachmentDomain(row: {
  id: string;
  orderItemId: string;
  type: string;
  url: string;
  fileName: string;
}): Attachment {
  return {
    id: row.id,
    orderItemId: row.orderItemId,
    type: row.type as AttachmentType,
    url: row.url,
    fileName: row.fileName,
  };
}

function toStageDomain(row: {
  id: string;
  orderItemId: string;
  stage: string;
  completed: boolean;
  completedAt: Date | null;
  userId: string | null;
}): ProductionStageStatus {
  return {
    id: row.id,
    orderItemId: row.orderItemId,
    stage: row.stage as ProductionStage,
    completed: row.completed,
    completedAt: row.completedAt,
    userId: row.userId,
  };
}

function toPaymentDomain(row: {
  id: string;
  orderId: string;
  date: Date;
  amount: Prisma.Decimal;
  method: string;
  feePct: Prisma.Decimal | null;
  note: string | null;
}): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    date: row.date,
    amount: Number(row.amount),
    method: row.method,
    feePct: row.feePct === null ? null : Number(row.feePct),
    note: row.note,
  };
}
