"use client";
import React, { useState } from "react";
import { Button, Card, Chip, Icons, Spinner, cx } from "./ui";
import type { DiligenceRequest } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Multi-step, AI-assisted intake:
//   1 Vendor   — type a name; Exa finds the official site + description; confirm/edit
//   2 Claims   — Exa scrapes the vendor's own pages; review/edit the claims
//   3 Compare  — optionally add competitors + buyer context; run verification
// ─────────────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type Discovery = {
  name: string;
  domain: string;
  description: string;
  category: string;
  alternatives: { domain: string; title: string }[];
  suggestedCompetitors: string[];
  mode?: string;
  notes?: string;
};

const STEPS = [
  { n: 1, label: "Vendor" },
  { n: 2, label: "Claims" },
  { n: 3, label: "Compare" },
] as const;

export function IntakeWizard({
  onRun,
  liveMode,
}: {
  onRun: (req: DiligenceRequest) => void;
  liveMode: boolean | null;
}) {
  const [step, setStep] = useState<Step>(1);

  // step 1
  const [vendor, setVendor] = useState("");
  const [finding, setFinding] = useState(false);
  const [disc, setDisc] = useState<Discovery | null>(null);
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [editingSite, setEditingSite] = useState(false);

  // step 2
  const [scraping, setScraping] = useState(false);
  const [claims, setClaims] = useState<string[]>([]);
  const [claimSources, setClaimSources] = useState<{ title: string; url: string }[]>([]);

  // step 3
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [compInput, setCompInput] = useState("");
  const [buyerContext, setBuyerContext] = useState("");

  const sample = disc?.mode === "sample";

  // ── step 1: find ──
  const findVendor = async (name?: string) => {
    const v = (name ?? vendor).trim();
    if (!v) return;
    setVendor(v);
    setFinding(true);
    try {
      const r = await fetch("/api/discover", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vendor: v }) });
      const d: Discovery = await r.json();
      setDisc(d);
      setDomain(d.domain || "");
      setDescription(d.description || "");
      setCategory(d.category || "");
      if (sampleLike(d)) setVendor(d.name);
    } catch {
      setDisc({ name: v, domain: "", description: "", category: "", alternatives: [], suggestedCompetitors: [] });
      setEditingSite(true);
    } finally {
      setFinding(false);
    }
  };

  const manualEntry = () => {
    setDisc({ name: vendor.trim() || "Vendor", domain: "", description: "", category: "", alternatives: [], suggestedCompetitors: [] });
    setEditingSite(true);
  };

  // ── step 1 -> 2: scrape claims ──
  const confirmVendor = async () => {
    setStep(2);
    setScraping(true);
    setClaims([]);
    try {
      const r = await fetch("/api/claims", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vendor, domain, category }) });
      const d = await r.json();
      setClaims(Array.isArray(d.claims) ? d.claims : []);
      setClaimSources(Array.isArray(d.sources) ? d.sources : []);
      if (disc?.suggestedCompetitors?.length) setCompetitors(disc.suggestedCompetitors.slice(0, 3));
    } catch {
      setClaims(["Enterprise-grade platform", "Secure and compliant deployment"]);
    } finally {
      setScraping(false);
    }
  };

  const run = () => {
    const cleanClaims = claims.map((c) => c.trim()).filter(Boolean);
    if (!vendor.trim() || cleanClaims.length === 0) return;
    onRun({ vendor: vendor.trim(), domain, category, buyerContext, claims: cleanClaims, competitors });
  };

  return (
    <div className="mx-auto max-w-[720px] px-5 py-8 vp-fade-up">
      <Stepper step={step} />

      {/* ─────────────── STEP 1 ─────────────── */}
      {step === 1 && (
        <div className="mt-6 vp-fade">
          <StepHead title="Which vendor are you evaluating?" sub="Type a name — Exa finds their official site and description from the live web." />

          <div className="flex items-center gap-2 mt-5">
            <div className="relative flex-1">
              <Icons.search size={15} style={{ color: "var(--ink-3)", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                autoFocus
                className="w-full text-[14px] pl-9 pr-3 py-2.5 focus-ring rounded-[9px] outline-none"
                placeholder="e.g. Intercom"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && findVendor()}
              />
            </div>
            <Button variant="primary" size="md" onClick={() => findVendor()} disabled={!vendor.trim() || finding}>
              {finding ? <Spinner size={15} /> : <Icons.bolt size={14} />}
              {finding ? "Finding…" : "Find vendor"}
            </Button>
          </div>

          {!disc && !finding && (
            <div className="flex items-center gap-3 mt-3 text-[12px]" style={{ color: "var(--ink-3)" }}>
              <button onClick={() => findVendor("Intercom")} className="focus-ring rounded font-medium" style={{ color: "var(--accent)" }}>
                Try the Intercom sample
              </button>
              <span>·</span>
              <button onClick={manualEntry} className="focus-ring rounded">
                Enter details manually
              </button>
            </div>
          )}

          {finding && (
            <Card className="mt-4">
              <div className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--ink-2)" }}>
                <Spinner size={15} />
                Searching the live web for <span className="font-medium" style={{ color: "var(--ink)" }}>{vendor}</span>…
              </div>
            </Card>
          )}

          {/* confirmation card */}
          {disc && !finding && (
            <Card className="mt-4 vp-fade-up">
              {sample && <SampleNote notes={disc.notes} />}
              <div className="flex items-start gap-3">
                <Favicon domain={domain} />
                <div className="flex-1 min-w-0">
                  {!editingSite ? (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
                          {vendor}
                        </span>
                        {domain && (
                          <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="mono text-[12px] inline-flex items-center gap-1 focus-ring rounded hover:underline" style={{ color: "var(--accent)" }}>
                            {domain}
                            <Icons.external size={11} />
                          </a>
                        )}
                      </div>
                      {category && (
                        <span className="inline-block mt-1.5 text-[11px] px-1.5 py-0.5 rounded" style={{ color: "var(--ink-2)", background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                          {category}
                        </span>
                      )}
                      <p className="text-[13px] leading-relaxed mt-2" style={{ color: "var(--ink-2)" }}>
                        {description}
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <FieldRow label="Website / domain">
                        <input className={inp} placeholder="intercom.com" value={domain} onChange={(e) => setDomain(e.target.value)} autoFocus />
                      </FieldRow>
                      <FieldRow label="Category">
                        <input className={inp} placeholder="AI customer support platform" value={category} onChange={(e) => setCategory(e.target.value)} />
                      </FieldRow>
                      <FieldRow label="Description">
                        <input className={inp} placeholder="One-line description" value={description} onChange={(e) => setDescription(e.target.value)} />
                      </FieldRow>
                    </div>
                  )}

                  {/* alternatives */}
                  {!editingSite && disc.alternatives.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--line-2)" }}>
                      <div className="text-[11px] mb-1.5" style={{ color: "var(--ink-3)" }}>
                        Not right? Other matches:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {disc.alternatives.map((a) => (
                          <Chip key={a.domain} onClick={() => setDomain(a.domain)} title={a.title}>
                            {a.domain}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 gap-2" style={{ borderTop: "1px solid var(--line-2)" }}>
                <button onClick={() => setEditingSite((e) => !e)} className="text-[12px] font-medium focus-ring rounded inline-flex items-center gap-1.5" style={{ color: "var(--ink-2)" }}>
                  <Icons.doc size={13} />
                  {editingSite ? "Done editing" : "Edit website / details"}
                </button>
                <Button variant="primary" size="md" onClick={confirmVendor} disabled={!vendor.trim()}>
                  Confirm &amp; find claims
                  <Icons.arrow size={14} />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ─────────────── STEP 2 ─────────────── */}
      {step === 2 && (
        <div className="mt-6 vp-fade">
          <StepHead
            title={`Claims ${vendor} makes`}
            sub="Exa scraped these from the vendor's own pages. Edit, remove, or add — each becomes one verification search."
          />

          {scraping ? (
            <Card className="mt-5">
              <div className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--ink-2)" }}>
                <Spinner size={15} />
                Reading <span className="font-medium" style={{ color: "var(--ink)" }}>{domain || vendor}</span> for claims…
              </div>
            </Card>
          ) : (
            <>
              <Card pad={false} className="mt-5">
                <div className="flex flex-col">
                  {claims.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: i < claims.length - 1 ? "1px solid var(--line-2)" : "none" }}>
                      <span className="mono text-[11px] w-5 shrink-0 text-center" style={{ color: "var(--ink-4)" }}>
                        c{i + 1}
                      </span>
                      <input
                        className="flex-1 text-[13px] px-2 py-1.5 focus-ring rounded-md outline-none"
                        style={{ background: "transparent", border: "1px solid transparent" }}
                        value={c}
                        onChange={(e) => setClaims((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                      />
                      <button onClick={() => setClaims((arr) => arr.filter((_, j) => j !== i))} className="shrink-0 p-1.5 focus-ring rounded-md hover:bg-[var(--paper-2)]" style={{ color: "var(--ink-3)" }} title="Remove">
                        <Icons.x size={14} />
                      </button>
                    </div>
                  ))}
                  {claims.length === 0 && (
                    <div className="px-3 py-4 text-[12px]" style={{ color: "var(--ink-3)" }}>
                      No claims yet — add the ones you want to verify.
                    </div>
                  )}
                </div>
                <div className="px-3 py-2" style={{ borderTop: "1px solid var(--line-2)" }}>
                  <button onClick={() => setClaims((a) => [...a, ""])} disabled={claims.length >= 8} className="text-[12px] font-medium focus-ring rounded disabled:opacity-40" style={{ color: "var(--accent)" }}>
                    + Add claim
                  </button>
                </div>
              </Card>

              {claimSources.length > 0 && (
                <div className="flex items-center gap-2 mt-2.5 flex-wrap text-[11px]" style={{ color: "var(--ink-3)" }}>
                  <Icons.link size={12} />
                  <span>scraped from</span>
                  {claimSources.slice(0, 3).map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="mono focus-ring rounded hover:underline" style={{ color: "var(--ink-2)" }}>
                      {host(s.url)}
                    </a>
                  ))}
                </div>
              )}

              <NavRow onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Next: competitors" nextDisabled={claims.filter((c) => c.trim()).length === 0} />
            </>
          )}
        </div>
      )}

      {/* ─────────────── STEP 3 ─────────────── */}
      {step === 3 && (
        <div className="mt-6 vp-fade">
          <StepHead title="Compare & context" sub="Optionally add competitors to benchmark against, and your buying context. Then run verification." />

          <Card className="mt-5">
            <label className="text-[12px] font-medium" style={{ color: "var(--ink-2)" }}>
              Competitors <span style={{ color: "var(--ink-4)" }}>optional</span>
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                className={inp}
                placeholder="Zendesk"
                value={compInput}
                onChange={(e) => setCompInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = compInput.trim();
                    if (v && !competitors.includes(v)) setCompetitors((c) => [...c, v].slice(0, 4));
                    setCompInput("");
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const v = compInput.trim();
                  if (v && !competitors.includes(v)) setCompetitors((c) => [...c, v].slice(0, 4));
                  setCompInput("");
                }}
                disabled={!compInput.trim() || competitors.length >= 4}
              >
                Add
              </Button>
            </div>
            {competitors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {competitors.map((c) => (
                  <Chip key={c} onClick={() => setCompetitors((arr) => arr.filter((x) => x !== c))} title="Remove">
                    {c}
                    <Icons.x size={11} />
                  </Chip>
                ))}
              </div>
            )}
            {disc && disc.suggestedCompetitors.filter((s) => !competitors.includes(s)).length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--line-2)" }}>
                <div className="text-[11px] mb-1.5" style={{ color: "var(--ink-3)" }}>
                  <Icons.bolt size={11} style={{ display: "inline", color: "var(--accent)", marginRight: 4 }} />
                  Exa-suggested:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {disc.suggestedCompetitors
                    .filter((s) => !competitors.includes(s))
                    .map((s) => (
                      <Chip key={s} onClick={() => setCompetitors((c) => [...c, s].slice(0, 4))} color="var(--accent-ink)" soft="var(--accent-soft)" line="var(--accent-line)" title="Add">
                        + {s}
                      </Chip>
                    ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="mt-3">
            <label className="text-[12px] font-medium" style={{ color: "var(--ink-2)" }}>
              Your buying context <span style={{ color: "var(--ink-4)" }}>optional</span>
            </label>
            <input
              className={cx(inp, "mt-2")}
              placeholder="Regional bank evaluating an AI support vendor for regulated workflows"
              value={buyerContext}
              onChange={(e) => setBuyerContext(e.target.value)}
            />
          </Card>

          <NavRow onBack={() => setStep(2)} onRun={run} live={liveMode} />
        </div>
      )}
    </div>
  );
}

// ── pieces ──
function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = step > s.n;
        const cur = step === s.n;
        return (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 inline-flex items-center justify-center rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: done ? "var(--ok)" : cur ? "var(--accent)" : "var(--paper-2)",
                  color: done || cur ? "#fff" : "var(--ink-4)",
                  border: `1px solid ${done ? "var(--ok)" : cur ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                {done ? <Icons.check size={13} /> : s.n}
              </span>
              <span className="text-[12px] font-medium" style={{ color: cur ? "var(--ink)" : "var(--ink-3)" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="flex-1 h-px" style={{ background: "var(--line)", minWidth: 16 }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
        {title}
      </h1>
      <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--ink-2)" }}>
        {sub}
      </p>
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  onRun,
  nextLabel,
  nextDisabled,
  live,
}: {
  onBack: () => void;
  onNext?: () => void;
  onRun?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  live?: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between mt-5">
      <Button variant="ghost" size="md" onClick={onBack}>
        <Icons.arrow size={14} style={{ transform: "rotate(180deg)" }} />
        Back
      </Button>
      {onNext && (
        <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
          <Icons.arrow size={14} />
        </Button>
      )}
      {onRun && (
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: live ? "var(--ok)" : "var(--elevated)", display: "inline-block" }} />
            {live ? "Live Exa" : "Sample"}
          </span>
          <Button variant="primary" size="md" onClick={onRun}>
            <Icons.shield size={15} />
            Run verification
          </Button>
        </div>
      )}
    </div>
  );
}

function SampleNote({ notes }: { notes?: string }) {
  return (
    <div className="flex items-start gap-2 mb-3 px-2.5 py-1.5 rounded-md text-[11.5px]" style={{ background: "var(--elevated-soft)", border: "1px solid var(--elevated-line)", color: "var(--elevated)" }}>
      <Icons.bolt size={13} style={{ marginTop: 1, flexShrink: 0 }} />
      <span>{notes || "Sample mode — showing Intercom. Add EXA_API_KEY to discover any vendor live."}</span>
    </div>
  );
}

function Favicon({ domain }: { domain: string }) {
  const [err, setErr] = useState(false);
  if (!domain || err) {
    return (
      <span className="w-9 h-9 inline-flex items-center justify-center rounded-lg shrink-0" style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-3)" }}>
        <Icons.building size={16} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt=""
      width={36}
      height={36}
      onError={() => setErr(true)}
      className="rounded-lg shrink-0"
      style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
    />
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inp = "w-full text-[13px] px-2.5 py-2 focus-ring rounded-[7px] outline-none";

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
function sampleLike(d: Discovery): boolean {
  return d.mode === "sample";
}
