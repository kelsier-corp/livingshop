import { PageResult } from "@domain/entities/Pagination";
import { SalesListQuery, SalesRow } from "@domain/entities/Sales";
import { OrderRepository } from "@domain/repositories/OrderRepository";

export class SalesService {
  constructor(private readonly orderRepository: OrderRepository) {}

  list(query: SalesListQuery): Promise<PageResult<SalesRow>> {
    return this.orderRepository.listSalesRows(query);
  }
}
