import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./ThemeContext";

export default function AppProviders({ children }) {
  return (
    <HelmetProvider>
      <ThemeProvider>
        {/* Skip-to-main-content for keyboard/AT users */}
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </ThemeProvider>
    </HelmetProvider>
  );
}
