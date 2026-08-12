import { ProductionStage } from "@domain/entities/enums";
import { ProductionStageStatus } from "@domain/entities/Order";
import { PageResult } from "@domain/entities/Pagination";
import { OrderItemWithContext, ProductionListQuery } from "@domain/entities/Production";
import { OrderRepository } from "@domain/repositories/OrderRepository";

export class ProductionService {
  constructor(private readonly orderRepository: OrderRepository) {}

  listBoard(query: ProductionListQuery): Promise<PageResult<OrderItemWithContext>> {
    return this.orderRepository.listItemsWithContext(query);
  }

  toggleStage(
    orderItemId: string,
    stage: ProductionStage,
    completed: boolean,
    userId: string | null
  ): Promise<ProductionStageStatus> {
    return this.orderRepository.setProductionStage(orderItemId, stage, completed, userId);
  }
}
