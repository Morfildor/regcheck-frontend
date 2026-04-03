import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, RefreshCcw } from "lucide-react";
import { getUnderstoodFacts } from "../helpers";
import { SEVERITY_GLOSSARY } from "../workspaceGlossary";
import { TonePill, cx } from "./Pills";
import styles from "./ClarificationsPanel.module.css";

function missingSeverityTone(severity) {
  if (severity === "blocker") return "warning";
  if (severity === "route-affecting") return "strong";
  return "muted";
}

function missingSeverityLabel(severity) {
  if (severity === "blocker") return "Blocker";
  if (severity === "route-affecting") return "Route-affecting";
  return "Optional";
}

function SuggestionChips({ item, onApplyMissingInput }) {
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

function ClarificationItem({ item, onApplyMissingInput }) {
  const severityClass =
    item.severity === "blocker" ? styles.itemBlocker
    : item.severity === "route-affecting" ? styles.itemRoute
    : styles.itemHelpful;

  return (
    <div className={cx(styles.clarificationItem, severityClass)}>
      <div className={styles.itemHeader}>
        <strong className={styles.itemTitle}>{item.title}</strong>
        <TonePill
          tone={missingSeverityTone(item.severity)}
          tip={SEVERITY_GLOSSARY[item.severity]}
        >
          {missingSeverityLabel(item.severity)}
        </TonePill>
      </div>
      {item.reason ? <p className={styles.itemReason}>{item.reason}</p> : null}
      <SuggestionChips item={item} onApplyMissingInput={onApplyMissingInput} />
    </div>
  );
}

export default function ClarificationsPanel({
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
      id="section-clarifications"
      className={cx(
        styles.clarificationsSection,
        "clarificationStrip",
        blocking.length ? styles.clarificationsCritical : ""
      )}
    >
      <button
        type="button"
        className={styles.clarificationsToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="clarifications-body"
      >
        <div className={styles.clarificationsMeta}>
          <span className={styles.clarificationsLabel}>Clarifications</span>
          <div className={styles.clarificationsPills}>
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
        <div id="clarifications-body" className={styles.clarificationsBody}>
          {/* Intro line */}
          <p className={styles.sectionIntro}>
            Missing or unclear facts — ordered by route impact.
          </p>

          {/* Stale notice + re-run in one row */}
          {dirty ? (
            <div className={styles.staleRow}>
              <p className={styles.staleNotice}>
                Description updated. Re-run to refresh the route.
              </p>
              <button
                type="button"
                className={cx(styles.rerunButton, styles.rerunButtonPrimary)}
                onClick={onReanalyze}
                disabled={busy}
              >
                {busy ? <LoaderCircle size={13} className={styles.spin} /> : <RefreshCcw size={13} />}
                Re-run
              </button>
            </div>
          ) : null}

          {/* Blockers — always fully visible, highest priority */}
          {blocking.length ? (
            <div className={styles.itemList}>
              {blocking.map((item) => (
                <ClarificationItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
              ))}
            </div>
          ) : null}

          {/* Route-affecting — show first few, expand on demand */}
          {routeAffecting.length ? (
            <div className={cx(styles.itemList, blocking.length ? styles.itemListSeparated : "")}>
              {visibleRouteAffecting.map((item) => (
                <ClarificationItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
              ))}
              {hiddenRouteCount > 0 && !showAllRoute ? (
                <button
                  type="button"
                  className={styles.showMoreBtn}
                  onClick={() => setShowAllRoute(true)}
                >
                  <ChevronDown size={12} />
                  {hiddenRouteCount} more route-affecting item{hiddenRouteCount === 1 ? "" : "s"}
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Understood facts strip — shown after critical items */}
          {understoodFacts.length > 0 ? (
            <div className={styles.understoodStrip}>
              <span className={styles.understoodLabel}>Already clear</span>
              <div className={styles.understoodChips}>
                {understoodFacts.map((fact) => (
                  <span key={fact} className={styles.understoodFact}>{fact}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Optional refinements — collapsed by default */}
          {helpful.length ? (
            <div className={styles.optionalSection}>
              <button
                type="button"
                className={styles.optionalToggle}
                onClick={() => setShowOptional((v) => !v)}
                aria-expanded={showOptional}
              >
                {showOptional ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {helpful.length} optional refinement{helpful.length === 1 ? "" : "s"}
              </button>
              {showOptional ? (
                <div className={styles.itemList}>
                  {helpful.map((item) => (
                    <ClarificationItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
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
