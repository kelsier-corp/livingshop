import { useQuery } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { fetchMockUsers } from "@/api/users";
import { setCurrentUserId } from "@/api/currentUserStore";
import { User } from "@/api/types";

const STORAGE_KEY = "livingshop.currentUserId";

interface CurrentUserContextValue {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  selectUser: (userId: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["mock-users"],
    queryFn: fetchMockUsers,
  });
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (!isLoading && users.length > 0) {
      const stillValid = users.some((user) => user.id === selectedId);
      if (!stillValid) setSelectedId(users[0].id);
    }
  }, [isLoading, users, selectedId]);

  useEffect(() => {
    setCurrentUserId(selectedId);
    if (selectedId) localStorage.setItem(STORAGE_KEY, selectedId);
  }, [selectedId]);

  const currentUser = useMemo(
    () => users.find((user) => user.id === selectedId) ?? null,
    [users, selectedId]
  );

  const value: CurrentUserContextValue = {
    users,
    currentUser,
    isLoading,
    selectUser: setSelectedId,
  };

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
