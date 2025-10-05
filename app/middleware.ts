// middleware.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  "/alerts", "/dependencies", "/graph-export", "/jira", "/package-details",
  "/repository", "/sbom", "/settings", "/slack", "/team-routing", "/watchlist"
];

export default function middleware(req: NextRequest) {
  if (!PROTECTED.some(p => req.nextUrl.pathname.startsWith(p))) return;
  const { userId } = auth();
  if (!userId) {
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: PROTECTED.map(p => `${p}/:path*`) };
