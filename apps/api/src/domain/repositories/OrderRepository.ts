import { AttachmentType, OrderStatus, ProductionStage } from "../entities/enums";
import {
  Attachment,
  Order,
  OrderCreateData,
  OrderItem,
  OrderItemAttributesInput,
  OrderItemCreateData,
  OrderListQuery,
  Payment,
  PaymentInput,
  ProductionStageStatus,
} from "../entities/Order";
import { PageResult } from "../entities/Pagination";
import { OrderItemWithContext, ProductionListQuery } from "../entities/Production";
import { SalesListQuery, SalesRow } from "../entities/Sales";

export interface OrderRepository {
  list(query: OrderListQuery): Promise<PageResult<Order>>;
  findById(id: string): Promise<Order | null>;
  create(data: OrderCreateData): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  markPrinted(id: string): Promise<Order>;
  // Both item mutations return the whole order so callers get the recomputed totals in one round
  // trip, the same way create() already does.
  addItem(orderId: string, data: OrderItemCreateData): Promise<Order>;
  setItemActive(orderId: string, itemId: string, active: boolean): Promise<Order>;
  updateItemAttributes(
    orderId: string,
    itemId: string,
    data: OrderItemAttributesInput
  ): Promise<Order>;
  // Reads an item regardless of its active flag, so the service can tell "not on this order" apart
  // from "already taken off it".
  findItemById(id: string): Promise<OrderItem | null>;
  addPayment(orderId: string, input: PaymentInput): Promise<Payment>;
  findPaymentById(id: string): Promise<Payment | null>;
  updatePayment(id: string, input: PaymentInput): Promise<Payment>;
  addAttachment(
    orderItemId: string,
    type: AttachmentType,
    url: string,
    fileName: string
  ): Promise<Attachment>;
  findAttachmentById(id: string): Promise<Attachment | null>;
  deleteAttachment(id: string): Promise<void>;
  setProductionStage(
    orderItemId: string,
    stage: ProductionStage,
    completed: boolean,
    userId: string | null
  ): Promise<ProductionStageStatus>;
  // Paginated variants back the interactive UI lists; the "All"/unbounded variants exist only
  // for the printed PDFs, which intentionally need the complete matching data set in one document.
  listItemsWithContext(query: ProductionListQuery): Promise<PageResult<OrderItemWithContext>>;
  listAllItemsWithContext(): Promise<OrderItemWithContext[]>;
  listSalesRows(query: SalesListQuery): Promise<PageResult<SalesRow>>;
  listAllSalesRows(): Promise<SalesRow[]>;
}
