import type { RawResult } from "./exa";
import type {
  Claim,
  Competitor,
  Confidence,
  DiligenceRequest,
  Evidence,
  EvidenceType,
  Lever,
  Risk,
  RiskFlag,
  Stance,
  Verdict,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic heuristic analysis — the no-LLM fallback.
// Turns raw Exa results into a claim matrix, risk flags, levers, competitor
// comparison, and a procurement summary using source-type + keyword signals.
// It is intentionally conservative: absence of proof => "unverified", never a
// fabricated "verified". The LLM path (llm.ts) produces richer findings; this
// guarantees the app still yields defensible structure with zero extra keys.
// ─────────────────────────────────────────────────────────────────────────────

const NEG = /\b(no|not|lack|without|missing|none|absen|unclear|limited|fails?|cannot|isn'?t|doesn'?t|unable|gap|concern|problem|issue|complaint|outage|breach)\b/i;
const POS = /\b(certif|compliant|soc ?2|iso ?27001|trusted by|customers? include|case study|named|supports?|provides?|enables?|integrat|encrypt|available|published|guarantee|sla)\b/i;

function classifyType(r: RawResult, vendorRoot: string, competitorNames: string[]): EvidenceType {
  const u = (r.url + " " + r.title).toLowerCase();
  const d = r.domain.toLowerCase();
  if (competitorNames.some((c) => u.includes(c.toLowerCase()) && !d.includes(vendorRoot))) return "competitor";
  if (/(security|trust|compliance|soc-?2|iso-?27001|privacy|gdpr)/.test(u)) return "security";
  if (/(pricing|plans|cost)/.test(u)) return "pricing";
  if (/(customer|case-stud|case_stud|stories|success)/.test(u)) return "casestudy";
  if (/(g2\.com|capterra|trustradius|gartner|forrester|review)/.test(d + u)) return "review";
  if (/(docs|developer|api|reference|guide)/.test(d + u)) return "docs";
  if (/(news|techcrunch|reuters|bloomberg|press|blog\/)/.test(d + u)) return "news";
  return r.intent;
}

function stanceOf(r: RawResult, type: EvidenceType): Stance {
  const blob = `${r.highlight} ${r.summary} ${r.text}`.slice(0, 600);
  const neg = NEG.test(blob);
  const pos = POS.test(blob);
  // Vendor's own authoritative pages lean supportive of the matching claim.
  if ((type === "security" || type === "docs" || type === "casestudy") && pos && !neg) return "support";
  if (type === "review" && neg) return "refute";
  if (neg && !pos) return "refute";
  if (pos && !neg) return "support";
  return "neutral";
}

function authorLabel(type: EvidenceType, domain: string, vendorRoot: string): string {
  const isVendor = domain.includes(vendorRoot);
  switch (type) {
    case "security": return isVendor ? "Vendor · Trust Center" : "Security reference";
    case "docs": return isVendor ? "Vendor · Docs" : "Technical docs";
    case "casestudy": return isVendor ? "Vendor · Case studies" : "Case study";
    case "pricing": return isVendor ? "Vendor · Pricing" : "Pricing reference";
    case "review": return "Third-party review";
    case "competitor": return "Competitor";
    case "news": return "Press / news";
  }
}

function firstSentence(s: string, fallback: string): string {
  const t = (s || "").trim();
  if (!t) return fallback;
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).slice(0, 220).trim();
}

export interface HeuristicOutput {
  claims: Claim[];
  evidence: Evidence[];
  compareDims: string[];
  competitors: Competitor[];
  flags: RiskFlag[];
  levers: Lever[];
  questions: string[];
  proofScore: number;
  proofBand: "Strong" | "Mixed" | "Weak";
  verdict: string;
  summary: string;
}

function rootDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
}

export function analyzeHeuristic(req: DiligenceRequest, raw: RawResult[]): HeuristicOutput {
  const vendorRoot = rootDomain(req.domain) || req.vendor.toLowerCase().split(/\s+/)[0];

  // 1) Build the evidence list.
  const evidence: Evidence[] = raw
    .sort((a, b) => b.score - a.score)
    .map((r, i) => {
      const type = classifyType(r, vendorRoot, req.competitors);
      const stance = stanceOf(r, type);
      const snippet = (r.highlight || r.summary || r.text || "").trim().slice(0, 280);
      return {
        id: `e${i + 1}`,
        claimId: r.claimIndex !== null ? `c${r.claimIndex + 1}` : null,
        type,
        stance,
        relevance: Number(r.score.toFixed(2)),
        title: r.title,
        domain: r.domain,
        url: r.url,
        published: r.publishedDate,
        author: authorLabel(type, r.domain, vendorRoot),
        snippet: snippet || "No extract returned for this source.",
        extracted:
          stance === "support"
            ? "Supports the related claim with primary-source detail."
            : stance === "refute"
            ? "Raises doubt or surfaces a gap relevant to the claim."
            : "Context the diligence agent weighed when scoring the claim.",
      };
    });

  // Attach the best structural evidence to each claim by intent overlap.
  const evByClaim = new Map<string, Evidence[]>();
  req.claims.forEach((_, i) => evByClaim.set(`c${i + 1}`, []));
  for (const e of evidence) {
    if (e.claimId && evByClaim.has(e.claimId)) evByClaim.get(e.claimId)!.push(e);
  }
  // For claims with thin direct evidence, pull in topically-matching structural sources.
  req.claims.forEach((claim, i) => {
    const id = `c${i + 1}`;
    const bucket = evByClaim.get(id)!;
    if (bucket.length >= 2) return;
    const want = intentForClaim(claim);
    for (const e of evidence) {
      if (bucket.length >= 3) break;
      if (e.type === want && !bucket.find((x) => x.id === e.id)) {
        bucket.push(e);
        if (!e.claimId) e.claimId = id;
      }
    }
  });

  // 2) Score each claim.
  const claims: Claim[] = req.claims.map((text, i) => {
    const id = `c${i + 1}`;
    const ev = evByClaim.get(id)!.slice(0, 4);
    const support = ev.filter((e) => e.stance === "support");
    const refute = ev.filter((e) => e.stance === "refute");
    const topRel = ev.reduce((m, e) => Math.max(m, e.relevance), 0);

    let verdict: Verdict;
    let confidence: Confidence;
    if (ev.length === 0) {
      verdict = "unverified";
      confidence = "Low";
    } else if (refute.length > support.length && refute.length >= 1) {
      verdict = "contradicted";
      confidence = refute.length >= 2 ? "High" : "Medium";
    } else if (support.length >= 2 && refute.length === 0 && topRel >= 0.6) {
      verdict = "verified";
      confidence = support.length >= 3 ? "High" : "Medium";
    } else if (support.length >= 1) {
      verdict = "partial";
      confidence = "Medium";
    } else {
      verdict = "unverified";
      confidence = "Low";
    }

    const sensitive = /(bank|financial|secur|complian|adopt|reference|cost|price|tco)/i.test(text);
    const risk: Risk =
      verdict === "verified" ? "Low" : verdict === "partial" ? "Medium" : sensitive ? "High" : "Medium";

    const missing =
      verdict === "unverified" || verdict === "contradicted"
        ? missingFor(text)
        : verdict === "partial"
        ? "Stronger primary evidence or a contractual guarantee"
        : null;

    const finding =
      ev.length === 0
        ? `No public web evidence found to substantiate this claim — Exa surfaced no supporting primary source.`
        : firstSentence(
            support[0]?.snippet || ev[0].snippet,
            `Evidence is mixed; ${support.length} supporting and ${refute.length} contradicting source(s) found.`,
          );

    return { id, text, verdict, confidence, risk, finding, evidence: ev.map((e) => e.id), missing };
  });

  // 3) Proof score: weighted by verdict.
  const w = { verified: 1, partial: 0.55, unverified: 0.12, contradicted: 0 } as const;
  const proofScore = claims.length
    ? Math.round((claims.reduce((s, c) => s + w[c.verdict], 0) / claims.length) * 100)
    : 0;
  const proofBand: "Strong" | "Mixed" | "Weak" =
    proofScore >= 70 ? "Strong" : proofScore >= 40 ? "Mixed" : "Weak";

  // 4) Risk flags from weak claims.
  const flags: RiskFlag[] = claims
    .filter((c) => c.verdict === "unverified" || c.verdict === "contradicted" || (c.verdict === "partial" && c.risk !== "Low"))
    .slice(0, 5)
    .map((c) => ({
      kind: c.risk === "High" || c.verdict === "contradicted" ? "risk" : "elevated",
      title:
        c.verdict === "contradicted"
          ? `Evidence contradicts: "${shorten(c.text)}"`
          : c.verdict === "unverified"
          ? `No public proof: "${shorten(c.text)}"`
          : `Only partial proof: "${shorten(c.text)}"`,
      detail: c.missing ? `Gap — ${c.missing}.` : c.finding,
      claimId: c.id,
    }));

  // 5) Competitor comparison — data-driven dims from what we actually found.
  const { compareDims, competitors } = buildComparison(req, evidence, vendorRoot, claims);

  // 6) Negotiation levers from weak/partial claims.
  const levers: Lever[] = [];
  for (const c of claims) {
    if (levers.length >= 4) break;
    if (c.verdict === "unverified") {
      levers.push({
        title: `Trade the unproven "${shorten(c.text)}" for pilot terms`,
        detail: `No public evidence backs this claim, so the buyer carries the risk. Anchor on a paid pilot with milestone pricing and a success-based exit before committing.`,
        basis: [c.id, ...c.evidence.slice(0, 1)],
      });
    } else if (c.verdict === "contradicted") {
      levers.push({
        title: `Use the contradicting evidence on "${shorten(c.text)}"`,
        detail: `Public sources push back on this claim. Require a written, contractual guarantee or discount until the vendor closes the gap.`,
        basis: [c.id, ...c.evidence.slice(0, 1)],
      });
    } else if (c.verdict === "partial") {
      levers.push({
        title: `Demand a guarantee behind the partial "${shorten(c.text)}"`,
        detail: `Evidence is incomplete. Convert the claim into a measurable SLA or acceptance test in the contract.`,
        basis: [c.id],
      });
    }
  }
  if (levers.length === 0) {
    levers.push({
      title: "Hold price against the strongest competitor",
      detail: "Claims largely verified — leverage is on commercials. Use the competitor's public pricing and references to push on rate and terms.",
      basis: [],
    });
  }

  // 7) Recommended questions.
  const questions = buildQuestions(req, claims);

  // 8) Headline verdict + summary.
  const nVer = claims.filter((c) => c.verdict === "verified").length;
  const nPart = claims.filter((c) => c.verdict === "partial").length;
  const nUnver = claims.filter((c) => c.verdict === "unverified" || c.verdict === "contradicted").length;
  const verdict =
    proofBand === "Strong"
      ? "Proceed — low diligence risk"
      : proofBand === "Mixed"
      ? "Proceed to pilot — with conditions"
      : "Hold — material evidence gaps";
  const summary =
    `${req.vendor} clears ${nVer} of ${claims.length} claims with public evidence` +
    `${nPart ? `, ${nPart} partial` : ""}${nUnver ? `, and ${nUnver} unverified` : ""}. ` +
    (nUnver
      ? `The unverified claims — and the absence of public proof behind them — are the strongest source of negotiation leverage for ${req.buyerContext || "the buyer"}.`
      : `Evidence is strong; remaining leverage is commercial.`);

  return {
    claims,
    evidence,
    compareDims,
    competitors,
    flags,
    levers,
    questions,
    proofScore,
    proofBand,
    verdict,
    summary,
  };
}

function intentForClaim(claim: string): EvidenceType {
  const c = claim.toLowerCase();
  if (/(secur|complian|soc ?2|iso|encrypt|gdpr|hipaa|audit|privacy)/.test(c)) return "security";
  if (/(integrat|api|crm|sdk|deploy|webhook|connect)/.test(c)) return "docs";
  if (/(cost|price|pricing|tco|cheaper|roi|reduce)/.test(c)) return "pricing";
  if (/(bank|financial|enterprise|customer|adopt|reference)/.test(c)) return "casestudy";
  return "docs";
}

function missingFor(claim: string): string {
  const c = claim.toLowerCase();
  if (/(bank|financial|adopt|reference|customer)/.test(c)) return "A named financial-services reference customer";
  if (/(secur|complian|soc ?2|iso)/.test(c)) return "A current SOC 2 / ISO report or trust-center attestation";
  if (/(cost|price|tco|reduce)/.test(c)) return "Public pricing or a written TCO model";
  if (/(real-?time|latency|sla|uptime)/.test(c)) return "A published latency / uptime SLA";
  if (/(integrat|api|crm)/.test(c)) return "Documentation of the named integration";
  return "A primary public source that substantiates the claim";
}

function shorten(s: string, n = 46): string {
  return s.length > n ? s.slice(0, n - 1).trim() + "…" : s;
}

function buildComparison(
  req: DiligenceRequest,
  evidence: Evidence[],
  vendorRoot: string,
  claims: Claim[],
): { compareDims: string[]; competitors: Competitor[] } {
  const compareDims = ["FSI references", "Security page", "Pricing transparency", "Docs depth", "Public evidence"];
  const entities = [req.vendor, ...req.competitors.slice(0, 3)];

  const competitors: Competitor[] = entities.map((name, idx) => {
    const isSubject = idx === 0;
    const key = name.toLowerCase().split(/\s+/)[0];
    const own = evidence.filter((e) =>
      isSubject ? e.domain.includes(vendorRoot) || e.claimId : e.title.toLowerCase().includes(key) || e.domain.includes(key),
    );
    const has = (pred: (e: Evidence) => boolean) => own.some(pred);
    const fsi = has((e) => e.type === "casestudy" && /(bank|financ|insur|fintech)/i.test(e.title + e.snippet));
    const sec = has((e) => e.type === "security");
    const price = has((e) => e.type === "pricing");
    const docs = own.filter((e) => e.type === "docs").length;

    const rows: Competitor["rows"] = {
      "FSI references": fsi ? { v: "Found", s: "strong" } : { v: "None found", s: "weak" },
      "Security page": sec ? { v: "Public", s: "strong" } : { v: "Not found", s: "mixed" },
      "Pricing transparency": price ? { v: "Public", s: "strong" } : { v: "Gated", s: "weak" },
      "Docs depth": docs >= 2 ? { v: "Deep", s: "strong" } : docs === 1 ? { v: "Some", s: "mixed" } : { v: "Thin", s: "weak" },
      "Public evidence": own.length >= 3 ? { v: `${own.length} sources`, s: "strong" } : own.length >= 1 ? { v: `${own.length} sources`, s: "mixed" } : { v: "None", s: "weak" },
    };
    return { name, subject: isSubject, rows };
  });

  return { compareDims, competitors };
}

function buildQuestions(req: DiligenceRequest, claims: Claim[]): string[] {
  const qs: string[] = [];
  for (const c of claims) {
    if (c.verdict === "verified") continue;
    const t = c.text.toLowerCase();
    if (/(bank|financial|adopt|reference|customer)/.test(t)) qs.push("Can you provide two named financial-services reference customers we can call?");
    else if (/(secur|complian|soc ?2|iso)/.test(t)) qs.push("Will you share your most recent SOC 2 Type II report and pen-test summary under NDA?");
    else if (/(cost|price|tco|reduce)/.test(t)) qs.push("What does a usage-based quote look like at our volume, and how does TCO compare to the incumbent?");
    else if (/(real-?time|latency|sla|uptime)/.test(t)) qs.push("What is your contractual latency / uptime SLA, and does it cover all channels?");
    else if (/(integrat|api|crm)/.test(t)) qs.push(`Can you demonstrate the ${req.category} integration end-to-end in our environment?`);
    else qs.push(`What primary evidence can you share to substantiate: "${shorten(c.text, 70)}"?`);
  }
  qs.push("Which audit-logging fields are retained, for how long, and are they exportable for examiners?");
  return Array.from(new Set(qs)).slice(0, 6);
}
