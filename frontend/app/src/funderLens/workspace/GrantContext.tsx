import { createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import type { Grant } from "../types";

const GrantCtx = createContext<Grant | null>(null);

export function GrantProvider({ grant, children }: { grant: Grant; children: React.ReactNode }) {
  return <GrantCtx.Provider value={grant}>{children}</GrantCtx.Provider>;
}

export function useGrant(): Grant {
  const g = useContext(GrantCtx);
  if (!g) throw new Error("useGrant must be used within a GrantProvider");
  return g;
}

/**
 * The white-box rail as deep-linkable URL state (§3): `?metric → ?node →
 * ?provenance`. Opening a node keeps the metric (so "back" returns to it),
 * giving the reading → nodes → artifact trail in one continuous gesture.
 */
export function useWhiteBox() {
  const [sp, setSp] = useSearchParams();
  const metric = sp.get("metric");
  const node = sp.get("node");
  const provenance = sp.get("provenance");
  const gaps = sp.get("gaps") === "open";

  const apply = (mutate: (n: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp);
    mutate(next);
    setSp(next, { replace: false });
  };
  const clearAll = (n: URLSearchParams) => {
    n.delete("metric");
    n.delete("node");
    n.delete("provenance");
    n.delete("gaps");
  };

  return {
    metric,
    node,
    provenance,
    gaps,
    isOpen: Boolean(metric || node || provenance),
    openMetric: (m: string) =>
      apply((n) => {
        clearAll(n);
        n.set("metric", m);
      }),
    openNode: (id: string) =>
      apply((n) => {
        n.delete("provenance");
        n.set("node", id);
      }),
    openProvenance: (id: string) => apply((n) => n.set("provenance", id)),
    openGap: () => apply((n) => {
      clearAll(n);
      n.set("gaps", "open");
    }),
    back: () =>
      apply((n) => {
        if (provenance) n.delete("provenance");
        else if (node) n.delete("node");
        else n.delete("metric");
      }),
    close: () => apply(clearAll),
  };
}
