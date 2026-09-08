import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/api/users";
import { User } from "@/api/types";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { RoleBadge } from "@/components/RoleBadge";
import { Badge, Card, PageHeader } from "@/components/ui";

// No pagination: this is the same 3 seeded users the mock login switcher already lists, not a
// growing dataset — see the /users vs /auth/users split in api/users.ts. CRUD/edit is out of
// scope for now, this is a read-only listing.
export function UsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const columns: DataTableColumn<User>[] = [
    { key: "name", header: "Nombre", width: "35%", render: (user) => user.name },
    { key: "email", header: "Email", width: "35%", truncate: true, render: (user) => user.email },
    { key: "role", header: "Rol", width: "15%", render: (user) => <RoleBadge role={user.role} /> },
    {
      key: "active",
      header: "Estado",
      width: "15%",
      render: (user) => (
        <Badge tone={user.active ? "green" : "slate"}>{user.active ? "Activo" : "Inactivo"}</Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Usuarios" />
      <Card>
        {isLoading ? (
          <p className="text-sm text-ink-soft">Cargando…</p>
        ) : (
          <DataTable columns={columns} rows={users} rowKey={(user) => user.id} />
        )}
      </Card>
    </div>
  );
}
