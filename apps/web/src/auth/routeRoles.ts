import { UserRole } from "@/api/types";

export const ROUTE_ROLES = {
  // Factory can view the orders list and an order's detail (including balances/payments) but
  // never create one — /orders/new stays admin/sales only, see createOrder below.
  orders: ["admin", "sales", "factory"] as UserRole[],
  createOrder: ["admin", "sales"] as UserRole[],
  production: ["admin", "sales", "factory"] as UserRole[],
  sales: ["admin", "sales"] as UserRole[],
  customers: ["admin", "sales"] as UserRole[],
  productTypes: ["admin"] as UserRole[],
  prices: ["admin"] as UserRole[],
  attributeCatalogs: ["admin"] as UserRole[],
};
