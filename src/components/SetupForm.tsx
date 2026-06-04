"use client";
import React, { useState } from "react";
import { Button, Card, Chip, Eyebrow, Icons, Spinner, cx } from "./ui";
import { SAMPLE_REQUEST } from "@/lib/sample";
import type { DiligenceRequest } from "@/lib/types";

const EMPTY: DiligenceRequest = { vendor: "", domain: "", category: "", buyerContext: "", claims: [""], competitors: [] };

const EVIDENCE_PRESETS = [
  { id: "security", label: "Security / trust", on: true },
  { id: "casestudy", label: "Case studies", on: true },
  { id: "docs", label: "Docs / API", on: true },
  { id: "pricing", label: "Pricing", on: true },
  { id: "review", label: "Reviews", on: true },
  { id: "news", label: "News / press", on: false },
];

export function SetupForm({
  onRun,
  loading,
  liveMode,
  llm,
}: {
  onRun: (req: DiligenceRequest) => void;
  loading: boolean;
  liveMode: boolean | null;
  llm: boolean | null;
}) {
  const [req, setReq] = useState<DiligenceRequest>(EMPTY);
  const [comp, setComp] = useState("");
  const [evidence, setEvidence] = useState(EVIDENCE_PRESETS);

  const set = (k: keyof DiligenceRequest, v: string) => setReq((r) => ({ ...r, [k]: v }));
  const setClaim = (i: number, v: string) => setReq((r) => ({ ...r, claims: r.claims.map((c, j) => (j === i ? v : c)) }));
  const addClaim = () => setReq((r) => ({ ...r, claims: [...r.claims, ""] }));
  const rmClaim = (i: number) => setReq((r) => ({ ...r, claims: r.claims.filter((_, j) => j !== i) }));
  const addComp = () => {
    const v = comp.trim();
    if (v && !req.competitors.includes(v)) setReq((r) => ({ ...r, competitors: [...r.competitors, v].slice(0, 4) }));
    setComp("");
  };

  const loadSample = () => {
    setReq({ ...SAMPLE_REQUEST, claims: [...SAMPLE_REQUEST.claims] });
    setComp("");
  };

  const cleanClaims = req.claims.map((c) => c.trim()).filter(Boolean);
  const ready = req.vendor.trim().length > 0 && cleanClaims.length > 0;

  const submit = () => {
    if (!ready || loading) return;
    onRun({ ...req, vendor: req.vendor.trim(), claims: cleanClaims });
  };

  const queryCount = cleanClaims.length + 5 + req.competitors.length * 2;

  return (
    <div className="mx-auto max-w-[1080px] px-5 py-7 vp-fade-up">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Eyebrow>Diligence setup</Eyebrow>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1" style={{ color: "var(--ink)" }}>
            Verify a vendor against the live web
          </h1>
          <p className="text-[13px] mt-1.5 max-w-[560px]" style={{ color: "var(--ink-2)" }}>
            Name the vendor and the claims to check. VendorProof runs one targeted Exa search per claim, classifies the
            evidence, and returns an evidence-backed verification matrix, risk flags, and a negotiation brief.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSample} title="Load the Intercom diligence brief">
          <Icons.bolt size={13} style={{ color: "var(--accent)" }} />
          Load sample (Intercom)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* ── Left: the form ── */}
        <div className="flex flex-col gap-4">
          <Card>
            <SectionLabel n={1} title="Vendor" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Field label="Vendor name" required>
                <input className={inputCls} placeholder="Intercom" value={req.vendor} onChange={(e) => set("vendor", e.target.value)} />
              </Field>
              <Field label="Website / domain">
                <input className={inputCls} placeholder="intercom.com" value={req.domain} onChange={(e) => set("domain", e.target.value)} />
              </Field>
              <Field label="Category">
                <input className={inputCls} placeholder="AI customer support platform" value={req.category} onChange={(e) => set("category", e.target.value)} />
              </Field>
              <Field label="Buyer context">
                <input
                  className={inputCls}
                  placeholder="Regional bank evaluating an AI support vendor"
                  value={req.buyerContext}
                  onChange={(e) => set("buyerContext", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <SectionLabel n={2} title="Claims to verify" />
              <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                {cleanClaims.length} claim{cleanClaims.length === 1 ? "" : "s"} · one Exa search each
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {req.claims.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="mono text-[11px] w-6 shrink-0" style={{ color: "var(--ink-4)" }}>
                    c{i + 1}
                  </span>
                  <input
                    className={inputCls}
                    placeholder="e.g. Secure and compliant deployment"
                    value={c}
                    onChange={(e) => setClaim(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (i === req.claims.length - 1 ? addClaim() : null)}
                  />
                  <button
                    onClick={() => rmClaim(i)}
                    disabled={req.claims.length === 1}
                    className="shrink-0 p-1.5 focus-ring rounded-md disabled:opacity-30 hover:bg-[var(--paper-2)]"
                    style={{ color: "var(--ink-3)" }}
                    title="Remove claim"
                  >
                    <Icons.x size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addClaim} disabled={req.claims.length >= 8} className="mt-2.5 text-[12px] font-medium focus-ring rounded-md px-1 disabled:opacity-40" style={{ color: "var(--accent)" }}>
              + Add claim
            </button>
          </Card>

          <Card>
            <SectionLabel n={3} title="Competitors to compare" optional />
            <div className="flex items-center gap-2 mt-3">
              <input
                className={inputCls}
                placeholder="Zendesk"
                value={comp}
                onChange={(e) => setComp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addComp())}
              />
              <Button variant="ghost" size="sm" onClick={addComp} disabled={!comp.trim() || req.competitors.length >= 4}>
                Add
              </Button>
            </div>
            {req.competitors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {req.competitors.map((c) => (
                  <Chip key={c} onClick={() => setReq((r) => ({ ...r, competitors: r.competitors.filter((x) => x !== c) }))} title="Remove">
                    {c}
                    <Icons.x size={11} />
                  </Chip>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right: request preview ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-5">
          <Card style={{ background: "var(--ink-surface)", border: "1px solid var(--line-ink)" }}>
            <div className="flex items-center gap-2">
              <Icons.search size={14} style={{ color: "var(--on-ink-2)" }} />
              <span className="eyebrow" style={{ color: "var(--on-ink-2)" }}>
                Exa request preview
              </span>
            </div>
            <div className="mono text-[11px] leading-relaxed mt-3" style={{ color: "var(--on-ink)" }}>
              <div style={{ color: "var(--on-ink-2)" }}>POST /search · type: auto</div>
              <div className="mt-2">
                <span style={{ color: "#7da2ff" }}>queries</span>: {queryCount}
              </div>
              <div className="mt-0.5 pl-2" style={{ color: "var(--on-ink-2)" }}>
                {cleanClaims.length} per-claim · 5 structural · {req.competitors.length * 2} competitor
              </div>
              <div className="mt-1.5">
                <span style={{ color: "#7da2ff" }}>contents</span>: text · highlights · summary
              </div>
              <div className="mt-1.5">
                <span style={{ color: "#7da2ff" }}>scope</span>: {req.domain ? `${req.domain.replace(/^https?:\/\//, "")} + web` : "open web"}
              </div>
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between text-[11px]" style={{ borderTop: "1px solid var(--line-ink)", color: "var(--on-ink-2)" }}>
              <span>~{(queryCount * 0.0015).toFixed(3)} est. cost</span>
              <span>~{Math.max(2, Math.round(queryCount * 0.25))}s</span>
            </div>
          </Card>

          <Card>
            <Eyebrow>Evidence types</Eyebrow>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {evidence.map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEvidence((arr) => arr.map((x) => (x.id === e.id ? { ...x, on: !x.on } : x)))}
                  className="text-[11px] px-2 py-1 font-medium focus-ring transition-all"
                  style={{
                    color: e.on ? "var(--accent-ink)" : "var(--ink-3)",
                    background: e.on ? "var(--accent-soft)" : "var(--paper-2)",
                    border: `1px solid ${e.on ? "var(--accent-line)" : "var(--line)"}`,
                    borderRadius: "var(--r-pill)",
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: "var(--ink-3)" }}>
              Exa gathers these source types per claim and scopes by domain. Toggles tune the demo&apos;s emphasis.
            </p>
          </Card>

          <div className="flex flex-col gap-2">
            <Button variant="primary" size="md" onClick={submit} disabled={!ready || loading}>
              {loading ? <Spinner size={15} /> : <Icons.shield size={15} />}
              {loading ? "Running verification…" : "Run verification with Exa"}
            </Button>
            <div className="flex items-center justify-center gap-2 text-[11px]" style={{ color: "var(--ink-3)" }}>
              <ModeDot live={liveMode} />
              {liveMode === null ? "Checking mode…" : liveMode ? "Live Exa mode" : "Sample mode (no key)"}
              {llm ? <span style={{ color: "var(--ink-4)" }}>· LLM analysis on</span> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeDot({ live }: { live: boolean | null }) {
  const color = live === null ? "var(--ink-4)" : live ? "var(--ok)" : "var(--elevated)";
  return <span style={{ width: 7, height: 7, borderRadius: 99, background: color, display: "inline-block" }} />;
}

const inputCls =
  "w-full text-[13px] px-2.5 py-2 focus-ring rounded-[7px] outline-none transition-shadow";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium" style={{ color: "var(--ink-2)" }}>
        {label} {required && <span style={{ color: "var(--accent)" }}>*</span>}
      </span>
      <span style={{ display: "contents" }}>{children}</span>
    </label>
  );
}

function SectionLabel({ n, title, optional }: { n: number; title: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="mono text-[11px] w-5 h-5 inline-flex items-center justify-center font-medium"
        style={{ color: "var(--ink-2)", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)" }}
      >
        {n}
      </span>
      <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </span>
      {optional && (
        <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
          optional
        </span>
      )}
    </div>
  );
}
