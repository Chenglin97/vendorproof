// ─────────────────────────────────────────────────────────────────────────────
// VendorProof — shared types
// These shapes flow from the API route to the client and define the
// "agent-ready intelligence" payload an internal diligence agent would consume.
// ─────────────────────────────────────────────────────────────────────────────

export type Verdict = "verified" | "partial" | "unverified" | "contradicted";
export type Confidence = "High" | "Medium" | "Low";
export type Risk = "Low" | "Medium" | "High";
export type Stance = "support" | "refute" | "neutral";
export type FlagKind = "risk" | "elevated";

/** The diligence brief the user submits. */
export interface DiligenceRequest {
  vendor: string;
  domain: string;
  category: string;
  buyerContext: string;
  claims: string[];
  competitors: string[];
}

/** Evidence type taxonomy — the kinds of sources Exa is asked to gather. */
export type EvidenceType =
  | "security"
  | "docs"
  | "casestudy"
  | "review"
  | "pricing"
  | "competitor"
  | "news";

/** One source returned by Exa, classified and linked to a claim. */
export interface Evidence {
  id: string;
  claimId: string | null;
  type: EvidenceType;
  stance: Stance;
  relevance: number; // 0..1
  title: string;
  domain: string;
  url: string;
  published: string | null;
  author: string; // source-type label, e.g. "Vendor · Trust Center"
  snippet: string; // Exa highlight / extracted text
  extracted: string; // one-line "what this means for the claim"
}

/** A single claim scored from its evidence. */
export interface Claim {
  id: string;
  text: string;
  verdict: Verdict;
  confidence: Confidence;
  risk: Risk;
  finding: string;
  evidence: string[]; // Evidence ids
  missing: string | null;
}

export interface CompetitorRow {
  v: string;
  s: "strong" | "mixed" | "weak";
}
export interface Competitor {
  name: string;
  subject?: boolean;
  rows: Record<string, CompetitorRow>;
}

export interface RiskFlag {
  kind: FlagKind;
  title: string;
  detail: string;
  claimId: string | null;
  /** source URL for adverse signals surfaced from the public web (the "dirt") */
  url?: string | null;
}

export interface Lever {
  title: string;
  detail: string;
  basis: string[]; // claim / evidence ids that justify it
}

export interface CrmSummary {
  recommendation: string;
  confidence: Confidence;
  fields: { k: string; v: string }[];
  body: string;
}

/** The Exa request/response that powered one representative claim (for the
 *  Integration screen — technical credibility for the platform team). */
export interface ExaTrace {
  endpoint: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

/** Full structured diligence result. */
export interface DiligenceResult {
  meta: {
    vendor: string;
    domain: string;
    category: string;
    buyerContext: string;
    competitorNames: string[];
    runAt: string;
    durationMs: number;
    searchCount: number;
    costDollars: number;
    mode: "live" | "sample"; // did we hit Exa, or fall back?
    analysisMode: "llm" | "heuristic";
    notes?: string;
  };
  proofScore: number; // 0..100
  proofBand: "Strong" | "Mixed" | "Weak";
  verdict: string;
  summary: string;
  claims: Claim[];
  evidence: Evidence[];
  compareDims: string[];
  competitors: Competitor[];
  flags: RiskFlag[];
  levers: Lever[];
  questions: string[];
  crm: CrmSummary;
  /** Agent-handoff payload — what flows downstream into a CRM/risk agent. */
  handoff: Record<string, unknown>;
  exaTrace: ExaTrace;
}

export const EVIDENCE_TYPE_META: Record<
  EvidenceType,
  { label: string; short: string; color: string; desc: string }
> = {
  security: {
    label: "Security / trust",
    short: "SEC",
    color: "#138a4e",
    desc: "Trust center, SOC 2 / ISO, security & compliance pages",
  },
  docs: {
    label: "Product docs",
    short: "DOCS",
    color: "#5b616e",
    desc: "Developer docs, implementation & deployment guides",
  },
  casestudy: {
    label: "Case study",
    short: "CASE",
    color: "#1f53ff",
    desc: "Customer stories, named references, logos",
  },
  review: {
    label: "Reviews / news",
    short: "REV",
    color: "#c2700a",
    desc: "Third-party reviews, analyst coverage, press",
  },
  pricing: {
    label: "Pricing signals",
    short: "PRICE",
    color: "#0e8c8c",
    desc: "Public pricing, packaging, usage tiers",
  },
  competitor: {
    label: "Competitor",
    short: "COMP",
    color: "#0b0b0d",
    desc: "Competitor pages used for comparison",
  },
  news: {
    label: "News / press",
    short: "NEWS",
    color: "#6d4ae0",
    desc: "Press coverage, announcements, market commentary",
  },
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; color: string; soft: string; line: string }
> = {
  verified: { label: "Verified", color: "var(--ok)", soft: "var(--ok-soft)", line: "var(--ok-line)" },
  partial: {
    label: "Partial",
    color: "var(--elevated)",
    soft: "var(--elevated-soft)",
    line: "var(--elevated-line)",
  },
  unverified: { label: "Unverified", color: "var(--risk)", soft: "var(--risk-soft)", line: "var(--risk-line)" },
  contradicted: {
    label: "Contradicted",
    color: "var(--risk)",
    soft: "var(--risk-soft)",
    line: "var(--risk-line)",
  },
};
