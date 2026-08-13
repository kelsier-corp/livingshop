import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CustomerInput, createCustomer, fetchCustomers } from "@/api/customers";
import { Customer } from "@/api/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "./ui";

const EMPTY_NEW_CUSTOMER: CustomerInput = {
  firstName: "",
  lastName: "",
  deliveryAddress: "",
  mobilePhone: "",
  phone: "",
  email: "",
};

interface Props {
  selectedCustomerId: string;
  onSelect: (customerId: string) => void;
}

// The customer list can grow into the thousands, so this searches the server (debounced)
// instead of filtering a full customer list loaded into the browser.
export function CustomerPicker({ selectedCustomerId, onSelect }: Props) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CustomerInput>(EMPTY_NEW_CUSTOMER);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data } = useQuery({
    queryKey: ["customers-picker", debouncedQuery],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 8, search: debouncedQuery }),
    enabled: debouncedQuery.trim().length > 0,
  });
  const matches = data?.items ?? [];

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedCustomer(customer);
      onSelect(customer.id);
      setShowNewForm(false);
      setNewCustomer(EMPTY_NEW_CUSTOMER);
      setQuery("");
    },
  });

  function handlePick(customer: Customer) {
    setSelectedCustomer(customer);
    onSelect(customer.id);
    setQuery("");
  }

  function handleClear() {
    setSelectedCustomer(null);
    onSelect("");
  }

  if (selectedCustomerId && selectedCustomer) {
    return (
      <div className="flex items-center justify-between rounded-sm border border-line bg-paper px-3 py-2">
        <div>
          <p className="text-sm font-medium text-ink">
            {selectedCustomer.firstName} {selectedCustomer.lastName}
          </p>
          <p className="text-xs text-ink-soft">
            {[selectedCustomer.mobilePhone, selectedCustomer.email].filter(Boolean).join(" · ") ||
              "-"}
          </p>
        </div>
        <SecondaryButton type="button" onClick={handleClear}>
          Cambiar
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="relative">
      <TextInput
        placeholder="Buscar cliente por nombre, teléfono o email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {query.trim() && !showNewForm ? (
        <div className="absolute z-10 mt-1 w-full rounded-sm border border-line bg-surface shadow-md">
          {matches.length > 0 ? (
            <ul>
              {matches.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
                    onClick={() => handlePick(customer)}
                  >
                    <span className="font-medium text-ink">
                      {customer.firstName} {customer.lastName}
                    </span>
                    <span className="ml-2 text-xs text-ink-soft">
                      {[customer.mobilePhone, customer.email].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-sm text-ink-soft">
              No se encontraron clientes con ese dato.
            </p>
          )}
          <button
            type="button"
            className="block w-full border-t border-line px-3 py-2 text-left text-sm font-medium text-accent hover:bg-paper"
            onClick={() => {
              setShowNewForm(true);
              setNewCustomer({ ...EMPTY_NEW_CUSTOMER, firstName: query });
            }}
          >
            + Crear cliente nuevo
          </button>
        </div>
      ) : null}

      {showNewForm ? (
        <div className="mt-2 rounded-sm border border-line bg-surface p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>Nombre</FieldLabel>
              <TextInput
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Apellido</FieldLabel>
              <TextInput
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Celular</FieldLabel>
              <TextInput
                value={newCustomer.mobilePhone ?? ""}
                onChange={(e) => setNewCustomer({ ...newCustomer, mobilePhone: e.target.value })}
              />
            </div>
            <div>
              <FieldLabel>Dirección de entrega</FieldLabel>
              <TextInput
                value={newCustomer.deliveryAddress ?? ""}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, deliveryAddress: e.target.value })
                }
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <PrimaryButton
              type="button"
              disabled={
                !newCustomer.firstName.trim() ||
                !newCustomer.lastName.trim() ||
                createMutation.isPending
              }
              onClick={() => createMutation.mutate(newCustomer)}
            >
              Guardar cliente
            </PrimaryButton>
            <SecondaryButton type="button" onClick={() => setShowNewForm(false)}>
              Cancelar
            </SecondaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
