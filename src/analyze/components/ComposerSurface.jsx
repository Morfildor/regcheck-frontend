import { useState, useEffect } from "react";
import { LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import Surface from "../../shared/ui/Surface";
import ScrollingTemplateRows from "../ScrollingTemplateRows";
import { joinText, formatUiLabel } from "../helpers";
import { cx } from "./Pills";
import styles from "./ComposerSurface.module.css";

function ComposerStatus({ active, viewModel, dirty }) {
  if (!active) return null;
  const openItems =
    viewModel.decisionSignals.blockerCount + viewModel.decisionSignals.routeAffectingCount;
  const parts = [
    formatUiLabel(viewModel.productIdentity.type || "Product"),
    viewModel.classificationConfidence.label,
    `${viewModel.totalStandards} standard${viewModel.totalStandards === 1 ? "" : "s"}`,
    openItems
      ? `${openItems} open item${openItems === 1 ? "" : "s"}`
      : "route stable",
  ];
  return (
    <p className={styles.composerStatus}>
      {dirty ? <span className={styles.composerDirtyDot} /> : null}
      {parts.join(" · ")}
    </p>
  );
}

export default function ComposerSurface({
  description,
  onDescriptionChange,
  onAnalyze,
  onReset,
  onRestorePrevious,
  previousSnapshot,
  busy,
  dirty,
  scopeGapGroups,
  templates,
  viewModel,
  hasResult,
}) {
  const [touched, setTouched] = useState(false);
  const analyzeLabel = hasResult ? "Re-analyze" : "Analyze";
  const isEmpty = !description.trim();
  const showValidation = touched && isEmpty;

  useEffect(() => {
    if (isEmpty) setTouched(false);
  }, [isEmpty]);

  function handleAnalyze() {
    if (isEmpty) {
      setTouched(true);
      return;
    }
    onAnalyze();
  }

  return (
    <Surface
      eyebrow={hasResult ? "Refine" : "Analyze"}
      title={hasResult ? "Refine" : "Describe the product"}
      text={hasResult ? "Edit the description and re-run to update the route." : null}
      bodyClassName={styles.composerBody}
    >
      <textarea
        id="analyze-description"
        className={cx(
          styles.textarea,
          hasResult ? styles.textareaCompact : "",
          showValidation ? styles.textareaError : ""
        )}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-label="Describe your product"
        aria-invalid={showValidation ? "true" : undefined}
        aria-describedby={showValidation ? "desc-validation-msg" : undefined}
        placeholder="Describe the product — include power source, wireless connectivity, intended users, and environment."
      />

      {showValidation ? (
        <p id="desc-validation-msg" className={styles.validationMsg} role="alert">
          Add a product description to run the analysis.
        </p>
      ) : null}

      <ComposerStatus active={hasResult} viewModel={viewModel} dirty={dirty} />

      {!hasResult ? (
        <ScrollingTemplateRows templates={templates} onSelect={onDescriptionChange} />
      ) : null}

      <div className={styles.actionBar} data-mobile-sticky="true">
        <button
          type="button"
          className={cx(styles.actionButton, styles.actionButtonPrimary)}
          onClick={handleAnalyze}
          disabled={busy}
          aria-disabled={isEmpty ? "true" : undefined}
        >
          {busy ? <LoaderCircle size={15} className={styles.spin} /> : <Sparkles size={15} />}
          {analyzeLabel}
        </button>
        <button
          type="button"
          className={cx(styles.actionButton, styles.actionButtonGhost)}
          onClick={onReset}
        >
          Reset
        </button>
        {previousSnapshot ? (
          <button
            type="button"
            className={cx(styles.actionButton, styles.actionButtonGhost)}
            onClick={onRestorePrevious}
          >
            <RotateCcw size={13} />
            Previous
          </button>
        ) : null}
      </div>

      {scopeGapGroups.length > 0 ? (
        <div className={styles.scopeGapsSection}>
          <span className={styles.scopeGapsLabel}>Fill in to complete the scope</span>
          {scopeGapGroups.map((group) => (
            <div key={group.id} className={styles.scopeGapRow}>
              <span className={styles.scopeGapQuestion}>{group.question}</span>
              <div className={styles.scopeGapChips}>
                {group.chips.map((chip) => (
                  <button
                    key={chip.text}
                    type="button"
                    className={styles.scopeGapChip}
                    onClick={() => onDescriptionChange(joinText(description, chip.text))}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Surface>
  );
}
