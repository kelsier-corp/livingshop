import { UserRole } from "@/api/types";

export const ROUTE_ROLES = {
  // Factory can view the orders list and an order's detail (including balances/payments) but
  // never create one — /orders/new stays admin/sales only, see createOrder below.
  orders: ["admin", "sales", "factory"] as UserRole[],
  createOrder: ["admin", "sales"] as UserRole[],
  production: ["admin", "sales", "factory"] as UserRole[],
  sales: ["admin", "sales"] as UserRole[],
  customers: ["admin", "sales"] as UserRole[],
  productTypes: ["admin", "sales"] as UserRole[],
  prices: ["admin", "sales"] as UserRole[],
  attributeCatalogs: ["admin", "sales"] as UserRole[],
  // The one exception to "sales has admin parity everywhere" — user management stays admin-only.
  users: ["admin"] as UserRole[],
};
