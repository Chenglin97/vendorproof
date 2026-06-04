import { NextResponse } from "next/server";
import { runDiligence } from "@/lib/engine";
import type { DiligenceRequest } from "@/lib/types";

// Diligence can fan out many Exa + one LLM call — give it room on Vercel.
export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clamp = (s: unknown, n: number) => String(s ?? "").trim().slice(0, n);

function normalize(body: unknown): DiligenceRequest | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const vendor = clamp(b.vendor, 120);
  if (!vendor) return { error: "A vendor name is required." };

  const claimsRaw = b.claims;
  const claims = (Array.isArray(claimsRaw)
    ? claimsRaw.map((c) => String(c))
    : String(claimsRaw ?? "").split("\n")
  )
    .map((c) => c.trim().slice(0, 200))
    .filter(Boolean);
  if (claims.length === 0) return { error: "At least one claim is required." };

  const competitorsRaw = b.competitors;
  const competitors = (Array.isArray(competitorsRaw)
    ? competitorsRaw.map((c) => String(c))
    : String(competitorsRaw ?? "").split(/[\n,]/)
  )
    .map((c) => c.trim().slice(0, 80))
    .filter(Boolean)
    // Drop a competitor that is just the vendor again (defeats the impostor filter).
    .filter((c) => c.toLowerCase() !== vendor.toLowerCase());

  return {
    vendor,
    domain: clamp(b.domain, 120),
    category: clamp(b.category, 120),
    buyerContext: clamp(b.buyerContext, 500),
    claims: claims.slice(0, 8),
    competitors: Array.from(new Set(competitors)).slice(0, 4),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const norm = normalize(body);
  if ("error" in norm) return NextResponse.json({ error: norm.error }, { status: 400 });

  try {
    const result = await runDiligence(norm);
    return NextResponse.json(result);
  } catch (err) {
    // Log detail server-side; return a generic message (no internal leakage).
    console.error("[verify] diligence failed:", err);
    return NextResponse.json({ error: "Diligence failed. Please try again." }, { status: 500 });
  }
}

// Lets the client know whether live mode is available without exposing the key.
export async function GET() {
  return NextResponse.json({
    liveMode: Boolean(process.env.EXA_API_KEY?.trim()),
    llm: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  });
}
