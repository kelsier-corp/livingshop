import { Customer, CustomerInput, CustomerListQuery } from "../entities/Customer";
import { PageResult } from "../entities/Pagination";

export interface CustomerRepository {
  list(query: CustomerListQuery): Promise<PageResult<Customer>>;
  findById(id: string): Promise<Customer | null>;
  create(input: CustomerInput): Promise<Customer>;
  update(id: string, input: CustomerInput): Promise<Customer>;
  delete(id: string): Promise<void>;
}
