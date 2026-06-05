# VendorProof — demo recording guide (live mode, <60s)

You're recording the **live** flow (real Exa, end to end). In step 2, **Exa's
Answer API auto-extracts the vendor's claims** — you don't type them. The whole
stack is Exa: `exa.searchAndContents` + `exa.answer`, no third-party LLM.
Vendor: **Intercom** (the assignment's example) — but it works on any brand.

---

## Pre-flight (2 minutes)

1. Dev server: `npm run dev` (port 3000) — or just record against the live URL: **vendorproof-chenglin-wei-projects.vercel.app**.
2. **Hard-reload** so the header reads **“Live Exa.”**
3. Browser ~**1280×800**, zoom 100%, hide bookmarks, Do Not Disturb on.
4. **Do one dry run first** — it's live, so the extracted claims, score, and dirt vary run-to-run. That's the point.
5. Recorder: `Cmd+Shift+5`, or [Screen Studio](https://screen.studio) for auto-zoom polish. Browser window only.

## Values to enter

| Field | Value |
|---|---|
| Vendor (step 1) | `Intercom` |
| Claims (step 2) | **auto-filled by Exa Answer** — review, continue |
| Competitors (step 3) | `Zendesk`, `Salesforce Service Cloud`, `Ada` |
| Buyer context (step 3) | `Regional bank evaluating an AI customer-support vendor for regulated customer service workflows` |

## What the result will show

- A **Mixed** proof score (≈50–65). The tool is **deliberately skeptical**: most claims are the vendor's own word → **partial** until an independent source confirms them; only formal attestations (SOC 2 / ISO) verify off the vendor's own page. (No more rubber-stamped 100%.)
- **Risk flags = the dirt.** A parallel `exa.answer` sweep digs up reported outages, pricing complaints, support issues, lawsuits — each **linked to its source**. (Intercom: a ~71-min US outage, a forced pricing restructure, billing-support failures.)
- Exact claims, score, and findings vary run-to-run because it's live — narrate qualitatively, not to a fixed number.

---

## The ~55-second script (narration in italics)

| Time | On screen | Say |
|---|---|---|
| 0–8s | Step 1, type `Intercom`, **Find vendor** | *“VendorProof is an Exa-powered vendor-diligence agent for financial services. I type the vendor…”* |
| 8–15s | Discovery card (site + description) | *“…and Exa finds their official site, live from the web.”* Click **Confirm & find claims.** |
| 15–24s | Step 2 — claims auto-populate | *“Exa reads their pages and pulls out the claims they make — each becomes one live verification search.”* → add competitors + buyer context → **Run.** |
| 24–38s | Matrix | *“It's skeptical — most claims are just the vendor's own word, marked partial until an independent source confirms them. Only the security certifications verify off their own trust center.”* |
| 38–48s | Risk flags — click a flag's source link | *“And Exa digs up what they don't advertise — a reported outage, pricing complaints — each linked to its source.”* |
| 48–57s | Levers & Brief → flash Exa Integration tab | *“The gaps and the dirt become negotiation leverage — and it hands off as agent-ready JSON. Messy live web in, structured diligence out.”* |

## Close (optional)
*“That’s Exa turning the live web into auditable, agent-ready intelligence for a high-stakes decision.”*

---

> Claim extraction, verification, and the adverse dig are **100% Exa** (`exa.answer` + `exa.searchAndContents`) — no third-party LLM in the stack. The wizard's **Back** buttons let you re-take any step.
