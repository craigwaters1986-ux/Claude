import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseEnv } from "./env";

export type TypedSupabaseClient = SupabaseClient<Database>;

let browserClient: TypedSupabaseClient | undefined;

/** Longest a database or sign-in request may take before it's treated as no signal. */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * fetch with a time limit. On a dead mobile connection a request can hang for
 * minutes instead of failing; this makes it fail, so the app can retry as soon
 * as there's signal. Photo uploads use their own stall detection (storage.ts).
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Written out by hand (not AbortSignal.any/timeout) so it works on older iPhones too.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), REQUEST_TIMEOUT_MS);
  const outer = init?.signal;
  const forward = () => controller.abort(outer?.reason);
  if (outer) {
    if (outer.aborted) forward();
    else outer.addEventListener("abort", forward, { once: true });
  }
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    outer?.removeEventListener("abort", forward);
  });
}

/**
 * Supabase client for Client Components.
 * One shared instance per tab, so auth state and realtime sockets aren't duplicated.
 */
export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, anonKey, { global: { fetch: fetchWithTimeout } });
  }
  return browserClient;
}
