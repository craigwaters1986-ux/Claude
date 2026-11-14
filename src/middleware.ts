import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, images and the service worker (which must never be redirected to sign-in).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|api/version|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
