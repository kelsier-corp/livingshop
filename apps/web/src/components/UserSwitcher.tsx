import { useCurrentUser } from "@/auth/CurrentUserContext";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  sales: "Ventas",
  factory: "Fábrica",
};

export function UserSwitcher() {
  const { users, currentUser, selectUser } = useCurrentUser();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-soft">Usuario</span>
      <select
        className="rounded-sm border border-line bg-paper px-2 py-1 text-sm text-ink"
        value={currentUser?.id ?? ""}
        onChange={(e) => selectUser(e.target.value)}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} — {ROLE_LABEL[user.role]}
          </option>
        ))}
      </select>
    </div>
  );
}
