import { NavLink, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/auth/CurrentUserContext";
import { ROUTE_ROLES } from "@/auth/routeRoles";
import { UserRole } from "@/api/types";
import { UserSwitcher } from "./UserSwitcher";

interface NavItem {
  to: string;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/orders", label: "Órdenes", roles: ROUTE_ROLES.orders },
  { to: "/production", label: "Producción", roles: ROUTE_ROLES.production },
  { to: "/sales", label: "Ventas", roles: ROUTE_ROLES.sales },
  { to: "/customers", label: "Clientes", roles: ROUTE_ROLES.customers },
  { to: "/product-types", label: "Productos", roles: ROUTE_ROLES.productTypes },
  { to: "/prices", label: "Precios", roles: ROUTE_ROLES.prices },
  { to: "/attribute-catalogs", label: "Catálogos", roles: ROUTE_ROLES.attributeCatalogs },
];

export function Layout() {
  const { currentUser, isLoading } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter(
    (item) => currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">Livingshop</h1>
            <p className="text-xs text-ink-soft">Órdenes, producción y ventas</p>
          </div>
          <UserSwitcher />
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-accent text-accent-deep"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? <p className="text-sm text-ink-soft">Cargando…</p> : <Outlet />}
      </main>
    </div>
  );
}
