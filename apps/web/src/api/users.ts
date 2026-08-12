import { apiGet } from "./client";
import { User } from "./types";

export function fetchMockUsers(): Promise<User[]> {
  return apiGet<User[]>("/auth/users");
}
