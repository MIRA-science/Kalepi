import { Navigate, Route, Routes } from "react-router-dom";
import { GrantIndex } from "./funderLens/views/GrantIndex";
import { StandingView } from "./funderLens/views/StandingView";
import { GrantWorkspace } from "./funderLens/workspace/GrantWorkspace";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GrantIndex />} />
      <Route path="/grants/:grantId" element={<GrantWorkspace />}>
        <Route index element={<Navigate to="standing" replace />} />
        <Route path="standing" element={<StandingView />} />
        <Route path="*" element={<Navigate to="standing" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
