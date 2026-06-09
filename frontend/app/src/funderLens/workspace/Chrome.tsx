/** Shared v2 chrome: header (with gap badge), view tabs, lens bar, coverage card. */

import { Link } from "react-router-dom";
import type { CoverageSummary, Grant, Lens } from "../types";
import { CoverageMeter, ScopeGlyph } from "../charts";

export function Header({ grant, onOpenGap }: { grant: Grant; onOpenGap: () => void }) {
  const gapCount = grant.gapQueue.filter((g) => g.status === "open").length;
  return (
    <header className="mira-header">
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
        <Link to="/" className="logo-dot" aria-label="All grants" />
        <div style={{ minWidth: 0 }}>
          <div className="breadcrumb">
            <ScopeGlyph kind="grant" size={18} color="var(--ink-4)" />
            <span style={{ color: "var(--ink-4)" }}>Field</span><span className="crumb-sep">›</span>
            <span style={{ color: "var(--ink-4)" }}>Portfolio</span><span className="crumb-sep">›</span>
            <span style={{ color: "var(--ink-4)" }}>Project</span><span className="crumb-sep">›</span>
            <span style={{ color: "var(--ink)", fontWeight: 600 }}>Grant {grant.code}</span>
          </div>
          <h1 className="grant-title">{grant.title}</h1>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flex: "0 0 auto" }}>
        <div className="vor">
          <span className="vor-k">Version of record</span>
          <span className="vor-v">{grant.proposalVersionOfRecord}</span>
        </div>
        <button className="gap-badge" onClick={onOpenGap}>
          <span className="gap-badge-n">{gapCount}</span> gaps to resolve
        </button>
      </div>
    </header>
  );
}

export function ViewTabs() {
  const tabs: [string, string][] = [["standing", "Standing"], ["schema", "Schema fit"], ["ecosystem", "Ecosystem"]];
  return (
    <div className="view-tabs">
      {tabs.map(([k, label]) => (
        <button key={k} className={"view-tab" + (k === "standing" ? " active" : "")} disabled={k !== "standing"}>
          {label}
          {k !== "standing" && <span className="soon">soon</span>}
        </button>
      ))}
    </div>
  );
}

export function LensBar({ lenses, lensId, setLensId }: { lenses: Lens[]; lensId: string; setLensId: (id: string) => void }) {
  return (
    <div className="lens-bar">
      <span className="lens-label"><span className="lens-eye" />Lens</span>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {lenses.map((l) => (
          <button key={l.id} className={"lens-chip" + (l.id === lensId ? " on" : "")} onClick={() => setLensId(l.id)} title={l.desc ?? undefined}>
            {l.name}
          </button>
        ))}
      </div>
      <span className="lens-note">weights re-emphasize · never sum to a score</span>
    </div>
  );
}

export function CoverageCard({ coverage }: { coverage: CoverageSummary }) {
  return (
    <div className="coverage-card">
      <div>
        <div className="cov-eyebrow">Coverage first — how much can we even see?</div>
        <div className="cov-big">
          <span className="cov-num">{Math.round(coverage.overall * 100)}</span>
          <span className="cov-pct">% of expected evidence present</span>
        </div>
        <div className="cov-counts">
          <span><b style={{ color: "var(--dm-cyan)" }}>{coverage.measured}</b> measured</span>
          <span><b style={{ color: "var(--ink-3)" }}>{coverage.sparse}</b> sparse</span>
          <span><b style={{ color: "var(--dm-gap)" }}>{coverage.unmeasured}</b> unmeasured</span>
          <span style={{ color: "var(--ink-4)" }}>of {coverage.total} nodes</span>
        </div>
      </div>
      <CoverageMeter coverage={coverage} />
    </div>
  );
}
