import { UserRole } from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}
