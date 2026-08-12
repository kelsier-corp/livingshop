import { AttributeCatalog, AttributeCatalogValue } from "@domain/entities/Catalog";
import { NotFoundError, ValidationError } from "@domain/errors/DomainError";
import { AttributeCatalogRepository } from "@domain/repositories/CatalogRepository";

export class AttributeCatalogService {
  constructor(private readonly repository: AttributeCatalogRepository) {}

  list(): Promise<AttributeCatalog[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<AttributeCatalog> {
    const catalog = await this.repository.findById(id);
    if (!catalog) throw new NotFoundError("AttributeCatalog", id);
    return catalog;
  }

  create(name: string): Promise<AttributeCatalog> {
    if (!name.trim()) throw new ValidationError("name is required");
    return this.repository.create(name);
  }

  async update(id: string, name: string): Promise<AttributeCatalog> {
    if (!name.trim()) throw new ValidationError("name is required");
    await this.getById(id);
    return this.repository.update(id, name);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  async addValue(attributeCatalogId: string, value: string): Promise<AttributeCatalogValue> {
    if (!value.trim()) throw new ValidationError("value is required");
    await this.getById(attributeCatalogId);
    return this.repository.addValue(attributeCatalogId, value);
  }

  updateValue(id: string, value: string, active: boolean): Promise<AttributeCatalogValue> {
    if (!value.trim()) throw new ValidationError("value is required");
    return this.repository.updateValue(id, value, active);
  }

  deleteValue(id: string): Promise<void> {
    return this.repository.deleteValue(id);
  }
}
