/**
 * Funder-lens data model (frontend half) — UI System Architecture §5.
 *
 * Hand-synced twin of `backend/kalepi/src/kalepi/funder_lens/models.py`:
 * identical camelCase field names, guarded by the `schemaVersion` literal.
 * Mode-agnostic — `projected` is the proactive face, `realized` the
 * retrospective face. There is intentionally NO composite `score` anywhere (§6.1).
 */

export const SCHEMA_VERSION = "kalepi.funderlens.v2" as const;

export type MetricId =
  | "alignment"
  | "excellence"
  | "impact"
  | "value"
  | "trust"
  | "risk"
  | "potential";

export const METRIC_ORDER: MetricId[] = [
  "alignment",
  "excellence",
  "impact",
  "value",
  "trust",
  "risk",
  "potential",
];

/** Drives solid / hatched / empty rendering (§6.2). `sparse` must never read as low. */
export type DisplayState = "measured" | "sparse" | "unmeasured";

export type Orientation = "backward" | "forward";
export type EvidenceType = "commitment-diff" | "outcome-context";

export type ArtifactType =
  | "proposal"
  | "report"
  | "paper"
  | "patent"
  | "dataset"
  | "reference"
  | "strategy-doc"
  | "mission";

export type Layer = "commitment" | "outcome" | "context";

export type GapReason = "missing-outcome-data" | "missing-context" | "low-certainty";
export type SuggestedAction = "ingest" | "prompt-human";
export type Assignee = "analyst" | "researcher";
export type GapStatus = "open" | "routed" | "resolved";

/** Two orthogonal axes, never collapsed into the value. */
export interface Confidence {
  coverage: number; // 0–1: how much expected evidence exists
  certainty: number; // 0–1: confidence in the evidence that does exist
  state: DisplayState; // derived bucket
  rationale?: string | null;
}

/** A pointer to a source artifact — never a payload. */
export interface Provenance {
  sourceArtifactId: string;
  artifactType: ArtifactType;
  layer: Layer;
  label: string;
  meta?: string | null;
  excerptRef?: string | null;
  href?: string | null;
}

/** Discourse-Graph object: one shared type across all three layers. */
export interface Node {
  id: string;
  label: string;
  layer: Layer;
  projected: number | null;
  realized: number | null;
  delta: number | null;
  unit?: string | null;
  confidence: Confidence;
  provenance: Provenance[];
}

export interface Annotation {
  id: string;
  author: string;
  ts: string;
  text: string;
}

/** Recorded human judgment — additive, never replaces the reading (§6.4). */
export interface Override {
  author: string;
  ts: string;
  rationale: string;
  humanValue?: number | null;
}

/** One metric: a value paired with a confidence, traced to its nodes. */
export interface MetricReading {
  metric: MetricId;
  label: string;
  question: string;
  orientation: Orientation;
  evidenceType: EvidenceType;
  projected: number | null;
  realized: number | null;
  delta: number | null;
  unit?: string | null;
  scaleMax?: number | null;
  confidence: Confidence;
  contributingNodeIds: string[];
  annotations: Annotation[];
  override?: Override | null;
  note?: string | null;
}

export interface GapItem {
  id: string;
  reason: GapReason;
  suggestedAction: SuggestedAction;
  label: string;
  status: GapStatus;
  relatedMetric?: MetricId | null;
  relatedNodeId?: string | null;
  assignee?: Assignee | null;
  detail?: string | null;
}

/** Pluralism: weights change emphasis/ordering only — never a sum (§6.1). */
export interface Lens {
  id: string;
  name: string;
  desc?: string | null;
  weights: Partial<Record<MetricId, number>>;
}

export interface CoverageByLayer {
  commitment: number;
  outcome: number;
  context: number;
}

/** Coverage before verdict (§6.6). */
export interface CoverageSummary {
  overall: number;
  measured: number;
  sparse: number;
  unmeasured: number;
  tracedSources: number;
  openGaps: number;
  total: number;
  byLayer: CoverageByLayer;
}

export interface Money {
  value: number;
  currency: string;
}

export interface Period {
  start: string;
  end?: string | null;
}

export interface GrantLayers {
  commitment: Node[];
  outcome: Node[];
  context: Node[];
}

/** The atomic unit. There is intentionally no `score` field (§6.1). */
export interface Grant {
  schemaVersion: string;
  id: string;
  code: string;
  title: string;
  funder: string;
  proposalVersionOfRecord: string;
  mission: string;
  pi?: string | null;
  field?: string | null;
  program?: string | null;
  amountCommitted?: Money | null;
  period?: Period | null;
  coverage: CoverageSummary;
  layers: GrantLayers;
  metrics: MetricReading[];
  gapQueue: GapItem[];
  lenses: Lens[];
  generatedAt: string;
}

export interface GrantSummary {
  id: string;
  code: string;
  title: string;
  funder: string;
  mission: string;
  field?: string | null;
  coverage: CoverageSummary;
}

// --- convenience lookups (white-box trail) -----------------------------------

export function allNodes(grant: Grant): Node[] {
  return [...grant.layers.commitment, ...grant.layers.outcome, ...grant.layers.context];
}

export function nodeById(grant: Grant, id: string): Node | undefined {
  return allNodes(grant).find((n) => n.id === id);
}

export function readingByMetric(grant: Grant, metric: string): MetricReading | undefined {
  return grant.metrics.find((m) => m.metric === metric);
}
