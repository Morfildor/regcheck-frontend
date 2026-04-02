import Surface from "../../shared/ui/Surface";
import { formatUiLabel } from "../helpers";
import { CONFIDENCE_GLOSSARY } from "../workspaceGlossary";
import { TonePill, DirectivePill, cx } from "./Pills";
import styles from "./OverviewPanel.module.css";

export default function OverviewPanel({ result, viewModel }) {
  const openIssueCount =
    viewModel.decisionSignals.blockerCount + viewModel.decisionSignals.routeAffectingCount;
  const riskLevel = (result?.overall_risk || "medium").toLowerCase();
  const riskTone =
    riskLevel === "high" || riskLevel === "critical"
      ? "warning"
      : riskLevel === "low"
      ? "positive"
      : null;

  return (
    <Surface id="section-summary" eyebrow="Product identification" bodyClassName={styles.overviewBody}>
      <div className={styles.identityCard}>
        <div className={styles.identityCardTop}>
          <span className={styles.identityLabel}>Matched product type</span>
          <TonePill
            tone={viewModel.classificationConfidence.tone}
            tip={CONFIDENCE_GLOSSARY[viewModel.classificationConfidence.label.toLowerCase()]}
          >
            {viewModel.classificationConfidence.label}
          </TonePill>
        </div>
        <h2 className={styles.identityType}>
          {formatUiLabel(viewModel.productIdentity.type || "Product route")}
        </h2>
        {viewModel.triggeredDirectives.length ? (
          <div className={styles.identityDirectives}>
            {viewModel.triggeredDirectives.map((dk) => (
              <DirectivePill key={dk} directiveKey={dk} />
            ))}
          </div>
        ) : null}
        {result?.summary ? (
          <p className={styles.identitySummary}>{result.summary}</p>
        ) : null}
      </div>

      <div className={styles.identityStatRow}>
        <div
          className={cx(
            styles.identityStat,
            riskTone === "warning" ? styles.identityStatWarning
            : riskTone === "positive" ? styles.identityStatPositive
            : ""
          )}
        >
          <span className={styles.identityStatLabel}>Risk</span>
          <strong className={styles.identityStatValue}>
            {formatUiLabel(result?.overall_risk || "medium")}
          </strong>
        </div>
        <div className={styles.identityStat}>
          <span className={styles.identityStatLabel}>Standards</span>
          <strong className={styles.identityStatValue}>{viewModel.totalStandards}</strong>
        </div>
        <div
          className={cx(
            styles.identityStat,
            openIssueCount > 2 ? styles.identityStatWarning
            : openIssueCount === 0 ? styles.identityStatPositive
            : styles.identityStatActive
          )}
        >
          <span className={styles.identityStatLabel}>Open issues</span>
          <strong className={styles.identityStatValue}>{openIssueCount || "None"}</strong>
        </div>
        <div className={styles.identityStat}>
          <span className={styles.identityStatLabel}>Scope</span>
          <strong className={styles.identityStatValue}>{viewModel.resultMaturity.label}</strong>
        </div>
      </div>
    </Surface>
  );
}
