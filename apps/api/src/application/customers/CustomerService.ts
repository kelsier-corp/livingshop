import { Customer, CustomerInput, CustomerListQuery } from "@domain/entities/Customer";
import { PageResult } from "@domain/entities/Pagination";
import { NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { CustomerRepository } from "@domain/repositories/CustomerRepository";

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  list(query: CustomerListQuery): Promise<PageResult<Customer>> {
    return this.customerRepository.list(query);
  }

  async getById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) throw new NotFoundError("Customer", id);
    return customer;
  }

  create(input: CustomerInput): Promise<Customer> {
    this.assertValid(input);
    return this.customerRepository.create(input);
  }

  async update(id: string, input: CustomerInput): Promise<Customer> {
    this.assertValid(input);
    await this.getById(id);
    return this.customerRepository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.customerRepository.delete(id);
  }

  private assertValid(input: CustomerInput): void {
    if (!input.firstName.trim() || !input.lastName.trim()) {
      throw new ValidationError("firstName and lastName are required");
    }
  }
}
