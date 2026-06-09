import { useMemo, useState } from "react";
import { MiraFingerprint, ReconciliationRows } from "../charts";
import { METRIC_ORDER, type MetricId, type MetricReading } from "../types";
import { lensOrder } from "../viz";
import { CoverageCard, LensBar } from "../workspace/Chrome";
import { useGrant, useWhiteBox } from "../workspace/GrantContext";

/** View A — resolved layout: ledger primary + a large fingerprint on the rail. */
export function StandingView() {
  const grant = useGrant();
  const wb = useWhiteBox();
  const [lensId, setLensId] = useState("balanced");

  const lens = grant.lenses.find((l) => l.id === lensId) ?? grant.lenses[0];
  const order = lensOrder(lens, METRIC_ORDER);
  const byMetric = useMemo(
    () => Object.fromEntries(grant.metrics.map((m) => [m.metric, m])) as Record<MetricId, MetricReading>,
    [grant],
  );
  const selected = (wb.metric as MetricId | null) ?? null;

  return (
    <div className="layout-resolved">
      <aside className="resolved-rail">
        <CoverageCard coverage={grant.coverage} />
        <section className="panel fp-card">
          <div className="panel-h">
            <span>Metric fingerprint</span>
            <span className="panel-sub">the shape — read as a gestalt</span>
          </div>
          <div className="fp-body">
            <MiraFingerprint byMetric={byMetric} size={320} weights={lens.weights} onSelect={wb.openMetric} selected={selected} />
          </div>
          <div className="fp-legend">
            <span><i className="lg-line" />promised</span>
            <span><i className="lg-fill" />realized</span>
            <span><i className="lg-halo" />confidence halo</span>
            <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>click any spoke to trace →</span>
          </div>
        </section>
      </aside>

      <section className="panel ledger-main">
        <div className="panel-h">
          <span>Promise → realized reconciliation</span>
          <span className="panel-sub">self-relative · the delta is the signal</span>
        </div>
        <LensBar lenses={grant.lenses} lensId={lensId} setLensId={setLensId} />
        <div className="ledger-scroll">
          <ReconciliationRows order={order} byMetric={byMetric} weights={lens.weights} onSelect={wb.openMetric} selected={selected} />
        </div>
        <div className="ledger-foot">
          <span style={{ color: "var(--ink-4)" }}>Click a row to open its reading → nodes → source.</span>
        </div>
      </section>
    </div>
  );
}
