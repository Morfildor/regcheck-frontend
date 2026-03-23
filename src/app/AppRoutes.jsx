import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AnalyzeWorkspace from "../analyze/AnalyzeWorkspace";
import HomePage from "../marketing/HomePage";

const ToolsPage = lazy(() => import("../marketing/ToolsPage"));
const AboutPage = lazy(() => import("../marketing/AboutPage"));
const ContactPage = lazy(() => import("../marketing/ContactPage"));
const NotFoundPage = lazy(() => import("../marketing/NotFoundPage"));

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/analyze" element={<AnalyzeWorkspace />} />
      <Route path="/tools" element={<ToolsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
