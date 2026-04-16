import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import CalculatorPage from "@/pages/CalculatorPage/CalculatorPage";
import GcodeEditorPage from "@/pages/GcodeEditorPage/GcodeEditorPage";
import GerberPage from "@/pages/GerberPage/GerberPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/calculator" replace />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/gcode" element={<GcodeEditorPage />} />
        <Route path="/gerber" element={<GerberPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
