import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllAttributeCatalogs } from "@/api/attributeCatalogs";
import { OrderInput, createOrder } from "@/api/orders";
import { fetchAllProductCategories } from "@/api/productCategories";
import { fetchAllProductTypes } from "@/api/productTypes";
import { AttributeValues, ProductType } from "@/api/types";
import { useCurrentUser } from "@/auth/CurrentUserContext";
import { CatalogValueSelect } from "@/components/CatalogValueSelect";
import { Collapsible } from "@/components/Collapsible";
import { CustomerPicker } from "@/components/CustomerPicker";
import { ProductTypePicker } from "@/components/ProductTypePicker";
import {
  Card,
  FieldLabel,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from "@/components/ui";
import { isNumericInput, respectsMinimum } from "@/utils/number";

interface CustomAttribute {
  key: string;
  value: string;
}

interface ItemDraft {
  key: string;
  productTypeId: string;
  quantity: number;
  deliveryDate: string;
  attributeValues: Record<string, string>;
  customAttributes: CustomAttribute[];
  factoryNotes: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem(deliveryDate: string): ItemDraft {
  return {
    key: crypto.randomUUID(),
    productTypeId: "",
    quantity: 1,
    deliveryDate,
    attributeValues: {},
    customAttributes: [],
    factoryNotes: "",
  };
}

function buildAttributes(item: ItemDraft): AttributeValues {
  const attributes: AttributeValues = { ...item.attributeValues };
  for (const custom of item.customAttributes) {
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

export function OrderFormPage() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { data: productTypes = [] } = useQuery({
    queryKey: ["product-types-all"],
    queryFn: fetchAllProductTypes,
  });
  const { data: productCategories = [] } = useQuery({
    queryKey: ["product-categories-all"],
    queryFn: fetchAllProductCategories,
  });
  const { data: attributeCatalogs = [] } = useQuery({
    queryKey: ["attribute-catalogs-all"],
    queryFn: fetchAllAttributeCatalogs,
  });

  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [sameDateForAll, setSameDateForAll] = useState(true);
  const [sharedDeliveryDate, setSharedDeliveryDate] = useState(today());
  const [items, setItems] = useState<ItemDraft[]>([emptyItem(today())]);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => navigate(`/orders/${order.id}`),
  });

  function productTypeFor(id: string): ProductType | undefined {
    return productTypes.find((productType) => productType.id === id);
  }

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleSelectProductType(index: number, productTypeId: string) {
    updateItem(index, { productTypeId, attributeValues: {} });
  }

  function addItem() {
    setItems([...items, emptyItem(sameDateForAll ? sharedDeliveryDate : today())]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function addCustomAttribute(index: number) {
    updateItem(index, {
      customAttributes: [...items[index].customAttributes, { key: "", value: "" }],
    });
  }

  function updateCustomAttribute(
    itemIndex: number,
    attrIndex: number,
    patch: Partial<CustomAttribute>
  ) {
    const item = items[itemIndex];
    const customAttributes = item.customAttributes.map((attr, i) =>
      i === attrIndex ? { ...attr, ...patch } : attr
    );
    updateItem(itemIndex, { customAttributes });
  }

  function removeCustomAttribute(itemIndex: number, attrIndex: number) {
    const item = items[itemIndex];
    updateItem(itemIndex, {
      customAttributes: item.customAttributes.filter((_, i) => i !== attrIndex),
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!currentUser || !customerId) return;

    const input: OrderInput = {
      customerId,
      salespersonId: currentUser.id,
      notes: notes || null,
      items: items.map((item) => ({
        productTypeId: item.productTypeId,
        quantity: item.quantity,
        deliveryDate: sameDateForAll ? sharedDeliveryDate : item.deliveryDate,
        attributes: buildAttributes(item),
        factoryNotes: item.factoryNotes || null,
      })),
    };
    createMutation.mutate(input);
  }

  return (
    <div>
      <PageHeader title="Nueva orden" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FieldLabel>Cliente</FieldLabel>
              <CustomerPicker selectedCustomerId={customerId} onSelect={setCustomerId} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="same-date"
                type="checkbox"
                checked={sameDateForAll}
                onChange={(e) => setSameDateForAll(e.target.checked)}
              />
              <label htmlFor="same-date" className="text-sm text-ink-soft">
                Misma fecha de entrega para todos los productos de esta orden
              </label>
            </div>
            {sameDateForAll && (
              <div>
                <FieldLabel>Fecha de entrega</FieldLabel>
                <TextInput
                  type="date"
                  value={sharedDeliveryDate}
                  onChange={(e) => setSharedDeliveryDate(e.target.value)}
                />
              </div>
            )}
            <div className="col-span-2">
              <FieldLabel>Observaciones</FieldLabel>
              <TextArea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </Card>

        {items.map((item, index) => {
          const productType = productTypeFor(item.productTypeId);
          const total = productType ? productType.basePrice * item.quantity : 0;
          return (
            <Card key={item.key}>
              <Collapsible
                title={`Producto ${index + 1}${productType ? `: ${productType.name}` : ""}`}
                subtitle={productType ? formatCurrency(total) : undefined}
                actions={
                  items.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-signal hover:underline"
                      onClick={() => removeItem(index)}
                    >
                      quitar producto
                    </button>
                  )
                }
              >
                <div>
                  <FieldLabel>Producto</FieldLabel>
                  <ProductTypePicker
                    productTypes={productTypes}
                    categories={productCategories}
                    selectedProductTypeId={item.productTypeId}
                    onSelect={(productTypeId) => handleSelectProductType(index, productTypeId)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Cantidad</FieldLabel>
                    <TextInput
                      type="text"
                      inputMode="numeric"
                      required
                      value={item.quantity}
                      onChange={(e) => {
                        if (
                          isNumericInput(e.target.value, { allowDecimal: false }) &&
                          respectsMinimum(e.target.value, 1)
                        ) {
                          updateItem(index, { quantity: Number(e.target.value) });
                        }
                      }}
                    />
                  </div>

                  {!sameDateForAll && (
                    <div>
                      <FieldLabel>Fecha de entrega</FieldLabel>
                      <TextInput
                        type="date"
                        required
                        value={item.deliveryDate}
                        onChange={(e) => updateItem(index, { deliveryDate: e.target.value })}
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
                              attributeCatalogs.find(
                                (catalog) => catalog.id === attribute.attributeCatalogId
                              )?.values ?? []
                            }
                            value={item.attributeValues[attribute.name] ?? ""}
                            onChange={(value) =>
                              updateItem(index, {
                                attributeValues: {
                                  ...item.attributeValues,
                                  [attribute.name]: value,
                                },
                              })
                            }
                          />
                        ) : (
                          <TextInput
                            required={attribute.required}
                            value={item.attributeValues[attribute.name] ?? ""}
                            onChange={(e) =>
                              updateItem(index, {
                                attributeValues: {
                                  ...item.attributeValues,
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
                    <FieldLabel className="mb-0">
                      Campos personalizados para este producto
                    </FieldLabel>
                    <SecondaryButton type="button" onClick={() => addCustomAttribute(index)}>
                      Agregar campo
                    </SecondaryButton>
                  </div>
                  <div className="space-y-2">
                    {item.customAttributes.map((custom, attrIndex) => (
                      <div key={attrIndex} className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <TextInput
                            placeholder="Nombre del campo"
                            value={custom.key}
                            onChange={(e) =>
                              updateCustomAttribute(index, attrIndex, { key: e.target.value })
                            }
                          />
                        </div>
                        <div className="col-span-7">
                          <TextInput
                            placeholder="Valor"
                            value={custom.value}
                            onChange={(e) =>
                              updateCustomAttribute(index, attrIndex, { value: e.target.value })
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="col-span-1 text-xs text-signal hover:underline"
                          onClick={() => removeCustomAttribute(index, attrIndex)}
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
                    value={item.factoryNotes}
                    onChange={(e) => updateItem(index, { factoryNotes: e.target.value })}
                  />
                </div>
              </Collapsible>
            </Card>
          );
        })}

        <div className="flex items-center justify-between">
          <SecondaryButton type="button" onClick={addItem}>
            Agregar otro producto
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={createMutation.isPending || !customerId}>
            Crear orden
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
