import { apiDelete, apiGet, apiPost, apiPut } from "./client";
import { AttributeCatalog, AttributeCatalogValue } from "./types";

export function fetchAttributeCatalogs(): Promise<AttributeCatalog[]> {
  return apiGet<AttributeCatalog[]>("/attribute-catalogs");
}

export function createAttributeCatalog(name: string): Promise<AttributeCatalog> {
  return apiPost<AttributeCatalog>("/attribute-catalogs", { name });
}

export function deleteAttributeCatalog(id: string): Promise<void> {
  return apiDelete<void>(`/attribute-catalogs/${id}`);
}

export function addAttributeCatalogValue(
  attributeCatalogId: string,
  value: string
): Promise<AttributeCatalogValue> {
  return apiPost<AttributeCatalogValue>(`/attribute-catalogs/${attributeCatalogId}/values`, {
    value,
  });
}

export function updateAttributeCatalogValue(
  attributeCatalogId: string,
  valueId: string,
  value: string,
  active: boolean
): Promise<AttributeCatalogValue> {
  return apiPut<AttributeCatalogValue>(
    `/attribute-catalogs/${attributeCatalogId}/values/${valueId}`,
    { value, active }
  );
}

export function deleteAttributeCatalogValue(
  attributeCatalogId: string,
  valueId: string
): Promise<void> {
  return apiDelete<void>(`/attribute-catalogs/${attributeCatalogId}/values/${valueId}`);
}
