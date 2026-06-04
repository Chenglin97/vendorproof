import { NextResponse } from "next/server";
import { discoverClaims } from "@/lib/intake";
import { SAMPLE_REQUEST } from "@/lib/sample";

export const maxDuration = 45;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_CLAIMS = {
  claims: SAMPLE_REQUEST.claims,
  sources: [
    { title: "Fin — the #1 AI agent for customer service", url: "https://www.intercom.com/fin" },
    { title: "Intercom Trust Center — security & compliance", url: "https://www.intercom.com/security" },
  ],
  mode: "sample" as const,
};

export async function POST(req: Request) {
  let body: { vendor?: string; domain?: string; category?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const vendor = String(body?.vendor ?? "").trim();
  if (!vendor) return NextResponse.json({ error: "A vendor name is required." }, { status: 400 });

  const key = process.env.EXA_API_KEY?.trim();
  if (!key) return NextResponse.json(SAMPLE_CLAIMS);

  try {
    const c = await discoverClaims(key, vendor, String(body?.domain ?? ""), String(body?.category ?? ""));
    return NextResponse.json({ ...c, mode: "live" });
  } catch {
    return NextResponse.json(SAMPLE_CLAIMS);
  }
}
