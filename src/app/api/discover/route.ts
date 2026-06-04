import { NextResponse } from "next/server";
import { discoverVendor } from "@/lib/intake";
import { SAMPLE_REQUEST } from "@/lib/sample";

export const maxDuration = 30;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_DISCOVERY = {
  name: "Intercom",
  domain: "intercom.com",
  description:
    "AI-first customer service platform; its Fin AI Agent resolves support conversations across channels.",
  category: "AI customer support platform",
  alternatives: [] as { domain: string; title: string }[],
  suggestedCompetitors: SAMPLE_REQUEST.competitors,
  mode: "sample" as const,
  notes: "Sample mode — no EXA_API_KEY. Add a key to discover any vendor live.",
};

export async function POST(req: Request) {
  let vendor = "";
  try {
    vendor = String(((await req.json()) as { vendor?: string })?.vendor ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!vendor) return NextResponse.json({ error: "A vendor name is required." }, { status: 400 });

  const key = process.env.EXA_API_KEY?.trim();
  if (!key) return NextResponse.json({ ...SAMPLE_DISCOVERY, name: "Intercom" });

  try {
    const d = await discoverVendor(key, vendor);
    return NextResponse.json({ ...d, mode: "live" });
  } catch (err) {
    return NextResponse.json({ ...SAMPLE_DISCOVERY, notes: `Live discovery failed (${(err as Error).message}); showing the sample.` });
  }
}
