import { PrismaClient } from "@prisma/client";
import { User } from "@domain/entities/User";
import { UserRepository } from "@domain/repositories/UserRepository";

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { name: "asc" } });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }
}

function toDomain(row: {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User["role"],
    active: row.active,
  };
}
