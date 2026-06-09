import { useEffect, useState } from "react";
import type { Claim } from "@mira/types";

export default function App() {
  const [claim, setClaim] = useState<Claim | null>(null);

  useEffect(() => {
    fetch("/api/claim")
      .then((r) => r.json())
      .then(setClaim);
  }, []);

  return <pre>{claim ? JSON.stringify(claim, null, 2) : "Loading…"}</pre>;
}
