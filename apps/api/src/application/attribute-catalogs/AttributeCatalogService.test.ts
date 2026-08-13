import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttributeCatalog, AttributeCatalogValue } from "@domain/entities/Catalog";
import { NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { AttributeCatalogRepository } from "@domain/repositories/CatalogRepository";
import { AttributeCatalogService } from "./AttributeCatalogService";

function buildCatalog(overrides: Partial<AttributeCatalog> = {}): AttributeCatalog {
  return {
    id: "catalog-1",
    name: "Tela",
    values: [{ id: "value-1", attributeCatalogId: "catalog-1", value: "Azul", active: true }],
    ...overrides,
  };
}

function buildValue(overrides: Partial<AttributeCatalogValue> = {}): AttributeCatalogValue {
  return {
    id: "value-1",
    attributeCatalogId: "catalog-1",
    value: "Azul",
    active: true,
    ...overrides,
  };
}

function buildRepository(): AttributeCatalogRepository {
  return {
    list: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(async () => buildCatalog()),
    create: vi.fn(async (name: string) => buildCatalog({ name })),
    update: vi.fn(async (_id, name: string) => buildCatalog({ name })),
    delete: vi.fn(),
    addValue: vi.fn(),
    findValueById: vi.fn(async () => buildValue()),
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
      await expect(async () => service.create("   ", ["Azul"])).rejects.toThrow(ValidationError);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("rejects an empty values array", async () => {
      await expect(async () => service.create("Tela", [])).rejects.toThrow(ValidationError);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it("rejects a values array containing only blanks", async () => {
      await expect(async () => service.create("Tela", ["  ", ""])).rejects.toThrow(ValidationError);
    });

    it("creates the catalog with the trimmed, non-empty values once name and values are valid", async () => {
      await service.create("Tela", [" Azul ", "Rojo", "  "]);
      expect(repository.create).toHaveBeenCalledWith("Tela", ["Azul", "Rojo"]);
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

  describe("deleteValue", () => {
    it("404s when the value doesn't exist", async () => {
      repository.findValueById = vi.fn(async () => null);
      await expect(service.deleteValue("missing")).rejects.toThrow(NotFoundError);
    });

    it("rejects deleting the catalog's last remaining value", async () => {
      repository.findById = vi.fn(async () => buildCatalog({ values: [buildValue()] }));
      await expect(service.deleteValue("value-1")).rejects.toThrow(ValidationError);
      expect(repository.deleteValue).not.toHaveBeenCalled();
    });

    it("deletes the value when at least one other value remains", async () => {
      repository.findById = vi.fn(async () =>
        buildCatalog({ values: [buildValue(), buildValue({ id: "value-2", value: "Rojo" })] })
      );
      await service.deleteValue("value-1");
      expect(repository.deleteValue).toHaveBeenCalledWith("value-1");
    });
  });
});
