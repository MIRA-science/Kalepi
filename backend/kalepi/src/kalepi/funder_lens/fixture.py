"""The MIRA Retrospective Lens v2 sample grant — a Microbiome & Human Health
award (MH-204), ported from the Claude Design handoff.

Values live on a shared 0–1 value axis (projected = promised face, realized =
delivered face). Built to exercise all three DisplayStates and a mix of above-/
below-promise deltas, with a recorded human override on Trust and a clinical-
trial node left unmeasured so Impact reads *sparse* and routes to the gap queue.
"""

from __future__ import annotations

from .models import (
    SCHEMA_VERSION,
    Annotation,
    ArtifactType,
    Assignee,
    Confidence,
    CoverageByLayer,
    CoverageSummary,
    DisplayState,
    EvidenceType,
    GapItem,
    GapReason,
    GapStatus,
    Grant,
    GrantLayers,
    GrantSummary,
    Layer,
    Lens,
    MetricId,
    MetricReading,
    Node,
    Orientation,
    Override,
    Provenance,
    SuggestedAction,
)


# --- the §6.2 rule: derive a DisplayState from a confidence pair --------------


def _state(coverage: float, certainty: float) -> DisplayState:
    if coverage <= 0.12:
        return DisplayState.UNMEASURED
    if coverage < 0.5 or certainty < 0.5:
        return DisplayState.SPARSE
    return DisplayState.MEASURED


def _conf(coverage: float, certainty: float, rationale: str | None = None) -> Confidence:
    return Confidence(coverage=coverage, certainty=certainty, state=_state(coverage, certainty), rationale=rationale)


# --- artifacts (white-box endpoints; embedded into each provenance pointer) --

_ARTIFACTS: dict[str, dict] = {
    "art-proposal": dict(artifactType=ArtifactType.PROPOSAL, layer=Layer.COMMITMENT,
        label="Proposal — Restoring Gut Microbiome Resilience After Antibiotic Disruption",
        meta="Version of record · v2 · submitted Mar 2022"),
    "art-mission": dict(artifactType=ArtifactType.MISSION, layer=Layer.COMMITMENT,
        label="Program mission — Human Microbiome & Chronic Disease",
        meta="Funder strategy · 2021–2026 cycle"),
    "art-strategy": dict(artifactType=ArtifactType.STRATEGY_DOC, layer=Layer.COMMITMENT,
        label="Renewal strategy memo — translational pathway", meta="Internal · circulated Y2"),
    "art-report": dict(artifactType=ArtifactType.REPORT, layer=Layer.OUTCOME,
        label="Final technical report (Year 3)", meta="Outcome artifact · 48 pp · ingested"),
    "art-paper1": dict(artifactType=ArtifactType.PAPER, layer=Layer.OUTCOME,
        label="Antibiotic-driven collapse of Bacteroides resilience in the human gut",
        meta="Cell Host & Microbe · 2024 · 31 citations"),
    "art-paper2": dict(artifactType=ArtifactType.PAPER, layer=Layer.OUTCOME,
        label="Keystone-taxa recovery dynamics after broad-spectrum exposure",
        meta="Nature Microbiology · 2025 · 9 citations"),
    "art-ref": dict(artifactType=ArtifactType.REFERENCE, layer=Layer.CONTEXT,
        label="Field reference set — microbiome resilience (142 papers)",
        meta="Context · ecosystem graph"),
}


def _prov(artifact_id: str, excerpt: str) -> Provenance:
    a = _ARTIFACTS[artifact_id]
    return Provenance(
        sourceArtifactId=artifact_id, artifactType=a["artifactType"], layer=a["layer"],
        label=a["label"], meta=a["meta"], excerptRef=excerpt,
    )


# --- nodes (the shared primitive across the three layers) --------------------


def _node(node_id, label, layer, projected, realized, coverage, certainty, prov) -> Node:
    delta = None if (projected is None or realized is None) else round(realized - projected, 2)
    return Node(id=node_id, label=label, layer=layer, projected=projected, realized=realized,
                delta=delta, confidence=_conf(coverage, certainty), provenance=prov)


_COMMITMENT = [
    _node("n-al-1", "Stated aim: restore Bacteroides diversity", Layer.COMMITMENT, 0.74, 0.86, 0.9, 0.85,
          [_prov("art-proposal", 'Aim 1 — "recover ≥80% of baseline Bacteroides diversity within 6 months of disruption."')]),
    _node("n-al-2", "Mission fit: chronic-disease relevance", Layer.COMMITMENT, 0.70, 0.80, 0.82, 0.78,
          [_prov("art-mission", "Priority area — dysbiosis as a driver of chronic inflammatory disease.")]),
    _node("n-al-3", "Scope adherence to funded plan", Layer.COMMITMENT, 0.72, 0.79, 0.8, 0.76,
          [_prov("art-report", "§2 Scope — all three aims pursued; Aim 3 narrowed to murine model.")]),
    _node("n-tr-1", "Reproducibility of headline result", Layer.COMMITMENT, 0.88, 0.62, 0.78, 0.74,
          [_prov("art-paper2", "§3.2 — recovery curve replicated in 2 of 3 cohorts.")]),
    _node("n-tr-2", "Data & code availability", Layer.COMMITMENT, 0.86, 0.66, 0.72, 0.68,
          [_prov("art-report", "Repository public; two pipelines undocumented.")]),
    _node("n-tr-3", "Conflict & provenance disclosure", Layer.COMMITMENT, 0.90, 0.66, 0.74, 0.7,
          [_prov("art-proposal", "Disclosure complete at submission; updates pending.")]),
    _node("n-ri-1", "Stated risk: cohort attrition", Layer.COMMITMENT, 0.44, 0.58, 0.66, 0.62,
          [_prov("art-proposal", 'Risk register — "attrition >30% would threaten Aim 2."')]),
    _node("n-ri-2", "Method risk realized", Layer.COMMITMENT, 0.46, 0.59, 0.64, 0.58,
          [_prov("art-report", "§6 — attrition held at 18%; mitigations effective.")]),
]

_OUTCOME = [
    _node("n-ex-1", "Methodological rigor (peer review)", Layer.OUTCOME, 0.66, 0.72, 0.5, 0.55,
          [_prov("art-paper1", 'Reviewer 2 — "longitudinal design with appropriate controls."')]),
    _node("n-ex-2", "Citation trajectory (post-2024)", Layer.OUTCOME, None, None, 0.05, 0.3,
          [_prov("art-ref", "Citation index not yet ingested for 2025–26 window.")]),
    _node("n-im-1", "Translational outcomes vs. promised", Layer.OUTCOME, 0.82, 0.50, 0.7, 0.66,
          [_prov("art-report", "§5 — clinical translation deferred; pre-clinical milestones met.")]),
    _node("n-im-2", "Downstream reuse of findings", Layer.OUTCOME, 0.78, 0.55, 0.66, 0.6,
          [_prov("art-paper1", "Methods adopted by 2 follow-on studies.")]),
    _node("n-im-3", "Clinical-trial uptake", Layer.OUTCOME, None, None, 0.0, 0.0,
          [_prov("art-report", "Outcome report for trial arm — not ingested.")]),
    _node("n-va-1", "Cost-to-output ratio", Layer.OUTCOME, 0.60, 0.56, 0.32, 0.42,
          [_prov("art-report", "§7 Budget — within 4% of plan; output basis partial.")]),
    _node("n-va-2", "Data-asset reuse value", Layer.OUTCOME, 0.58, 0.54, 0.28, 0.38,
          [_prov("art-ref", "Dataset deposited; reuse signal not yet measurable.")]),
]

_CONTEXT = [
    _node("n-po-1", "Follow-on / renewal readiness", Layer.CONTEXT, 0.55, 0.80, 0.62, 0.56,
          [_prov("art-strategy", 'Memo — "strong basis for a translational renewal."')]),
    _node("n-po-2", "Generative reuse in the field", Layer.CONTEXT, 0.54, 0.76, 0.58, 0.52,
          [_prov("art-ref", "Keystone-taxa framing being picked up across the field.")]),
]

_ALL = _COMMITMENT + _OUTCOME + _CONTEXT
_NODE = {n.id: n for n in _ALL}


def _avg(vals: list[float]) -> float:
    return round(sum(vals) / len(vals), 2) if vals else 0.0


def _reading(metric, orientation, evidence, projected, realized, node_ids, *,
             annotations=None, override=None, note=None) -> MetricReading:
    ns = [_NODE[i] for i in node_ids]
    cov = _avg([n.confidence.coverage for n in ns]) if ns else 0.0
    cer = _avg([n.confidence.certainty for n in ns]) if ns else 0.0
    delta = None if (projected is None or realized is None) else round(realized - projected, 2)
    return MetricReading(
        metric=metric, label=metric.value.capitalize(), question=_QUESTION[metric],
        orientation=orientation, evidenceType=evidence,
        projected=projected, realized=realized, delta=delta,
        confidence=_conf(cov, cer), contributingNodeIds=node_ids,
        annotations=annotations or [], override=override, note=note,
    )


_QUESTION = {
    MetricId.ALIGNMENT: "Did the work track the promise and the program?",
    MetricId.EXCELLENCE: "Quality of the research on its own terms.",
    MetricId.IMPACT: "Reach and consequence of what was delivered.",
    MetricId.VALUE: "Output relative to what was invested.",
    MetricId.TRUST: "Reproducibility, openness, disclosure.",
    MetricId.RISK: "Stated risks vs. how they actually played out.",
    MetricId.POTENTIAL: "Forward-looking — the hinge to the next cycle.",
}

_metrics = [
    _reading(MetricId.ALIGNMENT, Orientation.BACKWARD, EvidenceType.COMMITMENT_DIFF, 0.72, 0.82,
             ["n-al-1", "n-al-2", "n-al-3"]),
    _reading(MetricId.EXCELLENCE, Orientation.BACKWARD, EvidenceType.OUTCOME_CONTEXT, 0.66, 0.71,
             ["n-ex-1", "n-ex-2"], note="Provisional — the post-2024 citation window isn't ingested yet."),
    _reading(MetricId.IMPACT, Orientation.BACKWARD, EvidenceType.OUTCOME_CONTEXT, 0.80, 0.52,
             ["n-im-1", "n-im-2", "n-im-3"],
             annotations=[Annotation(id="a1", author="D. Okafor", ts="2026-05-28",
                 text="Clinical arm slipped to a no-cost extension — the gap here is timing, not failure.")]),
    _reading(MetricId.VALUE, Orientation.BACKWARD, EvidenceType.OUTCOME_CONTEXT, 0.60, 0.55,
             ["n-va-1", "n-va-2"], note="Near baseline on thin evidence — reads sparse, not a verdict."),
    _reading(MetricId.TRUST, Orientation.BACKWARD, EvidenceType.COMMITMENT_DIFF, 0.88, 0.64,
             ["n-tr-1", "n-tr-2", "n-tr-3"],
             override=Override(author="D. Okafor (analyst)", ts="2026-05-30", humanValue=0.71,
                 rationale="Two cohorts is thin but the third failed for a logistics reason, not a science one. "
                 "I read Trust a notch higher than the algorithm.")),
    _reading(MetricId.RISK, Orientation.BACKWARD, EvidenceType.COMMITMENT_DIFF, 0.45, 0.58,
             ["n-ri-1", "n-ri-2"], note="Delivered above promise — attrition was better managed than feared."),
    _reading(MetricId.POTENTIAL, Orientation.FORWARD, EvidenceType.OUTCOME_CONTEXT, 0.55, 0.78,
             ["n-po-1", "n-po-2"], note="The forward hinge — strong basis for a translational renewal."),
]

_gaps = [
    GapItem(id="g1", reason=GapReason.MISSING_OUTCOME_DATA, suggestedAction=SuggestedAction.INGEST,
        label="Clinical-trial outcome report", relatedMetric=MetricId.IMPACT, relatedNodeId="n-im-3",
        assignee=Assignee.ANALYST, status=GapStatus.OPEN,
        detail="Trial-arm report exists but isn't ingested — Impact is reading blind on its most consequential node."),
    GapItem(id="g2", reason=GapReason.LOW_CERTAINTY, suggestedAction=SuggestedAction.INGEST,
        label="Citations after 2024", relatedMetric=MetricId.EXCELLENCE, relatedNodeId="n-ex-2",
        assignee=Assignee.ANALYST, status=GapStatus.OPEN,
        detail="Citation index not refreshed for the 2025–26 window. Excellence is provisional."),
    GapItem(id="g3", reason=GapReason.MISSING_CONTEXT, suggestedAction=SuggestedAction.INGEST,
        label="Collaborator / reuse graph", relatedMetric=MetricId.POTENTIAL, relatedNodeId="n-po-2",
        assignee=Assignee.ANALYST, status=GapStatus.OPEN,
        detail="Ecosystem graph is partial — field-uptake signal for Potential is thin."),
    GapItem(id="g4", reason=GapReason.LOW_CERTAINTY, suggestedAction=SuggestedAction.PROMPT_HUMAN,
        label="Risk claims — unverified", relatedMetric=MetricId.RISK, relatedNodeId="n-ri-2",
        assignee=Assignee.RESEARCHER, status=GapStatus.OPEN,
        detail="Attrition mitigation is self-reported; no independent confirmation yet."),
]

_lenses = [
    Lens(id="balanced", name="Balanced audit", desc="Every reading weighted alike — the default shape.", weights={}),
    Lens(id="translational", name="Translational impact", desc="Leans on what reached the world.",
         weights={MetricId.IMPACT: 1, MetricId.VALUE: 0.9, MetricId.POTENTIAL: 0.8, MetricId.TRUST: 0.5,
                  MetricId.EXCELLENCE: 0.4, MetricId.ALIGNMENT: 0.3, MetricId.RISK: 0.3}),
    Lens(id="integrity", name="Research integrity", desc="Leans on reproducibility & disclosure.",
         weights={MetricId.TRUST: 1, MetricId.EXCELLENCE: 0.9, MetricId.ALIGNMENT: 0.7, MetricId.RISK: 0.6,
                  MetricId.IMPACT: 0.4, MetricId.VALUE: 0.3, MetricId.POTENTIAL: 0.3}),
    Lens(id="forward", name="Forward bet", desc="Leans on the hinge to the next cycle.",
         weights={MetricId.POTENTIAL: 1, MetricId.ALIGNMENT: 0.7, MetricId.IMPACT: 0.6, MetricId.TRUST: 0.6,
                  MetricId.EXCELLENCE: 0.5, MetricId.VALUE: 0.4, MetricId.RISK: 0.3}),
]


def _coverage() -> CoverageSummary:
    states = [n.confidence.state for n in _ALL]
    traced = {p.sourceArtifactId for n in _ALL for p in n.provenance}
    return CoverageSummary(
        overall=_avg([n.confidence.coverage for n in _ALL]),
        measured=states.count(DisplayState.MEASURED),
        sparse=states.count(DisplayState.SPARSE),
        unmeasured=states.count(DisplayState.UNMEASURED),
        tracedSources=len(traced),
        openGaps=sum(1 for g in _gaps if g.status == GapStatus.OPEN),
        total=len(_ALL),
        byLayer=CoverageByLayer(
            commitment=_avg([n.confidence.coverage for n in _COMMITMENT]),
            outcome=_avg([n.confidence.coverage for n in _OUTCOME]),
            context=_avg([n.confidence.coverage for n in _CONTEXT]),
        ),
    )


_grant = Grant(
    schemaVersion=SCHEMA_VERSION,
    id="grant-mh-204",
    code="MH-204",
    title="Restoring Gut Microbiome Resilience After Antibiotic Disruption",
    funder="Helios Foundation",
    proposalVersionOfRecord="Proposal v2 · Mar 2022",
    mission="Human Microbiome & Chronic Disease (2021–2026)",
    pi="R. Almeida · Translational Microbiome Lab",
    field="Microbiome & Human Health",
    coverage=_coverage(),
    layers=GrantLayers(commitment=_COMMITMENT, outcome=_OUTCOME, context=_CONTEXT),
    metrics=_metrics,
    gapQueue=_gaps,
    lenses=_lenses,
    generatedAt="2026-06-09T00:00:00Z",
)

GRANTS: dict[str, Grant] = {_grant.id: _grant}


def grant_summaries() -> list[GrantSummary]:
    return [
        GrantSummary(id=g.id, code=g.code, title=g.title, funder=g.funder, mission=g.mission,
                     field=g.field, coverage=g.coverage)
        for g in GRANTS.values()
    ]
