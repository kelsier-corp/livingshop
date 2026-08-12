import { AttributeDataType } from "./enums";

export interface AttributeCatalog {
  id: string;
  name: string;
  values: AttributeCatalogValue[];
}

export interface AttributeCatalogValue {
  id: string;
  attributeCatalogId: string;
  value: string;
  active: boolean;
}

export interface ProductCategoryRef {
  id: string;
  name: string;
}

export interface ProductCategory extends ProductCategoryRef {
  productCount: number;
}

export interface ProductType {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  active: boolean;
  sketchUrl: string | null;
  sketchFileName: string | null;
  categories: ProductCategoryRef[];
  attributeDefinitions: AttributeDefinition[];
}

export interface ProductTypePriceInput {
  id: string;
  basePrice: number;
}

export interface PercentagePriceIncreaseInput {
  scope: "all" | "categories";
  categoryIds?: string[];
  percentage: number;
}

export interface AttributeDefinition {
  id: string;
  productTypeId: string;
  name: string;
  dataType: AttributeDataType;
  attributeCatalogId: string | null;
  sortOrder: number;
  required: boolean;
}

export interface AttributeDefinitionInput {
  name: string;
  dataType: AttributeDataType;
  attributeCatalogId?: string | null;
  sortOrder?: number;
  required?: boolean;
}

export interface ProductTypeInput {
  name: string;
  description?: string | null;
  basePrice: number;
  categoryIds: string[];
  active?: boolean;
  attributeDefinitions: AttributeDefinitionInput[];
}

export interface ProductTypeListQuery {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string;
}

export interface ProductCategoryListQuery {
  page: number;
  pageSize: number;
  search?: string;
}
