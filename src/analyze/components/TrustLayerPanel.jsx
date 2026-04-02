import { ChevronDown } from "lucide-react";
import { titleCaseMinor } from "../helpers";
import { MATURITY_GLOSSARY, CONFIDENCE_GLOSSARY } from "../workspaceGlossary";
import { TonePill } from "./Pills";
import styles from "./TrustLayerPanel.module.css";

export default function TrustLayerPanel({ viewModel }) {
  const { blockerCount, directiveCount, clarificationCount } = viewModel.decisionSignals;

  const trustSummary = [
    `${blockerCount} blocker${blockerCount === 1 ? "" : "s"}`,
    `${directiveCount} ${directiveCount === 1 ? "family" : "families"}`,
    `${clarificationCount} clarification${clarificationCount === 1 ? "" : "s"}`,
  ].join(" / ");

  return (
    <details className={styles.trustBar}>
      <summary className={styles.trustBarSummary}>
        <span className={styles.trustBarLabel}>Confidence</span>
        <div className={styles.trustBarPills}>
          <TonePill
            tone={viewModel.resultMaturity.tone}
            strong
            tip={MATURITY_GLOSSARY[viewModel.resultMaturity.label.toLowerCase()]}
          >
            {viewModel.resultMaturity.label}
          </TonePill>
          <TonePill
            tone={viewModel.classificationConfidence.tone}
            tip={CONFIDENCE_GLOSSARY[viewModel.classificationConfidence.label.toLowerCase()]}
          >
            {viewModel.classificationConfidence.label}
          </TonePill>
          <span className={styles.trustBarMeta}>{trustSummary}</span>
        </div>
        <ChevronDown size={13} className={styles.trustBarChevron} />
      </summary>

      <div className={styles.trustBarBody}>
        {/* Assumptions */}
        <div className={styles.trustSection}>
          <span className={styles.trustSectionLabel}>Assumed</span>
          <div className={styles.trustChipRow}>
            {viewModel.assumptions.length ? (
              viewModel.assumptions.map((assumption) => (
                <span key={assumption} className={styles.assumedChip}>
                  {titleCaseMinor(assumption)}
                </span>
              ))
            ) : (
              <span className={styles.emptyCopy}>No explicit assumptions surfaced.</span>
            )}
          </div>
        </div>

        <p className={styles.trustBarDisclaimer}>
          Preliminary result — requires expert review before formal assessment or certification decisions.
        </p>
      </div>
    </details>
  );
}
