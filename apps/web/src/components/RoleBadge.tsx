import { UserRole } from "@/api/types";
import { Badge } from "./ui";

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  sales: "Ventas",
  factory: "Fábrica",
};

const TONE: Record<UserRole, "slate" | "green" | "amber" | "red"> = {
  admin: "amber",
  sales: "green",
  factory: "slate",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge tone={TONE[role]}>{ROLE_LABEL[role]}</Badge>;
}
