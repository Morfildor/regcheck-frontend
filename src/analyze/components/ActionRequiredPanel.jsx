import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, RefreshCcw } from "lucide-react";
import { getUnderstoodFacts } from "../helpers";
import { SEVERITY_GLOSSARY } from "../workspaceGlossary";
import { TonePill, cx } from "./Pills";
import styles from "./ActionRequiredPanel.module.css";

function missingSeverityTone(severity) {
  if (severity === "blocker") return "warning";
  if (severity === "route-affecting") return "strong";
  return "muted";
}

function missingSeverityLabel(severity) {
  if (severity === "blocker") return "Blocker";
  if (severity === "route-affecting") return "Route-affecting";
  return "Helpful";
}

function MissingInputExamples({ item, onApplyMissingInput }) {
  if (!item.examples?.length) return null;
  return (
    <div className={styles.inlineActionRow}>
      {item.examples.slice(0, 3).map((example) => (
        <button
          key={`${item.key}-${example}`}
          type="button"
          className={styles.suggestionChip}
          onClick={() => onApplyMissingInput(example)}
        >
          + {example}
        </button>
      ))}
    </div>
  );
}

function ActionItem({ item, onApplyMissingInput }) {
  const severityClass =
    item.severity === "blocker" ? styles.actionItemBlocker
    : item.severity === "route-affecting" ? styles.actionItemRoute
    : styles.actionItemHelpful;

  return (
    <div className={cx(styles.actionItem, severityClass)}>
      <div className={styles.actionItemHeader}>
        <strong className={styles.actionItemTitle}>{item.title}</strong>
        <TonePill
          tone={missingSeverityTone(item.severity)}
          tip={SEVERITY_GLOSSARY[item.severity]}
        >
          {missingSeverityLabel(item.severity)}
        </TonePill>
      </div>
      {item.reason ? <p className={styles.actionItemReason}>{item.reason}</p> : null}
      <MissingInputExamples item={item} onApplyMissingInput={onApplyMissingInput} />
    </div>
  );
}

export default function ActionRequiredPanel({
  description,
  viewModel,
  dirty,
  busy,
  onReanalyze,
  onApplyMissingInput,
}) {
  const blocking = viewModel.missingInputs.filter((i) => i.severity === "blocker");
  const routeAffecting = viewModel.missingInputs.filter((i) => i.severity === "route-affecting");
  const helpful = viewModel.missingInputs.filter((i) => i.severity === "helpful");
  const [open, setOpen] = useState(false);
  const [showAllRoute, setShowAllRoute] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const understoodFacts = useMemo(() => getUnderstoodFacts(description), [description]);

  const hasAny = blocking.length || routeAffecting.length || helpful.length;
  if (!hasAny && !dirty) return null;

  const totalCritical = blocking.length + routeAffecting.length;
  const ROUTE_INITIAL_LIMIT = 3;
  const visibleRouteAffecting = showAllRoute ? routeAffecting : routeAffecting.slice(0, ROUTE_INITIAL_LIMIT);
  const hiddenRouteCount = routeAffecting.length - ROUTE_INITIAL_LIMIT;

  return (
    <section
      id="section-action"
      className={cx(
        styles.actionRequiredSection,
        "clarificationStrip",
        blocking.length ? styles.actionRequiredCritical : ""
      )}
    >
      <button
        type="button"
        className={styles.actionRequiredToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="clarifications-body"
      >
        <div className={styles.actionRequiredMeta}>
          <span className={styles.actionRequiredLabel}>Clarifications</span>
          <div className={styles.actionRequiredPills}>
            {blocking.length ? (
              <TonePill tone="warning" tip={SEVERITY_GLOSSARY["blocker"]}>
                {blocking.length} blocker{blocking.length === 1 ? "" : "s"}
              </TonePill>
            ) : null}
            {routeAffecting.length ? (
              <TonePill tone="strong" tip={SEVERITY_GLOSSARY["route-affecting"]}>
                {routeAffecting.length} route-affecting
              </TonePill>
            ) : null}
            {!totalCritical && helpful.length ? (
              <TonePill tone="muted">{helpful.length} optional</TonePill>
            ) : null}
            {!hasAny && dirty ? (
              <TonePill tone="muted">Description updated</TonePill>
            ) : null}
          </div>
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open ? (
        <div id="clarifications-body" className={styles.actionRequiredBody}>
          {dirty ? (
            <p className={styles.staleNotice}>
              Description changed. Re-run when you want the route refreshed.
            </p>
          ) : null}

          {dirty ? (
            <div className={styles.actionRequiredHeaderRight}>
              <button
                type="button"
                className={cx(styles.actionButton, styles.actionButtonPrimary, styles.actionRequiredRunBtn)}
                onClick={onReanalyze}
                disabled={busy}
              >
                {busy ? <LoaderCircle size={13} className={styles.spin} /> : <RefreshCcw size={13} />}
                Re-run
              </button>
            </div>
          ) : null}

          {/* Understood facts strip */}
          {understoodFacts.length > 0 ? (
            <div className={styles.understoodStrip}>
              <span className={styles.understoodLabel}>Understood:</span>
              <div className={styles.understoodChips}>
                {understoodFacts.map((fact) => (
                  <span key={fact} className={styles.understoodFact}>{fact}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Blockers — always fully visible */}
          {blocking.length ? (
            <div className={styles.actionItemList}>
              {blocking.map((item) => (
                <ActionItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
              ))}
            </div>
          ) : null}

          {/* Route-affecting — show first few, expand on demand */}
          {routeAffecting.length ? (
            <div className={cx(styles.actionItemList, blocking.length ? styles.actionItemListSeparated : "")}>
              {visibleRouteAffecting.map((item) => (
                <ActionItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
              ))}
              {hiddenRouteCount > 0 && !showAllRoute ? (
                <button
                  type="button"
                  className={styles.actionShowMore}
                  onClick={() => setShowAllRoute(true)}
                >
                  <ChevronDown size={12} />
                  {hiddenRouteCount} more route-affecting item{hiddenRouteCount === 1 ? "" : "s"}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Optional refinements — collapsed by default */}
          {helpful.length ? (
            <div className={styles.actionOptional}>
              <button
                type="button"
                className={styles.actionOptionalToggle}
                onClick={() => setShowOptional((v) => !v)}
                aria-expanded={showOptional}
              >
                {showOptional ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {helpful.length} optional refinement{helpful.length === 1 ? "" : "s"}
              </button>
              {showOptional ? (
                <div className={styles.actionItemList}>
                  {helpful.map((item) => (
                    <ActionItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
