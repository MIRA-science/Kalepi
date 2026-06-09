/**
 * Funder-lens API client. Typed calls through the Vite `/api` proxy
 * (→ `http://127.0.0.1:8000`). Matches the existing `fetch` convention.
 */

import { METRIC_ORDER, SCHEMA_VERSION, type Grant, type GrantSummary } from "./types";

export class FunderLensError extends Error {}

async function getJson<T>(path: string, notFoundMsg?: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new FunderLensError(
      res.status === 404 && notFoundMsg
        ? notFoundMsg
        : `Request failed (${res.status} ${res.statusText}).`,
    );
  }
  return (await res.json()) as T;
}

/** Grant index — coverage-first summaries (§3 `/`). */
export function fetchGrants(): Promise<GrantSummary[]> {
  return getJson<GrantSummary[]>("/grants");
}

/** The full grant cell (§3 `/grants/:id`). Validates the hand-synced contract. */
export async function fetchGrant(grantId: string): Promise<Grant> {
  const grant = await getJson<Grant>(
    `/grants/${encodeURIComponent(grantId)}`,
    `No grant "${grantId}" under review.`,
  );
  if (grant.schemaVersion !== SCHEMA_VERSION) {
    throw new FunderLensError(
      `Schema mismatch: expected ${SCHEMA_VERSION}, got ${grant.schemaVersion}.`,
    );
  }
  if (!Array.isArray(grant.metrics) || grant.metrics.length !== METRIC_ORDER.length) {
    throw new FunderLensError(
      `Expected ${METRIC_ORDER.length} metrics, got ${grant.metrics?.length ?? 0}.`,
    );
  }
  grant.metrics = [...grant.metrics].sort(
    (a, b) => METRIC_ORDER.indexOf(a.metric) - METRIC_ORDER.indexOf(b.metric),
  );
  return grant;
}
