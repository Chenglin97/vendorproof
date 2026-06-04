"use client";
import React, { useEffect } from "react";
import { Chip, Icons, VerdictPill, fmtDate } from "./ui";
import { EVIDENCE_TYPE_META } from "@/lib/types";
import type { Claim, Evidence } from "@/lib/types";

const STANCE_META = {
  support: { label: "Supports", color: "var(--ok)", soft: "var(--ok-soft)", line: "var(--ok-line)" },
  refute: { label: "Refutes", color: "var(--risk)", soft: "var(--risk-soft)", line: "var(--risk-line)" },
  neutral: { label: "Context", color: "var(--ink-2)", soft: "var(--paper-2)", line: "var(--line)" },
} as const;

export function EvidenceDrawer({
  evidence,
  claim,
  onClose,
}: {
  evidence: Evidence | null;
  claim: Claim | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (evidence) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [evidence, onClose]);

  if (!evidence) return null;
  const t = EVIDENCE_TYPE_META[evidence.type];
  const stance = STANCE_META[evidence.stance];

  return (
    <>
      <div className="fixed inset-0 z-40 vp-fade" style={{ background: "rgba(11,11,13,0.32)" }} onClick={onClose} />
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[440px] flex flex-col vp-fade"
        style={{ background: "var(--paper)", borderLeft: "1px solid var(--line)", boxShadow: "var(--sh-lg)", animationName: "vp-fade-up" }}
      >
        <header className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <Icons.link size={14} style={{ color: "var(--ink-3)" }} />
            <span className="eyebrow">Evidence source</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md focus-ring hover:bg-[var(--paper-2)]" style={{ color: "var(--ink-3)" }} title="Close (Esc)">
            <Icons.x size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Chip color={t.color} soft="var(--paper-2)" line="var(--line)" mono>
              <Icons.dot size={8} style={{ color: t.color }} />
              {t.short}
            </Chip>
            <Chip color={stance.color} soft={stance.soft} line={stance.line}>
              {stance.label}
            </Chip>
            <span className="mono text-[11px] ml-auto" style={{ color: "var(--ink-3)" }}>
              relevance {evidence.relevance.toFixed(2)}
            </span>
          </div>

          <h3 className="text-[15px] font-semibold leading-snug mt-3" style={{ color: "var(--ink)" }}>
            {evidence.title}
          </h3>
          <a
            href={evidence.url.startsWith("http") ? evidence.url : `https://${evidence.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] mono mt-1.5 focus-ring rounded break-all hover:underline"
            style={{ color: "var(--accent)" }}
          >
            {evidence.url.replace(/^https?:\/\//, "")}
            <Icons.external size={12} />
          </a>

          <div className="flex items-center gap-3 text-[11px] mt-2" style={{ color: "var(--ink-3)" }}>
            <span>{evidence.author}</span>
            <span>·</span>
            <span>{fmtDate(evidence.published)}</span>
          </div>

          <Block label="Exa highlight">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink)" }}>
              “{evidence.snippet}”
            </p>
          </Block>

          <Block label="What it means">
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {evidence.extracted}
            </p>
          </Block>

          {claim && (
            <Block label="Claim under test">
              <div className="flex items-start gap-2.5">
                <VerdictPill verdict={claim.verdict} size="sm" />
                <p className="text-[13px] leading-snug flex-1" style={{ color: "var(--ink)" }}>
                  {claim.text}
                </p>
              </div>
              <p className="text-[12px] leading-relaxed mt-2" style={{ color: "var(--ink-2)" }}>
                {claim.finding}
              </p>
            </Block>
          )}
        </div>

        <footer className="px-5 py-3" style={{ borderTop: "1px solid var(--line)" }}>
          <a
            href={evidence.url.startsWith("http") ? evidence.url : `https://${evidence.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium focus-ring rounded"
            style={{ color: "var(--ink-2)" }}
          >
            <Icons.external size={13} />
            Open source in new tab
          </a>
        </footer>
      </aside>
    </>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--line-2)" }}>
      <div className="eyebrow mb-2">{label}</div>
      {children}
    </div>
  );
}
