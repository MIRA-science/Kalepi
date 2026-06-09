/**
 * Shared visual-encoding helpers — the §0 language in code.
 *
 * Value → position (normalized 0–1). Confidence → opacity + band (never value).
 * Projected = hollow, realized = solid. Delta connector: cool above / warm
 * below — never green/red. Gap/unmeasured = hatched, distinct from low.
 */

import {
  Award,
  Compass,
  Crosshair,
  Scale,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { DisplayState, EvidenceType, Lens, MetricId, MetricReading, Orientation } from "./types";

/** Labels + one-line blurbs per metric (the D8 framing). */
export const METRIC_META: Record<MetricId, { label: string; blurb: string }> = {
  alignment: { label: "Alignment", blurb: "Did the work track the promise & the program?" },
  excellence: { label: "Excellence", blurb: "Quality of the research on its own terms." },
  impact: { label: "Impact", blurb: "Reach & consequence of what was delivered." },
  value: { label: "Value", blurb: "Output relative to what was invested." },
  trust: { label: "Trust", blurb: "Reproducibility, openness, disclosure." },
  risk: { label: "Risk", blurb: "Stated risks vs. how they actually played out." },
  potential: { label: "Potential", blurb: "Forward-looking — the hinge to the next cycle." },
};

/** Lens reorders the fingerprint axes by weight (emphasis), never sums (§6.1). */
export function lensOrder(lens: Lens, base: MetricId[]): MetricId[] {
  if (!lens.weights || Object.keys(lens.weights).length === 0) return base;
  return [...base].sort((a, b) => (lens.weights[b] ?? 0) - (lens.weights[a] ?? 0));
}

/** Emphasis (opacity 0.45–1) for a metric under a lens. */
export function emphasisFor(lens: Lens, metric: MetricId, floor = 0.45): number {
  const w = lens.weights?.[metric];
  return w == null ? 1 : floor + w * (1 - floor);
}

/** §0 encoding colours (CSS custom properties — usable in SVG fill/stroke). */
export const DM = {
  cyan: "var(--dm-cyan)",
  blue: "var(--dm-blue)",
  teal: "var(--dm-teal)",
  amber: "var(--dm-amber)",
  gap: "var(--dm-gap)",
  hinge: "var(--dm-hinge)",
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  ink3: "var(--ink-3)",
  ink4: "var(--ink-4)",
  hair: "var(--hair)",
} as const;

export const METRIC_ICON: Record<MetricId, LucideIcon> = {
  alignment: Crosshair,
  excellence: Award,
  impact: TrendingUp,
  value: Scale,
  trust: ShieldCheck,
  risk: TriangleAlert,
  potential: Compass,
};

export const STATE_LABEL: Record<DisplayState, string> = {
  measured: "Measured",
  sparse: "Sparse · thin evidence",
  unmeasured: "Unmeasured",
};

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  backward: "Backward-looking",
  forward: "Forward-looking",
};

export const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  "commitment-diff": "Commitment-diff evidence",
  "outcome-context": "Outcome / context evidence",
};

export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Normalize a raw value to 0–1 against its own scale (never a shared one). */
export function normValue(
  value: number | null | undefined,
  scaleMax?: number | null,
  fallbackMax = 1,
): number | null {
  if (value === null || value === undefined) return null;
  const denom = scaleMax && scaleMax > 0 ? scaleMax : fallbackMax > 0 ? fallbackMax : 1;
  return clamp01(value / denom);
}

export interface MetricViz {
  realizedNorm: number | null;
  projectedNorm: number | null;
  /** certainty drives confidence-halo tightness (high = tight) */
  certainty: number;
  coverage: number;
  state: DisplayState;
  hasValue: boolean;
  isGap: boolean; // sparse OR unmeasured
}

export function vizFor(reading: MetricReading): MetricViz {
  const fallback = Math.max(reading.projected ?? 0, reading.realized ?? 0, 1);
  const state = reading.confidence.state;
  return {
    realizedNorm: normValue(reading.realized, reading.scaleMax, fallback),
    projectedNorm: normValue(reading.projected, reading.scaleMax, fallback),
    certainty: clamp01(reading.confidence.certainty),
    coverage: clamp01(reading.confidence.coverage),
    state,
    hasValue: reading.realized !== null && reading.realized !== undefined,
    isGap: state !== "measured",
  };
}

export type DeltaDir = "above" | "below" | "on" | "none";

export function deltaDir(delta: number | null | undefined): DeltaDir {
  if (delta === null || delta === undefined) return "none";
  if (delta > 0.0001) return "above";
  if (delta < -0.0001) return "below";
  return "on";
}

/** Connector colour for a delta — cool above, warm below (never green/red). */
export function deltaColor(delta: number | null | undefined): string {
  switch (deltaDir(delta)) {
    case "above":
      return DM.blue;
    case "below":
      return DM.amber;
    default:
      return DM.ink4;
  }
}

export function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return String(Math.round(v * 100) / 100);
}

export function formatDelta(delta: number | null | undefined, unit?: string | null): string | null {
  if (delta === null || delta === undefined) return null;
  const r = Math.round(delta * 100) / 100;
  const sign = r > 0 ? "+" : "";
  return `${sign}${r}${unit ? ` ${unit}` : ""}`;
}

export const pct = (n: number) => `${Math.round(clamp01(n) * 100)}%`;

/** Render variant for a reading card (D8 — non-uniform by type). */
export type ReadingVariant = "reconciliation" | "outcome" | "forward";

export function readingVariant(reading: MetricReading): ReadingVariant {
  if (reading.orientation === "forward") return "forward";
  return reading.evidenceType === "commitment-diff" ? "reconciliation" : "outcome";
}
