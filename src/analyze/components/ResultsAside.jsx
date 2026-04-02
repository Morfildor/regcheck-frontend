import { ChevronLeft } from "lucide-react";
import AnalyzeStatus from "./AnalyzeStatus";
import ComposerSurface from "./ComposerSurface";
import ErrorBanner from "./ErrorBanner";
import styles from "./ResultsAside.module.css";

/**
 * The refine panel rendered inside the aside column when results are showing.
 * The layout wrapper (grid cell) stays in AnalyzeWorkspace; this is the content.
 */
export default function ResultsAside({ onCollapse, composerProps, busy, error, onRetry }) {
  return (
    <>
      <div className={styles.collapseRow}>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onCollapse}
          title="Collapse refine panel"
        >
          <ChevronLeft size={13} />
        </button>
      </div>
      <ComposerSurface {...composerProps} hasResult={true} />
      <AnalyzeStatus busy={busy} />
      <ErrorBanner message={error} onRetry={onRetry} />
    </>
  );
}
