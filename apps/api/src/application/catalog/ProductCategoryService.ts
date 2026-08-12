import { ProductCategory, ProductCategoryListQuery } from "@domain/entities/Catalog";
import { PageResult } from "@domain/entities/Pagination";
import { ValidationError } from "@domain/errors/DomainError";
import { ProductCategoryRepository } from "@domain/repositories/CatalogRepository";

export class ProductCategoryService {
  constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

  list(query: ProductCategoryListQuery): Promise<PageResult<ProductCategory>> {
    return this.productCategoryRepository.list(query);
  }

  listAll(): Promise<ProductCategory[]> {
    return this.productCategoryRepository.findAll();
  }

  create(name: string): Promise<ProductCategory> {
    if (!name.trim()) throw new ValidationError("name is required");
    return this.productCategoryRepository.create(name);
  }

  update(id: string, name: string): Promise<ProductCategory> {
    if (!name.trim()) throw new ValidationError("name is required");
    return this.productCategoryRepository.update(id, name);
  }

  delete(id: string): Promise<void> {
    return this.productCategoryRepository.delete(id);
  }
}
