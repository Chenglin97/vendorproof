import "server-only";
import { runExaPlan } from "./exa";
import { analyzeHeuristic } from "./analyze";
import { refineWithLLM } from "./llm";
import { discoverAdverse } from "./intake";
import { buildSampleResult } from "./sample";
import type { Competitor, DiligenceRequest, DiligenceResult, Evidence, RiskFlag, Stance } from "./types";

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

  // Kick off the adverse-intelligence sweep in parallel with the search plan —
  // a deeper Exa Answer dig for the complaints/incidents the vendor hides.
  const advPromise = discoverAdverse(apiKey, req.vendor, req.domain).catch(() => ({ findings: [] as { text: string; url?: string; domain?: string }[] }));

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
    const validClaimIds = new Set(refined.claims.map((c) => c.id));
    claims = refined.claims;
    proofScore = refined.proofScore;
    proofBand = refined.proofBand;
    verdict = refined.verdict;
    summary = refined.summary || base.summary;

    // Flags/levers must reference real claim ids the model actually returned —
    // drop dangling references rather than render broken links.
    const cleanFlags = refined.flags.filter((f) => !f.claimId || validClaimIds.has(f.claimId));
    flags = cleanFlags.length ? cleanFlags : base.flags;
    const cleanLevers = refined.levers.map((l) => ({ ...l, basis: (l.basis || []).filter((b) => validClaimIds.has(b) || b.startsWith("e")) }));
    levers = cleanLevers.length ? cleanLevers : base.levers;
    questions = refined.questions.length ? refined.questions : base.questions;

    // Competitor table + its dimensions must travel TOGETHER and be well-formed,
    // or we keep the heuristic table (mismatched dims/rows render as blanks).
    if (isValidComparison(refined.competitors, refined.compareDims, req)) {
      competitors = refined.competitors;
      compareDims = refined.compareDims;
    }

    // Re-stance evidence from the model's judgement.
    for (const e of evidence) {
      const s = refined.stance[e.id] as Stance | undefined;
      if (s === "support" || s === "refute" || s === "neutral") e.stance = s;
    }
  }

  // Merge the adverse signals (cited to the public web) ahead of the
  // claim-derived flags — the hidden "dirt" is the most material risk.
  const adv = await advPromise;
  const adverseFlags: RiskFlag[] = adv.findings.slice(0, 4).map((f) => ({
    kind: "risk" as const,
    title: f.text,
    detail: f.domain ? `Reported on ${f.domain} — not on the vendor's own pages.` : "Reported on the public web, not the vendor's own pages.",
    claimId: null,
    url: f.url ?? null,
  }));
  const flagsOut = dedupeFlags([...adverseFlags, ...flags]).slice(0, 6);

  const crm = buildCrm(req, { claims, proofScore, proofBand });
  const handoff = buildHandoff(req, { claims, proofScore, proofBand, flags: flagsOut, evidence });

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
    flags: flagsOut,
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

function dedupeFlags(flags: RiskFlag[]): RiskFlag[] {
  const seen = new Set<string>();
  return flags.filter((f) => {
    const key = f.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The LLM competitor table is only usable if it includes the subject vendor and
 *  every row covers every dimension with a valid strength. Otherwise the UI
 *  renders blank cells, so we fall back to the heuristic table. */
function isValidComparison(competitors: Competitor[], dims: string[], req: DiligenceRequest): boolean {
  if (!Array.isArray(competitors) || competitors.length === 0 || !Array.isArray(dims) || dims.length === 0) return false;
  const subject = competitors.find((c) => c.subject) || competitors[0];
  if (!subject || !subject.name) return false;
  const ok = (s: unknown) => s === "strong" || s === "mixed" || s === "weak";
  return competitors.every(
    (c) => c && c.name && c.rows && dims.every((d) => c.rows[d] && typeof c.rows[d].v === "string" && ok(c.rows[d].s)),
  ) && subject.name.toLowerCase().includes(req.vendor.toLowerCase().split(/\s+/)[0]);
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
      source: f.url ?? undefined,
    })),
    nextActions: a.claims
      .filter((c) => c.verdict !== "verified")
      .slice(0, 4)
      .map((c) => ({ action: "obtain_evidence", claim: c.id, need: c.missing, owner: "vendor_risk", dueDays: 7 })),
    citations: a.evidence.length,
    source: "exa.live_web",
  };
}
