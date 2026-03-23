import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Surface from "../shared/ui/Surface";
import MarketingLayout from "./MarketingLayout";
import styles from "./MarketingPage.module.css";

export default function NotFoundPage() {
  return (
    <MarketingLayout
      meta={{
        title: "Page Not Found",
        description: "The requested RuleGrid page could not be found.",
      }}
      actions={
        <Link to="/analyze" className={styles.buttonSecondary}>
          Open analyzer
        </Link>
      }
    >
      <Surface bodyClassName={styles.stack}>
        <span className={styles.heroEyebrow}>Page not found</span>
        <h1 className={styles.heroTitle}>This page does not exist.</h1>
        <p className={styles.heroText}>
          Use the main navigation or go directly back to the analyzer.
        </p>
        <div className={styles.buttonRow}>
          <Link to="/" className={styles.buttonGhost}>
            Back home
          </Link>
          <Link to="/analyze" className={styles.buttonPrimary}>
            Open analyzer
            <ArrowRight size={14} />
          </Link>
        </div>
      </Surface>
    </MarketingLayout>
  );
}
