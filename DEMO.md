# VendorProof — demo recording guide (live mode, <60s)

You're recording the **live** flow (real Exa, end to end). In step 2, **Exa's
Answer API auto-extracts the vendor's claims** — you don't type them; you just
review and continue. Vendor: **Intercom** (the assignment's example).

---

## Pre-flight (2 minutes)

1. Dev server running with the Exa key: `npm run dev` (port 3000; any port is fine) — or just record against the live URL: **vendorproof-chenglin-wei-projects.vercel.app**.
2. **Hard-reload** so the header reads **“Live Exa”** (not a stale “Sample mode”).
3. Browser window ~**1280×800**, zoom 100%, hide bookmarks bar, Do Not Disturb on.
4. **Do one full dry run first** — Exa is live, so the extracted claims and score vary slightly run-to-run. That's the point (it's real); if a run looks off, just re-run.
5. Recorder: `Cmd+Shift+5` (built-in) or [Screen Studio](https://screen.studio) for auto-zoom polish. Record the browser window only.

## Values to enter

| Field | Value |
|---|---|
| Vendor (step 1) | `Intercom` |
| Claims (step 2) | **auto-filled by Exa Answer** — review, tweak if you like, continue |
| Competitors (step 3) | `Zendesk`, `Salesforce Service Cloud`, `Ada` |
| Buyer context (step 3) | `Regional bank evaluating an AI customer-support vendor for regulated customer service workflows` |

## What the result will show

- A **Strong** proof score, verdict around **“Proceed — low diligence risk.”**
- Security / compliance and CRM-integration claims tend to come back **verified** (citing `trust.intercom.com`, `developers.intercom.com`); broader AI-capability claims often land **partial** — the leverage.
- ~40+ evidence sources, a couple of risk flags. (Exact claims/score vary because it's live — narrate qualitatively, not to a fixed number.)

---

## The ~50-second script (narration in italics)

| Time | On screen | Say |
|---|---|---|
| 0–8s | Step 1, type `Intercom`, click **Find vendor** | *“VendorProof is an Exa-powered vendor-diligence agent for financial services. A bank is evaluating a vendor — I type the name…”* |
| 8–15s | Discovery card appears (intercom.com + description) | *“…and Exa finds their official site and what they do, live from the web.”* Click **Confirm & find claims.** |
| 15–26s | Step 2 — claims auto-populate (cite the sources) | *“Exa reads their own pages and pulls out the claims they make about themselves — each becomes one live verification search.”* → add the 3 competitors + buyer context → **Run verification.** |
| 26–34s | Staged loader | *“One targeted Exa search per claim against the live web — retrieve contents, classify the evidence, score each claim.”* |
| 34–47s | Matrix + a click on an evidence chip | *“Strong — most claims verified against their trust center and developer docs; the broader AI claims only partially proven.”* (click chip) *“Every verdict links to a real source.”* |
| 47–55s | Levers & Brief → Copy for CRM, then flash Exa Integration tab | *“The gaps become negotiation leverage — and it all hands off as agent-ready JSON for an internal procurement agent. Messy live web in, structured diligence out.”* |

## Close (optional last line)
*“That’s Exa turning the live web into auditable, agent-ready intelligence for a high-stakes decision.”*

---

> Tip: keep it under 60s. The wizard's **Back** buttons let you re-take a step without restarting. Claim extraction and verdicts are **100% Exa** (`exa.answer` + `exa.searchAndContents`) — no third-party LLM in the stack.
