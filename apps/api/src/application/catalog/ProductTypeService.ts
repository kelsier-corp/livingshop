import {
  PercentagePriceIncreaseInput,
  ProductType,
  ProductTypeInput,
  ProductTypeListQuery,
  ProductTypePriceInput,
} from "@domain/entities/Catalog";
import { PageResult } from "@domain/entities/Pagination";
import { NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { ProductTypeRepository } from "@domain/repositories/CatalogRepository";
import { FileStorage } from "@domain/repositories/FileStorage";

export class ProductTypeService {
  constructor(
    private readonly productTypeRepository: ProductTypeRepository,
    private readonly fileStorage: FileStorage
  ) {}

  list(query: ProductTypeListQuery): Promise<PageResult<ProductType>> {
    return this.productTypeRepository.list(query);
  }

  listAll(): Promise<ProductType[]> {
    return this.productTypeRepository.findAll();
  }

  async getById(id: string): Promise<ProductType> {
    const productType = await this.productTypeRepository.findById(id);
    if (!productType) throw new NotFoundError("ProductType", id);
    return productType;
  }

  create(input: ProductTypeInput): Promise<ProductType> {
    this.assertValid(input);
    return this.productTypeRepository.create(input);
  }

  async update(id: string, input: ProductTypeInput): Promise<ProductType> {
    this.assertValid(input);
    await this.getById(id);
    return this.productTypeRepository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.productTypeRepository.delete(id);
  }

  bulkUpdatePrices(prices: ProductTypePriceInput[]): Promise<ProductType[]> {
    for (const price of prices) {
      if (price.basePrice < 0) throw new ValidationError("basePrice cannot be negative");
    }
    return this.productTypeRepository.bulkUpdatePrices(prices);
  }

  async uploadSketch(
    id: string,
    file: { originalName: string; buffer: Buffer; mimeType: string }
  ): Promise<ProductType> {
    const productType = await this.getById(id);
    if (productType.sketchUrl) await this.fileStorage.delete(productType.sketchUrl);
    const stored = await this.fileStorage.save(file.originalName, file.buffer, file.mimeType);
    return this.productTypeRepository.updateSketch(id, stored);
  }

  async removeSketch(id: string): Promise<ProductType> {
    const productType = await this.getById(id);
    if (productType.sketchUrl) await this.fileStorage.delete(productType.sketchUrl);
    return this.productTypeRepository.updateSketch(id, null);
  }

  applyPercentageIncrease(input: PercentagePriceIncreaseInput): Promise<ProductType[]> {
    if (input.percentage <= -100) throw new ValidationError("percentage must be greater than -100");
    if (input.scope === "categories" && (!input.categoryIds || input.categoryIds.length === 0)) {
      throw new ValidationError("categoryIds is required when scope is categories");
    }
    const categoryIds = input.scope === "all" ? null : input.categoryIds!;
    return this.productTypeRepository.applyPercentageIncrease(input.percentage, categoryIds);
  }

  private assertValid(input: ProductTypeInput): void {
    if (!input.name.trim()) throw new ValidationError("name is required");
    if (input.basePrice < 0) throw new ValidationError("basePrice cannot be negative");
    for (const attribute of input.attributeDefinitions) {
      if (!attribute.name.trim()) {
        throw new ValidationError("Every attribute definition needs a name");
      }
      if (attribute.dataType === "catalog" && !attribute.attributeCatalogId) {
        throw new ValidationError(
          `Attribute "${attribute.name}" is of type catalog and needs attributeCatalogId`
        );
      }
    }
  }
}
