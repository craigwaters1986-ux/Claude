/**
 * Read and validate the public Supabase env vars once, with a clear error
 * instead of an opaque "Invalid URL" deep inside supabase-js.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so they must be referenced
 * literally (not via process.env[name]).
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Publishable key (sb_publishable_…) is Supabase's recommended client key;
  // the legacy anon JWT still works as a fallback.
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Copy .env.example to .env.local and set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url, anonKey };
}
