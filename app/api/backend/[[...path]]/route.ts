// app/api/backend/[[...path]]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const BACKEND = (process.env.BACKEND_API_BASE || "https://be-ssrt-2.onrender.com").replace(/\/$/, "");

function buildHeaders(req: NextRequest, bearer?: string) {
  const h = new Headers(req.headers);

  // strip hop-by-hop / browser-only headers
  [
    "host","connection","content-length","accept-encoding","upgrade-insecure-requests",
    "x-forwarded-for","x-forwarded-host","x-forwarded-proto","x-real-ip",
    "sec-fetch-mode","sec-fetch-site","sec-fetch-dest","sec-ch-ua",
    "sec-ch-ua-mobile","sec-ch-ua-platform",
  ].forEach(k => h.delete(k));

  if (bearer) h.set("authorization", `Bearer ${bearer}`);
  return h;
}

// CORS preflight (optional if only called by your Next app)
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
  return res;
}

// In Next 15 route handlers, params is a Promise
type Ctx = { params: Promise<{ path?: string[] }> };

async function handler(req: NextRequest, ctx: Ctx) {
  const { getToken } = await auth();
  const jwt = await getToken({ template: "BACKEND" }).catch(() => null);

  const { path = [] } = await ctx.params;
  const subpath = path.join("/");
  const url = `${BACKEND}/${subpath}`;

  const hasBody = !["GET", "HEAD"].includes(req.method);

  // Buffer the body so we don’t need `duplex`
  let body: BodyInit | undefined = undefined;
  if (hasBody) {
    // Choose an efficient buffer method; arrayBuffer works for JSON/form-data/etc.
    const ab = await req.arrayBuffer();
    body = ab.byteLength ? ab : undefined;
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers: buildHeaders(req, jwt ?? undefined),
    body,                      // buffered body (no duplex needed)
    redirect: "manual",
  });

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
  // loosen CORS (tighten if you only call from your app)
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
