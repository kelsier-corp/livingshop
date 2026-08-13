import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttributeCatalog } from "@domain/entities/Catalog";
import { NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { AttributeCatalogRepository } from "@domain/repositories/CatalogRepository";
import { AttributeCatalogService } from "./AttributeCatalogService";

function buildCatalog(overrides: Partial<AttributeCatalog> = {}): AttributeCatalog {
  return { id: "catalog-1", name: "Tela", values: [], ...overrides };
}

function buildRepository(): AttributeCatalogRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(async () => buildCatalog()),
    create: vi.fn(async (name: string) => buildCatalog({ name })),
    update: vi.fn(async (_id, name: string) => buildCatalog({ name })),
    delete: vi.fn(),
    addValue: vi.fn(),
    updateValue: vi.fn(),
    deleteValue: vi.fn(),
  };
}

describe("AttributeCatalogService", () => {
  let repository: AttributeCatalogRepository;
  let service: AttributeCatalogService;

  beforeEach(() => {
    repository = buildRepository();
    service = new AttributeCatalogService(repository);
  });

  describe("create", () => {
    it("rejects a blank name", async () => {
      await expect(async () => service.create("   ")).rejects.toThrow(ValidationError);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("creates the catalog when the name is non-empty", async () => {
      await service.create("Tela");
      expect(repository.create).toHaveBeenCalledWith("Tela");
    });
  });

  describe("update", () => {
    it("rejects a blank name", async () => {
      await expect(service.update("catalog-1", "")).rejects.toThrow(ValidationError);
    });

    it("404s when the catalog doesn't exist", async () => {
      repository.findById = vi.fn(async () => null);
      await expect(service.update("missing", "Tela")).rejects.toThrow(NotFoundError);
    });
  });

  describe("addValue", () => {
    it("rejects a blank value", async () => {
      await expect(service.addValue("catalog-1", "")).rejects.toThrow(ValidationError);
      expect(repository.addValue).not.toHaveBeenCalled();
    });

    it("404s when the parent catalog doesn't exist", async () => {
      repository.findById = vi.fn(async () => null);
      await expect(service.addValue("missing", "Azul")).rejects.toThrow(NotFoundError);
    });

    it("adds the value once the catalog is confirmed to exist", async () => {
      await service.addValue("catalog-1", "Azul");
      expect(repository.addValue).toHaveBeenCalledWith("catalog-1", "Azul");
    });
  });

  describe("updateValue", () => {
    it("rejects a blank value", async () => {
      await expect(async () => service.updateValue("value-1", "", true)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
