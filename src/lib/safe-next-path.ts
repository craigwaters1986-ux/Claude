/**
 * Only allow redirects to paths on this site ("/projects/…"), never to
 * another domain ("//evil.com", "https://…"). Stops open-redirect abuse.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
