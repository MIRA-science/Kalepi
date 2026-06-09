import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { fetchGrant } from "../api";
import type { Grant } from "../types";
import { Header, ViewTabs } from "./Chrome";
import { Drawers } from "./Drawers";
import { GrantProvider, useGrant, useWhiteBox } from "./GrantContext";

function Workbench() {
  const grant = useGrant();
  const wb = useWhiteBox();
  return (
    <div className="mira-root">
      <Header grant={grant} onOpenGap={wb.openGap} />
      <ViewTabs />
      <Outlet />
      <Drawers />
    </div>
  );
}

export function GrantWorkspace() {
  const { grantId } = useParams<{ grantId: string }>();
  const [grant, setGrant] = useState<Grant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grantId) return;
    let cancelled = false;
    setGrant(null);
    setError(null);
    fetchGrant(grantId)
      .then((g) => !cancelled && setGrant(g))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load."));
    return () => {
      cancelled = true;
    };
  }, [grantId]);

  if (error) {
    return (
      <div className="mira-root" style={{ display: "grid", placeItems: "center" }}>
        <div className="panel" style={{ padding: 28, textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontWeight: 600, color: "var(--ink)" }}>Couldn’t load this grant</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>{error}</div>
        </div>
      </div>
    );
  }
  if (!grant) {
    return (
      <div className="mira-root" style={{ display: "grid", placeItems: "center" }}>
        <span style={{ color: "var(--ink-3)", fontSize: 14 }}>Loading the audit…</span>
      </div>
    );
  }
  return (
    <GrantProvider grant={grant}>
      <Workbench />
    </GrantProvider>
  );
}
