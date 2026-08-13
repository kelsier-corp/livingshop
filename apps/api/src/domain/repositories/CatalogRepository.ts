import {
  AttributeCatalog,
  AttributeCatalogValue,
  ProductCategory,
  ProductCategoryListQuery,
  ProductType,
  ProductTypeInput,
  ProductTypeListQuery,
  ProductTypePriceInput,
} from "../entities/Catalog";
import { PageResult } from "../entities/Pagination";
import { StoredFile } from "./FileStorage";

export interface ProductTypeRepository {
  list(query: ProductTypeListQuery): Promise<PageResult<ProductType>>;
  findAll(): Promise<ProductType[]>;
  findById(id: string): Promise<ProductType | null>;
  create(input: ProductTypeInput): Promise<ProductType>;
  update(id: string, input: ProductTypeInput): Promise<ProductType>;
  delete(id: string): Promise<void>;
  bulkUpdatePrices(prices: ProductTypePriceInput[]): Promise<ProductType[]>;
  applyPercentageIncrease(percentage: number, categoryIds: string[] | null): Promise<ProductType[]>;
  updateSketch(id: string, sketch: StoredFile | null): Promise<ProductType>;
}

export interface ProductCategoryRepository {
  list(query: ProductCategoryListQuery): Promise<PageResult<ProductCategory>>;
  findAll(): Promise<ProductCategory[]>;
  create(name: string): Promise<ProductCategory>;
  update(id: string, name: string): Promise<ProductCategory>;
  delete(id: string): Promise<void>;
}

export interface AttributeCatalogRepository {
  findAll(): Promise<AttributeCatalog[]>;
  findById(id: string): Promise<AttributeCatalog | null>;
  create(name: string, values: string[]): Promise<AttributeCatalog>;
  update(id: string, name: string): Promise<AttributeCatalog>;
  delete(id: string): Promise<void>;
  addValue(attributeCatalogId: string, value: string): Promise<AttributeCatalogValue>;
  findValueById(id: string): Promise<AttributeCatalogValue | null>;
  updateValue(id: string, value: string, active: boolean): Promise<AttributeCatalogValue>;
  deleteValue(id: string): Promise<void>;
}
