import { PaymentMethod } from "../entities/Order";

export interface PaymentMethodRepository {
  findAll(): Promise<PaymentMethod[]>;
  create(name: string): Promise<PaymentMethod>;
  update(id: string, name: string, active: boolean): Promise<PaymentMethod>;
  delete(id: string): Promise<void>;
}
