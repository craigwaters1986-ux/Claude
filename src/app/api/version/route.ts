import { NextResponse } from "next/server";

// Built once per deployment: answers with that deployment's build id.
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ id: process.env.NEXT_PUBLIC_BUILD_ID ?? null }, { headers: { "cache-control": "no-store" } });
}
