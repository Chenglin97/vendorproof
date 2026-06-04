import "server-only";
import Exa from "exa-js";
import type { DiligenceRequest, EvidenceType } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Exa integration — SERVER ONLY. The API key never reaches the client.
//
// The diligence engine does NOT run one generic search. It runs a *plan* of
// targeted queries — one per claim, plus structural queries for security,
// case studies, pricing, docs, and head-to-head competitor comparisons.
// Each query is scoped (category + includeDomains) so Exa returns the primary
// sources a diligence analyst would otherwise hunt down by hand.
// ─────────────────────────────────────────────────────────────────────────────

export interface PlannedQuery {
  id: string;
  /** which claim this query serves, or null for structural/competitor queries */
  claimIndex: number | null;
  intent: EvidenceType;
  query: string;
  category?: "company" | "research paper" | "news" | "pdf" | "financial report";
  includeDomains?: string[];
  numResults: number;
}

function rootDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}

/** Build the targeted query plan from the diligence brief. */
export function buildQueryPlan(req: DiligenceRequest): PlannedQuery[] {
  const vendor = req.vendor.trim();
  const root = rootDomain(req.domain || "");
  const vendorDomains = root ? [root, `docs.${root}`] : undefined;
  const plan: PlannedQuery[] = [];

  // 1) One targeted search per claim — the core of the matrix.
  req.claims.forEach((claim, i) => {
    plan.push({
      id: `claim-${i}`,
      claimIndex: i,
      intent: claimIntent(claim),
      query: `${vendor} ${claim}`,
      category: "company",
      includeDomains: vendorDomains,
      numResults: 6,
    });
  });

  // 2) Structural queries — the evidence types a diligence pass always needs.
  plan.push({
    id: "struct-security",
    claimIndex: null,
    intent: "security",
    query: `${vendor} security compliance SOC 2 ISO 27001 enterprise trust center`,
    category: "company",
    includeDomains: vendorDomains,
    numResults: 5,
  });
  plan.push({
    id: "struct-fsi-case",
    claimIndex: null,
    intent: "casestudy",
    query: `${vendor} customer case study bank fintech insurance financial services named reference`,
    numResults: 6,
  });
  plan.push({
    id: "struct-pricing",
    claimIndex: null,
    intent: "pricing",
    query: `${vendor} pricing enterprise plans cost`,
    category: "company",
    includeDomains: vendorDomains,
    numResults: 4,
  });
  plan.push({
    id: "struct-docs",
    claimIndex: null,
    intent: "docs",
    query: `${vendor} documentation API integration CRM deployment security`,
    category: "company",
    includeDomains: vendorDomains,
    numResults: 4,
  });
  plan.push({
    id: "struct-reviews",
    claimIndex: null,
    intent: "review",
    query: `${vendor} review limitations problems enterprise financial services`,
    numResults: 5,
  });

  // 3) Head-to-head competitor queries.
  req.competitors.slice(0, 3).forEach((comp, i) => {
    plan.push({
      id: `comp-vs-${i}`,
      claimIndex: null,
      intent: "competitor",
      query: `${vendor} vs ${comp} ${req.category} financial services comparison`,
      numResults: 4,
    });
    plan.push({
      id: `comp-fsi-${i}`,
      claimIndex: null,
      intent: "competitor",
      query: `${comp} ${req.category} bank financial services case study security`,
      numResults: 3,
    });
  });

  return plan;
}

/** Map a claim's wording to the dominant evidence type we expect to verify it. */
function claimIntent(claim: string): EvidenceType {
  const c = claim.toLowerCase();
  if (/(secur|complian|soc ?2|iso|encrypt|gdpr|hipaa|audit|privacy)/.test(c)) return "security";
  if (/(integrat|api|crm|sdk|deploy|webhook|connect)/.test(c)) return "docs";
  if (/(cost|price|pricing|tco|cheaper|roi|reduce.*(volume|cost))/.test(c)) return "pricing";
  if (/(bank|financial|enterprise|customer|adopt|reference|trusted by)/.test(c)) return "casestudy";
  return "docs";
}

export interface RawResult {
  queryId: string;
  claimIndex: number | null;
  intent: EvidenceType;
  query: string;
  title: string;
  url: string;
  domain: string;
  publishedDate: string | null;
  author: string | null;
  score: number;
  text: string;
  highlight: string;
  summary: string;
}

export interface ExaRunOutput {
  results: RawResult[];
  searchCount: number;
  costDollars: number;
  representative: { request: Record<string, unknown>; response: Record<string, unknown> } | null;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Execute the query plan against Exa, in parallel, and flatten + dedupe results.
 * Throws if the Exa call fails so the caller can fall back to sample mode.
 */
export async function runExaPlan(
  apiKey: string,
  req: DiligenceRequest,
): Promise<ExaRunOutput> {
  const exa = new Exa(apiKey);
  const plan = buildQueryPlan(req);

  let costDollars = 0;
  let representative: ExaRunOutput["representative"] = null;

  const settled = await Promise.allSettled(
    plan.map(async (pq) => {
      const opts: Record<string, unknown> = {
        type: "auto",
        numResults: pq.numResults,
        text: { maxCharacters: 1200 },
        highlights: { numSentences: 2, highlightsPerUrl: 1, query: pq.query },
        summary: { query: `Does this evidence support: ${pq.query}?` },
      };
      if (pq.category) opts.category = pq.category;
      if (pq.includeDomains) opts.includeDomains = pq.includeDomains;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await exa.searchAndContents(pq.query, opts as any);

      if (typeof res?.costDollars?.total === "number") costDollars += res.costDollars.total;
      else if (typeof res?.costDollars === "number") costDollars += res.costDollars;

      // Capture the first FSI-case query as the representative trace for the
      // Integration screen (it best shows "find what's missing").
      if (!representative && pq.id === "struct-fsi-case") {
        representative = {
          request: { endpoint: "POST https://api.exa.ai/search", query: pq.query, ...opts },
          response: {
            requestId: res?.requestId ?? null,
            autopromptString: res?.autopromptString ?? null,
            resolvedSearchType: res?.resolvedSearchType ?? "auto",
            costDollars: res?.costDollars ?? null,
            results: (res?.results ?? []).slice(0, 3).map((r: any) => ({
              title: r.title,
              url: r.url,
              publishedDate: r.publishedDate ?? null,
              score: r.score ?? null,
              highlights: r.highlights ?? [],
            })),
          },
        };
      }

      const out: RawResult[] = (res?.results ?? []).map((r: any) => ({
        queryId: pq.id,
        claimIndex: pq.claimIndex,
        intent: pq.intent,
        query: pq.query,
        title: r.title ?? r.url ?? "Untitled source",
        url: r.url,
        domain: domainOf(r.url),
        publishedDate: r.publishedDate ?? null,
        author: r.author ?? null,
        score: typeof r.score === "number" ? r.score : 0.5,
        text: (r.text ?? "").slice(0, 1200),
        highlight: Array.isArray(r.highlights) && r.highlights[0] ? r.highlights[0] : "",
        summary: r.summary ?? "",
      }));
      return out;
    }),
  );

  // Flatten successful queries; tolerate partial failures.
  const flat: RawResult[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") flat.push(...s.value);
  }

  if (flat.length === 0) {
    throw new Error("Exa returned no usable results for any query in the plan.");
  }

  // Dedupe by URL, keeping the highest-scoring occurrence but preserving the
  // claim association from a claim-scoped query when available.
  const byUrl = new Map<string, RawResult>();
  for (const r of flat) {
    const existing = byUrl.get(r.url);
    if (!existing) {
      byUrl.set(r.url, r);
    } else {
      if (existing.claimIndex === null && r.claimIndex !== null) existing.claimIndex = r.claimIndex;
      if (r.score > existing.score) {
        existing.score = r.score;
        if (r.highlight) existing.highlight = r.highlight;
        if (r.summary) existing.summary = r.summary;
      }
    }
  }

  return {
    results: Array.from(byUrl.values()),
    searchCount: plan.length,
    costDollars: Number(costDollars.toFixed(4)),
    representative,
  };
}
