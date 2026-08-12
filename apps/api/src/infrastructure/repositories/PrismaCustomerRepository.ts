import { Prisma, PrismaClient } from "@prisma/client";
import { Customer, CustomerInput, CustomerListQuery } from "@domain/entities/Customer";
import { PageResult } from "@domain/entities/Pagination";
import { CustomerRepository } from "@domain/repositories/CustomerRepository";

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: CustomerListQuery): Promise<PageResult<Customer>> {
    const where: Prisma.CustomerWhereInput = query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { mobilePhone: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items: rows.map(toDomain), total, page: query.page, pageSize: query.pageSize };
  }

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(input: CustomerInput): Promise<Customer> {
    const row = await this.prisma.customer.create({ data: input });
    return toDomain(row);
  }

  async update(id: string, input: CustomerInput): Promise<Customer> {
    const row = await this.prisma.customer.update({ where: { id }, data: input });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } });
  }
}

function toDomain(row: {
  id: string;
  firstName: string;
  lastName: string;
  deliveryAddress: string | null;
  mobilePhone: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
}): Customer {
  return { ...row };
}
