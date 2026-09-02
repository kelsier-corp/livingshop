import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
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
import { formatCurrency } from "@/utils/currency";

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

// Client-side only: there's no order id yet while the form is being filled out, so recovering an
// interrupted "crear orden" (reload, accidental navigation) has to live in localStorage rather
// than the backend.
const DRAFT_STORAGE_KEY = "livingshop:order-draft";

interface StoredOrderDraft {
  customerId: string;
  notes: string;
  sameDateForAll: boolean;
  sharedDeliveryDate: string;
  items: OrderItemDraft[];
}

function loadStoredDraft(): StoredOrderDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredOrderDraft) : null;
  } catch {
    return null;
  }
}

function saveStoredDraft(draft: StoredOrderDraft) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function clearStoredDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

function itemHasContent(item: OrderItemDraft): boolean {
  return (
    !!item.productTypeId ||
    item.factoryNotes.trim() !== "" ||
    Object.values(item.attributeValues).some((value) => value.trim() !== "") ||
    item.customAttributes.some((custom) => custom.key.trim() !== "" || custom.value.trim() !== "")
  );
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
  // Read once on mount, before the autosave effect below has a chance to run — otherwise a fresh
  // blank form would overwrite the very draft we're about to offer to restore.
  const [pendingDraft, setPendingDraft] = useState<StoredOrderDraft | null>(() =>
    loadStoredDraft()
  );

  const hasContent = customerId !== "" || notes.trim() !== "" || items.some(itemHasContent);
  // Stays up until the user explicitly resolves it — restore, discard, or a successful submit —
  // not merely because they started typing. Typing without touching either button isn't a choice,
  // so it shouldn't silently make the offer disappear.
  const showDraftRecovery = !!pendingDraft;

  useEffect(() => {
    if (!hasContent) return;
    saveStoredDraft({
      customerId,
      notes,
      sameDateForAll,
      sharedDeliveryDate,
      items: items.map(({ key: _key, ...rest }) => rest),
    });
  }, [customerId, notes, sameDateForAll, sharedDeliveryDate, items, hasContent]);

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      clearStoredDraft();
      setPendingDraft(null);
      navigate(`/orders/${order.id}`);
    },
  });

  function restoreDraft() {
    if (!pendingDraft) return;
    setCustomerId(pendingDraft.customerId);
    setNotes(pendingDraft.notes);
    setSameDateForAll(pendingDraft.sameDateForAll);
    setSharedDeliveryDate(pendingDraft.sharedDeliveryDate);
    setItems(pendingDraft.items.map((item) => ({ ...item, key: crypto.randomUUID() })));
    setPendingDraft(null);
  }

  function discardDraft() {
    clearStoredDraft();
    setPendingDraft(null);
  }

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

      {showDraftRecovery && (
        <Card className="mb-6 flex items-center justify-between gap-4 border-accent/40 bg-accent/5">
          <p className="text-sm text-ink-soft">
            Tenés una orden sin terminar guardada en este navegador. ¿Querés retomarla?
          </p>
          <div className="flex shrink-0 gap-2">
            <SecondaryButton type="button" onClick={discardDraft}>
              Descartar
            </SecondaryButton>
            <PrimaryButton type="button" onClick={restoreDraft}>
              Restaurar borrador
            </PrimaryButton>
          </div>
        </Card>
      )}

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

        {createMutation.isError && (
          <p className="text-sm text-signal">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "No se pudo crear la orden."}
          </p>
        )}

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
