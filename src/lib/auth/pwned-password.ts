/**
 * Leaked-password check against HaveIBeenPwned's Pwned Passwords list.
 *
 * Supabase's built-in leaked-password protection needs a paid plan, so the app
 * checks itself when a password is set. Privacy: uses the k-anonymity range
 * API, so only the first 5 characters of the password's SHA-1 hash leave the
 * device; the password itself (and its full hash) never do.
 *
 * Fails open: if the service can't be reached (offline, slow), returns null
 * and the password is allowed, rather than blocking the user.
 */
export async function timesPasswordLeaked(password: string, timeoutMs = 5000): Promise<number | null> {
  try {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      signal: controller.signal,
      // Padding hides how many matches there were from anyone watching the traffic.
      headers: { "Add-Padding": "true" },
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;

    for (const line of (await res.text()).split("\n")) {
      const [candidate, count] = line.trim().split(":");
      if (candidate === suffix) return Number(count) || 0;
    }
    return 0;
  } catch {
    return null;
  }
}
