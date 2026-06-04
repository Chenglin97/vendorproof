> **Take-home "think through" component.** This memo answers the assignment's four strategy questions — challenges FSI teams face, product needs, the data Exa uniquely captures and the market it unlocks, and sales barriers — and frames **VendorProof** (this repo) as the concrete wedge. Written founder-style: opinionated, specific, and honest about Exa's real limits.

---

# Exa × Financial Services: The Documented-Negative Wedge

## The opening

The blocker on AI adoption in regulated finance is not model quality — it's governance evidence. Every major regime now pulls vendor and embedded AI fully into scope: the Fed's SR 11-7 treats third-party models as in-scope for "effective challenge," the PRA's SS1/23 covers all models "whether developed in-house or externally (including vendor models)," and DORA forces AI vendors into a register of ICT third parties with documented exit strategies and subcontractor diligence. The work that gates a deal is documentary. And the hardest artifact to produce is a credible *negative*: a defensible record that you looked for a SOC 2 report, a named bank customer, an undisclosed incident — and turned up nothing.

Be precise about what that means, because the precision is the product. Exa is ranked web retrieval over fresh external content. It returns a bounded result set, not a census of the web. So the artifact is not "this vendor has no SOC 2 anywhere" — Exa cannot prove that, and a SOC 2 behind a login wall returns the same empty set as one that doesn't exist. The artifact is: *"We ran N targeted searches across the public web on this date; here are the exact queries, here are the sources, and none surfaced a SOC 2, a named FSI customer, or a disclosed incident."* That converts a blank questionnaire field into a documented, repeatable, audit-trailed negative. That is genuinely valuable, and it is honest. The wedge: own the evidence-and-audit-trail layer of AI-vendor diligence, starting with VendorProof.

## What FSI teams struggle with today

Per Whistic's *2025 Third-Party Risk Management Impact Report*, an average team of ~8.5 analysts covers ~286 vendors and most respondents call their manual TPRM workflow unscalable; treat these as one vendor's survey, not ground truth. The directional point holds and matches what practitioners say: evidence collection, not risk judgment, is the bottleneck. The painful unit is chasing artifacts across weeks of incomplete vendor back-and-forth.

Three structural gaps make it worse:

- **The documented negative.** Federal regulators endorse SOC 2 for vendor diligence, and many security teams won't open a file on an AI vendor that lacks one. Early-stage AI vendors often have none — and an empty questionnaire field is not evidence. A dated, source-cited "we searched and found nothing" is the artifact a risk officer actually wants and a questionnaire can never produce.
- **Fourth-party opacity.** If a vendor wraps OpenAI's or Anthropic's API, the bank is using that provider as a fourth party — yet sub-processor lists are stale and self-reported. Five vendors sitting on one foundation model is invisible concentration risk. Public web evidence surfaces this as a *lead* to investigate — not as a register-grade filing.
- **The static-review gap.** SR 11-7 assumes models are stable between review cycles; agentic systems recalibrate continuously, so point-in-time diligence is regulator-acknowledged as insufficient. Fresh web retrieval between cycles is a real complement to a quarterly licensed feed.

## What Exa actually captures — and its honest limits

The edge is **freshness and long-tail recall on entity queries**. Licensed feeds (Moody's, LSEG, Dow Jones adverse-media) and internal RAG only contain what was ingested at last refresh; Exa's neural+keyword auto-routing plus a per-result `summary` and `highlights` in one `searchAndContents` call surfaces last week's incident report or an obscure named case study a keyword index misses.

The limits are equally real and must be in the pitch:

- **Thin-footprint vendors.** The exact early-stage AI vendors we target may have almost no web presence. Less footprint means less evidence means an artificially "low proof" score that reflects the crawler's blind spot, not the vendor's posture. The product must label this explicitly as low-coverage, never as low-trust.
- **Entity collisions.** "Ramp" pulls LiveRamp, IdRamp, FilingRamp. VendorProof already ships an impostor-domain filter for exactly this — but it's a known, ongoing failure mode, not a solved one.
- **False positives are the existential risk.** A false "verified" — an impostor company's case study, a look-alike SOC 2 — approves a real vendor on bad evidence. For a diligence tool that is worse than a false negative, and grading discipline must be tuned around it.

## What Moody's / LSEG / Dow Jones do better

Sell alongside, not against — and concede why. Incumbent feeds are license-clean, entity-resolved, false-positive-managed, and audit-survivable; compliance teams already trust them and they hold up in an exam. Fresh web is messier, harder to entity-resolve, and carries no provenance guarantee. Exa's role is the **fresh, long-tail, early-stage-vendor complement** where licensed coverage is thinnest — the new AI vendor with no entity record yet. Conceding the incumbent's strength is what makes the complement claim credible.

## Roadmap — not yet built

Today VendorProof fans out `exa.searchAndContents` (`type:auto`, `highlights`, `summary`, `includeDomains`) for verification, and calls `exa.answer` — Exa's own search-grounded synthesis — to extract the vendor's claims from their pages, so the reasoning layer stays on Exa rather than a third-party LLM. It does not yet use date filtering, livecrawl, the Research API, or Monitors. State that plainly; an Exa exec who opens `src/lib/{exa,intake}.ts` will check. The expansion path, clearly aspirational:

- **Per-claim recency gate** via `startPublishedDate`/`endPublishedDate` and livecrawl — "evidence published in the last 90 days," the between-assessment gap in the regulator's own words.
- **Continuous monitoring** via Websets Monitors (cron search + webhooks) — the recurring-ARR half of the same oversight mandate.
- **A web-derived fourth-party signal graph** — explicitly a lead-generation layer that *feeds* a DORA register workflow, never a register-grade record itself.

## Unit economics and the GTM tension

The engine already logs `costDollars` per run. A diligence pass is ~12–19 searches at `numResults` 3–6, so Exa spend is on the order of low cents to low dollars per vendor — trivial against a six-figure adverse-media line item. That argues for a **seat/subscription** motion, not per-search billing: procurement buys subscriptions, and the monitoring use case is inherently recurring. Land VendorProof as onboarding evidence; expand to a per-critical-vendor Monitor sold against the explicit continuous-oversight mandate in OCC Bulletin 2023-17 and DORA.

Name the hard part honestly: FSI diligence is a slow, security-reviewed, procurement-gated enterprise sale — the opposite of Exa's developer self-serve DNA. It's still worth it because the regulatory tailwind is durable and the monitoring revenue is recurring and defensible. An exec respects the memo that says this out loud.

## Sales barriers and how we beat them

| Barrier | Counter |
|---|---|
| "We license Moody's / LSEG / Dow Jones." | Those are audit-survivable lists of what's *on* a list. Exa is the fresh, long-tail complement for vendors with no entity record yet. Complementary, sold alongside. |
| "Why not Tavily / Perplexity / Brave + an LLM?" | On long-tail entity queries, Exa's embedding retrieval recall plus `/contents` summary+highlights in one call beats a commodity SERP wrapper. If that edge doesn't hold on a real vendor, the wedge isn't real — so we benchmark it openly. |
| "We have internal RAG." | RAG only knows what you ingested. It can't surface a case study published yesterday or a vendor it never crawled. |
| "How do I trust an AI 'NO'?" | We sell the audit trail, not an ontological proof: exact queries, dated, every cell citing a live URL. False positives are the real risk, so absence returns "unverified," never a fabricated "verified," and we ship an impostor-domain filter today. |
| "Data handling / PII." | The Exa key is server-side. But the query carries the vendor name plus buyer context — and buyer context can be MNPI ("regional bank evaluating X"), so it's templated to avoid leaking deal intent. Open items the security review will gate on: EU/UK data residency under DORA, and the ToS/licensing status of scraped content surfaced as evidence. We bring answers, not a trace screen. |

## How we'd prove the "NO" is right

A completeness-flavored pitch demands a completeness measurement. Before any FSI buyer, run a recall benchmark against a labeled set — e.g. 50 vendors with *known* SOC 2 status and *known* named FSI customers — and report precision/recall. Recall tells us how often a true artifact is missed (the thin-footprint failure); precision tells us how often an impostor slips through (the existential one). Showing we can measure completeness is the single most credibility-building thing we can put in front of a technical buyer.

## The wedge in action: VendorProof

A bank, fintech, or insurer names a vendor and the claims to verify. VendorProof fires one scoped `searchAndContents` call per claim (`type:auto`, `includeDomains` scoped to the vendor's own + docs domains, with `highlights{query}` and a per-result summary prompt: *"Does this evidence support the claim?"*), plus structural queries — SOC 2 / trust-center, FSI-named case study, pricing, docs, reviews — and head-to-head competitor searches. Output: a Claim Verification Matrix (verdict / confidence / risk, every cell citing a live URL), competitor comparison, risk flags, negotiation levers, questions-to-ask, a procurement-ready summary, and an agent-handoff JSON (`vendorproof.diligence/v1`). Note the honest seam: claim extraction runs on `exa.answer`, but the verdict scoring, handoff, and CRM payload are hand-built in `engine.ts` over a deterministic heuristic — Exa supplies the grounded evidence and the claim synthesis; the decision shape is ours.

The defensible advantage: a dated, source-cited record that *we searched and found no SOC 2, no named FSI customer, and one publicly reported incident the vendor omitted from its trust page* — on fresh, long-tail web that internal RAG and licensed DBs don't cover. That's the line from one-time onboarding (LAND) to a Monitor per critical vendor (EXPAND), riding the same regulation the whole way up.

## Sources

- SR 11-7 in the Age of Agentic AI (GARP): https://www.garp.org/risk-intelligence/operational/sr-11-7-age-agentic-ai-260227
- SS1/23 – Model Risk Management Principles for Banks (Bank of England / PRA): https://www.bankofengland.co.uk/prudential-regulation/publication/2023/may/model-risk-management-principles-for-banks-ss
- Interagency Guidance on Third-Party Relationships (OCC Bulletin 2023-17): https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html
- DORA Third-Party Risk for AI (DeepInspect): https://www.deepinspect.ai/blog/dora-ai-third-party-risk
- Third-Party Risk Management Impact Report 2025 (Whistic): https://6236605.fs1.hubspotusercontent-na1.net/hubfs/6236605/2025_Impact_Report.pdf
- SOC 2 for AI Startups: What Regulators Watch (SecureSlate): https://getsecureslate.com/blog/soc-2-for-ai-startups-what-regulators-watch-and-how-to-stay-compliant
