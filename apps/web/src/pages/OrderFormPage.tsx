import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllAttributeCatalogs } from "@/api/attributeCatalogs";
import { OrderInput, createOrder } from "@/api/orders";
import { fetchAllProductCategories } from "@/api/productCategories";
import { fetchAllProductTypes } from "@/api/productTypes";
import { ProductType } from "@/api/types";
import { useCurrentUser } from "@/auth/CurrentUserContext";
import { Collapsible } from "@/components/Collapsible";
import { CustomerPicker } from "@/components/CustomerPicker";
import {
  OrderItemDraft,
  OrderItemFields,
  buildItemAttributes,
  emptyOrderItemDraft,
} from "@/components/OrderItemFields";
import {
  Card,
  FieldLabel,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from "@/components/ui";

// The React key has to survive reordering, so it lives alongside the draft rather than inside it.
interface ItemDraft extends OrderItemDraft {
  key: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyItem(deliveryDate: string): ItemDraft {
  return { key: crypto.randomUUID(), ...emptyOrderItemDraft(deliveryDate) };
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

  function addItem() {
    setItems([...items, emptyItem(sameDateForAll ? sharedDeliveryDate : today())]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
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
        attributes: buildItemAttributes(item),
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
                <OrderItemFields
                  draft={item}
                  productTypes={productTypes}
                  categories={productCategories}
                  attributeCatalogs={attributeCatalogs}
                  showDeliveryDate={!sameDateForAll}
                  onChange={(patch) => updateItem(index, patch)}
                />
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
