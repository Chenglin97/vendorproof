"use client";
import React, { useEffect, useState } from "react";
import { Shell, LoadingState } from "@/components/Shell";
import { SetupForm } from "@/components/SetupForm";
import { ResultsView } from "@/components/ResultsView";
import { Card, Button, Icons } from "@/components/ui";
import type { DiligenceRequest, DiligenceResult } from "@/lib/types";

type View = "setup" | "loading" | "results";

export default function Page() {
  const [view, setView] = useState<View>("setup");
  const [result, setResult] = useState<DiligenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<DiligenceRequest | null>(null);
  const [liveMode, setLiveMode] = useState<boolean | null>(null);
  const [llm, setLlm] = useState<boolean | null>(null);

  // Probe mode (does the server have an Exa key?) without exposing it.
  useEffect(() => {
    fetch("/api/verify")
      .then((r) => r.json())
      .then((d) => {
        setLiveMode(Boolean(d.liveMode));
        setLlm(Boolean(d.llm));
      })
      .catch(() => setLiveMode(false));
  }, []);

  const run = async (req: DiligenceRequest) => {
    setPending(req);
    setError(null);
    setView("loading");
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setResult(data as DiligenceResult);
      setView("results");
    } catch (e) {
      setError((e as Error).message);
      setView("setup");
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setView("setup");
  };

  return (
    <Shell liveMode={liveMode}>
      {error && view === "setup" && (
        <div className="mx-auto max-w-[1080px] px-5 pt-5">
          <Card style={{ background: "var(--risk-soft)", border: "1px solid var(--risk-line)" }}>
            <div className="flex items-start gap-2.5">
              <Icons.alert size={16} style={{ color: "var(--risk)", marginTop: 1 }} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: "var(--risk)" }}>
                  Verification failed
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-2)" }}>
                  {error}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </div>
          </Card>
        </div>
      )}

      {view === "setup" && <SetupForm onRun={run} loading={false} liveMode={liveMode} llm={llm} />}
      {view === "loading" && <LoadingState vendor={pending?.vendor ?? ""} claims={pending?.claims ?? []} />}
      {view === "results" && result && <ResultsView result={result} onReset={reset} />}
    </Shell>
  );
}
