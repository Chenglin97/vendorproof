"use client";
import React, { useState } from "react";
import { Button, Card, Icons } from "./ui";
import type { DiligenceResult } from "@/lib/types";

export function Integration({ result }: { result: DiligenceResult }) {
  return (
    <div className="flex flex-col gap-4">
      {/* agent flow */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Icons.spark size={15} style={{ color: "var(--accent)" }} />
          <span className="text-[13px] font-semibold">How Exa powers the diligence agent</span>
        </div>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
          {[
            { t: "Brief", d: "vendor · claims · competitors", ico: Icons.doc },
            { t: "Exa /search", d: `${result.meta.searchCount} targeted queries`, ico: Icons.search },
            { t: "/contents", d: "text · highlights · summary", ico: Icons.layers },
            { t: "Classify", d: "source type · stance · relevance", ico: Icons.flag },
            { t: "Score", d: "verdict · confidence · risk", ico: Icons.scale },
            { t: "Handoff", d: "agent-ready JSON", ico: Icons.code },
          ].map((s, i, arr) => (
            <React.Fragment key={s.t}>
              <div className="flex flex-col items-center text-center px-3 py-2.5 rounded-lg shrink-0" style={{ background: "var(--paper-2)", border: "1px solid var(--line)", minWidth: 120 }}>
                <s.ico size={16} style={{ color: "var(--ink-2)" }} />
                <span className="text-[12px] font-semibold mt-1.5" style={{ color: "var(--ink)" }}>
                  {s.t}
                </span>
                <span className="text-[10.5px] mt-0.5 leading-tight" style={{ color: "var(--ink-3)" }}>
                  {s.d}
                </span>
              </div>
              {i < arr.length - 1 && <Icons.arrow size={14} style={{ color: "var(--ink-4)", alignSelf: "center", flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* representative Exa call */}
        <CodeCard
          title="Representative Exa call"
          subtitle="the search that finds what's missing"
          icon={<Icons.search size={14} style={{ color: "var(--on-ink-2)" }} />}
          code={JSON.stringify({ request: result.exaTrace.request, response: result.exaTrace.response }, null, 2)}
          filename="exa-trace.json"
        />
        {/* handoff JSON */}
        <CodeCard
          title="Agent handoff payload"
          subtitle="flows into your CRM / risk agent"
          icon={<Icons.code size={14} style={{ color: "var(--on-ink-2)" }} />}
          code={JSON.stringify(result.handoff, null, 2)}
          filename="vendorproof-handoff.json"
        />
      </div>

      {/* drop-in snippet */}
      <CodeCard
        title="Drop-in agent function"
        subtitle="one Exa search per claim — the exact orchestration"
        icon={<Icons.bolt size={14} style={{ color: "var(--on-ink-2)" }} />}
        code={AGENT_SNIPPET}
        filename="verifyClaim.ts"
        wide
      />

      {/* notes */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {NOTES.map((n) => (
            <div key={n.t}>
              <div className="text-[12px] font-semibold" style={{ color: "var(--ink)" }}>
                {n.t}
              </div>
              <p className="text-[12px] leading-relaxed mt-0.5" style={{ color: "var(--ink-2)" }}>
                {n.d}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CodeCard({
  title,
  subtitle,
  icon,
  code,
  filename,
  wide,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  code: string;
  filename: string;
  wide?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };
  const download = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card pad={false} style={{ background: "var(--ink-surface)", border: "1px solid var(--line-ink)", overflow: "hidden" }}>
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--line-ink)" }}>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[12px] font-semibold" style={{ color: "var(--on-ink)" }}>
            {title}
          </span>
          <span className="text-[10.5px]" style={{ color: "var(--on-ink-2)" }}>
            {subtitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <IconBtn onClick={copy} title="Copy">
            {copied ? <Icons.check size={13} style={{ color: "#5fd39a" }} /> : <Icons.copy size={13} />}
          </IconBtn>
          <IconBtn onClick={download} title="Download">
            <Icons.download size={13} />
          </IconBtn>
        </div>
      </div>
      <pre
        className="mono text-[11px] leading-relaxed px-4 py-3 overflow-x-auto"
        style={{ color: "var(--on-ink)", maxHeight: wide ? 360 : 300 }}
      >
        {code}
      </pre>
    </Card>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} className="p-1.5 rounded-md focus-ring transition-colors" style={{ color: "var(--on-ink-2)" }}>
      {children}
    </button>
  );
}

const AGENT_SNIPPET = `import Exa from "exa-js";
const exa = new Exa(process.env.EXA_API_KEY); // server-side only

// The diligence agent runs ONE targeted Exa search per vendor claim,
// then classifies each result and scores the claim from real evidence.
async function verifyClaim(vendor, claim) {
  const { results } = await exa.searchAndContents(
    \`\${vendor} \${claim.text}\`,
    {
      type: "auto",
      numResults: 6,
      category: "company",
      includeDomains: claim.domains,        // vendor + docs + competitor
      text: { maxCharacters: 1200 },
      highlights: { numSentences: 2, query: claim.text },
      summary: { query: \`Does this support: \${claim.text}?\` },
    }
  );

  return {
    claim: claim.text,
    evidence: results.map(r => ({
      url: r.url, title: r.title, date: r.publishedDate,
      highlight: r.highlights?.[0], summary: r.summary, score: r.score,
    })),
    // agent reasons over highlights -> verdict + confidence + risk
  };
}`;

const NOTES = [
  { t: "Search type", d: "type: auto lets Exa pick neural vs keyword per query; useAutoprompt sharpens intent." },
  { t: "Scoping", d: "category + includeDomains focus each search on vendor docs, trust centers, and competitor pages." },
  { t: "Retrieval", d: "/contents returns text, per-claim highlights, and a claim-scoped summary in one call." },
  { t: "Provenance", d: "Every verdict links to a real URL — auditable for vendor-risk and model-risk committees." },
  { t: "Fallback", d: "Weak evidence broadens the query and marks the claim 'unverified' rather than hallucinating support." },
  { t: "Cost", d: "One search per claim keeps spend predictable — the exact cost and latency are shown in the results header." },
];
