import { PrismaClient } from "@prisma/client";
import { PaymentMethod } from "@domain/entities/Order";
import { PaymentMethodRepository } from "@domain/repositories/PaymentMethodRepository";

export class PrismaPaymentMethodRepository implements PaymentMethodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: "asc" } });
  }

  async create(name: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({ data: { name } });
  }

  async update(id: string, name: string, active: boolean): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({ where: { id }, data: { name, active } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({ where: { id } });
  }
}
