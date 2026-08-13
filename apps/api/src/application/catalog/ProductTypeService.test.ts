import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductTypeInput } from "@domain/entities/Catalog";
import { ValidationError } from "@domain/errors/DomainError";
import { ProductTypeRepository } from "@domain/repositories/CatalogRepository";
import { FileStorage } from "@domain/repositories/FileStorage";
import { ProductTypeService } from "./ProductTypeService";

function buildRepository(): ProductTypeRepository {
  return {
    list: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(async (input: ProductTypeInput) => ({
      id: "product-1",
      name: input.name,
      description: input.description ?? null,
      basePrice: input.basePrice,
      active: input.active ?? true,
      sketchUrl: null,
      sketchFileName: null,
      includeInFactorySheet: true,
      categories: [],
      attributeDefinitions: [],
    })),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpdatePrices: vi.fn(async (prices) => prices.map(() => ({}) as never)),
    applyPercentageIncrease: vi.fn(),
    updateSketch: vi.fn(),
  };
}

function buildFileStorage(): FileStorage {
  return { save: vi.fn(), delete: vi.fn() };
}

function buildInput(overrides: Partial<ProductTypeInput> = {}): ProductTypeInput {
  return {
    name: "Sofá 3 cuerpos",
    basePrice: 100000,
    categoryIds: [],
    attributeDefinitions: [],
    ...overrides,
  };
}

describe("ProductTypeService", () => {
  let repository: ProductTypeRepository;
  let service: ProductTypeService;

  beforeEach(() => {
    repository = buildRepository();
    service = new ProductTypeService(repository, buildFileStorage());
  });

  describe("create", () => {
    it("rejects a blank name", async () => {
      await expect(async () => service.create(buildInput({ name: "   " }))).rejects.toThrow(
        ValidationError
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("rejects a negative basePrice", async () => {
      await expect(async () => service.create(buildInput({ basePrice: -1 }))).rejects.toThrow(
        ValidationError
      );
    });

    it("accepts a basePrice of exactly 0", async () => {
      await expect(service.create(buildInput({ basePrice: 0 }))).resolves.toBeDefined();
    });

    it("rejects an attribute definition without a name", async () => {
      const input = buildInput({
        attributeDefinitions: [{ name: "", dataType: "text", sortOrder: 0, required: false }],
      });
      await expect(async () => service.create(input)).rejects.toThrow(ValidationError);
    });

    it("rejects a catalog-type attribute with no attributeCatalogId", async () => {
      const input = buildInput({
        attributeDefinitions: [
          { name: "Tela", dataType: "catalog", sortOrder: 0, required: false },
        ],
      });
      await expect(async () => service.create(input)).rejects.toThrow(/attributeCatalogId/);
    });

    it("accepts a catalog-type attribute that does specify attributeCatalogId", async () => {
      const input = buildInput({
        attributeDefinitions: [
          {
            name: "Tela",
            dataType: "catalog",
            attributeCatalogId: "catalog-1",
            sortOrder: 0,
            required: false,
          },
        ],
      });
      await expect(service.create(input)).resolves.toBeDefined();
    });

    it("passes the validated input through to the repository unchanged", async () => {
      const input = buildInput({ name: "Sillón" });
      await service.create(input);
      expect(repository.create).toHaveBeenCalledWith(input);
    });
  });

  describe("bulkUpdatePrices", () => {
    it("rejects the whole batch if any price is negative", async () => {
      await expect(async () =>
        service.bulkUpdatePrices([
          { id: "p1", basePrice: 100 },
          { id: "p2", basePrice: -5 },
        ])
      ).rejects.toThrow(ValidationError);
      expect(repository.bulkUpdatePrices).not.toHaveBeenCalled();
    });

    it("forwards a batch of non-negative prices to the repository", async () => {
      const prices = [{ id: "p1", basePrice: 100 }];
      await service.bulkUpdatePrices(prices);
      expect(repository.bulkUpdatePrices).toHaveBeenCalledWith(prices);
    });
  });

  describe("applyPercentageIncrease", () => {
    it("rejects a percentage that would zero out or invert prices", async () => {
      await expect(async () =>
        service.applyPercentageIncrease({ scope: "all", percentage: -100 })
      ).rejects.toThrow(ValidationError);
    });

    it("rejects scope 'categories' with no categoryIds", async () => {
      await expect(async () =>
        service.applyPercentageIncrease({ scope: "categories", categoryIds: [], percentage: 10 })
      ).rejects.toThrow(ValidationError);
    });

    it("passes null categoryIds through for scope 'all'", async () => {
      await service.applyPercentageIncrease({ scope: "all", percentage: 10 });
      expect(repository.applyPercentageIncrease).toHaveBeenCalledWith(10, null);
    });
  });
});
