import "server-only";
import Exa from "exa-js";
import { callClaude, hasLLM } from "./llm";

// ─────────────────────────────────────────────────────────────────────────────
// Guided intake — the two AI-assisted steps before verification.
//   discoverVendor  : name -> official site + description + category (+ rivals)
//   discoverClaims  : vendor + site -> claims scraped from their own pages
// Both use Exa live; both degrade to heuristics if no Claude key, and the API
// routes degrade to the Intercom sample if no Exa key.
// ─────────────────────────────────────────────────────────────────────────────

const NON_OFFICIAL = /(wikipedia|linkedin|crunchbase|g2\.com|capterra|trustradius|facebook|twitter|x\.com|youtube|instagram|glassdoor|bloomberg|reuters|medium\.com|github\.com|reddit)/i;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function firstSentence(s: string, max = 180): string {
  const t = (s || "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).slice(0, max).trim();
}

export interface VendorDiscovery {
  name: string;
  domain: string;
  description: string;
  category: string;
  alternatives: { domain: string; title: string }[];
  suggestedCompetitors: string[];
}

export async function discoverVendor(apiKey: string, vendor: string): Promise<VendorDiscovery> {
  const exa = new Exa(apiKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await exa.searchAndContents(`${vendor} official company website product`, {
    type: "auto",
    numResults: 8,
    category: "company",
    text: { maxCharacters: 700 },
    summary: { query: `In one sentence, what does ${vendor} do, and what product category is it?` },
  } as Parameters<typeof exa.searchAndContents>[1]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = (res?.results ?? []).filter((r: any) => r?.url);
  const official = results.filter((r) => !NON_OFFICIAL.test(hostOf(r.url)));
  const token = vendor.toLowerCase().replace(/[^a-z0-9]/g, "");
  const best =
    official.find((r) => hostOf(r.url).replace(/[^a-z0-9]/g, "").includes(token)) || official[0] || results[0];

  const domain = best ? hostOf(best.url) : "";
  let description = firstSentence(best?.summary || best?.text || "");
  let category = "";
  const seen = new Set<string>([domain]);
  const alternatives = official
    .map((r) => ({ domain: hostOf(r.url), title: r.title ?? hostOf(r.url) }))
    .filter((a) => a.domain && !seen.has(a.domain) && (seen.add(a.domain), true))
    .slice(0, 3);

  let suggestedCompetitors: string[] = [];

  // Optional Claude refine — cleaner description, category, competitor names.
  if (hasLLM()) {
    const ctx = results
      .slice(0, 6)
      .map((r) => `- ${r.title} (${hostOf(r.url)}): ${firstSentence(r.summary || r.text || "", 160)}`)
      .join("\n");
    const out = await callClaude(
      `You are identifying a company for a vendor-diligence tool.\nCANDIDATE NAME: ${vendor}\nWEB RESULTS:\n${ctx}\n\nReturn ONLY a JSON object: {"domain":"the official root domain","description":"one factual sentence (max 22 words)","category":"product category (max 5 words)","competitors":["3 real competitor company names"]}.`,
      600,
    );
    if (out) {
      try {
        const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
        if (j.description) description = String(j.description).slice(0, 200);
        if (j.category) category = String(j.category).slice(0, 60);
        if (Array.isArray(j.competitors)) suggestedCompetitors = j.competitors.map(String).slice(0, 4);
        // trust the model's domain only if it looks like a domain
        if (typeof j.domain === "string" && /\.[a-z]{2,}$/i.test(j.domain) && !NON_OFFICIAL.test(j.domain)) {
          return { name: vendor, domain: hostOf(`https://${j.domain.replace(/^https?:\/\//, "")}`) || domain, description, category, alternatives, suggestedCompetitors };
        }
      } catch {
        /* fall through to heuristic */
      }
    }
  }

  return { name: vendor, domain, description: description || "No description found — confirm or edit the details below.", category, alternatives, suggestedCompetitors };
}

const CLAIM_HINTS = /(enterprise|secur|complian|soc ?2|iso ?27001|gdpr|hipaa|encrypt|integrat|real-?time|low-?latency|scal|trusted by|reduce|increase|improve|automat|fastest|leading|99\.9|uptime|sla|multilingual|ai-?powered|no-?code|self-?serve|api)/i;

export interface ClaimDiscovery {
  claims: string[];
  sources: { title: string; url: string }[];
}

export async function discoverClaims(apiKey: string, vendor: string, domain: string, category: string): Promise<ClaimDiscovery> {
  const exa = new Exa(apiKey);
  const root = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  const include = root ? [root, `docs.${root}`] : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await exa.searchAndContents(`${vendor} product capabilities security enterprise features ${category}`, {
    type: "auto",
    numResults: 8,
    category: "company",
    ...(include ? { includeDomains: include } : {}),
    text: { maxCharacters: 1400 },
    highlights: { numSentences: 2, highlightsPerUrl: 2, query: "what the product claims it can do, security and compliance" },
  } as Parameters<typeof exa.searchAndContents>[1]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = (res?.results ?? []).filter((r: any) => r?.url);
  const sources = results.slice(0, 6).map((r) => ({ title: r.title ?? hostOf(r.url), url: r.url }));

  // Optional Claude extraction over the scraped text.
  if (hasLLM()) {
    const corpus = results
      .slice(0, 6)
      .map((r) => `# ${r.title} (${hostOf(r.url)})\n${(r.highlights ?? []).join(" ")} ${(r.text ?? "").slice(0, 700)}`)
      .join("\n\n")
      .slice(0, 6000);
    const out = await callClaude(
      `From the vendor's own marketing/site text below, extract the 4-6 most important capability, security, or business claims ${vendor} makes about ITSELF. Each claim must be a short, specific, independently verifiable statement (max 12 words). Do not include fluff.\n\nTEXT:\n${corpus}\n\nReturn ONLY a JSON array of strings.`,
      800,
    );
    if (out) {
      try {
        const arr = JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1));
        const claims = (arr as unknown[]).map((s) => String(s).trim()).filter(Boolean).slice(0, 6);
        if (claims.length >= 2) return { claims, sources };
      } catch {
        /* fall through */
      }
    }
  }

  // Heuristic extraction: claim-like sentences from highlights/text.
  const blobs: string[] = [];
  for (const r of results.slice(0, 6)) {
    for (const h of r.highlights ?? []) blobs.push(String(h));
    blobs.push(...String(r.text ?? "").split(/(?<=[.!?])\s+/));
  }
  const seen = new Set<string>();
  const claims: string[] = [];
  for (const raw of blobs) {
    const s = raw.trim().replace(/\s+/g, " ");
    if (s.length < 18 || s.length > 120) continue;
    if (!CLAIM_HINTS.test(s)) continue;
    const key = s.toLowerCase().slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    claims.push(s.replace(/[.,;:]\s*$/, ""));
    if (claims.length >= 6) break;
  }
  if (claims.length >= 3) return { claims, sources };

  // Fallback defaults so the user always has something to confirm/edit.
  return {
    claims: claims.concat(
      [
        "Enterprise-grade platform",
        "Secure and compliant deployment",
        "Integrates with existing systems",
        "Proven, measurable customer results",
      ].filter((d) => !claims.some((c) => c.toLowerCase().includes(d.toLowerCase().split(" ")[0]))),
    ).slice(0, 5),
    sources,
  };
}
