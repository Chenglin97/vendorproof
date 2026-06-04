"use client";
import React from "react";
import { Icons } from "./ui";

export function Shell({
  children,
  liveMode,
}: {
  children: React.ReactNode;
  liveMode: boolean | null;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--canvas)" }}>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 h-14"
        style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "saturate(180%) blur(12px)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg"
            style={{ background: "var(--ink)", color: "var(--on-ink)" }}
          >
            <Icons.shield size={16} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--ink-3)" }}>
                exa
              </span>
              <span className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
                VendorProof
              </span>
            </div>
            <div className="text-[10.5px]" style={{ color: "var(--ink-3)" }}>
              FSI vendor diligence
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: liveMode === null ? "var(--ink-4)" : liveMode ? "var(--ok)" : "var(--elevated)",
                display: "inline-block",
              }}
            />
            {liveMode === null ? "…" : liveMode ? "Live Exa" : "Sample mode"}
          </span>
          <a
            href="https://exa.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-medium focus-ring rounded px-1"
            style={{ color: "var(--ink-2)" }}
          >
            Powered by Exa
            <Icons.external size={12} />
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="px-5 py-4 text-[11px] flex items-center justify-between flex-wrap gap-2" style={{ borderTop: "1px solid var(--line)", color: "var(--ink-3)" }}>
        <span>VendorProof — live web evidence → structured, agent-ready diligence for high-stakes FSI decisions.</span>
        <span className="mono">exa /search · /contents</span>
      </footer>
    </div>
  );
}

// Staged "one search per claim" loader.
export function LoadingState({ vendor, claims }: { vendor: string; claims: string[] }) {
  const steps = [
    "Planning targeted Exa queries",
    "Searching the live web — one search per claim",
    "Retrieving contents, highlights & summaries",
    "Classifying evidence by source & stance",
    "Scoring verdicts, risk & negotiation levers",
  ];
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, steps.length - 1)), 900);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-[560px] px-5 py-16 vp-fade">
      <div className="flex items-center gap-2.5 mb-1">
        <Icons.search size={16} style={{ color: "var(--accent)" }} />
        <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
          Verifying {vendor || "vendor"} against the live web
        </span>
      </div>
      <p className="text-[12px] mb-5" style={{ color: "var(--ink-3)" }}>
        {claims.length} claim{claims.length === 1 ? "" : "s"} · running targeted Exa searches
      </p>
      <div className="flex flex-col gap-2.5">
        {steps.map((s, i) => {
          const done = i < active;
          const cur = i === active;
          return (
            <div key={s} className="flex items-center gap-3">
              <span
                className="w-5 h-5 inline-flex items-center justify-center rounded-full shrink-0"
                style={{
                  background: done ? "var(--ok-soft)" : cur ? "var(--accent-soft)" : "var(--paper-2)",
                  border: `1px solid ${done ? "var(--ok-line)" : cur ? "var(--accent-line)" : "var(--line)"}`,
                  color: done ? "var(--ok)" : "var(--accent)",
                }}
              >
                {done ? <Icons.check size={12} /> : cur ? <Spin /> : <span style={{ width: 5, height: 5, borderRadius: 99, background: "var(--ink-4)" }} />}
              </span>
              <span className="text-[13px]" style={{ color: done || cur ? "var(--ink)" : "var(--ink-4)", fontWeight: cur ? 600 : 400 }}>
                {s}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Spin() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" style={{ animation: "vp-spin 0.7s linear infinite" }} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
