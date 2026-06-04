import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight per-IP rate limit + body-size guard on the paid API routes.
//
// /api/verify fans out up to ~19 billed Exa searches plus a Claude call per
// request, so an unthrottled endpoint is a cost-exhaustion (financial-DoS)
// vector against the operator's keys. This in-memory sliding window stops bursts
// cheaply and with zero dependencies. It is PER SERVER INSTANCE — fine for a
// demo/single deployment. For multi-region production, swap the Map for
// @upstash/ratelimit (Redis) so the limit is shared across instances.
// ─────────────────────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000;
const PER_MIN: Record<string, number> = {
  "/api/verify": 5,
  "/api/discover": 15,
  "/api/claims": 15,
};
const MAX_BODY_BYTES = 16_000;

const hits = new Map<string, number[]>();

export function middleware(req: NextRequest) {
  if (req.method !== "POST") return NextResponse.next();
  const path = req.nextUrl.pathname;
  const limit = PER_MIN[path];
  if (!limit) return NextResponse.next();

  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim() || "local";
  const key = `${path}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= limit) {
    return NextResponse.json(
      { error: "Rate limit exceeded — please wait a moment and try again." },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }

  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // crude memory bound

  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
