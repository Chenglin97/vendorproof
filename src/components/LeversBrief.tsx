"use client";
import React, { useState } from "react";
import { Button, Card, Icons, cx } from "./ui";
import type { DiligenceResult } from "@/lib/types";

export function LeversBrief({ result }: { result: DiligenceResult }) {
  const [copied, setCopied] = useState(false);

  const copySummary = async () => {
    const text =
      `${result.meta.vendor} — vendor diligence (VendorProof)\n` +
      `Recommendation: ${result.crm.recommendation} (confidence: ${result.crm.confidence})\n\n` +
      result.crm.fields.map((f) => `${f.k}: ${f.v}`).join("\n") +
      `\n\n${result.crm.body}\n\n` +
      `Negotiation levers:\n` +
      result.levers.map((l, i) => `${i + 1}. ${l.title} — ${l.detail}`).join("\n") +
      `\n\nQuestions for the vendor:\n` +
      result.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Levers */}
        <Card pad={false}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
            <Icons.bolt size={15} style={{ color: "var(--accent)" }} />
            <span className="text-[13px] font-semibold">Negotiation levers</span>
            <span className="text-[11px]" style={{ color: "var(--ink-3)" }}>
              built from the evidence gaps
            </span>
          </div>
          <div className="flex flex-col">
            {result.levers.map((l, i) => (
              <div key={i} className="px-4 py-3 flex gap-3" style={{ borderBottom: i < result.levers.length - 1 ? "1px solid var(--line-2)" : "none" }}>
                <span
                  className="mono text-[11px] w-5 h-5 inline-flex items-center justify-center font-medium shrink-0"
                  style={{ color: "var(--accent-ink)", background: "var(--accent-soft)", border: "1px solid var(--accent-line)", borderRadius: "var(--r-sm)" }}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="text-[13px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
                    {l.title}
                  </div>
                  <p className="text-[12px] leading-relaxed mt-1" style={{ color: "var(--ink-2)" }}>
                    {l.detail}
                  </p>
                  {l.basis.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {l.basis.map((b) => (
                        <span key={b} className="mono text-[10px] px-1 py-0.5 rounded" style={{ color: "var(--ink-3)", background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Questions */}
        <Card pad={false}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
            <Icons.help size={15} style={{ color: "var(--ink-3)" }} />
            <span className="text-[13px] font-semibold">Questions to ask the vendor</span>
          </div>
          <ol className="flex flex-col">
            {result.questions.map((q, i) => (
              <li key={i} className="px-4 py-2.5 flex gap-2.5 text-[12.5px] leading-relaxed" style={{ borderBottom: i < result.questions.length - 1 ? "1px solid var(--line-2)" : "none", color: "var(--ink)" }}>
                <span className="mono text-[11px] shrink-0" style={{ color: "var(--ink-4)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {q}
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Procurement summary */}
      <Card pad={false}>
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            <Icons.doc size={15} style={{ color: "var(--ink-3)" }} />
            <span className="text-[13px] font-semibold">Procurement-ready summary</span>
          </div>
          <Button variant="ghost" size="sm" onClick={copySummary}>
            {copied ? <Icons.check size={13} style={{ color: "var(--ok)" }} /> : <Icons.copy size={13} />}
            {copied ? "Copied" : "Copy for CRM"}
          </Button>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              {result.crm.recommendation}
            </span>
            <span
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: "var(--accent-ink)", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}
            >
              {result.crm.confidence} confidence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-3.5">
            {result.crm.fields.map((f) => (
              <div key={f.k} className="flex items-baseline justify-between gap-3 py-1" style={{ borderBottom: "1px solid var(--line-2)" }}>
                <span className="text-[11px] eyebrow" style={{ letterSpacing: "0.04em" }}>
                  {f.k}
                </span>
                <span className="text-[12.5px] font-medium text-right" style={{ color: "var(--ink)" }}>
                  {f.v}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[13px] leading-relaxed mt-4" style={{ color: "var(--ink-2)" }}>
            {result.crm.body}
          </p>
        </div>
      </Card>
    </div>
  );
}
