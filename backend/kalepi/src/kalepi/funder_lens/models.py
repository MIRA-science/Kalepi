"""Funder-lens data model — the spine (UI System Architecture §5).

Kalepi-local types layered on top of MIRA by addition only (AGENTS.md R6); a
node references its source MIRA/Kalepi artifact by id only (R3 — pointers, not
payloads). Mode-agnostic: ``projected`` is the proactive face, ``realized`` the
retrospective face, so the proactive lens can share this layer later.

Hand-synced twin of ``frontend/app/src/funderLens/types.ts`` — identical
camelCase field names; the ``schemaVersion`` literal is the drift tripwire.

Invariants enforced here (§6): there is **no** ``score`` field anywhere; every
value travels with its ``Confidence``; provenance rides on every node; an
``Override`` is additive (it never mutates the algorithm's reading).
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict

SCHEMA_VERSION = "kalepi.funderlens.v2"


# --- closed vocabularies ------------------------------------------------------


class MetricId(str, Enum):
    ALIGNMENT = "alignment"
    EXCELLENCE = "excellence"
    IMPACT = "impact"
    VALUE = "value"
    TRUST = "trust"
    RISK = "risk"
    POTENTIAL = "potential"


class DisplayState(str, Enum):
    """Drives whether a value renders solid / hatched / empty (§6.2).

    ``sparse`` is the load-bearing middle state: there is *some* evidence but
    thin coverage. It must read as a gap, never as a low grade.
    """

    MEASURED = "measured"
    SPARSE = "sparse"
    UNMEASURED = "unmeasured"


class Orientation(str, Enum):
    BACKWARD = "backward"
    FORWARD = "forward"


class EvidenceType(str, Enum):
    COMMITMENT_DIFF = "commitment-diff"
    OUTCOME_CONTEXT = "outcome-context"


class ArtifactType(str, Enum):
    PROPOSAL = "proposal"
    REPORT = "report"
    PAPER = "paper"
    PATENT = "patent"
    DATASET = "dataset"
    REFERENCE = "reference"
    STRATEGY_DOC = "strategy-doc"
    MISSION = "mission"


class Layer(str, Enum):
    COMMITMENT = "commitment"
    OUTCOME = "outcome"
    CONTEXT = "context"


class GapReason(str, Enum):
    MISSING_OUTCOME_DATA = "missing-outcome-data"
    MISSING_CONTEXT = "missing-context"
    LOW_CERTAINTY = "low-certainty"


class SuggestedAction(str, Enum):
    INGEST = "ingest"
    PROMPT_HUMAN = "prompt-human"


class Assignee(str, Enum):
    ANALYST = "analyst"
    RESEARCHER = "researcher"


class GapStatus(str, Enum):
    OPEN = "open"
    ROUTED = "routed"
    RESOLVED = "resolved"


# --- base ---------------------------------------------------------------------


class FunderLensModel(BaseModel):
    """camelCase wire format, strict like the generated ``mira`` models."""

    model_config = ConfigDict(populate_by_name=True, extra="forbid")


# --- the confidence primitive (always paired with a value, §6.2) -------------


class Confidence(FunderLensModel):
    """Two orthogonal axes, never collapsed into the value.

    ``coverage`` — how much of the *expected* evidence exists.
    ``certainty`` — confidence in the evidence that does exist.
    ``state`` — derived bucket that drives solid / hatched / empty rendering.
    """

    coverage: float
    certainty: float
    state: DisplayState
    rationale: str | None = None


# --- provenance + the shared node primitive ----------------------------------


class Provenance(FunderLensModel):
    """A pointer to a source artifact — never a payload (R3)."""

    sourceArtifactId: str
    artifactType: ArtifactType
    layer: Layer
    label: str
    meta: str | None = None
    excerptRef: str | None = None
    href: str | None = None


class Node(FunderLensModel):
    """Discourse-Graph object: one shared type across all three layers.

    Carries a promised face (``projected``) and a delivered face
    (``realized``); ``delta`` is the retrospective signal. ``null`` on either
    face is meaningful (the realized face is ``null`` until observed).
    """

    id: str
    label: str
    layer: Layer
    projected: float | None = None
    realized: float | None = None
    delta: float | None = None
    unit: str | None = None
    confidence: Confidence
    provenance: list[Provenance]


# --- the seven metric readings (the fingerprint) -----------------------------


class Annotation(FunderLensModel):
    id: str
    author: str
    ts: str
    text: str


class Override(FunderLensModel):
    """Recorded human judgment — additive, never replaces the reading (§6.4)."""

    author: str
    ts: str
    rationale: str
    humanValue: float | None = None


class MetricReading(FunderLensModel):
    """One metric: a value paired with a confidence, traced to its nodes.

    ``orientation`` + ``evidenceType`` (D8) drive a non-uniform render variant —
    the seven readings deliberately do not share one uniform card.
    """

    metric: MetricId
    label: str
    question: str
    orientation: Orientation
    evidenceType: EvidenceType
    projected: float | None = None
    realized: float | None = None
    delta: float | None = None
    unit: str | None = None
    scaleMax: float | None = None
    confidence: Confidence
    contributingNodeIds: list[str]
    annotations: list[Annotation] = []
    override: Override | None = None
    note: str | None = None


# --- gaps, lenses, coverage --------------------------------------------------


class GapItem(FunderLensModel):
    id: str
    reason: GapReason
    suggestedAction: SuggestedAction
    label: str
    status: GapStatus = GapStatus.OPEN
    relatedMetric: MetricId | None = None
    relatedNodeId: str | None = None
    assignee: Assignee | None = None
    detail: str | None = None


class Lens(FunderLensModel):
    """Pluralism: weights change emphasis/ordering only — never a sum (§6.1)."""

    id: str
    name: str
    desc: str | None = None
    weights: dict[MetricId, float] = {}


class CoverageByLayer(FunderLensModel):
    commitment: float
    outcome: float
    context: float


class CoverageSummary(FunderLensModel):
    """Coverage before verdict (§6.6): how much can we even see?"""

    overall: float
    measured: int
    sparse: int
    unmeasured: int
    tracedSources: int
    openGaps: int
    total: int
    byLayer: CoverageByLayer


# --- the grant cell ----------------------------------------------------------


class Money(FunderLensModel):
    value: float
    currency: str


class Period(FunderLensModel):
    start: str
    end: str | None = None


class GrantLayers(FunderLensModel):
    commitment: list[Node]
    outcome: list[Node]
    context: list[Node]


class Grant(FunderLensModel):
    """The atomic unit. There is intentionally **no** ``score`` field (§6.1)."""

    schemaVersion: str
    id: str
    code: str
    title: str
    funder: str
    proposalVersionOfRecord: str
    mission: str
    pi: str | None = None
    field: str | None = None
    program: str | None = None
    amountCommitted: Money | None = None
    period: Period | None = None
    coverage: CoverageSummary
    layers: GrantLayers
    metrics: list[MetricReading]
    gapQueue: list[GapItem]
    lenses: list[Lens] = []
    generatedAt: str


class GrantSummary(FunderLensModel):
    """Row in the grant index — coverage-first (§6.6)."""

    id: str
    code: str
    title: str
    funder: str
    mission: str
    field: str | None = None
    coverage: CoverageSummary
