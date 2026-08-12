import { AttachmentType, OrderStatus, ProductionStage } from "../entities/enums";
import {
  Attachment,
  Order,
  OrderCreateData,
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
  addPayment(orderId: string, input: PaymentInput): Promise<Payment>;
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
