import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import SimulatorPage from "@/pages/SimulatorPage/SimulatorPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SimulatorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
