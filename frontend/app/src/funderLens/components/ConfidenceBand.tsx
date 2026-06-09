/**
 * The confidence rail + invariant 6.2: a value never renders without its
 * confidence. `<ValueChip>` always pairs the realized value with its state; the
 * three DisplayStates are visibly distinct — measured (solid), sparse (hatched
 * + range), unmeasured (empty + "add data").
 */

import type { Confidence, MetricReading } from "../types";
import { clamp01, deltaColor } from "../viz";

const STATE_LABEL = {
  measured: "measured",
  sparse: "sparse · range",
  unmeasured: "no data",
} as const;

export function ConfidenceBand({
  confidence,
  width = 150,
  onAddData,
  compact,
}: {
  confidence: Confidence;
  width?: number | string;
  onAddData?: (e: React.MouseEvent) => void;
  compact?: boolean;
}) {
  const { coverage, certainty, state } = confidence;
  const h = compact ? 7 : 9;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width }}>
      <div style={{ position: "relative", height: h, borderRadius: 99, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {state === "unmeasured" ? (
          <div style={{ position: "absolute", inset: 0, background: "var(--hatch-gap)", opacity: 0.6 }} />
        ) : (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: clamp01(coverage) * 100 + "%",
              borderRadius: 99,
              background: state === "sparse" ? "var(--hatch-cyan)" : "var(--dm-cyan)",
              opacity: 0.35 + certainty * 0.6,
              border: state === "sparse" ? "1px dashed var(--dm-cyan)" : "none",
            }}
          />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11.5, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600, color: state === "unmeasured" ? "var(--dm-gap)" : "var(--ink-3)" }}>
          {STATE_LABEL[state]}
        </span>
        {state === "unmeasured" && onAddData ? (
          <button className="add-data-btn" onClick={onAddData}>+ add data</button>
        ) : (
          <span style={{ fontSize: 11.5, color: "var(--ink-4)", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(coverage * 100)}% cov
          </span>
        )}
      </div>
    </div>
  );
}

function deltaLabel(d: number | null | undefined) {
  if (d == null) return "no delta yet";
  const n = Math.round(Math.abs(d) * 100);
  return d >= 0 ? `delivered +${n} above promise` : `delivered −${n} below promise`;
}

/** A value pill that always carries its confidence state (§6.2). */
export function ValueChip({ reading }: { reading: MetricReading }) {
  const dColor = deltaColor(reading.delta);
  const state = reading.confidence.state;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "4px 11px",
          borderRadius: 6,
          background: state === "unmeasured" ? "var(--hatch-gap)" : "rgba(47,132,194,0.09)",
          border: "1px solid " + (state === "unmeasured" ? "var(--dm-gap)" : "rgba(47,132,194,0.25)"),
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 99,
            background: state === "unmeasured" ? "transparent" : "var(--dm-cyan)",
            border: state === "sparse" ? "2px dashed var(--dm-cyan)" : state === "unmeasured" ? "2px dashed var(--dm-gap)" : "none",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
          {reading.realized == null ? "—" : Math.round(reading.realized * 100)}
        </span>
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>realized</span>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: dColor }}>{deltaLabel(reading.delta)}</span>
    </div>
  );
}
