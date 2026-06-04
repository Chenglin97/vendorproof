import type { DiligenceRequest, DiligenceResult } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Curated sample diligence — Intercom, for a regional bank evaluating an AI
// customer-support vendor. This is what renders when EXA_API_KEY is missing (or
// a live run fails), so the app always demos end to end. Evidence points at
// Intercom's real public pages; verdicts reflect a genuine FSI diligence read:
// strong general-enterprise proof, but thin *regulated banking* specifics.
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_REQUEST: DiligenceRequest = {
  vendor: "Intercom",
  domain: "intercom.com",
  category: "AI customer support platform",
  buyerContext:
    "Regional bank evaluating an AI customer-support vendor for regulated customer service workflows",
  claims: [
    "Enterprise-grade AI customer support",
    "Secure and compliant deployment",
    "Integrates with existing support and CRM systems",
    "Can reduce support volume and improve resolution time",
  ],
  competitors: ["Zendesk", "Salesforce Service Cloud", "Ada"],
};

export function buildSampleResult(runAt: string): DiligenceResult {
  const result: DiligenceResult = {
    meta: {
      vendor: "Intercom",
      domain: "intercom.com",
      category: "AI customer support platform",
      buyerContext: SAMPLE_REQUEST.buyerContext,
      competitorNames: ["Zendesk", "Salesforce Service Cloud", "Ada"],
      runAt,
      durationMs: 2870,
      searchCount: 14,
      costDollars: 0.021,
      mode: "sample",
      analysisMode: "heuristic",
      notes:
        "Sample mode — no EXA_API_KEY set. Evidence references Intercom's real public pages; add a key in .env.local to run live diligence on any vendor.",
    },
    proofScore: 74,
    proofBand: "Strong",
    verdict: "Proceed to pilot — strong baseline, validate the FSI specifics",
    summary:
      "Intercom clears enterprise security, CRM integration, and AI-support maturity with public, citable proof. The gap for a regulated bank is specificity: no named banking / insurance reference customer, and the support-reduction claim rests on self-reported case-study numbers rather than an FSI benchmark. That gap — plus a usage-based price that scales with volume — is the negotiating leverage.",
    claims: [
      {
        id: "c1",
        text: "Enterprise-grade AI customer support",
        verdict: "verified",
        confidence: "High",
        risk: "Low",
        finding:
          "Intercom's Fin AI Agent is a shipped, enterprise-positioned product with named large-enterprise customers and published resolution capability.",
        evidence: ["e1", "e3"],
        missing: null,
      },
      {
        id: "c2",
        text: "Secure and compliant deployment",
        verdict: "verified",
        confidence: "High",
        risk: "Low",
        finding:
          "Public trust center lists SOC 2 Type II, ISO 27001, GDPR and HIPAA support, with data-residency options — strong general-enterprise compliance posture.",
        evidence: ["e2", "e8"],
        missing: null,
      },
      {
        id: "c3",
        text: "Integrates with existing support and CRM systems",
        verdict: "verified",
        confidence: "High",
        risk: "Low",
        finding:
          "Documented native integrations with Salesforce and Zendesk plus a public REST API, webhooks, and a 450+ app store substantiate the integration claim.",
        evidence: ["e4", "e5"],
        missing: null,
      },
      {
        id: "c4",
        text: "Can reduce support volume and improve resolution time",
        verdict: "partial",
        confidence: "Medium",
        risk: "Medium",
        finding:
          "Case studies cite Fin resolving ~50% of conversations, but figures are vendor-reported and none come from a regulated financial-services deployment.",
        evidence: ["e6", "e7"],
        missing: "An FSI-specific, independently measured resolution / deflection benchmark",
      },
    ],
    evidence: [
      {
        id: "e1",
        claimId: "c1",
        type: "docs",
        stance: "support",
        relevance: 0.93,
        title: "Fin — the #1 AI agent for customer service",
        domain: "intercom.com",
        url: "https://www.intercom.com/fin",
        published: "2026-03-12",
        author: "Vendor · Product",
        snippet:
          "Fin is an AI agent that resolves customer questions instantly across channels, used by enterprises including large SaaS and marketplace companies, with human-handoff and guardrails.",
        extracted: "Directly substantiates a shipped, enterprise-grade AI support product.",
      },
      {
        id: "e2",
        claimId: "c2",
        type: "security",
        stance: "support",
        relevance: 0.95,
        title: "Intercom Trust Center — security & compliance",
        domain: "intercom.com",
        url: "https://www.intercom.com/security",
        published: "2026-02-01",
        author: "Vendor · Trust Center",
        snippet:
          "Intercom maintains SOC 2 Type II, ISO 27001, GDPR compliance and supports HIPAA; data hosted in the US or EU with encryption in transit and at rest.",
        extracted: "Names current certifications and data-residency options — strong compliance proof.",
      },
      {
        id: "e3",
        claimId: "c1",
        type: "casestudy",
        stance: "support",
        relevance: 0.84,
        title: "Customer stories — Intercom",
        domain: "intercom.com",
        url: "https://www.intercom.com/customers",
        published: "2026-04-20",
        author: "Vendor · Case studies",
        snippet:
          "Featured customers span SaaS, e-commerce, and marketplaces; several report large support-team scale handled with Fin and Intercom Inbox.",
        extracted: "Confirms enterprise scale — but the named logos skew to tech, not regulated FSI.",
      },
      {
        id: "e4",
        claimId: "c3",
        type: "docs",
        stance: "support",
        relevance: 0.88,
        title: "Intercom Developer Platform — REST API & webhooks",
        domain: "developers.intercom.com",
        url: "https://developers.intercom.com/",
        published: "2026-01-18",
        author: "Vendor · Docs",
        snippet:
          "Full REST API, webhooks, Canvas Kit, and OAuth apps let teams sync conversations and customer data with external systems programmatically.",
        extracted: "Technical depth backs the integration claim at the API level.",
      },
      {
        id: "e5",
        claimId: "c3",
        type: "docs",
        stance: "support",
        relevance: 0.8,
        title: "Salesforce & Zendesk integrations — Intercom App Store",
        domain: "intercom.com",
        url: "https://www.intercom.com/app-store",
        published: "2026-03-02",
        author: "Vendor · App Store",
        snippet:
          "Native integrations with Salesforce, Zendesk, HubSpot and 450+ apps sync tickets, contacts, and CRM records bidirectionally.",
        extracted: "Names the exact CRM/support systems in the buyer's claim.",
      },
      {
        id: "e6",
        claimId: "c4",
        type: "casestudy",
        stance: "support",
        relevance: 0.78,
        title: "Fin resolution rate — Intercom case studies",
        domain: "intercom.com",
        url: "https://www.intercom.com/customers?topic=fin",
        published: "2026-04-09",
        author: "Vendor · Case studies",
        snippet:
          "Customers report Fin resolving 50%+ of inbound conversations end-to-end, cutting first-response times; figures are customer-reported within Intercom's own case studies.",
        extracted: "Supports the volume-reduction claim, but the numbers are vendor-published.",
      },
      {
        id: "e7",
        claimId: "c4",
        type: "review",
        stance: "refute",
        relevance: 0.71,
        title: "Intercom reviews — resolution quality & cost",
        domain: "g2.com",
        url: "https://www.g2.com/products/intercom/reviews",
        published: "2026-03-28",
        author: "Third-party review",
        snippet:
          "Reviewers praise Fin's deflection but several flag that per-resolution pricing makes high-volume cost hard to predict, and resolution quality varies by use case.",
        extracted: "Independent signal that resolution gains are real but uneven — and cost-sensitive.",
      },
      {
        id: "e8",
        claimId: "c2",
        type: "casestudy",
        stance: "neutral",
        relevance: 0.69,
        title: "AI support vendors in regulated industries — analyst note",
        domain: "softwarereviews.io",
        url: "https://www.softwarereviews.io/categories/customer-service-ai",
        published: "2026-04-15",
        author: "Independent research",
        snippet:
          "Named banking and insurance deployments for AI support remain concentrated among a few platforms; horizontal vendors show strong general compliance but fewer public FSI references.",
        extracted: "Third-party context: the absence of named bank references is material, not an oversight.",
      },
      {
        id: "e9",
        claimId: null,
        type: "competitor",
        stance: "neutral",
        relevance: 0.82,
        title: "Salesforce Service Cloud for financial services",
        domain: "salesforce.com",
        url: "https://www.salesforce.com/financial-services/",
        published: "2026-02-22",
        author: "Competitor",
        snippet:
          "Salesforce publishes a Financial Services Cloud with named banking and insurance customers, FINRA/SEC-aware features, and Agentforce AI built in.",
        extracted: "Competitor is stronger on named FSI references and regulated tooling — direct leverage.",
      },
      {
        id: "e10",
        claimId: null,
        type: "competitor",
        stance: "neutral",
        relevance: 0.75,
        title: "Zendesk AI & financial services",
        domain: "zendesk.com",
        url: "https://www.zendesk.com/industries/financial-services-customer-service/",
        published: "2026-03-05",
        author: "Competitor",
        snippet:
          "Zendesk markets an FSI-specific customer-service offering with named bank customers, transparent per-agent pricing, and an AI add-on.",
        extracted: "Competitor offers an FSI-named reference set and per-agent pricing transparency.",
      },
    ],
    compareDims: ["Named FSI references", "SOC 2 / ISO", "CRM integrations", "Pricing transparency", "AI resolution proof"],
    competitors: [
      {
        name: "Intercom",
        subject: true,
        rows: {
          "Named FSI references": { v: "Few / none", s: "weak" },
          "SOC 2 / ISO": { v: "SOC 2 II · ISO 27001", s: "strong" },
          "CRM integrations": { v: "Salesforce · Zendesk", s: "strong" },
          "Pricing transparency": { v: "Per-resolution, public", s: "strong" },
          "AI resolution proof": { v: "~50% (self-reported)", s: "mixed" },
        },
      },
      {
        name: "Zendesk",
        rows: {
          "Named FSI references": { v: "Banks named", s: "strong" },
          "SOC 2 / ISO": { v: "SOC 2 II · ISO 27001", s: "strong" },
          "CRM integrations": { v: "Native + Salesforce", s: "strong" },
          "Pricing transparency": { v: "Per-agent, public", s: "strong" },
          "AI resolution proof": { v: "AI add-on", s: "mixed" },
        },
      },
      {
        name: "Salesforce Service Cloud",
        rows: {
          "Named FSI references": { v: "Many banks", s: "strong" },
          "SOC 2 / ISO": { v: "SOC 2 · FedRAMP path", s: "strong" },
          "CRM integrations": { v: "Native (Salesforce)", s: "strong" },
          "Pricing transparency": { v: "Per-user, public", s: "strong" },
          "AI resolution proof": { v: "Agentforce", s: "strong" },
        },
      },
      {
        name: "Ada",
        rows: {
          "Named FSI references": { v: "Some named", s: "mixed" },
          "SOC 2 / ISO": { v: "SOC 2 Type II", s: "strong" },
          "CRM integrations": { v: "Salesforce · Zendesk", s: "strong" },
          "Pricing transparency": { v: "Custom / gated", s: "weak" },
          "AI resolution proof": { v: "Automation-first", s: "strong" },
        },
      },
    ],
    flags: [
      {
        kind: "risk",
        title: "No named regulated-FSI reference customer",
        detail:
          "Public customer stories skew to SaaS and e-commerce; no named bank or insurer was found — a hard gate for most third-party risk reviews.",
        claimId: "c1",
      },
      {
        kind: "elevated",
        title: "Resolution-rate claim is vendor-reported",
        detail:
          "The ~50% Fin resolution figure comes from Intercom's own case studies, not an independent or FSI-specific benchmark.",
        claimId: "c4",
      },
      {
        kind: "elevated",
        title: "Per-resolution pricing scales with volume",
        detail:
          "Usage-based pricing means cost is hard to cap at a bank's contact-center volume — reviewers flag unpredictable spend.",
        claimId: "c4",
      },
      {
        kind: "elevated",
        title: "Data-residency / regulated record-keeping to confirm",
        detail:
          "US/EU residency is offered, but examiner-grade audit logging and retention for regulated workflows need contractual confirmation.",
        claimId: "c2",
      },
    ],
    levers: [
      {
        title: "Prove the resolution rate on your own data first",
        detail:
          "The ~50% figure is self-reported. Anchor on a paid pilot with a measured resolution/deflection target and a success-based exit before a full rollout.",
        basis: ["c4", "e6", "e7"],
      },
      {
        title: "Require named regulated-FSI references",
        detail:
          "No named bank reference was found and competitors publish them. Make two callable FSI references a condition of advancing.",
        basis: ["c1", "e9"],
      },
      {
        title: "Cap per-resolution cost at your volume",
        detail:
          "Pricing is public and usage-based. Use your contact-center volume to negotiate a committed-use rate and a monthly spend cap.",
        basis: ["c4", "e7"],
      },
      {
        title: "Fold regulated compliance into the base contract",
        detail:
          "Push examiner-grade audit logging, retention, and data-residency guarantees into the base package rather than a paid add-on.",
        basis: ["c2", "e8"],
      },
    ],
    questions: [
      "Can you provide two named bank or insurance reference customers running Fin in regulated customer service?",
      "What Fin resolution rate have comparable financial-services customers achieved, and how was it measured?",
      "Will you share your latest SOC 2 Type II report and pen-test summary under NDA, with US data-residency options?",
      "At our contact-center volume, what is the effective per-resolution cost, and can it be capped with committed use?",
      "How do the Salesforce and Zendesk integrations handle regulated data, audit logging, and examiner exports?",
      "Which audit-logging fields are retained, for how long, and are they exportable for regulators?",
    ],
    crm: {
      recommendation: "Proceed to a 60-day paid pilot with FSI conditions",
      confidence: "Medium",
      fields: [
        { k: "Vendor", v: "Intercom" },
        { k: "Category", v: "AI customer support platform" },
        { k: "Claims verified", v: "3 of 4 (1 partial)" },
        { k: "Proof score", v: "74 / 100 — Strong baseline" },
        { k: "Top risk", v: "No named regulated-FSI reference customer" },
        { k: "Leverage", v: "Salesforce / Zendesk publish FSI references + transparent pricing" },
        { k: "Next step", v: "Request FSI references + SOC 2 report; scope a measured pilot with a spend cap" },
      ],
      body:
        "Intercom clears enterprise security (SOC 2 Type II, ISO 27001, HIPAA), CRM integration (Salesforce, Zendesk, public API), and AI-support maturity (Fin) with public, citable evidence. The gaps for a regulated bank are specificity, not capability: no named FSI reference customer, a resolution-rate claim that is vendor-reported, and usage-based pricing that scales with volume. Recommend a 60-day paid pilot conditioned on two callable FSI references, a SOC 2 report under NDA, a measured resolution target on the bank's own traffic, and a committed-use price cap. Use Salesforce Service Cloud and Zendesk's published FSI references and pricing as leverage on terms.",
    },
    handoff: {
      schema: "vendorproof.diligence/v1",
      vendor: { name: "Intercom", domain: "intercom.com", category: "AI customer support platform" },
      buyerContext:
        "Regional bank evaluating an AI customer-support vendor for regulated customer service workflows",
      decision: { recommendation: "pilot_with_conditions", proofScore: 74, band: "Strong", confidence: "Medium" },
      claims: [
        { id: "c1", verdict: "verified", risk: "Low" },
        { id: "c2", verdict: "verified", risk: "Low" },
        { id: "c3", verdict: "verified", risk: "Low" },
        { id: "c4", verdict: "partial", risk: "Medium" },
      ],
      openRisks: [
        { id: "no_fsi_reference", severity: "high", owner: "vendor_risk" },
        { id: "resolution_unbenchmarked", severity: "medium", owner: "procurement" },
        { id: "usage_pricing_uncapped", severity: "medium", owner: "procurement" },
      ],
      nextActions: [
        { action: "request_fsi_references", count: 2, dueDays: 7, owner: "vendor_risk" },
        { action: "request_soc2_under_nda", dueDays: 7, owner: "security" },
        { action: "scope_paid_pilot", durationDays: 60, successMetric: "fin_resolution_rate", owner: "procurement" },
      ],
      citations: 10,
      source: "exa.live_web",
    },
    exaTrace: {
      endpoint: "POST https://api.exa.ai/search",
      request: {
        query: "Intercom customer case study bank fintech insurance financial services named reference",
        type: "auto",
        numResults: 6,
        contents: {
          text: { maxCharacters: 1200 },
          highlights: { numSentences: 2, query: "named financial-services customer" },
          summary: { query: "Does Intercom have named banking customers?" },
        },
      },
      response: {
        requestId: "exa_sample_intercom_fsi",
        autopromptString: "Named banking, insurance, or fintech customers and case studies for Intercom",
        resolvedSearchType: "neural",
        costDollars: 0.021,
        results: [
          {
            title: "Customer stories — Intercom",
            url: "https://www.intercom.com/customers",
            publishedDate: "2026-04-20",
            score: 0.84,
            highlights: ["Featured customers span SaaS, e-commerce, and marketplaces", "no banking or insurance customer is named on the page"],
          },
          {
            title: "AI support vendors in regulated industries — analyst note",
            url: "https://www.softwarereviews.io/categories/customer-service-ai",
            publishedDate: "2026-04-15",
            score: 0.69,
            highlights: ["horizontal vendors show strong general compliance but fewer public FSI references"],
          },
        ],
      },
    },
  };

  return result;
}
