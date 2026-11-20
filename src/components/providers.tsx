"use client";

import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { OfflineSetup } from "@/components/offline-setup";
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
            // Keep loaded data for a week, so it can be shown with no signal.
            gcTime: 7 * 24 * 60 * 60_000,
            // With no signal, show what's saved rather than waiting for a fetch that can't happen.
            networkMode: "offlineFirst",
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

  // The last-loaded projects, snags and levels are saved on the device, so the
  // app has something to show when it's opened with no signal.
  // (On the server there's no storage; the persister then does nothing, so
  // server and first client render match.)
  const [persister] = useState(() =>
    createSyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      key: "snaglist.cache",
      throttleTime: 2000,
    }),
  );

  const content = (
    <>
      <OfflineSetup />
      {children}
      <Toaster position="top-center" richColors closeButton />
    </>
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      // Saved data shows immediately; then everything on screen is refreshed
      // from the server (when there's signal), so a reload never shows stale data for long.
      onSuccess={() => queryClient.invalidateQueries()}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60_000,
        buster: "v1", // bump if the shape of saved data changes
        dehydrateOptions: {
          shouldDehydrateQuery: (q) =>
            q.state.status === "success" && ["projects", "snags", "levels", "user-state"].includes(String(q.queryKey[0])),
        },
      }}
    >
      {content}
    </PersistQueryClientProvider>
  );
}
