import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAllAttributeCatalogs } from "@/api/attributeCatalogs";
import { pdfUrl } from "@/api/client";
import { fetchCustomer } from "@/api/customers";
import {
  addOrderItem,
  addPayment,
  deleteAttachment,
  fetchOrder,
  setOrderItemActive,
  updateOrderStatus,
  updatePayment,
  uploadAttachment,
} from "@/api/orders";
import { fetchPaymentMethods } from "@/api/paymentMethods";
import { fetchAllProductCategories } from "@/api/productCategories";
import { fetchAllProductTypes } from "@/api/productTypes";
import { OrderStatus, Payment } from "@/api/types";
import { Collapsible } from "@/components/Collapsible";
import { Modal } from "@/components/Modal";
import { ORDER_STATUS_LABEL, OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  OrderItemDraft,
  OrderItemFields,
  buildItemAttributes,
  emptyOrderItemDraft,
} from "@/components/OrderItemFields";
import {
  Card,
  FieldLabel,
  FileInput,
  PageHeader,
  PrimaryButton,
  Select,
  SecondaryButton,
  TextInput,
} from "@/components/ui";
import { isNumericInput, respectsMinimum } from "@/utils/number";

const STATUSES: OrderStatus[] = ["draft", "confirmed", "in_production", "delivered", "cancelled"];

// Mirrors ITEM_EDITABLE_STATUSES in the API's domain/policies/orderEditing.ts — the server is the
// one that enforces it, this only decides whether to offer the controls.
const ITEM_EDITABLE_STATUSES: OrderStatus[] = ["draft", "confirmed"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-AR");
}

// Printing the factory sheet twice in one day is common — showing only the date makes it
// impossible to tell which printout is the current one.
function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });
  const { data: customer } = useQuery({
    queryKey: ["customers", order?.customerId],
    queryFn: () => fetchCustomer(order!.customerId),
    enabled: !!order,
  });
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: fetchPaymentMethods,
  });
  const activeMethods = paymentMethods.filter((m) => m.active);
  const canEditItems = !!order && ITEM_EDITABLE_STATUSES.includes(order.status);

  // Only needed by the "add a product" modal, so they're not fetched until the order allows it.
  const { data: productTypes = [] } = useQuery({
    queryKey: ["product-types-all"],
    queryFn: fetchAllProductTypes,
    enabled: canEditItems,
  });
  const { data: productCategories = [] } = useQuery({
    queryKey: ["product-categories-all"],
    queryFn: fetchAllProductCategories,
    enabled: canEditItems,
  });
  const { data: attributeCatalogs = [] } = useQuery({
    queryKey: ["attribute-catalogs-all"],
    queryFn: fetchAllAttributeCatalogs,
    enabled: canEditItems,
  });

  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "", note: "" });
  const [pendingPreview, setPendingPreview] = useState<{ itemId: string; url: string } | null>(
    null
  );
  const [addingItem, setAddingItem] = useState(false);
  const [itemDraft, setItemDraft] = useState<OrderItemDraft>(() => emptyOrderItemDraft(today()));
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentEdit, setPaymentEdit] = useState({ amount: "", method: "", note: "" });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders", id] });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id!, status),
    onSuccess: invalidate,
  });

  const paymentMutation = useMutation({
    mutationFn: () =>
      addPayment(id!, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method || activeMethods[0]?.name || "",
        note: paymentForm.note || null,
      }),
    onSuccess: () => {
      invalidate();
      setPaymentForm({ amount: "", method: "", note: "" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      addOrderItem(id!, {
        productTypeId: itemDraft.productTypeId,
        quantity: itemDraft.quantity,
        deliveryDate: itemDraft.deliveryDate,
        attributes: buildItemAttributes(itemDraft),
        factoryNotes: itemDraft.factoryNotes || null,
      }),
    onSuccess: () => {
      invalidate();
      setAddingItem(false);
      setItemDraft(emptyOrderItemDraft(today()));
    },
  });

  const itemActiveMutation = useMutation({
    mutationFn: ({ itemId, active }: { itemId: string; active: boolean }) =>
      setOrderItemActive(id!, itemId, active),
    onSuccess: invalidate,
  });

  const editPaymentMutation = useMutation({
    mutationFn: () =>
      updatePayment(id!, editingPayment!.id, {
        amount: Number(paymentEdit.amount),
        method: paymentEdit.method,
        note: paymentEdit.note || null,
      }),
    onSuccess: () => {
      invalidate();
      setEditingPayment(null);
    },
  });

  const attachmentMutation = useMutation({
    mutationFn: ({ orderItemId, file }: { orderItemId: string; file: File }) =>
      uploadAttachment(orderItemId, "reference_photo", file),
    onSuccess: invalidate,
    onSettled: () => {
      setPendingPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return null;
      });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: invalidate,
  });

  function handleFileSelected(orderItemId: string, file: File) {
    setPendingPreview({ itemId: orderItemId, url: URL.createObjectURL(file) });
    attachmentMutation.mutate({ orderItemId, file });
  }

  function handleDeleteAttachment(attachmentId: string) {
    if (window.confirm("¿Eliminar este adjunto? Esta acción no se puede deshacer.")) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  }

  function handleRemoveItem(itemId: string, productTypeName: string | undefined) {
    if (window.confirm(`¿Quitar "${productTypeName ?? "este producto"}" de la orden?`)) {
      itemActiveMutation.mutate({ itemId, active: false });
    }
  }

  function openPaymentEdit(payment: Payment) {
    setEditingPayment(payment);
    setPaymentEdit({
      amount: String(payment.amount),
      method: payment.method,
      note: payment.note ?? "",
    });
  }

  if (isLoading || !order) return <p className="text-sm text-ink-soft">Cargando…</p>;

  function handlePaymentSubmit(e: FormEvent) {
    e.preventDefault();
    if (paymentForm.amount) paymentMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-accent"
      >
        ← Volver a órdenes
      </Link>
      <PageHeader
        title={<span className="font-mono">Orden #{order.number}</span>}
        actions={
          <div className="flex gap-2">
            <a
              href={pdfUrl(`/pdf/orders/${order.id}/order-sheet.pdf`)}
              target="_blank"
              rel="noreferrer"
            >
              <SecondaryButton type="button">PDF de la orden</SecondaryButton>
            </a>
            <a
              href={pdfUrl(`/pdf/orders/${order.id}/factory-sheet.pdf`)}
              target="_blank"
              rel="noreferrer"
            >
              <SecondaryButton type="button">Ficha técnica</SecondaryButton>
            </a>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <FieldLabel>Cliente</FieldLabel>
            <p className="text-ink">
              {customer ? `${customer.firstName} ${customer.lastName}` : "-"}
            </p>
          </div>
          <div>
            <FieldLabel>Fecha de la orden</FieldLabel>
            <p className="text-ink">{formatDate(order.date)}</p>
          </div>
          <div>
            <FieldLabel>Impresa</FieldLabel>
            <p className="text-ink">{formatDateTime(order.printedAt)}</p>
          </div>
          <div>
            <FieldLabel>Estado</FieldLabel>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <Select
                value={order.status}
                onChange={(e) => statusMutation.mutate(e.target.value as OrderStatus)}
                className="w-auto"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        {order.notes && (
          <div className="mt-4">
            <FieldLabel>Observaciones</FieldLabel>
            <p className="text-sm text-ink-soft">{order.notes}</p>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <PageHeader
          title="Productos"
          actions={
            canEditItems ? (
              <SecondaryButton type="button" onClick={() => setAddingItem(true)}>
                Agregar producto
              </SecondaryButton>
            ) : (
              <p className="max-w-xs text-right text-xs text-ink-soft/70">
                Los productos solo se pueden agregar o quitar mientras la orden está en borrador o
                confirmada.
              </p>
            )
          }
        />
        {itemActiveMutation.isError && (
          <p className="text-xs text-signal">
            {itemActiveMutation.error instanceof Error
              ? itemActiveMutation.error.message
              : "No se pudo quitar el producto."}
          </p>
        )}
        {order.items.map((item) => (
          <Card key={item.id}>
            <Collapsible
              title={`${item.productTypeName} — Cant. ${item.quantity}`}
              subtitle={`Entrega ${formatDate(item.deliveryDate)}`}
              actions={
                <div className="flex items-center gap-3">
                  {item.totalPrice !== undefined && (
                    <span className="font-mono text-sm text-ink-soft">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  )}
                  {/* An order can't end up with zero products — the API rejects it too. */}
                  {canEditItems && order.items.length > 1 && (
                    <button
                      type="button"
                      className="text-xs text-signal hover:underline disabled:opacity-50"
                      disabled={itemActiveMutation.isPending}
                      onClick={() => handleRemoveItem(item.id, item.productTypeName)}
                    >
                      quitar producto
                    </button>
                  )}
                </div>
              }
            >
              <div className="grid grid-cols-3 gap-2 text-sm text-ink-soft">
                {Object.entries(item.attributes).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-ink-soft/70">{key}: </span>
                    {String(value)}
                  </div>
                ))}
              </div>
              {item.factoryNotes && (
                <p className="mt-2 text-sm text-ink-soft">Comentarios: {item.factoryNotes}</p>
              )}

              {item.productTypeSketchUrl && (
                <div className="mt-3 border-t border-line pt-3">
                  <FieldLabel>Croquis del producto</FieldLabel>
                  <a
                    href={item.productTypeSketchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-28"
                  >
                    <img
                      src={item.productTypeSketchUrl}
                      alt="Croquis del producto"
                      className="h-28 w-28 rounded-sm border border-line object-cover"
                    />
                  </a>
                  <p className="mt-1 text-xs text-ink-soft/70">Se gestiona desde Productos.</p>
                </div>
              )}

              <div className="mt-3 border-t border-line pt-3">
                <FieldLabel>Fotos de referencia</FieldLabel>
                <div className="mb-2 flex flex-wrap gap-3">
                  {item.attachments.map((attachment) => (
                    <div key={attachment.id} className="w-28">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                        title={attachment.fileName}
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.fileName}
                          className="h-28 w-28 rounded-sm border border-line object-cover"
                        />
                      </a>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="truncate text-xs text-ink-soft">Foto</span>
                        <button
                          type="button"
                          className="text-xs text-signal hover:underline disabled:opacity-50"
                          disabled={deleteAttachmentMutation.isPending}
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingPreview && pendingPreview.itemId === item.id && (
                    <div className="w-28 opacity-60">
                      <img
                        src={pendingPreview.url}
                        alt="Subiendo…"
                        className="h-28 w-28 rounded-sm border border-line object-cover"
                      />
                      <span className="mt-1 block text-xs text-ink-soft">Subiendo…</span>
                    </div>
                  )}
                  {item.attachments.length === 0 && !pendingPreview && (
                    <p className="text-sm text-ink-soft/70">Todavía no hay fotos de referencia.</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FileInput
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelected(item.id, file);
                      e.target.value = "";
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-soft/70">
                  Formatos aceptados: JPG o PNG. Tamaño máximo 8MB.
                </p>
                {attachmentMutation.isError && (
                  <p className="mt-1 text-xs text-signal">
                    {attachmentMutation.error instanceof Error
                      ? attachmentMutation.error.message
                      : "No se pudo subir el archivo."}
                  </p>
                )}
                {deleteAttachmentMutation.isError && (
                  <p className="mt-1 text-xs text-signal">No se pudo eliminar el adjunto.</p>
                )}
              </div>
            </Collapsible>
          </Card>
        ))}
      </div>

      {order.totals && (
        <Card>
          <PageHeader title="Pagos" />
          <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <FieldLabel>Total</FieldLabel>
              <p className="font-mono text-ink">{formatCurrency(order.totals.totalAmount)}</p>
            </div>
            <div>
              <FieldLabel>Pagado</FieldLabel>
              <p className="font-mono text-ink">{formatCurrency(order.totals.amountPaid)}</p>
            </div>
            <div>
              <FieldLabel>Saldo</FieldLabel>
              <p className="font-mono font-semibold text-ink">
                {formatCurrency(order.totals.balance)}
              </p>
            </div>
          </div>

          {/* Payments stay editable in any status — a balance can be settled, or a wrong amount
              spotted, well after the order was delivered. */}
          <ul className="mb-4 space-y-1 text-sm text-ink-soft">
            {(order.payments ?? []).map((payment) => (
              <li key={payment.id} className="flex items-center gap-2">
                <span>
                  {formatDate(payment.date)} — {formatCurrency(payment.amount)} ({payment.method})
                  {payment.note ? ` — ${payment.note}` : ""}
                </span>
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => openPaymentEdit(payment)}
                >
                  editar
                </button>
              </li>
            ))}
            {(order.payments ?? []).length === 0 && (
              <li className="text-ink-soft/70">Todavía no hay pagos registrados.</li>
            )}
          </ul>

          <form onSubmit={handlePaymentSubmit} className="grid grid-cols-4 gap-2">
            <TextInput
              type="text"
              inputMode="decimal"
              placeholder="Monto"
              value={paymentForm.amount}
              onChange={(e) => {
                if (isNumericInput(e.target.value) && respectsMinimum(e.target.value)) {
                  setPaymentForm({ ...paymentForm, amount: e.target.value });
                }
              }}
            />
            <Select
              value={paymentForm.method || activeMethods[0]?.name || ""}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              {activeMethods.map((method) => (
                <option key={method.id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </Select>
            <TextInput
              placeholder="Comentario (opcional)"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
            />
            <PrimaryButton type="submit" disabled={paymentMutation.isPending}>
              Agregar pago
            </PrimaryButton>
          </form>
        </Card>
      )}

      <Modal
        open={addingItem}
        title={`Agregar producto a la orden #${order.number}`}
        onClose={() => setAddingItem(false)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (itemDraft.productTypeId) addItemMutation.mutate();
          }}
        >
          <OrderItemFields
            draft={itemDraft}
            productTypes={productTypes}
            categories={productCategories}
            attributeCatalogs={attributeCatalogs}
            showDeliveryDate
            onChange={(patch) => setItemDraft({ ...itemDraft, ...patch })}
          />
          <p className="mt-4 text-xs text-ink-soft/70">
            El producto se agrega al precio de lista actual, que puede diferir del que tenía cuando
            se creó la orden.
          </p>
          {addItemMutation.isError && (
            <p className="mt-2 text-xs text-signal">
              {addItemMutation.error instanceof Error
                ? addItemMutation.error.message
                : "No se pudo agregar el producto."}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setAddingItem(false)}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={addItemMutation.isPending || !itemDraft.productTypeId}
            >
              Agregar producto
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingPayment}
        title="Editar pago"
        onClose={() => setEditingPayment(null)}
        width="max-w-lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (paymentEdit.amount) editPaymentMutation.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Monto</FieldLabel>
              <TextInput
                type="text"
                inputMode="decimal"
                required
                value={paymentEdit.amount}
                onChange={(e) => {
                  if (isNumericInput(e.target.value) && respectsMinimum(e.target.value)) {
                    setPaymentEdit({ ...paymentEdit, amount: e.target.value });
                  }
                }}
              />
            </div>
            <div>
              <FieldLabel>Método</FieldLabel>
              <Select
                value={paymentEdit.method}
                onChange={(e) => setPaymentEdit({ ...paymentEdit, method: e.target.value })}
              >
                {/* The payment's own method is listed even if it was deactivated since, so editing
                    the amount doesn't silently switch it to another method. */}
                {!activeMethods.some((method) => method.name === paymentEdit.method) &&
                  paymentEdit.method && (
                    <option value={paymentEdit.method}>{paymentEdit.method}</option>
                  )}
                {activeMethods.map((method) => (
                  <option key={method.id} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <FieldLabel>Comentario</FieldLabel>
              <TextInput
                value={paymentEdit.note}
                onChange={(e) => setPaymentEdit({ ...paymentEdit, note: e.target.value })}
              />
            </div>
          </div>
          {editPaymentMutation.isError && (
            <p className="mt-2 text-xs text-signal">
              {editPaymentMutation.error instanceof Error
                ? editPaymentMutation.error.message
                : "No se pudo actualizar el pago."}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setEditingPayment(null)}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={editPaymentMutation.isPending}>
              Guardar cambios
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
