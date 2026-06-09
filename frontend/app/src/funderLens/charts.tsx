/**
 * MIRA charts & glyphs — the §0 visual encoding in React (ported from v2).
 * Value = position. Confidence = opacity + band. Delta = cool-above / warm-below.
 * Gap = hatched + "?". Never green/red.
 */

import { METRIC_ORDER, type CoverageSummary, type MetricId, type MetricReading } from "./types";
import { METRIC_META, clamp01, deltaColor } from "./viz";

type ByMetric = Record<MetricId, MetricReading>;
type Weights = Partial<Record<MetricId, number>>;

/* ---- glyphs -------------------------------------------------------------- */
export function ProvenanceGlyph({ size = 18, color = "var(--ink-3)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" style={{ flex: "0 0 auto" }}>
      <circle cx={6} cy={11} r={4.5} fill={color} />
      <g stroke={color} strokeWidth={2} fill="none" strokeLinecap="round">
        <path d="M12 11 h4" />
        <path d="M14.5 7.5 l3.5 3.5 -3.5 3.5" />
      </g>
    </svg>
  );
}

export function ArtifactGlyph({ size = 20, color = "var(--ink-3)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "0 0 auto" }}>
      <rect x={5} y={3} width={14} height={18} rx={2.5} fill="none" stroke={color} strokeWidth={2} />
      <g stroke={color} strokeWidth={1.8} strokeLinecap="round">
        <line x1={8.5} y1={8} x2={15.5} y2={8} />
        <line x1={8.5} y1={12} x2={15.5} y2={12} />
        <line x1={8.5} y1={16} x2={13} y2={16} />
      </g>
    </svg>
  );
}

const SCOPE: Record<string, [number, number, number][]> = {
  grant: [[16, 16, 5]],
  project: [[10, 20, 4], [22, 20, 4], [16, 9, 4]],
  portfolio: [[11, 11, 3.4], [21, 11, 3.4], [11, 21, 3.4], [21, 21, 3.4]],
};
export function ScopeGlyph({ kind, size = 26, color = "var(--ink-3)" }: { kind: string; size?: number; color?: string }) {
  const circles = SCOPE[kind] ?? SCOPE.grant;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flex: "0 0 auto" }}>
      {circles.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </svg>
  );
}

/* ---- CoverageMeter: per-layer coverage (§6.6) ---------------------------- */
export function CoverageMeter({ coverage }: { coverage: CoverageSummary }) {
  const segs = [
    { k: "commitment", label: "Commitment", v: coverage.byLayer.commitment },
    { k: "outcome", label: "Outcome", v: coverage.byLayer.outcome },
    { k: "context", label: "Context", v: coverage.byLayer.context },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {segs.map((s) => (
        <div key={s.k} style={{ display: "grid", gridTemplateColumns: "108px 1fr 44px", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-2)", fontWeight: 500 }}>{s.label}</span>
          <div style={{ position: "relative", height: 10, borderRadius: 99, background: "rgba(0,0,0,0.06)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: s.v * 100 + "%", borderRadius: 99, background: "var(--dm-cyan)", opacity: 0.55 + s.v * 0.4 }} />
          </div>
          <span style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(s.v * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---- MiraFingerprint: D2 radar ------------------------------------------- */
export function MiraFingerprint({
  byMetric,
  size = 320,
  weights = {},
  onSelect,
  selected,
}: {
  byMetric: ByMetric;
  size?: number;
  weights?: Weights;
  onSelect?: (m: MetricId) => void;
  selected?: MetricId | null;
}) {
  const order = METRIC_ORDER;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const R = size * 0.34;
  const n = order.length;
  const angle = (i: number) => ((-90 + (i * 360) / n) * Math.PI) / 180;
  const pt = (i: number, r: number): [number, number] => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r];
  const toPoly = (pts: [number, number][]) => pts.map((p) => p.join(",")).join(" ");

  const realizedPts = order.map((m, i) => pt(i, (byMetric[m].realized == null ? 0.12 : (byMetric[m].realized as number)) * R));
  const promisedPts = order.map((m, i) => pt(i, (byMetric[m].projected == null ? 0.12 : (byMetric[m].projected as number)) * R));
  const rings = [0.25, 0.5, 0.75, 1].map((f) => toPoly(order.map((_, i) => pt(i, f * R))));
  const padX = size * 0.18;

  return (
    <svg viewBox={`${-padX} 0 ${size + padX * 2} ${size + 34}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <pattern id="fpHatch" width={7} height={7} patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1={0} y1={0} x2={0} y2={7} stroke="var(--dm-gap)" strokeWidth={2} opacity={0.5} />
        </pattern>
      </defs>
      {rings.map((pts, i) => (
        <polygon key={"r" + i} points={pts} fill="none" stroke="var(--hair)" strokeWidth={1.1} />
      ))}
      {order.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={"s" + i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--hair)" strokeWidth={1.1} />;
      })}
      <polygon points={toPoly(promisedPts)} fill="none" stroke="var(--dm-blue)" strokeWidth={2.4} strokeDasharray="7 6" opacity={0.85} />
      <polygon points={toPoly(realizedPts)} fill="var(--dm-cyan)" fillOpacity={0.18} stroke="var(--dm-cyan)" strokeWidth={2.8} />
      {order.map((m, i) => {
        const r = byMetric[m];
        const [x, y] = realizedPts[i];
        const cert = r.confidence.certainty;
        const state = r.confidence.state;
        const halo = 8 + (1 - cert) * 30;
        const isSel = selected === m;
        const isHinge = m === "potential";
        if (state === "unmeasured") {
          return (
            <g key={"v" + i}>
              <circle cx={x} cy={y} r={13} fill="url(#fpHatch)" stroke="var(--dm-gap)" strokeWidth={1.6} strokeDasharray="4 4" />
              <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fill="var(--ink-3)" fontFamily="var(--font-display)">?</text>
            </g>
          );
        }
        return (
          <g key={"v" + i}>
            <circle cx={x} cy={y} r={halo} fill={isHinge ? "var(--dm-hinge)" : "var(--dm-cyan)"} opacity={0.06 + cert * 0.1} />
            {state === "sparse" ? (
              <circle cx={x} cy={y} r={7} fill="none" stroke="var(--dm-cyan)" strokeWidth={2.2} strokeDasharray="3.5 3.5" />
            ) : (
              <circle cx={x} cy={y} r={isSel ? 8 : 5.5} fill={isHinge ? "var(--dm-hinge)" : "var(--dm-cyan)"} stroke={isSel ? "var(--ink)" : "none"} strokeWidth={isSel ? 2 : 0} />
            )}
          </g>
        );
      })}
      {promisedPts.map((p, i) => (
        <circle key={"pv" + i} cx={p[0]} cy={p[1]} r={4} fill="#fff" stroke="var(--dm-blue)" strokeWidth={2} />
      ))}
      {order.map((m, i) => {
        const [lx, ly] = pt(i, R + 30);
        const w = weights[m];
        const emph = w == null ? 1 : 0.5 + w * 0.5;
        const isSel = selected === m;
        const anchor = lx > cx + 12 ? "start" : lx < cx - 12 ? "end" : "middle";
        return (
          <text
            key={"l" + i}
            x={lx}
            y={ly + 5}
            textAnchor={anchor}
            fontSize={isSel ? 20 : 18}
            fontFamily="var(--font-display)"
            fontWeight={isSel ? 700 : 500}
            fill={isSel ? "var(--ink)" : "var(--ink-2)"}
            opacity={emph}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect?.(m)}
          >
            {METRIC_META[m].label}
          </text>
        );
      })}
    </svg>
  );
}

/* ---- ReconciliationRows: D3 dumbbell ledger (the primary surface) -------- */
export function ReconciliationRows({
  order,
  byMetric,
  weights = {},
  onSelect,
  selected,
}: {
  order: MetricId[];
  byMetric: ByMetric;
  weights?: Weights;
  onSelect?: (m: MetricId) => void;
  selected?: MetricId | null;
}) {
  const pad = 4;
  const xOf = (v: number) => pad + clamp01(v) * (100 - pad * 2);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 18, paddingBottom: 8 }}>
        <span />
        <div style={{ position: "relative", height: 14 }}>
          <span style={{ position: "absolute", left: pad + "%", fontSize: 11.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>low</span>
          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>value →</span>
          <span style={{ position: "absolute", right: pad + "%", fontSize: 11.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>high</span>
        </div>
      </div>
      {order.map((m) => {
        const r = byMetric[m];
        const isSel = selected === m;
        const state = r.confidence.state;
        const proj = clamp01(r.projected == null ? 0 : r.projected);
        const real = clamp01(r.realized == null ? 0 : r.realized);
        const lo = Math.min(proj, real);
        const hi = Math.max(proj, real);
        const dColor = deltaColor(r.delta);
        const w = weights[m];
        const emph = w == null ? 1 : 0.45 + w * 0.55;
        return (
          <div
            key={m}
            onClick={() => onSelect?.(m)}
            className={"recon-row" + (isSel ? " sel" : "")}
            style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 18, alignItems: "center", padding: "13px 0", cursor: "pointer", opacity: emph, borderBottom: "1px solid var(--hair-soft)" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{METRIC_META[m].label}</span>
              <span style={{ fontSize: 11, color: dColor, fontWeight: 600 }}>
                {r.delta == null
                  ? "no delta"
                  : (r.delta >= 0 ? "▲ +" : "▼ ") + Math.round(Math.abs(r.delta) * 100) + " vs promise"}
              </span>
            </div>
            <div style={{ position: "relative", height: 26 }}>
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, borderLeft: "1px dashed var(--hair)" }} />
              {state !== "measured" && (
                <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: `calc(${xOf(lo)}% - 16px)`, width: `calc(${xOf(hi) - xOf(lo)}% + 32px)`, height: 18, borderRadius: 99, background: "var(--dm-gap)", opacity: 0.16 }} />
              )}
              {r.delta != null && (
                <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: xOf(lo) + "%", width: xOf(hi) - xOf(lo) + "%", height: 4, background: dColor, borderRadius: 2, opacity: state === "measured" ? 1 : 0.5 }} />
              )}
              <div className="dumb" style={{ left: xOf(proj) + "%", background: "#fff", border: "2.4px solid var(--dm-cyan)" }} />
              {state === "unmeasured" ? (
                <div className="dumb" style={{ left: xOf(real) + "%", background: "var(--hatch-gap)", border: "2px dashed var(--dm-gap)" }} />
              ) : (
                <div className="dumb" style={{ left: xOf(real) + "%", background: state === "sparse" ? "transparent" : "var(--dm-cyan)", border: state === "sparse" ? "2.4px dashed var(--dm-cyan)" : "none" }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
