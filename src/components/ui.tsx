"use client";
import React from "react";
import type { Verdict } from "@/lib/types";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ── Inline icon set (no dependency) ─────────────────────────────────────────
type IconProps = { size?: number; className?: string; style?: React.CSSProperties };
const I = (path: React.ReactNode) =>
  function Icon({ size = 16, className, style }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden
      >
        {path}
      </svg>
    );
  };

export const Icons = {
  search: I(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>),
  shield: I(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />),
  check: I(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>),
  help: I(<><circle cx="12" cy="12" r="9" /><path d="M9.2 9.5a2.8 2.8 0 0 1 5.4 1c0 1.8-2.6 2.2-2.6 4M12 17.5h.01" /></>),
  dashed: I(<><path d="M12 3a9 9 0 0 1 4.5 1.2M20.8 7.5A9 9 0 0 1 21 12M19.8 16.5A9 9 0 0 1 16.5 19.8M12 21a9 9 0 0 1-4.5-1.2M3.2 16.5A9 9 0 0 1 3 12M4.2 7.5A9 9 0 0 1 7.5 4.2" /></>),
  x: I(<><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>),
  alert: I(<><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.8 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" /></>),
  flag: I(<><path d="M4 22V4M4 4h11l-1.5 4L15 12H4" /></>),
  arrow: I(<path d="M5 12h14M13 6l6 6-6 6" />),
  copy: I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
  download: I(<><path d="M12 3v12M7 11l5 5 5-5" /><path d="M5 21h14" /></>),
  external: I(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>),
  layers: I(<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  doc: I(<><path d="M14 3v5h5" /><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /></>),
  scale: I(<><path d="M12 3v18M7 21h10M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7ZM19 7l-2.5 6a3 3 0 0 0 5 0L19 7Z" /></>),
  building: I(<><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M9 7h.01M13 7h.01M9 11h.01M13 11h.01M9 15h.01M13 15h.01" /></>),
  spark: I(<path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6 6l2.5 2.5M18 18l-2.5-2.5M6 18l2.5-2.5M18 6l-2.5 2.5" />),
  code: I(<><path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16" /></>),
  bolt: I(<path d="M13 2 4 13h6l-1 9 9-11h-6l1-9Z" />),
  link: I(<><path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" /></>),
  dot: I(<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />),
};

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "vp-spin 0.7s linear infinite" }} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Verdict pill ────────────────────────────────────────────────────────────
const VERDICT_ICON: Record<Verdict, React.FC<IconProps>> = {
  verified: Icons.check,
  partial: Icons.dashed,
  unverified: Icons.help,
  contradicted: Icons.x,
};
const VERDICT_TOKENS: Record<Verdict, { color: string; soft: string; line: string; label: string }> = {
  verified: { color: "var(--ok)", soft: "var(--ok-soft)", line: "var(--ok-line)", label: "Verified" },
  partial: { color: "var(--elevated)", soft: "var(--elevated-soft)", line: "var(--elevated-line)", label: "Partial" },
  unverified: { color: "var(--risk)", soft: "var(--risk-soft)", line: "var(--risk-line)", label: "Unverified" },
  contradicted: { color: "var(--risk)", soft: "var(--risk-soft)", line: "var(--risk-line)", label: "Contradicted" },
};
export function VerdictPill({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" }) {
  const t = VERDICT_TOKENS[verdict];
  const Ico = VERDICT_ICON[verdict];
  return (
    <span
      className={cx("inline-flex items-center gap-1.5 font-medium", size === "sm" ? "text-[11px] px-1.5 py-0.5" : "text-[12px] px-2 py-1")}
      style={{ color: t.color, background: t.soft, border: `1px solid ${t.line}`, borderRadius: "var(--r-pill)" }}
    >
      <Ico size={size === "sm" ? 12 : 13} />
      {t.label}
    </span>
  );
}

// ── Generic chip ────────────────────────────────────────────────────────────
export function Chip({
  children,
  color,
  soft,
  line,
  onClick,
  title,
  mono,
}: {
  children: React.ReactNode;
  color?: string;
  soft?: string;
  line?: string;
  onClick?: () => void;
  title?: string;
  mono?: boolean;
}) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      title={title}
      className={cx(
        "inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 font-medium focus-ring transition-colors",
        mono && "mono",
        onClick && "cursor-pointer hover:brightness-[0.97]",
      )}
      style={{
        color: color ?? "var(--ink-2)",
        background: soft ?? "var(--paper-2)",
        border: `1px solid ${line ?? "var(--line)"}`,
        borderRadius: "var(--r-sm)",
      }}
    >
      {children}
    </Comp>
  );
}

// ── Risk badge ──────────────────────────────────────────────────────────────
export function RiskBadge({ risk }: { risk: "Low" | "Medium" | "High" }) {
  const map = {
    Low: { color: "var(--ok)", soft: "var(--ok-soft)", line: "var(--ok-line)" },
    Medium: { color: "var(--elevated)", soft: "var(--elevated-soft)", line: "var(--elevated-line)" },
    High: { color: "var(--risk)", soft: "var(--risk-soft)", line: "var(--risk-line)" },
  }[risk];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 font-medium"
      style={{ color: map.color, background: map.soft, border: `1px solid ${map.line}`, borderRadius: "var(--r-pill)" }}
    >
      <Icons.dot size={8} />
      {risk}
    </span>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
  pad = true,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cx(pad && "p-4", className)}
      style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", boxShadow: "var(--sh-sm)", ...style }}
    >
      {children}
    </div>
  );
}

// ── Button ──────────────────────────────────────────────────────────────────
export function Button({
  children,
  onClick,
  variant = "ghost",
  size = "md",
  disabled,
  type = "button",
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "ink";
  size?: "sm" | "md";
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium focus-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sz = size === "sm" ? "text-[12px] px-2.5 py-1.5" : "text-[13px] px-3.5 py-2";
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-sm)" },
    ink: { background: "var(--ink)", color: "var(--on-ink)", border: "1px solid var(--ink)", borderRadius: "var(--r-md)" },
    ghost: { background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-xs)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={cx(base, sz)} style={styles[variant]}>
      {children}
    </button>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}

export function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d.length === 10 ? d + "T00:00:00" : d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
