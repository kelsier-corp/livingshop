import { apiGet } from "./client";
import { User } from "./types";

// Unauthenticated on purpose — backs the mock login/user-switcher dropdown, which has to work
// before there's a current user to send as x-user-id. Never use this for the admin Usuarios tab.
export function fetchMockUsers(): Promise<User[]> {
  return apiGet<User[]>("/auth/users");
}

// The admin-only "Usuarios" tab's data source — gated server-side to admin, unlike fetchMockUsers.
export function fetchUsers(): Promise<User[]> {
  return apiGet<User[]>("/users");
}
