import { UserRole } from "@/api/types";

export function homeRouteForRole(role: UserRole): string {
  return role === "factory" ? "/production" : "/orders";
}
