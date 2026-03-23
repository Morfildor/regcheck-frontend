import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import AppProviders from "./AppProviders";
import AppRoutes from "./AppRoutes";

const fallbackStyle = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  color: "var(--text-muted)",
  background: "linear-gradient(180deg, var(--bg-alt) 0%, var(--bg) 22%, #09101a 100%)",
};

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<div style={fallbackStyle}>Loading page…</div>}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
}
