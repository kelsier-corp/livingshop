import { UserRole } from "@/api/types";

export const ROUTE_ROLES = {
  orders: ["admin", "sales"] as UserRole[],
  production: ["admin", "sales", "factory"] as UserRole[],
  sales: ["admin", "sales"] as UserRole[],
  customers: ["admin", "sales"] as UserRole[],
  productTypes: ["admin"] as UserRole[],
  prices: ["admin"] as UserRole[],
  attributeCatalogs: ["admin"] as UserRole[],
};
