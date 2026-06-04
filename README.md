# VendorProof

**An Exa-powered vendor-diligence agent for financial services.**

> **Live demo:** _‹deploy to Vercel and paste the URL here — it opens directly in zero-config sample mode›_  ·  **Demo video (<60s):** _‹link›_  ·  **Repo:** `github.com/Chenglin97/vendorproof`
>
> **Evaluate in 2 minutes:** open the live demo → click **“Try the Intercom sample”** → skim the verification matrix → click any evidence chip to open the cited source. No keys, no setup.

When a bank, fintech, or insurer evaluates a vendor, they can't take a marketing page at face value. VendorProof uses [Exa](https://exa.ai)'s live web search to **verify what a vendor claims against real public evidence**, compare them to competitors, surface risk flags, and produce an evidence-backed negotiation brief — every insight linked to a citable source.

It is not vendor search and not a chatbot. It is an internal diligence agent: **live web → evidence → structured decision support → downstream agent action.**

> **North star:** the demo should make one thing obvious — *Exa can turn messy live web evidence into structured, agent-ready intelligence for high-stakes financial-services decisions.*

---

## What it does

Give it a vendor, the claims to verify, and (optionally) competitors and buyer context. VendorProof:

1. Plans a set of **targeted Exa queries** — one search per claim, plus structural searches for security/compliance, case studies, pricing, docs, and reviews, plus two head-to-head queries per competitor. (Not one generic search — a typical run is 12–19 searches.)
2. Retrieves **text, highlights, and claim-scoped summaries** from each result via Exa `/search` + `/contents`.
3. Classifies every source by **type and stance** (supports / refutes / context) and scores each claim into a **verdict, confidence, and risk**.
4. Produces a **Claim Verification Matrix**, **competitor comparison**, **risk flags**, **negotiation levers**, **questions to ask the vendor**, a **procurement-ready summary**, and an **agent-handoff JSON** payload for a downstream CRM / vendor-risk agent.

Every cell in the matrix opens an **evidence drawer** with the real source title, URL, Exa highlight, and the claim it tests.

### A guided, AI-assisted intake

The setup is a **three-step wizard**, not a blank form — Exa does the legwork:

1. **Vendor** — type a name; Exa finds the official site, a one-line description, and category from the live web. Confirm it, pick from alternative matches, or edit the domain manually.
2. **Claims** — Exa scrapes the vendor's *own* pages and proposes the claims to verify. Edit, remove, or add — each becomes one verification search. (If it can't extract specific claims, it says so and offers editable placeholders rather than faking them.)
3. **Compare** — optionally add competitors (with Exa-suggested ones) and your buying context, then run.

### Result screens

| Screen | What it shows |
|---|---|
| **Claim Verification** | Proof score, claim coverage, risk flags, the verification matrix (filterable), and the competitor comparison. Every evidence chip opens a drawer with the real source title, URL, Exa highlight, and the claim it tests. |
| **Levers & Brief** | Negotiation levers built from the evidence gaps, questions to ask, and a copy-ready procurement summary. |
| **Exa Integration** | The agent flow, the representative Exa request/response, the agent-handoff JSON, and a drop-in `verifyClaim()` snippet. |

---

## Quick start

**Requirements:** Node ≥ 18.18 (tested on 20 and 25; `.nvmrc` pins 20). On Node 25, an experimental global `localStorage` is auto-neutralized by `src/instrumentation.ts` — no action needed.

```bash
git clone https://github.com/Chenglin97/vendorproof.git
cd vendorproof
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open **http://localhost:3000** (or the next free port Next prints) and click **“Try the Intercom sample”** on step 1.

> The app runs in **sample mode with zero configuration**, so it always demos. Add an Exa key to run live diligence on any vendor; add a Claude key for vendor-specific claim extraction and sharper verdicts.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `EXA_API_KEY` | No | Powers live web diligence. Get one at [dashboard.exa.ai](https://dashboard.exa.ai). **Used server-side only** — never exposed to the client. If missing, the app falls back to the curated Intercom sample. |
| `ANTHROPIC_API_KEY` | No | If set, evidence is graded by Claude for richer findings. If missing, a deterministic heuristic is used instead. |
| `ANTHROPIC_MODEL` | No | Override the Claude model (default `claude-sonnet-4-6`). |

**Graceful degradation at every layer:**

```
no EXA_API_KEY ........... curated Intercom sample (full UI, citable pages)
Exa call fails ........... curated sample, flagged in the header
ANTHROPIC_API_KEY set .... Claude grades the evidence
ANTHROPIC_API_KEY absent . deterministic heuristic analysis
```

The Exa key is read only inside the server routes (`src/app/api/{verify,discover,claims}/route.ts` → `src/lib/{engine,intake}.ts`). It is never bundled into client code. The paid routes are rate-limited per IP (`src/middleware.ts` — 8 verify/min, 25 discover-or-claims/min) with a 16 KB body cap, so an unthrottled endpoint can't run up your Exa/Claude bill.

---

## Demo script (under 60 seconds)

1. **Open the app.** First screen is the working tool — step 1 of the diligence wizard, not a landing page.
2. **Click “Try the Intercom sample.”** Exa "discovers" Intercom — official site, description, category — and you confirm. *(With a key, type any vendor; this happens live.)*
3. **Confirm & find claims.** Exa scrapes Intercom's own pages and proposes the claims: enterprise-grade AI support, secure & compliant, CRM integration, reduces support volume. Add Zendesk / Salesforce Service Cloud / Ada as competitors, then **Run verification.**
4. **Watch the staged loader** — searching the live web (one search per claim), retrieving contents, classifying evidence, scoring.
5. **Land on the matrix.** Proof score in the **mid-70s — Strong** (≈77 live, 74 in the curated sample). Security and CRM integration **verified** against the trust center and developer docs; the enterprise-AI and volume-reduction claims come back **partial**. *“Intercom clears security and integration with citable public pages — but the AI-maturity and resolution claims aren’t fully proven, and there’s no named **regulated-FSI** reference customer.”*
6. **Click an evidence chip.** The drawer opens the real source — Intercom’s trust center / customer page — with the Exa highlight and the claim it tests. *“Every verdict is grounded in a real URL.”*
7. **Open “Levers & Brief.”** *“The gaps become negotiation leverage: prove the resolution rate on our own data, require named FSI references, cap usage-based pricing.”* Hit **Copy for CRM.**
8. **Open “Exa Integration.”** *“And here’s the agent-handoff JSON and the exact `/search` + `/contents` orchestration our AI-platform team drops into an internal diligence agent.”*

> Recording without a key? Sample mode produces this entire flow deterministically — no quota or network dependency.

---

## What Exa unlocks for FSI

- **Fresh external web, not a stale database.** Trust centers, job posts, case studies, and competitor pricing change constantly. Exa reads them *live* — internal RAG only knows what's already indexed.
- **Proving the absence of evidence.** The hardest, most valuable diligence signal is a negative: *"is there any named bank customer anywhere?"* Exa's broad neural recall lets an agent assert "none found" with confidence — something keyword search and licensed databases handle poorly.
- **Source-grounded and auditable.** Every result is a URL, so every verdict is defensible for vendor-risk and model-risk committees.
- **Agent-ready retrieval.** `/search` + `/contents` returns text, highlights, and claim-scoped summaries in one call, scoped by category and domain — it drops straight into an internal agent, no scraping or brittle connectors.
- **Expansion path.** Vendor claim verification → ongoing third-party monitoring → renewal diligence → KYC / onboarding evidence packs, across every desk.

---

## Deploy to Vercel

1. Push this repo to GitHub (already done if you cloned it). Make it public, or grant your reviewer's GitHub account access, so the import and clone steps work for them.
2. In [Vercel](https://vercel.com/new), **Import** the repo. The framework preset auto-detects **Next.js** — no build settings to change.
3. Add environment variables under **Settings → Environment Variables**: `EXA_API_KEY` (and optionally `ANTHROPIC_API_KEY`). Mark them for Production + Preview.
4. **Deploy.** The diligence route runs as a Node serverless function (`maxDuration = 60`) to allow for the Exa + LLM fan-out.

Or from the CLI:

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

Without env vars set, the deployment still works — it serves sample mode. Add `EXA_API_KEY` to go live.

---

## Architecture

```
src/
  app/
    page.tsx                 # client orchestrator: wizard → loading → results
    api/discover/route.ts    # POST: name → official site + description (intake step 1)
    api/claims/route.ts      # POST: vendor+site → claims scraped from their pages (step 2)
    api/verify/route.ts      # POST: runs diligence; GET: reports mode (no key leak)
    layout.tsx, globals.css  # Geist + JetBrains Mono, design tokens
  middleware.ts              # per-IP rate limit + body-size guard on the paid routes
  instrumentation.ts         # neutralizes Node 25's broken global localStorage in SSR
  lib/
    exa.ts                   # server-only Exa client + targeted query plan
    intake.ts                # vendor discovery + claim scraping (the two AI intake steps)
    analyze.ts               # deterministic heuristic analyzer (no-LLM fallback)
    llm.ts                   # optional Claude refinement over the same real evidence
    engine.ts                # orchestrator + graceful fallback + handoff/CRM builders
    domain.ts                # shared domain normalization + vendor-domain test
    sample.ts                # curated Intercom diligence (keyless demo)
    types.ts                 # shared shapes (the agent-ready payload)
  components/                # IntakeWizard, ResultsView, ClaimVerification, LeversBrief,
                             # Integration, EvidenceDrawer, Shell, ui
```

**Design principle:** evidence (real URLs + snippets) is *always* built deterministically from Exa results, so every citation is genuine. The LLM only *reasons* over that evidence — it never invents sources.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · `exa-js`. No client-side secrets.

---

## Notes & scope

This is a take-home: scoped to be readable end-to-end while still being a real, working app.

- The curated **Intercom sample** references Intercom's actual public pages; verdicts reflect a genuine FSI diligence read (strong general-enterprise proof, thinner *regulated-banking* specifics). It exists so the demo never depends on a key or quota.
- Live mode hits Exa for real. Verdicts in live mode are produced by the heuristic (always) and refined by Claude (if a key is present). Treat them as a diligence *starting point*, not legal/financial advice.
- Vendor names in any non-Intercom example are illustrative.

---

## License

MIT — see [LICENSE](./LICENSE).
