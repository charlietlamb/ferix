import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const newUrl = new URL("/api/og/repository", origin);

  for (const [key, value] of searchParams.entries()) {
    newUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(newUrl, 308);
}
