"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // One QueryClient per browser session (useState keeps it stable across renders).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // don't refetch on every screen change
            retry: 1,
            refetchOnWindowFocus: true, // catch up after the phone wakes up
          },
          mutations: {
            // Patchy site signal: a failed save retries a few times before
            // reporting an error. Offline saves pause and resume on reconnect.
            retry: 3,
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
