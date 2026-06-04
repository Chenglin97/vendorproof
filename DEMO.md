# VendorProof — demo recording guide (live mode, <60s)

You're recording the **live** flow (real Exa), typing the claims by hand in step 2.
Vendor: **Intercom** (the assignment's example; verified to produce a clean result).

---

## Pre-flight (2 minutes)

1. Dev server running with the Exa key: `npm run dev -- -p 3019` (it's already up).
2. **Hard-reload** `http://localhost:3019` so the header reads **“Live Exa”** (not a stale “Sample mode”).
3. Browser window ~**1280×800**, zoom 100%, hide bookmarks bar, turn on Do Not Disturb (no notification popups).
4. **Do one full dry run first** — Exa is live, so results vary slightly run-to-run. If a run looks off, just re-run; expect ~**77 / Strong**.
5. Recorder: `Cmd+Shift+5` (built-in) or [Screen Studio](https://screen.studio) for auto-zoom polish. Record the browser window only.

## Values to enter (copy-paste these)

| Field | Value |
|---|---|
| Vendor (step 1) | `Intercom` |
| Buyer context (step 3) | `Regional bank evaluating an AI customer-support vendor for regulated customer service workflows` |
| Competitors (step 3) | `Zendesk`, `Salesforce Service Cloud`, `Ada` |

**Claims to type in step 2** (the auto-scrape returns generic placeholders without a Claude key — clear them and type these 4):

```
Enterprise-grade AI customer support
Secure and compliant deployment
Integrates with existing support and CRM systems
Can reduce support volume and improve resolution time
```

## What the result will show (so nothing surprises you on camera)

- **Proof score ≈ 77 — Strong**, verdict **“Proceed — low diligence risk.”**
- **Secure & compliant** → *verified* (cites `trust.intercom.com`)
- **Integrates with CRM** → *verified* (cites `developers.intercom.com`)
- **Enterprise-grade AI support** and **Reduce support volume** → *partial* (the leverage)
- ~40+ evidence sources, a couple of risk flags.

---

## The ~50-second script (narration in italics)

| Time | On screen | Say |
|---|---|---|
| 0–8s | Step 1, type `Intercom`, click **Find vendor** | *“VendorProof is an Exa-powered vendor-diligence agent for financial services. A bank is evaluating a vendor — I just type the name…”* |
| 8–15s | Discovery card appears (intercom.com + description) | *“…and Exa finds their official site and what they do, live from the web.”* Click **Confirm & find claims.** |
| 15–26s | Step 2 — clear placeholders, paste the 4 claims | *“These are the claims I want to verify — each becomes its own Exa search.”* → Step 3: add the 3 competitors + buyer context → **Run verification.** |
| 26–34s | Staged loader | *“One targeted search per claim against the live web — retrieve contents, classify the evidence, score each claim.”* |
| 34–47s | Matrix + a click on an evidence chip | *“Seventy-seven — Strong. Security and CRM integration verified against their trust center and developer docs; the ‘enterprise AI’ and volume-reduction claims are only partially proven.”* (click chip) *“Every verdict links to a real source.”* |
| 47–55s | Levers & Brief → Copy for CRM, then flash Exa Integration tab | *“The gaps become negotiation leverage — and it all hands off as agent-ready JSON for an internal procurement agent. Messy live web in, structured diligence out.”* |

## Close (optional last line)
*“That’s Exa turning the live web into auditable, agent-ready intelligence for a high-stakes decision.”*

---

> Tip: keep it under 60s. If you fumble, the wizard’s **Back** buttons let you re-take a step without restarting. For a guaranteed-identical take with specific auto-filled claims, remove `EXA_API_KEY` from `.env.local` and restart — that serves the curated Intercom sample (74/Strong) deterministically.
