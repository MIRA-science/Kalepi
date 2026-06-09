import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, TriangleAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchGrants } from "../api";
import type { GrantSummary } from "../types";
import { pct } from "../viz";

function CoverageBar({ g }: { g: GrantSummary }) {
  const total = g.coverage.measured + g.coverage.sparse + g.coverage.unmeasured;
  return (
    <div className="flex h-2 w-32 overflow-hidden rounded-full border border-hair">
      <div className="bg-dm-cyan/30" style={{ width: `${(g.coverage.measured / total) * 100}%` }} />
      <div className="bg-hatch" style={{ width: `${(g.coverage.sparse / total) * 100}%` }} />
      <div className="bg-hatch opacity-60" style={{ width: `${(g.coverage.unmeasured / total) * 100}%` }} />
    </div>
  );
}

export function GrantIndex() {
  const [grants, setGrants] = useState<GrantSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGrants()
      .then((g) => !cancelled && setGrants(g))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load."));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
      <header className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-dm-cyan">
          MIRA · Retrospective Funder Lens
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Grants under review</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-3">
          Each grant is audited against its own promise — never ranked against the others. Coverage
          leads: how much we can even see, before how it did.
        </p>
      </header>

      {error ? (
        <div className="fy-panel flex items-center gap-2 rounded-2xl p-6 text-sm text-ink-2">
          <TriangleAlert className="size-5 text-dm-amber" /> {error}
        </div>
      ) : !grants ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : (
        <ul className="space-y-3">
          {grants.map((g) => (
            <li key={g.id}>
              <Link
                to={`/grants/${g.id}/standing`}
                className="fy-panel group flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-dm-cyan/40"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-ink">{g.title}</h2>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-3">
                    <Building2 className="size-3.5" /> {g.funder}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-ink-3">Mission: {g.mission}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-lg font-semibold tabular-nums text-ink">{pct(g.coverage.overall)}</span>
                  <CoverageBar g={g} />
                  <span className="text-[10px] text-ink-3">
                    {g.coverage.measured}m · {g.coverage.sparse}s · {g.coverage.unmeasured}u
                  </span>
                </div>
                <ArrowRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
