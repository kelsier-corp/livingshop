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

  create(name: string, values: string[]): Promise<AttributeCatalog> {
    if (!name.trim()) throw new ValidationError("name is required");
    const trimmedValues = values.map((value) => value.trim()).filter((value) => value.length > 0);
    if (trimmedValues.length === 0) throw new ValidationError("At least one value is required");
    return this.repository.create(name, trimmedValues);
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

  async deleteValue(id: string): Promise<void> {
    const value = await this.repository.findValueById(id);
    if (!value) throw new NotFoundError("AttributeCatalogValue", id);
    const catalog = await this.getById(value.attributeCatalogId);
    if (catalog.values.length <= 1) {
      throw new ValidationError("A catalog must keep at least one value");
    }
    await this.repository.deleteValue(id);
  }
}
