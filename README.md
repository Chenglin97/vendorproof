# VendorProof

**An Exa-powered vendor-diligence agent for financial services.**

> **Live demo:** **https://vendorproof-chenglin-wei-projects.vercel.app**  ·  **Demo video (<60s):** _‹link›_  ·  **Strategy memo:** [STRATEGY.md](./STRATEGY.md)  ·  **Repo:** `github.com/Chenglin97/vendorproof`
>
> **Evaluate in 2 minutes:** open the live demo → type any vendor → watch Exa find the site, pull the vendor's claims, verify each against the live web, and dig up the complaints they hide. Every verdict and risk flag links to a real source. No setup.

When a bank, fintech, or insurer evaluates a vendor, they can't take a marketing page at face value. **VendorProof uses [Exa](https://exa.ai) to verify what a vendor claims against the live web, surface the risks they don't advertise, and turn it into a procurement-ready brief — every insight linked to a citable source.**

It's not vendor search and not a chatbot. It's an internal diligence agent: **live web → evidence → structured decision support → downstream agent action.** The whole reasoning stack is Exa — `searchAndContents` for verification, `answer` for claim extraction and adverse intelligence. No third-party LLM.

---

## How it works

A three-step wizard, every step powered by Exa:

1. **Discover** — type a vendor name; Exa finds the official site, a one-line description, and category from the live web. Confirm, pick an alternative, or edit it.
2. **Extract** — Exa's **Answer API** reads the vendor's own pages and pulls out the specific claims they make about themselves (cited). You can edit or add to them; each becomes one verification search.
3. **Verify** — Exa runs **one targeted search per claim**, plus structural searches (security/compliance, case studies, pricing, docs, reviews) and head-to-head competitor queries. Every result is classified by source type and stance, then scored.

In parallel, an **adverse-intelligence sweep** (`exa.answer`) hunts for the things a vendor won't put on its own site — outages, complaints, lawsuits, hidden costs, controversies — and surfaces them as **risk flags, each linked to its source.**

**Output:** a Claim Verification Matrix (every cell cites a live URL), competitor comparison, risk flags (including the dirt), negotiation levers, questions to ask, a procurement-ready summary, and an **agent-handoff JSON** payload for a downstream CRM / vendor-risk agent.

## Diligence, not search — it's skeptical by design

The point of diligence is to find where claims *aren't* backed. So a vendor's own page only **verifies** a formal, checkable attestation (a SOC 2 / ISO certification on its trust center). Every capability, marketing, or outcome claim stays **partial** until an *independent* source corroborates it — no rubber-stamping a vendor's marketing back to itself. The most valuable signal is often a documented negative: *"we ran N searches on this date and found no named bank customer, no SOC 2, and one undisclosed incident."*

---

## Quick start

**Requirements:** Node ≥ 18.18 (`.nvmrc` pins 20). On Node 25, an experimental global `localStorage` is auto-neutralized by `src/instrumentation.ts` — no action needed.

```bash
git clone https://github.com/Chenglin97/vendorproof.git
cd vendorproof
npm install
echo "EXA_API_KEY=your_key_here" > .env.local   # get one at https://dashboard.exa.ai
npm run dev
```

Open **http://localhost:3000** and run a vendor. With no key, the app serves a curated Intercom sample so it always demos; add `EXA_API_KEY` to run live diligence on any vendor.

The key is read **server-side only** (in the API routes → `src/lib/{engine,intake}.ts`) and never reaches the client. The paid routes are rate-limited per IP with a body-size cap, so an exposed endpoint can't run up your Exa bill.

---

## Architecture

```
src/
  app/
    page.tsx                 # client orchestrator: wizard → loading → results
    api/discover/route.ts    # POST: name → official site + description
    api/claims/route.ts      # POST: vendor+site → claims (via exa.answer)
    api/verify/route.ts      # POST: full diligence; GET: reports live/sample mode
  middleware.ts              # per-IP rate limit + body-size guard on paid routes
  instrumentation.ts         # neutralizes Node 25's experimental localStorage in SSR
  lib/
    exa.ts                   # server-only Exa client + targeted query plan
    intake.ts                # discovery, claim extraction, adverse sweep (Exa Answer)
    analyze.ts               # deterministic scoring: stance, verdict, risk, levers
    engine.ts                # orchestrator + handoff/CRM builders + adverse merge
    domain.ts                # shared domain normalization + vendor-domain test
    sample.ts                # curated Intercom diligence (keyless demo)
    types.ts                 # shared shapes (the agent-ready payload)
  components/                # IntakeWizard, ResultsView, ClaimVerification, LeversBrief,
                             # Integration, EvidenceDrawer, Shell, ui
```

**Design principle:** evidence (real URLs + snippets) is always Exa's; the scoring is deterministic and never invents a source. Exa supplies the grounded evidence and the synthesis; the decision shape is the app's.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · `exa-js`. Deploys to Vercel as-is (import the repo, set `EXA_API_KEY`, deploy).

---

## What Exa unlocks for FSI

- **Fresh external web, not a stale database.** Trust centers, incident reports, reviews, and competitor pages change constantly — Exa reads them live; internal RAG only knows what it already indexed.
- **Proving the absence of evidence,** and surfacing the adverse signal a vendor hides — the hardest, most valuable diligence facts, which keyword search and licensed feeds handle poorly.
- **Source-grounded and auditable** — every verdict and risk flag is a real URL, defensible for vendor-risk and model-risk committees.
- **Agent-ready** — `searchAndContents` + `answer` drop straight into an internal diligence agent; the output is structured JSON, ready to hand off.

The full strategy — challenges, product needs, the data moat vs. incumbents, TAM, and sales barriers — is in **[STRATEGY.md](./STRATEGY.md)**. A 60-second walkthrough script is in **[DEMO.md](./DEMO.md)**.

---

## Notes

This is a take-home: scoped to be readable end-to-end while being a real, working app. Live verdicts are a diligence *starting point*, not legal or financial advice. Exa returns a bounded result set, so a "not found" means "none surfaced across the searches run," not a proof of absence. Vendor names in any example are used illustratively.

## License

MIT — see [LICENSE](./LICENSE).
