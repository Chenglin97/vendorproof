# VendorProof

**An Exa-powered vendor-diligence agent for financial services.**

When a bank, fintech, or insurer evaluates a vendor, they can't take a marketing page at face value. VendorProof uses [Exa](https://exa.ai)'s live web search to **verify what a vendor claims against real public evidence**, compare them to competitors, surface risk flags, and produce an evidence-backed negotiation brief — every insight linked to a citable source.

It is not vendor search and not a chatbot. It is an internal diligence agent: **live web → evidence → structured decision support → downstream agent action.**

> **North star:** the demo should make one thing obvious — *Exa can turn messy live web evidence into structured, agent-ready intelligence for high-stakes financial-services decisions.*

---

## What it does

Give it a vendor, the claims to verify, and (optionally) competitors and buyer context. VendorProof:

1. Plans a set of **targeted Exa queries** — one search per claim, plus structural searches for security/compliance, case studies, pricing, docs, and head-to-head competitor comparisons. (Not one generic search.)
2. Retrieves **text, highlights, and claim-scoped summaries** from each result via Exa `/search` + `/contents`.
3. Classifies every source by **type and stance** (supports / refutes / context) and scores each claim into a **verdict, confidence, and risk**.
4. Produces a **Claim Verification Matrix**, **competitor comparison**, **risk flags**, **negotiation levers**, **questions to ask the vendor**, a **procurement-ready summary**, and an **agent-handoff JSON** payload for a downstream CRM / vendor-risk agent.

Every cell in the matrix opens an **evidence drawer** with the real source title, URL, Exa highlight, and the claim it tests.

### Screens

| Screen | What it shows |
|---|---|
| **Diligence Setup** | Vendor, domain, category, buyer context, editable claim list, competitors. One-click sample data. A live Exa request preview (query count, scope, est. cost/latency). |
| **Claim Verification** | Proof score, claim coverage, risk flags, the verification matrix (filterable), and the competitor comparison. |
| **Levers & Brief** | Negotiation levers built from the evidence gaps, questions to ask, and a copy-ready procurement summary. |
| **Exa Integration** | The agent flow, the representative Exa request/response, the agent-handoff JSON, and a drop-in `verifyClaim()` snippet. |

---

## Quick start

```bash
git clone https://github.com/Chenglin97/vendorproof.git
cd vendorproof
npm install
cp .env.example .env.local   # optional — see below
npm run dev
```

Open **http://localhost:3000** and click **“Load sample (Intercom)” → “Run verification with Exa.”**

> The app runs in **sample mode with zero configuration**, so it always demos. Add an Exa key to run live diligence on any vendor.

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

The Exa key is read only inside the server route (`src/app/api/verify/route.ts` → `src/lib/engine.ts`). It is never bundled into client code.

---

## Demo script (under 60 seconds)

1. **Open the app.** First screen is the working tool — the diligence setup, not a landing page.
2. **Click “Load sample (Intercom).”** A regional bank is evaluating Intercom as an AI customer-support vendor. Four claims load (enterprise-grade AI support, secure & compliant, integrates with CRM, reduces support volume) plus competitors Zendesk, Salesforce Service Cloud, and Ada.
3. **Point at the request preview** (the dark card): *“One Exa search per claim, scoped to the vendor’s own domain plus the open web — with cost and latency up front.”*
4. **Click “Run verification with Exa.”** The staged loader shows the agent searching the live web, retrieving contents, classifying evidence, and scoring.
5. **Land on the matrix.** Proof score **74 — Strong baseline.** Three claims verified, one partial. *“Intercom clears security, CRM integration, and AI maturity with citable public pages — but there’s no named **regulated-FSI** reference customer, and the resolution-rate claim is vendor-reported.”*
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

1. Push this repo to GitHub (already done if you cloned it).
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
    page.tsx                 # client orchestrator: setup → loading → results
    api/verify/route.ts      # POST: runs diligence; GET: reports mode (no key leak)
    layout.tsx, globals.css  # Geist + JetBrains Mono, design tokens
  instrumentation.ts         # neutralizes Node 25's broken global localStorage in SSR
  lib/
    exa.ts                   # server-only Exa client + targeted query plan
    analyze.ts               # deterministic heuristic analyzer (no-LLM fallback)
    llm.ts                   # optional Claude refinement over the same real evidence
    engine.ts                # orchestrator + graceful fallback + handoff/CRM builders
    sample.ts                # curated Intercom diligence (keyless demo)
    types.ts                 # shared shapes (the agent-ready payload)
  components/                # SetupForm, ResultsView, ClaimVerification, LeversBrief,
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
