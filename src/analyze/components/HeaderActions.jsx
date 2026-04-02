import { Check, Download, RefreshCcw } from "lucide-react";
import { formatUiLabel } from "../helpers";
import { RISK_GLOSSARY } from "../workspaceGlossary";
import { TonePill, cx } from "./Pills";
import styles from "./HeaderActions.module.css";

export default function HeaderActions({ result, totalStandards, onReset, onCopy, copied }) {
  if (!result) {
    return <span className={styles.headerHint}>Describe your product to get a scoped route.</span>;
  }

  return (
    <div className={styles.headerActions}>
      <TonePill
        tone="strong"
        tip={RISK_GLOSSARY[result?.overall_risk?.toLowerCase() || "medium"]}
      >
        {formatUiLabel(result?.overall_risk || "medium")} risk
      </TonePill>
      <span className={styles.headerMetric}>
        {totalStandards} standard{totalStandards === 1 ? "" : "s"}
      </span>
      <button
        type="button"
        className={cx(styles.actionButton, styles.actionButtonSecondary, styles.actionButtonSm)}
        onClick={onCopy}
        aria-live="polite"
        title="Copy analysis summary to clipboard"
      >
        {copied ? <Check size={13} /> : <Download size={13} />}
        {copied ? "Copied" : "Export"}
      </button>
      <button
        type="button"
        className={cx(styles.actionButton, styles.actionButtonGhost, styles.actionButtonSm)}
        onClick={onReset}
        title="Start a new analysis"
      >
        <RefreshCcw size={13} />
        New
      </button>
    </div>
  );
}
