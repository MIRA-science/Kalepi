/**
 * The white-box rail + gap queue, as v2-styled slide-in drawers (URL-driven so
 * they stay deep-linkable). White-box: reading → node → source artifact, a
 * continuous trail; no value is a dead end (§6.3). Override coexists with the
 * algorithm (§6.4). Gap queue is the honest, actionable inverse of a score.
 */

import type { GapReason, MetricId } from "../types";
import { nodeById, readingByMetric } from "../types";
import { METRIC_META, deltaColor } from "../viz";
import { ArtifactGlyph, ProvenanceGlyph } from "../charts";
import { ConfidenceBand, ValueChip } from "../components/ConfidenceBand";
import { useGrant, useWhiteBox } from "./GrantContext";

const REASON_LABEL: Record<GapReason, string> = {
  "missing-outcome-data": "Missing outcome data",
  "missing-context": "Missing context",
  "low-certainty": "Low certainty",
};

function Crumbs({ crumbs, onBack, onClose, pill = "WHITE-BOX", pillStyle }: {
  crumbs: string[];
  onBack?: () => void;
  onClose: () => void;
  pill?: string;
  pillStyle?: React.CSSProperties;
}) {
  return (
    <div className="drawer-head">
      <div className="drawer-crumbs">
        {onBack && <button className="icon-btn" onClick={onBack} aria-label="back">←</button>}
        <span className="wb-pill" style={pillStyle}>{pill}</span>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <span className="crumb-sep">›</span>}
            <span style={{ color: i === crumbs.length - 1 ? "var(--ink)" : "var(--ink-4)" }}>{c}</span>
          </span>
        ))}
      </div>
      <button className="icon-btn" onClick={onClose} aria-label="close">✕</button>
    </div>
  );
}

export function Drawers() {
  const grant = useGrant();
  const wb = useWhiteBox();

  if (wb.gaps) {
    return (
      <div className="drawer-wrap">
        <div className="drawer-scrim" onClick={wb.close} />
        <aside className="drawer">
          <Crumbs crumbs={["Unresolved data"]} onClose={wb.close} pill="GAP QUEUE" pillStyle={{ background: "var(--dm-amber)" }} />
          <div className="drawer-body">
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", fontFamily: "var(--font-text)", marginTop: 0 }}>
              The honest inverse of a score — what the system can’t yet see, made actionable. A thin
              reading routes here as a call to act, never a penalty.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 6 }}>
              {grant.gapQueue.map((g) => (
                <div key={g.id} className="gap-card">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 99, border: "2.4px dashed var(--dm-amber)", flex: "0 0 auto" }} />
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", flex: 1 }}>{g.label}</span>
                    <span className="gap-reason">{REASON_LABEL[g.reason]}</span>
                  </div>
                  {g.detail && (
                    <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--font-text)", margin: "8px 0 10px", paddingLeft: 26 }}>{g.detail}</div>
                  )}
                  <div style={{ display: "flex", gap: 8, paddingLeft: 26 }}>
                    <button className="gap-act primary">{g.suggestedAction === "ingest" ? "+ Ingest data" : "Prompt a " + g.assignee}</button>
                    {g.relatedMetric && (
                      <button className="gap-act" onClick={() => wb.openMetric(g.relatedMetric as MetricId)}>
                        Open {METRIC_META[g.relatedMetric].label}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    );
  }

  if (!wb.isOpen) return null;

  const reading = wb.metric ? readingByMetric(grant, wb.metric) : undefined;
  const node = wb.node ? nodeById(grant, wb.node) : undefined;
  const sourceNode = wb.provenance ? nodeById(grant, wb.provenance) : undefined;
  const depth = wb.provenance ? 3 : wb.node ? 2 : 1;
  const metricLabel = reading ? METRIC_META[reading.metric].label : "";

  let crumbs: string[] = [];
  let body: React.ReactNode = null;

  if (sourceNode) {
    const p = sourceNode.provenance[0];
    crumbs = [metricLabel, "Node", "Source"];
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="drawer-eyebrow">Source artifact · {p.layer} layer</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div className="art-icon"><ArtifactGlyph size={26} color="var(--ink-2)" /></div>
            <div>
              <h3 className="drawer-title" style={{ fontSize: 20, marginTop: 0 }}>{p.label}</h3>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>{p.meta}</div>
            </div>
          </div>
        </div>
        <div className="excerpt">
          <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", marginBottom: 8 }}>Excerpt referenced</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", fontFamily: "var(--font-text)" }}>{p.excerptRef}</div>
        </div>
        <div className="trail-strip">
          <span>{metricLabel}</span><span className="arr">→</span><span>node</span><span className="arr">→</span>
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>artifact</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--font-text)" }}>
          The trail is continuous — no reading is a dead end. Open the artifact to read it in full.
        </div>
      </div>
    );
  } else if (node) {
    crumbs = [metricLabel, "Node"];
    const dColor = deltaColor(node.delta);
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="drawer-eyebrow">Node primitive · two faces + delta</div>
          <h3 className="drawer-title" style={{ fontSize: 22 }}>{node.label}</h3>
        </div>
        <div className="anatomy">
          <div className="anat-row"><span className="anat-dot hollow" /><span className="anat-k">projected</span><span className="anat-v">{node.projected == null ? "—" : Math.round(node.projected * 100)}</span><span className="anat-note">promised face</span></div>
          <div className="anat-row"><span className="anat-dot solid" /><span className="anat-k">realized</span><span className="anat-v">{node.realized == null ? "—" : Math.round(node.realized * 100)}</span><span className="anat-note">delivered face</span></div>
          <div className="anat-row delta" style={{ background: node.delta == null ? "var(--hatch-gap)" : "rgba(47,132,194,0.08)" }}>
            <span style={{ fontWeight: 700, color: dColor, fontSize: 15 }}>Δ {node.delta == null ? "—" : (node.delta >= 0 ? "+" : "") + Math.round(node.delta * 100)}</span>
            <span className="anat-note" style={{ marginLeft: "auto" }}>{node.delta == null ? "needs data" : "the retrospective signal"}</span>
          </div>
          <div style={{ padding: "4px 2px" }}><ConfidenceBand confidence={node.confidence} width="100%" /></div>
        </div>
        <div>
          <div className="drawer-section-h">Provenance · the white-box link</div>
          {node.provenance.map((p, i) => (
            <button key={i} className="node-row" style={{ alignItems: "center" }} onClick={() => wb.openProvenance(node.id)}>
              <ArtifactGlyph size={18} />
              <span style={{ flex: 1, textAlign: "left" }}>
                <span style={{ display: "block", fontWeight: 600, color: "var(--ink)" }}>{p.label}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.artifactType}</span>
              </span>
              <ProvenanceGlyph size={16} />
            </button>
          ))}
        </div>
      </div>
    );
  } else if (reading) {
    crumbs = [metricLabel];
    body = (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div className="drawer-eyebrow">{reading.orientation === "forward" ? "Forward-looking reading" : "Retrospective reading"} · self-relative</div>
          <h3 className="drawer-title">{metricLabel}</h3>
          <p style={{ fontSize: 13.5, color: "var(--ink-2)", fontFamily: "var(--font-text)", margin: "4px 0 0" }}>{METRIC_META[reading.metric].blurb}</p>
        </div>
        <div className="drawer-stat">
          <ValueChip reading={reading} />
          <div style={{ marginTop: 12 }}><ConfidenceBand confidence={reading.confidence} width="100%" /></div>
        </div>
        {reading.override && (
          <div className="override-box">
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)" }}>Recorded judgment — sits beside the algorithm</div>
            <div style={{ fontSize: 13.5, color: "var(--ink)", fontFamily: "var(--font-text)", marginTop: 6 }}>“{reading.override.rationale}”</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
              <span>{reading.override.author}</span>
              <span>human reads {Math.round((reading.override.humanValue ?? 0) * 100)} · algorithm {reading.realized == null ? "—" : Math.round(reading.realized * 100)}</span>
            </div>
          </div>
        )}
        {reading.annotations.map((a) => (
          <div key={a.id} className="annot-box">
            <div style={{ fontSize: 13.5, color: "var(--ink)", fontFamily: "var(--font-text)" }}>“{a.text}”</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 6 }}>{a.author} · {a.ts}</div>
          </div>
        ))}
        <div>
          <div className="drawer-section-h">Contributing nodes · {reading.contributingNodeIds.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reading.contributingNodeIds.map((id) => {
              const nd = nodeById(grant, id);
              if (!nd) return null;
              return (
                <button key={id} className="node-row" onClick={() => wb.openNode(id)}>
                  <span style={{ flex: 1, textAlign: "left" }}>{nd.label}</span>
                  <ConfidenceBand confidence={nd.confidence} width={70} compact />
                  <ProvenanceGlyph size={16} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drawer-wrap">
      <div className="drawer-scrim" onClick={wb.close} />
      <aside className="drawer">
        <Crumbs crumbs={crumbs} onBack={depth > 1 ? wb.back : undefined} onClose={wb.close} />
        <div className="drawer-body">{body}</div>
      </aside>
    </div>
  );
}
