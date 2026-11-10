"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { ServiceError } from "@/lib/services/errors";

/** Codes where trying again can't help: not found / not allowed. */
const PERMANENT_ERRORS = new Set(["PGRST116", "42501", "upload_rejected", "no_session"]);

function shouldRetry(failureCount: number, error: unknown, max: number) {
  if (error instanceof Error && error.name === "UnsupportedImageError") return false;
  if (error instanceof ServiceError && error.code && PERMANENT_ERRORS.has(error.code)) return false;
  return failureCount < max;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session (useState keeps it stable across renders).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // don't refetch on every screen change
            retry: (count, error) => shouldRetry(count, error, 1),
            refetchOnWindowFocus: true, // catch up after the phone wakes up
          },
          mutations: {
            // Patchy site signal: a failed save retries a few times before
            // reporting an error. Offline saves pause and resume on reconnect.
            retry: (count, error) => shouldRetry(count, error, 3),
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
