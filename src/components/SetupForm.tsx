"use client";
import React, { useState } from "react";
import { Button, Card, Chip, Eyebrow, Icons, Spinner } from "./ui";
import { SAMPLE_REQUEST } from "@/lib/sample";
import type { DiligenceRequest } from "@/lib/types";

const EMPTY: DiligenceRequest = { vendor: "", domain: "", category: "", buyerContext: "", claims: [""], competitors: [] };

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
    <div className="mx-auto max-w-[960px] px-5 py-8 vp-fade-up">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <Eyebrow>Diligence setup</Eyebrow>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1.5" style={{ color: "var(--ink)" }}>
            Verify a vendor against the live web
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSample} title="Load the Intercom diligence brief">
          <Icons.bolt size={13} style={{ color: "var(--accent)" }} />
          Load sample
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        {/* ── Form (single card, divided sections) ── */}
        <Card pad={false}>
          <Section title="Vendor">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </Section>

          <Divider />

          <Section title="Claims to verify" required>
            <div className="flex flex-col gap-2">
              {req.claims.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="mono text-[11px] w-5 shrink-0" style={{ color: "var(--ink-4)" }}>
                    c{i + 1}
                  </span>
                  <input
                    className={inputCls}
                    placeholder="e.g. Secure and compliant deployment"
                    value={c}
                    onChange={(e) => setClaim(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && i === req.claims.length - 1 && addClaim()}
                  />
                  <button
                    onClick={() => rmClaim(i)}
                    disabled={req.claims.length === 1}
                    className="shrink-0 p-1.5 focus-ring rounded-md disabled:opacity-25 hover:bg-[var(--paper-2)]"
                    style={{ color: "var(--ink-3)" }}
                    title="Remove claim"
                  >
                    <Icons.x size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addClaim} disabled={req.claims.length >= 8} className="mt-2.5 text-[12px] font-medium focus-ring rounded-md disabled:opacity-40" style={{ color: "var(--accent)" }}>
              + Add claim
            </button>
          </Section>

          <Divider />

          <Section title="Competitors" optional>
            <div className="flex items-center gap-2">
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
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {req.competitors.map((c) => (
                  <Chip key={c} onClick={() => setReq((r) => ({ ...r, competitors: r.competitors.filter((x) => x !== c) }))} title="Remove">
                    {c}
                    <Icons.x size={11} />
                  </Chip>
                ))}
              </div>
            )}
          </Section>
        </Card>

        {/* ── Sidebar: compact preview + run ── */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-20">
          <Card style={{ background: "var(--ink-surface)", border: "1px solid var(--line-ink)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <Icons.search size={13} style={{ color: "var(--on-ink-2)" }} />
              <span className="eyebrow" style={{ color: "var(--on-ink-2)", fontSize: 10 }}>
                Exa request preview
              </span>
            </div>
            <div className="mono text-[11px] leading-relaxed" style={{ color: "var(--on-ink)" }}>
              <Row k="searches" v={`${queryCount}`} />
              <Row k="per claim" v={`${cleanClaims.length} · +5 structural`} />
              <Row k="contents" v="text · highlights" />
              <Row k="scope" v={req.domain ? "domain + web" : "open web"} />
            </div>
            <div className="mt-2.5 pt-2.5 flex items-center justify-between text-[10.5px]" style={{ borderTop: "1px solid var(--line-ink)", color: "var(--on-ink-2)" }}>
              <span>~${(queryCount * 0.0015).toFixed(3)}</span>
              <span>~{Math.max(2, Math.round(queryCount * 0.25))}s</span>
            </div>
          </Card>

          <Button variant="primary" size="md" onClick={submit} disabled={!ready || loading}>
            {loading ? <Spinner size={15} /> : <Icons.shield size={15} />}
            {loading ? "Running…" : "Run verification"}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: liveMode === null ? "var(--ink-4)" : liveMode ? "var(--ok)" : "var(--elevated)", display: "inline-block" }} />
            {liveMode === null ? "Checking…" : liveMode ? "Live Exa mode" : "Sample mode"}
            {llm ? <span style={{ color: "var(--ink-4)" }}>· LLM on</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span style={{ color: "#7da2ff" }}>{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

const inputCls = "w-full text-[13px] px-2.5 py-2 focus-ring rounded-[7px] outline-none transition-shadow";

function Section({
  title,
  children,
  required,
  optional,
}: {
  title: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
          {title}
        </span>
        {required && <span style={{ color: "var(--accent)" }}>*</span>}
        {optional && (
          <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
            optional
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--line-2)" }} />;
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium" style={{ color: "var(--ink-2)" }}>
        {label} {required && <span style={{ color: "var(--accent)" }}>*</span>}
      </span>
      {children}
    </label>
  );
}
