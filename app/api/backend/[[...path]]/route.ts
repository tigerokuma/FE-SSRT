// app/api/backend/[[...path]]/route.ts
import {NextRequest, NextResponse} from "next/server";
import {auth} from "@clerk/nextjs/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND = (process.env.BACKEND_API_BASE || "https://be-ssrt-2.onrender.com").replace(/\/$/, "");

function buildHeaders(req: NextRequest, bearer?: string) {
    const h = new Headers(req.headers);

    // Strip hop-by-hop / browser-only headers
    [
        "host", "connection", "content-length", "accept-encoding", "upgrade-insecure-requests",
        "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-real-ip",
        "sec-fetch-mode", "sec-fetch-site", "sec-fetch-dest", "sec-ch-ua",
        "sec-ch-ua-mobile", "sec-ch-ua-platform",
    ].forEach(k => h.delete(k));

    // Force identity so upstream doesn't gzip
    h.set("accept-encoding", "identity");

    if (bearer) h.set("authorization", `Bearer ${bearer}`);
    return h;
}

export async function OPTIONS() {
    const res = new NextResponse(null, {status: 204});
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
    return res;
}

type Ctx = { params: Promise<{ path?: string[] }> };

async function handler(req: NextRequest, ctx: Ctx) {


    const {getToken} = await auth();
    const jwt = await getToken({template: "BACKEND"}).catch(() => null);

    const {path = []} = await ctx.params;              // Next 15: params is a Promise
    const subpath = path.join("/");
    const search = req.nextUrl.search ?? "";
    const url = `${BACKEND}/${subpath}${search}`;


    const hasBody = !["GET", "HEAD"].includes(req.method);

    const init: RequestInit = {
        method: req.method,
        headers: buildHeaders(req, jwt ?? undefined),
        body: hasBody ? (req.body as any) : undefined,
        // @ts-expect-error: undici needs this when streaming a body
        duplex: hasBody ? "half" : undefined,
        redirect: "manual",
    };

    const upstream = await fetch(url, init);

    // Clone & sanitize response headers
    const h = new Headers(upstream.headers);
    [
        "content-encoding",      // remove gzip/deflate headers
        "content-length",        // let Next set it
        "transfer-encoding",     // streaming details not valid to forward
        "content-security-policy",
        "content-security-policy-report-only",
    ].forEach(k => h.delete(k));

    // If you want JSON by default for empty 201/204:
    if (!h.has("content-type") && upstream.status !== 204) {
        h.set("content-type", "application/json; charset=utf-8");
    }

    // Normalize body: for small responses like sync-from-clerk it's fine to buffer
    const body =
        upstream.status === 204
            ? null
            : await upstream.arrayBuffer(); // avoids encoding mismatch

    const res = new NextResponse(body, {status: upstream.status, headers: h});
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
