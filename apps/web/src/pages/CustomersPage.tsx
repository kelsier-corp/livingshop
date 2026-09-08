import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import {
  CustomerInput,
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from "@/api/customers";
import { Customer } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import {
  Card,
  DangerButton,
  FieldLabel,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from "@/components/ui";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const PAGE_SIZE = 10;

const EMPTY_FORM: CustomerInput = {
  firstName: "",
  lastName: "",
  deliveryAddress: "",
  mobilePhone: "",
  phone: "",
  email: "",
  taxId: "",
  invoiceType: "",
  businessName: "",
  secondaryPhone: "",
  invoiceDescription: "",
};

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { page, search: debouncedSearch }],
    queryFn: () =>
      fetchCustomers({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined }),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => updateCustomer(id, input),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });
  const deleteMutation = useMutation({ mutationFn: deleteCustomer, onSuccess: invalidate });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(customer: Customer) {
    setForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      deliveryAddress: customer.deliveryAddress ?? "",
      mobilePhone: customer.mobilePhone ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      taxId: customer.taxId ?? "",
      invoiceType: customer.invoiceType ?? "",
      businessName: customer.businessName ?? "",
      secondaryPhone: customer.secondaryPhone ?? "",
      invoiceDescription: customer.invoiceDescription ?? "",
    });
    setEditingId(customer.id);
    setShowForm(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) updateMutation.mutate({ id: editingId, input: form });
    else createMutation.mutate(form);
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Nombre",
      width: "25%",
      render: (c) => (
        <span className="font-medium text-ink">
          {c.firstName} {c.lastName}
        </span>
      ),
    },
    {
      key: "address",
      header: "Dirección",
      width: "30%",
      truncate: true,
      render: (c) => c.deliveryAddress ?? "-",
    },
    {
      key: "contact",
      header: "Contacto",
      width: "25%",
      truncate: true,
      render: (c) => [c.mobilePhone, c.phone, c.email].filter(Boolean).join(" · ") || "-",
    },
    {
      key: "actions",
      header: "",
      width: "20%",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-2">
          <SecondaryButton onClick={() => startEdit(c)}>Editar</SecondaryButton>
          <DangerButton onClick={() => deleteMutation.mutate(c.id)}>Eliminar</DangerButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        actions={<PrimaryButton onClick={startCreate}>Nuevo cliente</PrimaryButton>}
      />

      <Card className="mb-4">
        <FieldLabel>Buscar</FieldLabel>
        <TextInput
          placeholder="Nombre, apellido, email o teléfono…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </Card>

      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(c) => c.id}
            emptyMessage="No hay clientes que coincidan con la búsqueda."
            pagination={{
              mode: "server",
              page,
              pageSize: PAGE_SIZE,
              total: data?.total ?? 0,
              onPageChange: setPage,
            }}
          />
        )}
      </Card>

      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingId ? "Editar cliente" : "Nuevo cliente"}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Nombre</FieldLabel>
            <TextInput
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Apellido</FieldLabel>
            <TextInput
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Dirección de entrega</FieldLabel>
            <TextInput
              value={form.deliveryAddress ?? ""}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Celular</FieldLabel>
            <TextInput
              value={form.mobilePhone ?? ""}
              onChange={(e) => setForm({ ...form, mobilePhone: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Teléfono</FieldLabel>
            <TextInput
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Teléfono secundario</FieldLabel>
            <TextInput
              value={form.secondaryPhone ?? ""}
              onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Email</FieldLabel>
            <TextInput
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>CUIT/CUIL/DNI</FieldLabel>
            <TextInput
              value={form.taxId ?? ""}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
            />
          </div>
          <div>
            <FieldLabel>Tipo de factura</FieldLabel>
            <TextInput
              value={form.invoiceType ?? ""}
              onChange={(e) => setForm({ ...form, invoiceType: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Razón social</FieldLabel>
            <TextInput
              value={form.businessName ?? ""}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Descripción de factura</FieldLabel>
            <TextInput
              value={form.invoiceDescription ?? ""}
              onChange={(e) => setForm({ ...form, invoiceDescription: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex gap-2">
            <PrimaryButton
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId ? "Guardar cambios" : "Crear cliente"}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={resetForm}>
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
