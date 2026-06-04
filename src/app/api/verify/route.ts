import { NextResponse } from "next/server";
import { runDiligence } from "@/lib/engine";
import type { DiligenceRequest } from "@/lib/types";

// Diligence can fan out many Exa + one LLM call — give it room on Vercel.
export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(body: unknown): DiligenceRequest | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const vendor = String(b.vendor ?? "").trim();
  if (!vendor) return { error: "A vendor name is required." };

  const claimsRaw = b.claims;
  const claims = Array.isArray(claimsRaw)
    ? claimsRaw.map((c) => String(c).trim()).filter(Boolean)
    : String(claimsRaw ?? "")
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);
  if (claims.length === 0) return { error: "At least one claim is required." };

  const competitorsRaw = b.competitors;
  const competitors = Array.isArray(competitorsRaw)
    ? competitorsRaw.map((c) => String(c).trim()).filter(Boolean)
    : String(competitorsRaw ?? "")
        .split(/[\n,]/)
        .map((c) => c.trim())
        .filter(Boolean);

  return {
    vendor,
    domain: String(b.domain ?? "").trim(),
    category: String(b.category ?? "").trim(),
    buyerContext: String(b.buyerContext ?? "").trim(),
    claims: claims.slice(0, 8),
    competitors: competitors.slice(0, 4),
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
    return NextResponse.json(
      { error: `Diligence failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

// Lets the client know whether live mode is available without exposing the key.
export async function GET() {
  return NextResponse.json({
    liveMode: Boolean(process.env.EXA_API_KEY?.trim()),
    llm: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
  });
}
