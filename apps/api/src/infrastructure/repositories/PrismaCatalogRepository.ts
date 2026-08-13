import { Prisma, PrismaClient } from "@prisma/client";
import {
  AttributeCatalog,
  AttributeCatalogValue,
  AttributeDefinition,
  ProductCategory,
  ProductCategoryListQuery,
  ProductType,
  ProductTypeInput,
  ProductTypeListQuery,
  ProductTypePriceInput,
} from "@domain/entities/Catalog";
import { PageResult } from "@domain/entities/Pagination";
import {
  AttributeCatalogRepository,
  ProductCategoryRepository,
  ProductTypeRepository,
} from "@domain/repositories/CatalogRepository";
import { StoredFile } from "@domain/repositories/FileStorage";

const productTypeInclude = {
  categories: true,
  attributeDefinitions: { orderBy: { sortOrder: "asc" as const } },
};

export class PrismaProductTypeRepository implements ProductTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ProductTypeListQuery): Promise<PageResult<ProductType>> {
    const where: Prisma.ProductTypeWhereInput = {
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.categoryId ? { categories: { some: { id: query.categoryId } } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.productType.findMany({
        where,
        include: productTypeInclude,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.productType.count({ where }),
    ]);

    return { items: rows.map(toDomain), total, page: query.page, pageSize: query.pageSize };
  }

  async findAll(): Promise<ProductType[]> {
    const rows = await this.prisma.productType.findMany({
      include: productTypeInclude,
      orderBy: { name: "asc" },
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<ProductType | null> {
    const row = await this.prisma.productType.findUnique({
      where: { id },
      include: productTypeInclude,
    });
    return row ? toDomain(row) : null;
  }

  async create(input: ProductTypeInput): Promise<ProductType> {
    const row = await this.prisma.productType.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        basePrice: input.basePrice,
        active: input.active ?? true,
        categories: { connect: input.categoryIds.map((id) => ({ id })) },
        attributeDefinitions: {
          create: input.attributeDefinitions.map((attribute, index) => ({
            name: attribute.name,
            dataType: attribute.dataType,
            attributeCatalogId: attribute.attributeCatalogId ?? null,
            sortOrder: attribute.sortOrder ?? index,
            required: attribute.required ?? false,
          })),
        },
      },
      include: productTypeInclude,
    });
    return toDomain(row);
  }

  async update(id: string, input: ProductTypeInput): Promise<ProductType> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.attributeDefinition.deleteMany({ where: { productTypeId: id } });
      return tx.productType.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description ?? null,
          basePrice: input.basePrice,
          active: input.active ?? true,
          categories: { set: input.categoryIds.map((categoryId) => ({ id: categoryId })) },
          attributeDefinitions: {
            create: input.attributeDefinitions.map((attribute, index) => ({
              name: attribute.name,
              dataType: attribute.dataType,
              attributeCatalogId: attribute.attributeCatalogId ?? null,
              sortOrder: attribute.sortOrder ?? index,
              required: attribute.required ?? false,
            })),
          },
        },
        include: productTypeInclude,
      });
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productType.delete({ where: { id } });
  }

  async bulkUpdatePrices(prices: ProductTypePriceInput[]): Promise<ProductType[]> {
    await this.prisma.$transaction(
      prices.map((price) =>
        this.prisma.productType.update({
          where: { id: price.id },
          data: { basePrice: price.basePrice },
        })
      )
    );
    return this.findAll();
  }

  async applyPercentageIncrease(
    percentage: number,
    categoryIds: string[] | null
  ): Promise<ProductType[]> {
    const targets = await this.prisma.productType.findMany({
      where: categoryIds ? { categories: { some: { id: { in: categoryIds } } } } : undefined,
      select: { id: true, basePrice: true },
    });

    await this.prisma.$transaction(
      targets.map((target) =>
        this.prisma.productType.update({
          where: { id: target.id },
          data: { basePrice: Math.round(Number(target.basePrice) * (1 + percentage / 100)) },
        })
      )
    );
    return this.findAll();
  }

  async updateSketch(id: string, sketch: StoredFile | null): Promise<ProductType> {
    const row = await this.prisma.productType.update({
      where: { id },
      data: { sketchUrl: sketch?.url ?? null, sketchFileName: sketch?.fileName ?? null },
      include: productTypeInclude,
    });
    return toDomain(row);
  }
}

export class PrismaProductCategoryRepository implements ProductCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: ProductCategoryListQuery): Promise<PageResult<ProductCategory>> {
    const where: Prisma.ProductCategoryWhereInput = query.search
      ? { name: { contains: query.search, mode: "insensitive" } }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.productCategory.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { _count: { select: { productTypes: true } } },
      }),
      this.prisma.productCategory.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        productCount: row._count.productTypes,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findAll(): Promise<ProductCategory[]> {
    const rows = await this.prisma.productCategory.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { productTypes: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      productCount: row._count.productTypes,
    }));
  }

  async create(name: string): Promise<ProductCategory> {
    const row = await this.prisma.productCategory.create({ data: { name } });
    return { id: row.id, name: row.name, productCount: 0 };
  }

  async update(id: string, name: string): Promise<ProductCategory> {
    const row = await this.prisma.productCategory.update({
      where: { id },
      data: { name },
      include: { _count: { select: { productTypes: true } } },
    });
    return { id: row.id, name: row.name, productCount: row._count.productTypes };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productCategory.delete({ where: { id } });
  }
}

export class PrismaAttributeCatalogRepository implements AttributeCatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<AttributeCatalog[]> {
    const rows = await this.prisma.attributeCatalog.findMany({
      include: { values: { orderBy: { value: "asc" } } },
      orderBy: { name: "asc" },
    });
    return rows.map(toCatalogDomain);
  }

  async findById(id: string): Promise<AttributeCatalog | null> {
    const row = await this.prisma.attributeCatalog.findUnique({
      where: { id },
      include: { values: { orderBy: { value: "asc" } } },
    });
    return row ? toCatalogDomain(row) : null;
  }

  async create(name: string): Promise<AttributeCatalog> {
    const row = await this.prisma.attributeCatalog.create({
      data: { name },
      include: { values: true },
    });
    return toCatalogDomain(row);
  }

  async update(id: string, name: string): Promise<AttributeCatalog> {
    const row = await this.prisma.attributeCatalog.update({
      where: { id },
      data: { name },
      include: { values: { orderBy: { value: "asc" } } },
    });
    return toCatalogDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.attributeCatalog.delete({ where: { id } });
  }

  async addValue(attributeCatalogId: string, value: string): Promise<AttributeCatalogValue> {
    const row = await this.prisma.attributeCatalogValue.create({
      data: { attributeCatalogId, value },
    });
    return toValueDomain(row);
  }

  async updateValue(id: string, value: string, active: boolean): Promise<AttributeCatalogValue> {
    const row = await this.prisma.attributeCatalogValue.update({
      where: { id },
      data: { value, active },
    });
    return toValueDomain(row);
  }

  async deleteValue(id: string): Promise<void> {
    await this.prisma.attributeCatalogValue.delete({ where: { id } });
  }
}

type ProductTypeRow = Prisma.ProductTypeGetPayload<{ include: typeof productTypeInclude }>;

function toDomain(row: ProductTypeRow): ProductType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    basePrice: Number(row.basePrice),
    active: row.active,
    sketchUrl: row.sketchUrl,
    sketchFileName: row.sketchFileName,
    categories: row.categories.map((category) => ({ id: category.id, name: category.name })),
    attributeDefinitions: row.attributeDefinitions.map((attribute): AttributeDefinition => ({
      id: attribute.id,
      productTypeId: attribute.productTypeId,
      name: attribute.name,
      dataType: attribute.dataType as AttributeDefinition["dataType"],
      attributeCatalogId: attribute.attributeCatalogId,
      sortOrder: attribute.sortOrder,
      required: attribute.required,
    })),
  };
}

function toCatalogDomain(row: {
  id: string;
  name: string;
  values: { id: string; attributeCatalogId: string; value: string; active: boolean }[];
}): AttributeCatalog {
  return {
    id: row.id,
    name: row.name,
    values: row.values.map(toValueDomain),
  };
}

function toValueDomain(row: {
  id: string;
  attributeCatalogId: string;
  value: string;
  active: boolean;
}): AttributeCatalogValue {
  return { ...row };
}
