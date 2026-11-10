import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next-path";

/**
 * Magic-link landing route. Supabase redirects here with ?code=…, which we
 * exchange for a session cookie, then send the user on to where they were going.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Most common cause: the link was opened in a different browser from the one
  // that requested it. The login page offers the 6-digit code as a fallback.
  return NextResponse.redirect(`${origin}/login?error=link`);
}
