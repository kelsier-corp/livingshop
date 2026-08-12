import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ApiError } from "@/api/client";
import { CurrentUserProvider } from "@/auth/CurrentUserContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A 4xx (bad input, not found, forbidden) will fail again on retry — the default of
      // 3 retries with backoff just made a validation error look like the UI was stuck
      // "loading" for several seconds. Only retry errors that might be transient (network
      // failures, 5xx).
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CurrentUserProvider>
    </QueryClientProvider>
  </StrictMode>
);
