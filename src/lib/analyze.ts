import type { RawResult } from "./exa";
import { isVendorDomain, rootDomain } from "./domain";
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

// High-precision *refutation* signals only. Earlier this matched bare
// "no/not/limited/issue/concern", which fire constantly in normal security and
// fintech copy and produced false "contradicted" verdicts (e.g. Plaid). We now
// require diligence-meaningful negatives or explicit negations of a capability.
const NEG = /(\bbreach(ed|es)?\b|\boutage\b|\bdowntime\b|\bvulnerabilit|\blawsuit\b|\bsued\b|\bdata loss\b|\bleaked\b|\bfined?\b|\bpenalt|\brecall\b|no (named|public|known|known )?(bank|customer|reference|evidence|case)|\bnot (compliant|certified|available|supported)\b|\blacks?\b|\blacking\b|\bfailed to\b|\bdoes not\b|\bdoesn'?t\b|\bcannot\b|\bcan'?t\b|\bno (public|known)\b|without (a |an )?(soc|iso|sla|certification))/i;
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

function stanceOf(r: RawResult, isVendor: boolean): Stance {
  const blob = clean(`${r.highlight} ${r.summary} ${r.text}`).slice(0, 600);
  const neg = NEG.test(blob);
  const pos = POS.test(blob);
  // A vendor's own page asserts the claim — treat it as (weak) self-support, and
  // never let it refute itself. The verdict logic separately requires INDEPENDENT
  // corroboration before a non-self-documenting claim can be "verified".
  if (isVendor) return "support";
  if (neg && !pos) return "refute"; // a clear third-party negative
  if (neg && pos) return "neutral"; // mixed third-party signal
  if (pos) return "support";
  return "neutral";
}

function authorLabel(type: EvidenceType, domain: string, vendorRoot: string): string {
  const isVendor = isVendorDomain(domain, vendorRoot);
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

function clean(s: string): string {
  // Strip markdown headers, list markers, links/images, and pipes that Exa's
  // company-profile summaries often include, then collapse whitespace.
  return (s || "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstSentence(s: string, fallback: string): string {
  const t = clean(s);
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

export function analyzeHeuristic(req: DiligenceRequest, raw: RawResult[]): HeuristicOutput {
  const vendorRoot = rootDomain(req.domain) || req.vendor.toLowerCase().split(/\s+/)[0];

  // 1) Build the evidence list.
  const evidence: Evidence[] = raw
    .sort((a, b) => b.score - a.score)
    .map((r, i) => {
      const type = classifyType(r, vendorRoot, req.competitors);
      const isVendor = isVendorDomain(r.domain, vendorRoot);
      const stance = stanceOf(r, isVendor);
      const snippet = clean(r.highlight || r.summary || r.text || "").slice(0, 280);
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
    // Separate the vendor's own assertions from INDEPENDENT (third-party) proof.
    const vendorSupport = support.filter((e) => isVendorDomain(e.domain, vendorRoot));
    const indepSupport = support.filter((e) => !isVendorDomain(e.domain, vendorRoot));
    // Self-documenting claims (security / docs / pricing): the vendor's own trust
    // center / docs / pricing page IS the authoritative source of truth.
    const want = intentForClaim(text);
    const selfDocumenting = want === "security" || want === "docs" || want === "pricing";
    const typedVendorSource = vendorSupport.some((e) => e.type === want || e.type === "security" || e.type === "docs");

    let verdict: Verdict;
    let confidence: Confidence;
    if (ev.length === 0 || (support.length === 0 && refute.length === 0)) {
      // No usable signal either way.
      verdict = "unverified";
      confidence = "Low";
    } else if (support.length === 0 && refute.length >= 1) {
      // The only public signal is a credible negative.
      verdict = "contradicted";
      confidence = refute.length >= 2 ? "High" : "Medium";
    } else if (refute.length >= 2 && refute.length > support.length) {
      verdict = "contradicted";
      confidence = "High";
    } else if (selfDocumenting && vendorSupport.length >= 1 && typedVendorSource && refute.length === 0) {
      // e.g. SOC 2 on the vendor's own trust center -> verified.
      verdict = "verified";
      confidence = indepSupport.length >= 1 && topRel >= 0.5 ? "High" : "Medium";
    } else if (indepSupport.length >= 1 && refute.length === 0) {
      // Non-self-documenting claim (adoption / results) corroborated independently.
      verdict = "verified";
      confidence = (indepSupport.length >= 2 || vendorSupport.length >= 1) && topRel >= 0.5 ? "High" : "Medium";
    } else if (support.length >= 1) {
      // Some support but not independently corroborated (vendor-only for an
      // adoption claim), or mixed support + refute -> partial.
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
  const nContradicted = claims.filter((c) => c.verdict === "contradicted").length;
  let proofBand: "Strong" | "Mixed" | "Weak" =
    proofScore >= 70 ? "Strong" : proofScore >= 40 ? "Mixed" : "Weak";
  // A contradicted claim caps the band — you can't call a vendor "Strong" while
  // the public web actively refutes one of its claims.
  if (nContradicted > 0 && proofBand === "Strong") proofBand = "Mixed";

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
  // Honesty guard: if most claims have no public evidence at all, don't emit a
  // confident go/no-go off a near-empty base.
  const claimsWithEvidence = claims.filter((c) => c.evidence.length > 0).length;
  const inconclusive = claims.length > 0 && claimsWithEvidence < Math.ceil(claims.length / 2);
  const verdict = inconclusive
    ? "Inconclusive — insufficient public evidence to assess"
    : proofBand === "Strong"
    ? "Proceed — low diligence risk"
    : proofBand === "Mixed"
    ? "Proceed to pilot — with conditions"
    : "Hold — material evidence gaps";
  const summary = inconclusive
    ? `Exa surfaced little public evidence for ${req.vendor} — only ${claimsWithEvidence} of ${claims.length} claims had any supporting source. Treat this as a starting point: request primary documentation directly, or refine the vendor domain and re-run.`
    : `${req.vendor} clears ${nVer} of ${claims.length} claims with public evidence` +
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
  if (/(integrat|\bapi\b|crm|sdk|deploy|webhook|connect)/.test(c)) return "docs";
  // Outcome claims ("reduce volume", "improve resolution") are NOT self-documenting
  // pricing claims — they need third-party proof, so route them to casestudy.
  if (/(reduce|improve|increase|faster|boost|save time|productivity|resolution|deflect)/.test(c)) return "casestudy";
  if (/(\bcost\b|\bprice\b|pricing|\btco\b|cheaper|\broi\b|total cost)/.test(c)) return "pricing";
  if (/(bank|financial|enterprise|customer|adopt|reference|trusted)/.test(c)) return "casestudy";
  return "docs";
}

function missingFor(claim: string): string {
  const c = claim.toLowerCase();
  if (/(bank|financial|adopt|reference|customer)/.test(c)) return "A named reference customer in a comparable sector";
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
  const compareDims = ["Named references", "Security / trust", "Pricing transparency", "Docs depth", "Public evidence"];
  const entities = [req.vendor, ...req.competitors.slice(0, 3)];
  // Neutral "not assessed" cell — used when we simply gathered no evidence for a
  // given entity, rather than alarming everyone with a wall of red "None found".
  const unknown = { v: "—", s: "mixed" as const };

  const competitors: Competitor[] = entities.map((name, idx) => {
    const isSubject = idx === 0;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const own = evidence.filter((e) => {
      // The SUBJECT counts only its OWN-domain evidence — never claim-linked
      // third-party or competitor sources (that previously inflated its row).
      if (isSubject) return isVendorDomain(e.domain, vendorRoot);
      if (key.length < 3) return false;
      const hostKey = e.domain.replace(/[^a-z0-9]/g, "");
      const titleKey = e.title.toLowerCase().replace(/[^a-z0-9]/g, "");
      return hostKey.includes(key) || titleKey.includes(key);
    });

    if (own.length === 0) {
      const rows = Object.fromEntries(compareDims.map((d) => [d, unknown])) as Competitor["rows"];
      return { name, subject: isSubject, rows };
    }

    const has = (pred: (e: Evidence) => boolean) => own.some(pred);
    const refs = has((e) => (e.type === "casestudy" || e.type === "competitor") && /(bank|financ|insur|fintech|enterprise|customer|trusted)/i.test(e.title + e.snippet));
    const sec = has((e) => e.type === "security");
    const price = has((e) => e.type === "pricing");
    const docs = own.filter((e) => e.type === "docs").length;

    const rows: Competitor["rows"] = {
      "Named references": refs ? { v: "Found", s: "strong" } : unknown,
      "Security / trust": sec ? { v: "Public", s: "strong" } : unknown,
      "Pricing transparency": price ? { v: "Public", s: "strong" } : unknown,
      "Docs depth": docs >= 2 ? { v: "Deep", s: "strong" } : docs === 1 ? { v: "Some", s: "mixed" } : unknown,
      "Public evidence":
        own.length >= 3 ? { v: `${own.length} sources`, s: "strong" } : { v: `${own.length} source${own.length === 1 ? "" : "s"}`, s: "mixed" },
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
    if (/(bank|financial|adopt|reference|customer)/.test(t)) qs.push("Can you provide two named reference customers in our sector we can call?");
    else if (/(secur|complian|soc ?2|iso)/.test(t)) qs.push("Will you share your most recent SOC 2 Type II report and pen-test summary under NDA?");
    else if (/(cost|price|tco|reduce)/.test(t)) qs.push("What does a usage-based quote look like at our volume, and how does TCO compare to the incumbent?");
    else if (/(real-?time|latency|sla|uptime)/.test(t)) qs.push("What is your contractual latency / uptime SLA, and does it cover all channels?");
    else if (/(integrat|api|crm)/.test(t)) qs.push(`Can you demonstrate the ${req.category} integration end-to-end in our environment?`);
    else qs.push(`What primary evidence can you share to substantiate: "${shorten(c.text, 70)}"?`);
  }
  qs.push("Which audit-logging fields are retained, for how long, and are they exportable for examiners?");
  return Array.from(new Set(qs)).slice(0, 6);
}
