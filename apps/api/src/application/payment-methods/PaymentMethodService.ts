import { PaymentMethod } from "@domain/entities/Order";
import { ValidationError } from "@domain/errors/DomainError";
import { PaymentMethodRepository } from "@domain/repositories/PaymentMethodRepository";

export class PaymentMethodService {
  constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

  list(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.findAll();
  }

  create(name: string): Promise<PaymentMethod> {
    if (!name.trim()) throw new ValidationError("name is required");
    return this.paymentMethodRepository.create(name.trim());
  }

  update(id: string, name: string, active: boolean): Promise<PaymentMethod> {
    if (!name.trim()) throw new ValidationError("name is required");
    return this.paymentMethodRepository.update(id, name.trim(), active);
  }

  delete(id: string): Promise<void> {
    return this.paymentMethodRepository.delete(id);
  }
}
