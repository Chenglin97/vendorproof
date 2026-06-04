import "server-only";
import { runExaPlan } from "./exa";
import { analyzeHeuristic } from "./analyze";
import { refineWithLLM } from "./llm";
import { buildSampleResult } from "./sample";
import type { DiligenceRequest, DiligenceResult, Evidence, Stance } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator: brief -> Exa live search -> analysis -> structured result.
// Graceful degradation at every layer:
//   no EXA_API_KEY .......... curated sample (Intercom)
//   Exa call fails .......... curated sample (Intercom), flagged
//   ANTHROPIC_API_KEY set ... LLM-graded analysis; else deterministic heuristic
// ─────────────────────────────────────────────────────────────────────────────

export async function runDiligence(req: DiligenceRequest): Promise<DiligenceResult> {
  const runAt = new Date().toISOString();
  const apiKey = process.env.EXA_API_KEY?.trim();

  if (!apiKey) {
    return tagSample(buildSampleResult(runAt), "No EXA_API_KEY configured — showing the curated Intercom sample.");
  }

  let exa;
  try {
    const started = Date.now();
    exa = await runExaPlan(apiKey, req);
    (exa as typeof exa & { _ms: number })._ms = Date.now() - started;
  } catch (err) {
    // Live diligence failed (bad key, quota, network) — still demo.
    return tagSample(
      buildSampleResult(runAt),
      `Live Exa search failed (${(err as Error).message}); showing the curated sample instead.`,
    );
  }

  const durationMs = (exa as typeof exa & { _ms?: number })._ms ?? 0;

  // Deterministic baseline — guarantees a defensible structure + real citations.
  const base = analyzeHeuristic(req, exa.results);
  let analysisMode: "llm" | "heuristic" = "heuristic";
  let { claims, flags, levers, questions, competitors, compareDims, proofScore, proofBand, verdict, summary } = base;
  const evidence: Evidence[] = base.evidence;

  // Optional LLM refinement over the SAME real evidence.
  const refined = await refineWithLLM(req, evidence);
  if (refined) {
    analysisMode = "llm";
    claims = refined.claims;
    flags = refined.flags.length ? refined.flags : base.flags;
    levers = refined.levers.length ? refined.levers : base.levers;
    questions = refined.questions.length ? refined.questions : base.questions;
    competitors = refined.competitors.length ? refined.competitors : base.competitors;
    compareDims = refined.compareDims.length ? refined.compareDims : base.compareDims;
    proofScore = refined.proofScore;
    proofBand = refined.proofBand;
    verdict = refined.verdict;
    summary = refined.summary || base.summary;
    // Re-stance evidence from the model's judgement.
    for (const e of evidence) {
      const s = refined.stance[e.id] as Stance | undefined;
      if (s === "support" || s === "refute" || s === "neutral") e.stance = s;
    }
  }

  const crm = buildCrm(req, { claims, proofScore, proofBand });
  const handoff = buildHandoff(req, { claims, proofScore, proofBand, flags, evidence });

  return {
    meta: {
      vendor: req.vendor,
      domain: req.domain,
      category: req.category,
      buyerContext: req.buyerContext,
      competitorNames: req.competitors,
      runAt,
      durationMs,
      searchCount: exa.searchCount,
      costDollars: exa.costDollars,
      mode: "live",
      analysisMode,
    },
    proofScore,
    proofBand,
    verdict,
    summary,
    claims,
    evidence,
    compareDims,
    competitors,
    flags,
    levers,
    questions,
    crm,
    handoff,
    exaTrace: {
      endpoint: "POST https://api.exa.ai/search",
      request: exa.representative?.request ?? { note: "representative request unavailable" },
      response: exa.representative?.response ?? { note: "representative response unavailable" },
    },
  };
}

function tagSample(r: DiligenceResult, note: string): DiligenceResult {
  return { ...r, meta: { ...r.meta, mode: "sample", notes: note } };
}

function buildCrm(
  req: DiligenceRequest,
  a: { claims: DiligenceResult["claims"]; proofScore: number; proofBand: string },
): DiligenceResult["crm"] {
  const nVer = a.claims.filter((c) => c.verdict === "verified").length;
  const nPart = a.claims.filter((c) => c.verdict === "partial").length;
  const topRisk = a.claims.find((c) => c.risk === "High") || a.claims.find((c) => c.verdict !== "verified");
  const rec =
    a.proofBand === "Strong"
      ? "Proceed — low diligence risk"
      : a.proofBand === "Mixed"
      ? "Proceed to a paid pilot with conditions"
      : "Hold — close evidence gaps before advancing";
  return {
    recommendation: rec,
    confidence: a.proofBand === "Strong" ? "High" : a.proofBand === "Mixed" ? "Medium" : "Low",
    fields: [
      { k: "Vendor", v: req.vendor },
      { k: "Category", v: req.category },
      { k: "Claims verified", v: `${nVer} of ${a.claims.length}${nPart ? ` (${nPart} partial)` : ""}` },
      { k: "Proof score", v: `${a.proofScore} / 100 — ${a.proofBand}` },
      { k: "Top risk", v: topRisk?.missing || topRisk?.text || "None material" },
      { k: "Buyer", v: req.buyerContext || "—" },
      { k: "Next step", v: "Request missing references + reports; scope a conditioned pilot" },
    ],
    body:
      `${req.vendor} scored ${a.proofScore}/100 (${a.proofBand}) across ${a.claims.length} claims, with ${nVer} verified` +
      `${nPart ? ` and ${nPart} partial` : ""}. Evidence is drawn live from the public web with per-claim citations. ` +
      `Recommend "${rec.toLowerCase()}", conditioned on closing the unverified claims and securing the missing primary evidence noted in the matrix.`,
  };
}

function buildHandoff(
  req: DiligenceRequest,
  a: {
    claims: DiligenceResult["claims"];
    proofScore: number;
    proofBand: string;
    flags: DiligenceResult["flags"];
    evidence: Evidence[];
  },
): Record<string, unknown> {
  const rec =
    a.proofBand === "Strong" ? "approve_with_standard_terms" : a.proofBand === "Mixed" ? "pilot_with_conditions" : "hold";
  return {
    schema: "vendorproof.diligence/v1",
    vendor: { name: req.vendor, domain: req.domain, category: req.category },
    buyerContext: req.buyerContext,
    decision: { recommendation: rec, proofScore: a.proofScore, band: a.proofBand },
    claims: a.claims.map((c) => ({ id: c.id, verdict: c.verdict, risk: c.risk, missing: c.missing })),
    openRisks: a.flags.map((f, i) => ({
      id: `risk_${i + 1}`,
      severity: f.kind === "risk" ? "high" : "medium",
      title: f.title,
      claim: f.claimId,
    })),
    nextActions: a.claims
      .filter((c) => c.verdict !== "verified")
      .slice(0, 4)
      .map((c) => ({ action: "obtain_evidence", claim: c.id, need: c.missing, owner: "vendor_risk", dueDays: 7 })),
    citations: a.evidence.length,
    source: "exa.live_web",
  };
}
