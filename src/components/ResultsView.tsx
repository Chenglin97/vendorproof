"use client";
import React, { useState } from "react";
import { Button, Icons, cx } from "./ui";
import { ClaimVerification, ProofMeter } from "./ClaimVerification";
import { LeversBrief } from "./LeversBrief";
import { Integration } from "./Integration";
import { EvidenceDrawer } from "./EvidenceDrawer";
import type { Claim, DiligenceResult, Evidence } from "@/lib/types";

type Tab = "verify" | "brief" | "integration";

export function ResultsView({ result, onReset }: { result: DiligenceResult; onReset: () => void }) {
  const [tab, setTab] = useState<Tab>("verify");
  const [drawer, setDrawer] = useState<{ e: Evidence; c: Claim | null } | null>(null);

  const openEvidence = (e: Evidence, c: Claim | null) => setDrawer({ e, c });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendorproof-${result.meta.vendor.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: Tab; label: string; n?: number }[] = [
    { id: "verify", label: "Claim Verification", n: result.claims.length },
    { id: "brief", label: "Levers & Brief" },
    { id: "integration", label: "Exa Integration" },
  ];

  return (
    <div className="vp-fade-up">
      {/* header */}
      <div style={{ borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
        <div className="mx-auto max-w-[1180px] px-5 pt-5">
          <div className="flex items-start gap-4 flex-wrap">
            <ProofMeter score={result.proofScore} band={result.proofBand} />
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[19px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                  {result.meta.vendor}
                </h1>
                <span className="text-[12px] mono px-1.5 py-0.5 rounded" style={{ color: "var(--ink-2)", background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                  {result.meta.category || "—"}
                </span>
                <BandTag band={result.proofBand} />
              </div>
              <p className="text-[13px] leading-relaxed mt-2 max-w-[680px]" style={{ color: "var(--ink-2)" }}>
                {result.summary}
              </p>
              <div className="flex items-center gap-x-4 gap-y-1 mt-2.5 flex-wrap text-[11px]" style={{ color: "var(--ink-3)" }}>
                {result.meta.buyerContext && (
                  <Meta icon={Icons.building} text={result.meta.buyerContext} />
                )}
                {result.meta.competitorNames.length > 0 && (
                  <Meta icon={Icons.scale} text={`vs ${result.meta.competitorNames.join(", ")}`} />
                )}
                <Meta icon={Icons.link} text={`${result.evidence.length} evidence sources`} />
                <Meta icon={Icons.search} text={`${result.meta.searchCount} Exa searches`} />
                <Meta icon={Icons.bolt} text={`${(result.meta.durationMs / 1000).toFixed(2)}s · $${result.meta.costDollars.toFixed(3)}`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onReset}>
                <Icons.search size={13} />
                New review
              </Button>
              <Button variant="ghost" size="sm" onClick={exportJson}>
                <Icons.download size={13} />
                Export
              </Button>
              <Button variant="ink" size="sm" onClick={() => setTab("brief")}>
                <Icons.doc size={13} />
                Levers &amp; brief
              </Button>
            </div>
          </div>

          {result.meta.mode === "sample" && <ModeBanner notes={result.meta.notes} />}

          {/* tabs */}
          <div className="flex items-center gap-1 mt-4">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx("relative text-[13px] font-medium px-3 py-2.5 focus-ring transition-colors")}
                style={{ color: tab === t.id ? "var(--ink)" : "var(--ink-3)" }}
              >
                {t.label}
                {t.n != null && (
                  <span className="ml-1.5 mono text-[10px] px-1 py-0.5 rounded" style={{ color: "var(--ink-3)", background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                    {t.n}
                  </span>
                )}
                {tab === t.id && <span className="absolute left-2 right-2 bottom-0 h-[2px] rounded-full" style={{ background: "var(--accent)" }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="mx-auto max-w-[1180px] px-5 py-5">
        {tab === "verify" && <ClaimVerification result={result} onOpenEvidence={openEvidence} />}
        {tab === "brief" && <LeversBrief result={result} />}
        {tab === "integration" && <Integration result={result} />}
      </div>

      <EvidenceDrawer evidence={drawer?.e ?? null} claim={drawer?.c ?? null} onClose={() => setDrawer(null)} />
    </div>
  );
}

function Meta({ icon: Ico, text }: { icon: React.FC<{ size?: number; style?: React.CSSProperties }>; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Ico size={12} style={{ color: "var(--ink-4)" }} />
      {text}
    </span>
  );
}

function BandTag({ band }: { band: string }) {
  const map: Record<string, { c: string; s: string; l: string }> = {
    Strong: { c: "var(--ok)", s: "var(--ok-soft)", l: "var(--ok-line)" },
    Mixed: { c: "var(--elevated)", s: "var(--elevated-soft)", l: "var(--elevated-line)" },
    Weak: { c: "var(--risk)", s: "var(--risk-soft)", l: "var(--risk-line)" },
  };
  const t = map[band] ?? map.Mixed;
  return (
    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: t.c, background: t.s, border: `1px solid ${t.l}` }}>
      {band} proof
    </span>
  );
}

function ModeBanner({ notes }: { notes?: string }) {
  return (
    <div
      className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg text-[12px]"
      style={{ background: "var(--elevated-soft)", border: "1px solid var(--elevated-line)", color: "var(--elevated)" }}
    >
      <Icons.bolt size={14} style={{ marginTop: 1, flexShrink: 0 }} />
      <span>
        <span className="font-semibold">Sample mode.</span>{" "}
        {notes || "Showing a curated diligence result. Add EXA_API_KEY to run live web verification on any vendor."}
      </span>
    </div>
  );
}
