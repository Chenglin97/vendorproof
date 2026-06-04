"use client";
import React, { useState } from "react";
import { Card, Chip, Icons, RiskBadge, VerdictPill, cx } from "./ui";
import { EVIDENCE_TYPE_META } from "@/lib/types";
import type { Claim, DiligenceResult, Evidence, Verdict } from "@/lib/types";

export function ProofMeter({ score, band, size = 86 }: { score: number; band: string; size?: number }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  const color = band === "Strong" ? "var(--ok)" : band === "Mixed" ? "var(--elevated)" : "var(--risk)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.max(0, Math.min(100, score))) / 100}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
          {score}
        </span>
        <span className="eyebrow mt-1" style={{ fontSize: 9 }}>
          Proof
        </span>
      </div>
    </div>
  );
}

const VERDICT_DOT: Record<Verdict, string> = {
  verified: "var(--ok)",
  partial: "var(--elevated)",
  unverified: "var(--risk)",
  contradicted: "var(--risk)",
};

export function ClaimVerification({
  result,
  onOpenEvidence,
}: {
  result: DiligenceResult;
  onOpenEvidence: (e: Evidence, c: Claim | null) => void;
}) {
  const [filter, setFilter] = useState<"all" | Verdict>("all");
  const evById = new Map(result.evidence.map((e) => [e.id, e]));

  const counts = {
    verified: result.claims.filter((c) => c.verdict === "verified").length,
    partial: result.claims.filter((c) => c.verdict === "partial").length,
    unverified: result.claims.filter((c) => c.verdict === "unverified" || c.verdict === "contradicted").length,
  };
  const total = result.claims.length;
  const shown = result.claims.filter((c) => filter === "all" || c.verdict === filter || (filter === "unverified" && c.verdict === "contradicted"));

  return (
    <div className="flex flex-col gap-4">
      {/* coverage + risk flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.layers size={15} style={{ color: "var(--ink-3)" }} />
              <span className="text-[13px] font-semibold">Claim coverage</span>
            </div>
            <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
              {total} claims · {result.evidence.length} sources
            </span>
          </div>
          {/* segmented bar */}
          <div className="flex h-2 mt-3.5 rounded-full overflow-hidden" style={{ background: "var(--paper-2)" }}>
            {counts.verified > 0 && <span style={{ flex: counts.verified, background: "var(--ok)" }} />}
            {counts.partial > 0 && <span style={{ flex: counts.partial, background: "var(--elevated)" }} />}
            {counts.unverified > 0 && <span style={{ flex: counts.unverified, background: "var(--risk)" }} />}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[12px]">
            <Legend color="var(--ok)" n={counts.verified} label="Verified" />
            <Legend color="var(--elevated)" n={counts.partial} label="Partial" />
            <Legend color="var(--risk)" n={counts.unverified} label="Unverified" />
          </div>
          <div className="mt-3.5 pt-3.5 flex items-start gap-2" style={{ borderTop: "1px solid var(--line-2)" }}>
            <Icons.scale size={15} style={{ color: "var(--accent)", marginTop: 1 }} />
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                {result.verdict}
              </div>
              <div className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                Confidence: {result.crm.confidence}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.flag size={15} style={{ color: "var(--risk)" }} />
              <span className="text-[13px] font-semibold">Risk flags</span>
            </div>
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: "var(--risk)", background: "var(--risk-soft)", border: "1px solid var(--risk-line)" }}
            >
              {result.flags.length}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 mt-3">
            {result.flags.length === 0 && (
              <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                No material risk flags — claims are well-evidenced.
              </p>
            )}
            {result.flags.map((f, i) => {
              const Ico = f.kind === "risk" ? Icons.alert : Icons.help;
              const color = f.kind === "risk" ? "var(--risk)" : "var(--elevated)";
              return (
                <div key={i} className="flex items-start gap-2">
                  <Ico size={14} style={{ color, marginTop: 1, flexShrink: 0 }} />
                  <div className="text-[12px] leading-snug">
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>
                      {f.title}
                    </span>
                    <span style={{ color: "var(--ink-2)" }}> — {f.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* matrix */}
      <Card pad={false}>
        <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold">Claim verification matrix</span>
            <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
              every cell cites a live source
            </span>
          </div>
          <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}>
            {(["all", "verified", "partial", "unverified"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cx("text-[11px] px-2 py-1 rounded-md font-medium capitalize focus-ring transition-all")}
                style={
                  filter === f
                    ? { background: "var(--paper)", color: "var(--ink)", boxShadow: "var(--sh-xs)" }
                    : { color: "var(--ink-3)", background: "transparent" }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* header row (desktop) */}
        <div className="hidden md:grid px-4 py-2 text-[10px] eyebrow" style={{ gridTemplateColumns: "1fr 110px 90px 130px 80px", borderBottom: "1px solid var(--line-2)" }}>
          <span>Claim</span>
          <span>Verdict</span>
          <span>Confidence</span>
          <span>Evidence</span>
          <span>Risk</span>
        </div>

        <div>
          {shown.map((c) => (
            <ClaimRow key={c.id} claim={c} evById={evById} onOpenEvidence={onOpenEvidence} />
          ))}
          {shown.length === 0 && (
            <div className="px-4 py-8 text-center text-[12px]" style={{ color: "var(--ink-3)" }}>
              No claims match this filter.
            </div>
          )}
        </div>
      </Card>

      {/* competitor comparison */}
      {result.competitors.length > 0 && <CompetitorTable result={result} />}
    </div>
  );
}

function ClaimRow({
  claim,
  evById,
  onOpenEvidence,
}: {
  claim: Claim;
  evById: Map<string, Evidence>;
  onOpenEvidence: (e: Evidence, c: Claim) => void;
}) {
  const [open, setOpen] = useState(false);
  const ev = claim.evidence.map((id) => evById.get(id)).filter(Boolean) as Evidence[];

  return (
    <div style={{ borderBottom: "1px solid var(--line-2)" }} className="transition-colors hover:bg-[var(--paper-2)]">
      <div
        className="grid items-center px-4 py-3 gap-2 cursor-pointer"
        style={{ gridTemplateColumns: "1fr auto" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="md:grid md:items-center md:gap-2" style={{ gridTemplateColumns: "1fr 110px 90px 130px 80px" }}>
          <div className="flex items-start gap-2 pr-3">
            <Icons.dot size={9} style={{ color: VERDICT_DOT[claim.verdict], marginTop: 5, flexShrink: 0 }} />
            <div>
              <span className="text-[13px] font-medium leading-snug" style={{ color: "var(--ink)" }}>
                {claim.text}
              </span>
              <div className="md:hidden flex items-center gap-2 mt-1.5">
                <VerdictPill verdict={claim.verdict} size="sm" />
                <RiskBadge risk={claim.risk} />
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <VerdictPill verdict={claim.verdict} size="sm" />
          </div>
          <div className="hidden md:block text-[12px]" style={{ color: "var(--ink-2)" }}>
            {claim.confidence}
          </div>
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {ev.slice(0, 3).map((e) => (
              <button
                key={e.id}
                onClick={(ev2) => {
                  ev2.stopPropagation();
                  onOpenEvidence(e, claim);
                }}
                title={e.title}
                className="mono text-[10px] px-1 py-0.5 rounded focus-ring transition-colors hover:brightness-95"
                style={{ color: EVIDENCE_TYPE_META[e.type].color, background: "var(--paper-2)", border: "1px solid var(--line)" }}
              >
                {EVIDENCE_TYPE_META[e.type].short}
              </button>
            ))}
            {ev.length === 0 && <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>none</span>}
          </div>
          <div className="hidden md:block">
            <RiskBadge risk={claim.risk} />
          </div>
        </div>
        <Icons.arrow size={15} style={{ color: "var(--ink-4)", transform: open ? "rotate(90deg)" : "none", transition: "transform 160ms" }} />
      </div>

      {open && (
        <div className="px-4 pb-4 pl-9 vp-fade" style={{ marginTop: -4 }}>
          <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            {claim.finding}
          </p>
          {claim.missing && (
            <div className="flex items-center gap-1.5 mt-2 text-[11.5px]" style={{ color: "var(--risk)" }}>
              <Icons.alert size={13} />
              <span>
                <span className="font-medium">Missing:</span> {claim.missing}
              </span>
            </div>
          )}
          {ev.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {ev.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onOpenEvidence(e, claim)}
                  className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md focus-ring transition-colors hover:bg-[var(--paper)] text-left"
                  style={{ background: "var(--paper)", border: "1px solid var(--line)", maxWidth: 280 }}
                >
                  <Icons.dot size={8} style={{ color: EVIDENCE_TYPE_META[e.type].color, flexShrink: 0 }} />
                  <span className="truncate" style={{ color: "var(--ink-2)" }}>
                    {e.title}
                  </span>
                  <Icons.arrow size={11} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompetitorTable({ result }: { result: DiligenceResult }) {
  const sMeta = {
    strong: "var(--ok)",
    mixed: "var(--elevated)",
    weak: "var(--risk)",
  } as const;
  return (
    <Card pad={false}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
        <Icons.building size={15} style={{ color: "var(--ink-3)" }} />
        <span className="text-[13px] font-semibold">Competitor comparison</span>
        <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
          evidence-based · from the public web
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line-2)" }}>
              <th className="text-left px-4 py-2 eyebrow" style={{ fontSize: 10 }}>
                Vendor
              </th>
              {result.compareDims.map((d) => (
                <th key={d} className="text-left px-3 py-2 eyebrow" style={{ fontSize: 10 }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.competitors.map((comp) => (
              <tr
                key={comp.name}
                style={{ borderBottom: "1px solid var(--line-2)", background: comp.subject ? "var(--accent-soft)" : "transparent" }}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {comp.name}
                    </span>
                    {comp.subject && (
                      <span
                        className="text-[9px] font-semibold px-1 py-0.5 rounded uppercase tracking-wide"
                        style={{ color: "var(--accent-ink)", background: "var(--paper)", border: "1px solid var(--accent-line)" }}
                      >
                        Under review
                      </span>
                    )}
                  </div>
                </td>
                {result.compareDims.map((d) => {
                  const cell = comp.rows[d];
                  return (
                    <td key={d} className="px-3 py-2.5">
                      {cell ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-2)" }}>
                          <Icons.dot size={8} style={{ color: sMeta[cell.s] }} />
                          {cell.v}
                        </span>
                      ) : (
                        <span className="text-[12px]" style={{ color: "var(--ink-4)" }}>
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Legend({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span style={{ width: 8, height: 8, borderRadius: 99, background: color, display: "inline-block" }} />
      <span className="font-semibold" style={{ color: "var(--ink)" }}>
        {n}
      </span>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
    </span>
  );
}
