import { HelmetProvider } from "react-helmet-async";

export default function AppProviders({ children }) {
  return <HelmetProvider>{children}</HelmetProvider>;
}
