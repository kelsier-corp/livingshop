import { AttributeCatalog, AttributeValues, ProductCategory, ProductType } from "@/api/types";
import { CatalogValueSelect } from "@/components/CatalogValueSelect";
import { ProductTypePicker } from "@/components/ProductTypePicker";
import { FieldLabel, SecondaryButton, TextArea, TextInput } from "@/components/ui";
import { isNumericInput, respectsMinimum } from "@/utils/number";

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface OrderItemDraft {
  productTypeId: string;
  quantity: number;
  deliveryDate: string;
  attributeValues: Record<string, string>;
  customAttributes: CustomAttribute[];
  factoryNotes: string;
}

export function emptyOrderItemDraft(deliveryDate: string): OrderItemDraft {
  return {
    productTypeId: "",
    quantity: 1,
    deliveryDate,
    attributeValues: {},
    customAttributes: [],
    factoryNotes: "",
  };
}

// The attributes column is a free-form JSON map, so the product's declared attributes and any
// one-off custom fields the salesperson typed get merged into the same object.
export function buildItemAttributes(draft: OrderItemDraft): AttributeValues {
  const attributes: AttributeValues = { ...draft.attributeValues };
  for (const custom of draft.customAttributes) {
    if (custom.key.trim()) attributes[custom.key.trim()] = custom.value;
  }
  return attributes;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

interface Props {
  draft: OrderItemDraft;
  productTypes: ProductType[];
  categories: ProductCategory[];
  attributeCatalogs: AttributeCatalog[];
  // The new-order form hides this when one delivery date is shared across every product; adding a
  // product to an existing order always asks for it.
  showDeliveryDate: boolean;
  onChange: (patch: Partial<OrderItemDraft>) => void;
}

// Shared by the new-order form and the "add a product" modal on an existing order, so both go
// through the same product picker, attribute rendering and custom-field editor.
export function OrderItemFields({
  draft,
  productTypes,
  categories,
  attributeCatalogs,
  showDeliveryDate,
  onChange,
}: Props) {
  const productType = productTypes.find((candidate) => candidate.id === draft.productTypeId);

  function updateCustomAttribute(index: number, patch: Partial<CustomAttribute>) {
    onChange({
      customAttributes: draft.customAttributes.map((attr, i) =>
        i === index ? { ...attr, ...patch } : attr
      ),
    });
  }

  return (
    <>
      <div>
        <FieldLabel>Producto</FieldLabel>
        <ProductTypePicker
          productTypes={productTypes}
          categories={categories}
          selectedProductTypeId={draft.productTypeId}
          // Clearing the attribute values matters: they're keyed by the previous product's
          // attribute names and would otherwise be sent along with the new product.
          onSelect={(productTypeId) => onChange({ productTypeId, attributeValues: {} })}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <FieldLabel>Cantidad</FieldLabel>
          <TextInput
            type="text"
            inputMode="numeric"
            required
            value={draft.quantity}
            onChange={(e) => {
              if (
                isNumericInput(e.target.value, { allowDecimal: false }) &&
                respectsMinimum(e.target.value, 1)
              ) {
                onChange({ quantity: Number(e.target.value) });
              }
            }}
          />
        </div>

        {showDeliveryDate && (
          <div>
            <FieldLabel>Fecha de entrega</FieldLabel>
            <TextInput
              type="date"
              required
              value={draft.deliveryDate}
              onChange={(e) => onChange({ deliveryDate: e.target.value })}
            />
          </div>
        )}
        {productType && (
          <div>
            <FieldLabel>Precio unitario</FieldLabel>
            <p className="pt-1.5 font-mono text-sm text-ink">
              {formatCurrency(productType.basePrice)}
            </p>
          </div>
        )}
      </div>

      {productType && productType.attributeDefinitions.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {productType.attributeDefinitions.map((attribute) => (
            <div key={attribute.id}>
              <FieldLabel>
                {attribute.name}
                {attribute.required ? " *" : ""}
              </FieldLabel>
              {attribute.dataType === "catalog" ? (
                <CatalogValueSelect
                  required={attribute.required}
                  values={
                    attributeCatalogs.find((catalog) => catalog.id === attribute.attributeCatalogId)
                      ?.values ?? []
                  }
                  value={draft.attributeValues[attribute.name] ?? ""}
                  onChange={(value) =>
                    onChange({
                      attributeValues: { ...draft.attributeValues, [attribute.name]: value },
                    })
                  }
                />
              ) : (
                <TextInput
                  required={attribute.required}
                  value={draft.attributeValues[attribute.name] ?? ""}
                  onChange={(e) =>
                    onChange({
                      attributeValues: {
                        ...draft.attributeValues,
                        [attribute.name]: e.target.value,
                      },
                    })
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <FieldLabel className="mb-0">Campos personalizados para este producto</FieldLabel>
          <SecondaryButton
            type="button"
            onClick={() =>
              onChange({ customAttributes: [...draft.customAttributes, { key: "", value: "" }] })
            }
          >
            Agregar campo
          </SecondaryButton>
        </div>
        <div className="space-y-2">
          {draft.customAttributes.map((custom, attrIndex) => (
            <div key={attrIndex} className="grid grid-cols-12 gap-2">
              <div className="col-span-4">
                <TextInput
                  placeholder="Nombre del campo"
                  value={custom.key}
                  onChange={(e) => updateCustomAttribute(attrIndex, { key: e.target.value })}
                />
              </div>
              <div className="col-span-7">
                <TextInput
                  placeholder="Valor"
                  value={custom.value}
                  onChange={(e) => updateCustomAttribute(attrIndex, { value: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="col-span-1 text-xs text-signal hover:underline"
                onClick={() =>
                  onChange({
                    customAttributes: draft.customAttributes.filter((_, i) => i !== attrIndex),
                  })
                }
              >
                quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <FieldLabel>Comentarios para fábrica</FieldLabel>
        <TextArea
          rows={2}
          placeholder="Cualquier especificación que necesite saber fábrica sobre este producto"
          value={draft.factoryNotes}
          onChange={(e) => onChange({ factoryNotes: e.target.value })}
        />
      </div>
    </>
  );
}
