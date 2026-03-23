import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  LoaderCircle,
  RefreshCcw,
  RotateCcw,
  Search,
  Sparkles,
  Waypoints,
} from "lucide-react";
import AppShell from "../app/AppShell";
import PageMeta from "../shared/ui/PageMeta";
import Surface from "../shared/ui/Surface";
import layoutStyles from "./AnalyzeWorkspaceLayout.module.css";
import styles from "./AnalyzeWorkspace.module.css";
import { EMPTY_METADATA, fetchMetadataOptions, requestAnalysis } from "./api";
import { buildAnalysisViewModel, buildTemplateChoices } from "./selectors";
import {
  buildClipboardSummary,
  directiveShort,
  directiveTone,
  formatStageLabel,
  formatUiLabel,
  joinText,
  routeTitle,
  titleCaseMinor,
} from "./helpers";

const EXAMPLE_DETAILS = [
  "power source",
  "connectivity",
  "battery",
  "intended use",
  "included accessories",
  "environment / installation context",
];

const PILL_TONE_CLASS = {
  positive: styles.pillPositive,
  warning: styles.pillWarning,
  muted: styles.pillMuted,
  strong: styles.pillStrong,
};

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listDiff(previousItems, nextItems) {
  const previous = new Set(previousItems);
  const next = new Set(nextItems);
  return {
    added: [...next].filter((item) => !previous.has(item)),
    removed: [...previous].filter((item) => !next.has(item)),
  };
}

function summarizeItems(items, limit = 3) {
  if (!items.length) return "";
  const visible = items.slice(0, limit);
  const suffix = items.length > limit ? ` +${items.length - limit} more` : "";
  return `${visible.join(", ")}${suffix}`;
}

function buildComparisonSummary(previousResult, previousDescription, nextResult, nextDescription) {
  if (!previousResult || !nextResult) return null;

  const previousViewModel = buildAnalysisViewModel(previousResult, previousDescription);
  const nextViewModel = buildAnalysisViewModel(nextResult, nextDescription);
  const changes = [];

  if ((previousResult.product_type || "") !== (nextResult.product_type || "")) {
    changes.push(
      `Product identity changed: ${formatUiLabel(previousResult.product_type || "unclear")} -> ${formatUiLabel(
        nextResult.product_type || "unclear"
      )}`
    );
  }

  if (previousViewModel.classificationConfidence.label !== nextViewModel.classificationConfidence.label) {
    changes.push(
      `Confidence changed: ${previousViewModel.classificationConfidence.label} -> ${nextViewModel.classificationConfidence.label}`
    );
  }

  if (previousViewModel.resultMaturity.label !== nextViewModel.resultMaturity.label) {
    changes.push(
      `Maturity changed: ${previousViewModel.resultMaturity.label} -> ${nextViewModel.resultMaturity.label}`
    );
  }

  const legislationDiff = listDiff(
    previousViewModel.legislationItems.map((item) => item.directive_key || item.code || item.title),
    nextViewModel.legislationItems.map((item) => item.directive_key || item.code || item.title)
  );
  if (legislationDiff.added.length) {
    changes.push(`Added legislations: ${summarizeItems(legislationDiff.added.map((item) => directiveShort(item)))}`);
  }

  const standardDiff = listDiff(
    previousViewModel.routeSections.flatMap((section) => (section.items || []).map((item) => item.code || item.title)),
    nextViewModel.routeSections.flatMap((section) => (section.items || []).map((item) => item.code || item.title))
  );
  if (standardDiff.removed.length) {
    changes.push(`Removed standards: ${summarizeItems(standardDiff.removed)}`);
  }

  return changes.length ? changes : null;
}

function extractKnownFacts(description, result) {
  const lowered = String(description || "").toLowerCase();
  const facts = [];

  if (result?.product_type) facts.push(formatUiLabel(result.product_type));
  if (/mains|230v|240v|plug|corded|ac/.test(lowered)) facts.push("Mains power stated");
  if (/battery|rechargeable|lithium|cell/.test(lowered)) facts.push("Battery stated");
  if (/wifi|wi-fi|bluetooth|radio|wireless/.test(lowered)) facts.push("Wireless connectivity stated");
  if (/no wireless|no radio|local only/.test(lowered)) facts.push("No radio stated");
  if (/consumer|household|home/.test(lowered)) facts.push("Consumer use stated");
  if (/professional|industrial|commercial/.test(lowered)) facts.push("Professional use stated");
  if (/outdoor|weather|ip\d/.test(lowered)) facts.push("Outdoor or installation context stated");
  if (/charger|adapter|power supply/.test(lowered)) facts.push("Accessory power hardware stated");

  return [...new Set(facts)].slice(0, 6);
}

function buildSuggestionGroups(description, backendChips, guidanceItems) {
  const lowered = String(description || "").toLowerCase();
  const groups = [];

  const addGroup = (id, label, suggestions) => {
    const deduped = [];
    const seen = new Set();
    (suggestions || []).forEach((suggestion) => {
      const key = suggestion.text || suggestion.label;
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(suggestion);
    });
    if (deduped.length) groups.push({ id, label, suggestions: deduped.slice(0, 5) });
  };

  if (!/mains|battery|usb|adapter|power/.test(lowered)) {
    addGroup("power", "Power details", [
      { label: "Mains powered", text: "mains powered (230 V AC)" },
      { label: "Battery powered", text: "rechargeable lithium battery" },
      { label: "External adapter", text: "powered via external AC/DC power supply adapter" },
    ]);
  }

  if (!/wifi|wi-fi|bluetooth|radio|wireless|nfc/.test(lowered)) {
    addGroup("connectivity", "Connectivity", [
      { label: "Wi-Fi", text: "Wi-Fi connectivity" },
      { label: "Bluetooth", text: "Bluetooth connectivity" },
      { label: "No wireless", text: "no wireless connectivity" },
    ]);
  }

  if (!/consumer|household|professional|industrial|commercial/.test(lowered)) {
    addGroup("use-case", "Intended use", [
      { label: "Consumer use", text: "consumer use" },
      { label: "Professional use", text: "professional use" },
      { label: "Indoor only", text: "indoor use only" },
    ]);
  }

  if (backendChips?.length) {
    addGroup(
      "backend",
      "Engine prompts",
      backendChips.map((item) => ({ label: item.label, text: item.text }))
    );
  }

  if (guidanceItems?.length) {
    addGroup(
      "clarifications",
      "Scope-changing clarifications",
      guidanceItems.flatMap((item) =>
        (item.choices || []).map((choice) => ({
          label: choice,
          text: choice,
        }))
      )
    );
  }

  return groups.slice(0, 3);
}

function useSuggestionGroups(description, backendChips, guidanceItems) {
  const deferredDescription = useDeferredValue(description);
  return useMemo(
    () => buildSuggestionGroups(deferredDescription, backendChips, guidanceItems),
    [backendChips, deferredDescription, guidanceItems]
  );
}

function useIsNarrowViewport() {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 960 : false
  );

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 960);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isNarrow;
}

function TonePill({ children, tone = "muted", strong = false }) {
  return (
    <span className={cx(styles.pill, PILL_TONE_CLASS[tone], strong ? styles.pillStrong : "")}>
      {children}
    </span>
  );
}

function DirectivePill({ directiveKey }) {
  const tone = directiveTone(directiveKey);
  return (
    <span
      className={styles.directivePill}
      style={{
        "--directive-bg": tone.bg,
        "--directive-border": tone.bd,
        "--directive-text": tone.text,
      }}
    >
      {directiveShort(directiveKey)}
    </span>
  );
}

function HeaderActions({
  result,
  totalStandards,
  onReset,
  onRestorePrevious,
  previousSnapshot,
  onCopy,
  copied,
}) {
  if (!result) {
    return <span className={styles.headerHint}>Describe the product to get a scoped route.</span>;
  }

  return (
    <div className={styles.headerActions}>
      <TonePill tone="strong">{formatUiLabel(result?.overall_risk || "medium")} risk</TonePill>
      <span className={styles.headerMetric}>{totalStandards} standards</span>
      {previousSnapshot ? (
        <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary)} onClick={onRestorePrevious}>
          <RotateCcw size={14} />
          Previous
        </button>
      ) : null}
      <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary)} onClick={onCopy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
      <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary)} onClick={onReset}>
        <RefreshCcw size={14} />
        New analysis
      </button>
    </div>
  );
}

function AnalyzeStatus({ busy }) {
  if (!busy) return null;

  return (
    <div className={styles.progressBanner} role="status" aria-live="polite">
      <LoaderCircle size={16} className={styles.spin} />
      <div>
        <div className={styles.progressTitle}>Analyzing product</div>
        <div className={styles.progressText}>
          Checking the description against the compliance engine and rebuilding the route.
        </div>
      </div>
    </div>
  );
}

function DirtyNotice({ dirty, busy, onReanalyze, onDismiss }) {
  if (!dirty) return null;

  return (
    <div className={styles.dirtyBanner} role="status" aria-live="polite">
      <div className={styles.dirtyCopy}>
        <span className={styles.dirtyDot} />
        <span>Description updated. Re-run to apply the latest clarifications.</span>
      </div>
      <div className={styles.dirtyActions}>
        <button type="button" className={cx(styles.actionButton, styles.actionButtonPrimary)} onClick={onReanalyze}>
          {busy ? <LoaderCircle size={14} className={styles.spin} /> : <RefreshCcw size={14} />}
          {busy ? "Starting new run" : "Re-run analysis"}
        </button>
        <button type="button" className={styles.dismissButton} onClick={onDismiss} aria-label="Dismiss stale banner">
          <ChevronUp size={14} />
        </button>
      </div>
    </div>
  );
}

function ComposerSurface({
  description,
  onDescriptionChange,
  onAnalyze,
  onReset,
  onRestorePrevious,
  onCopy,
  copied,
  previousSnapshot,
  busy,
  dirty,
  onDismissDirty,
  suggestionGroups,
  templates,
  hasResult,
}) {
  const analyzeLabel = hasResult ? (dirty ? "Re-run analysis" : "Analyze again") : "Analyze product";

  return (
    <Surface
      eyebrow={hasResult ? "Analyzer controls" : "Analyzer entry"}
      title={hasResult ? "Refine the current scope" : "Describe the product"}
      text={
        hasResult
          ? "Keep the current result visible while you tighten the description, then re-run from the same workspace."
          : "The strongest first pass includes product function, power, radios, battery, accessories, and intended environment."
      }
      bodyClassName={styles.composerBody}
    >
      <label className={styles.textareaLabel} htmlFor="analyze-description">
        Product description
      </label>
      <textarea
        id="analyze-description"
        className={styles.textarea}
        rows={hasResult ? 7 : 9}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        aria-label="Describe your product"
        placeholder="Example: Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path."
      />

      <div className={styles.actionBar} data-mobile-sticky="true">
        <button type="button" className={cx(styles.actionButton, styles.actionButtonPrimary)} onClick={onAnalyze}>
          {busy ? <LoaderCircle size={15} className={styles.spin} /> : <Sparkles size={15} />}
          {analyzeLabel}
        </button>
        <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary)} onClick={onReset}>
          <RefreshCcw size={14} />
          Reset
        </button>
        {previousSnapshot ? (
          <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary)} onClick={onRestorePrevious}>
            <RotateCcw size={14} />
            Restore previous result
          </button>
        ) : null}
        <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary, styles.desktopOnlyAction)} onClick={onCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy / export"}
        </button>
      </div>

      <DirtyNotice dirty={dirty} busy={busy} onReanalyze={onAnalyze} onDismiss={onDismissDirty} />

      <div className={styles.suggestionStack}>
        {suggestionGroups.map((group) => (
          <div key={group.id} className={styles.suggestionGroup}>
            <div className={styles.suggestionLabel}>{group.label}</div>
            <div className={styles.suggestionRow}>
              {group.suggestions.map((suggestion) => (
                <button
                  key={`${group.id}-${suggestion.text}`}
                  type="button"
                  className={styles.suggestionChip}
                  onClick={() => onDescriptionChange(joinText(description, suggestion.text))}
                >
                  + {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        {!hasResult ? (
          <div className={styles.suggestionGroup}>
            <div className={styles.suggestionLabel}>Strong example descriptions</div>
            <div className={styles.suggestionRow}>
              {templates.slice(0, 6).map((template) => (
                <button
                  key={template.label}
                  type="button"
                  className={styles.suggestionChip}
                  onClick={() => onDescriptionChange(template.text)}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Surface>
  );
}

function EmptyStateGuidance({ templates, onPickExample }) {
  return (
    <Surface
      eyebrow="Before the first run"
      title="Give the analyzer the details that most change the route"
      text="The goal is a stronger first-pass backend result, not a perfect spec sheet."
      bodyClassName={styles.emptyStateBody}
    >
      <div className={styles.guidanceGrid}>
        <div className={styles.guidanceCard}>
          <div className={styles.guidanceCardTitle}>
            <Search size={16} />
            What helps most
          </div>
          <div className={styles.chipList}>
            {EXAMPLE_DETAILS.map((item) => (
              <span key={item} className={styles.listChip}>
                {titleCaseMinor(item)}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.guidanceCard}>
          <div className={styles.guidanceCardTitle}>
            <Waypoints size={16} />
            Example descriptions
          </div>
          <div className={styles.exampleList}>
            {templates.slice(0, 3).map((template) => (
              <button
                key={template.label}
                type="button"
                className={styles.exampleCard}
                onClick={() => onPickExample(template.text)}
              >
                <span className={styles.exampleLabel}>{template.label}</span>
                <span className={styles.exampleText}>{template.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Surface>
  );
}

function OverviewPanel({ result, viewModel }) {
  const metrics = [
    { label: "Product", value: formatUiLabel(viewModel.productIdentity.type || "unclear") },
    { label: "Family", value: formatUiLabel(viewModel.productIdentity.family || "unclear") },
    { label: "Subtype", value: formatUiLabel(viewModel.productIdentity.subtype || "not locked") },
    { label: "Stage", value: formatStageLabel(viewModel.productIdentity.stage || "unknown") },
    { label: "Risk", value: formatUiLabel(result?.overall_risk || "medium") },
    { label: "Standards", value: String(viewModel.totalStandards) },
  ];

  return (
    <Surface
      eyebrow="1. Product identification / overview"
      title={formatUiLabel(viewModel.productIdentity.type || "Product route")}
      text={result?.summary || "Analysis complete."}
      bodyClassName={styles.metricGrid}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className={styles.metricCard}>
          <span className={styles.metricLabel}>{metric.label}</span>
          <strong className={styles.metricValue}>{metric.value}</strong>
        </div>
      ))}
    </Surface>
  );
}

function TrustLayerPanel({ viewModel }) {
  return (
    <Surface
      eyebrow="2. Trust layer"
      title="Current scoping confidence"
      text="These labels and assumptions tell you how stable the route is before evidence review begins."
      bodyClassName={styles.trustGrid}
    >
      <div className={styles.trustCard}>
        <span className={styles.sectionLabel}>Result maturity</span>
        <TonePill tone={viewModel.resultMaturity.tone} strong>
          {viewModel.resultMaturity.label}
        </TonePill>
      </div>

      <div className={styles.trustCard}>
        <span className={styles.sectionLabel}>Classification confidence</span>
        <TonePill tone={viewModel.classificationConfidence.tone} strong>
          {viewModel.classificationConfidence.label}
        </TonePill>
      </div>

      <div className={cx(styles.trustCard, styles.trustAssumptions)}>
        <span className={styles.sectionLabel}>Assumptions</span>
        <div className={styles.chipList}>
          {viewModel.assumptions.length ? (
            viewModel.assumptions.map((assumption) => (
              <span key={assumption} className={styles.listChip}>
                {titleCaseMinor(assumption)}
              </span>
            ))
          ) : (
            <span className={styles.emptyCopy}>No explicit assumptions surfaced from the current result.</span>
          )}
        </div>
      </div>
    </Surface>
  );
}

function MissingInputsPanel({ description, result, viewModel }) {
  const knownFacts = extractKnownFacts(description, result);
  const blocking = viewModel.missingInputs.filter((item) => item.severity === "blocker");
  const important = viewModel.missingInputs.filter((item) => item.severity !== "blocker");

  return (
    <Surface
      eyebrow="3. Critical missing inputs / blockers"
      title="What could change this result"
      text="Known facts stay separate from assumptions and missing inputs so the team can decide what to confirm next."
      bodyClassName={styles.missingGrid}
    >
      <div className={styles.infoCard}>
        <span className={styles.sectionLabel}>Known from description</span>
        <div className={styles.chipList}>
          {knownFacts.length ? (
            knownFacts.map((fact) => (
              <span key={fact} className={styles.listChip}>
                {fact}
              </span>
            ))
          ) : (
            <span className={styles.emptyCopy}>The current description is still thin on route-defining facts.</span>
          )}
        </div>
      </div>

      <div className={styles.infoCard}>
        <span className={styles.sectionLabel}>Assumed</span>
        <div className={styles.chipList}>
          {viewModel.assumptions.length ? (
            viewModel.assumptions.map((assumption) => (
              <span key={assumption} className={styles.listChip}>
                {titleCaseMinor(assumption)}
              </span>
            ))
          ) : (
            <span className={styles.emptyCopy}>No major assumptions are currently highlighted.</span>
          )}
        </div>
      </div>

      <div className={styles.infoCard}>
        <span className={styles.sectionLabel}>Missing and blocking</span>
        <div className={styles.stackList}>
          {blocking.length ? (
            blocking.map((item) => (
              <div key={item.key} className={styles.missingItem}>
                <div className={styles.missingTitleRow}>
                  <span className={styles.missingTitle}>{item.title}</span>
                  <TonePill tone="warning">Blocker</TonePill>
                </div>
                <p className={styles.missingReason}>{item.reason}</p>
              </div>
            ))
          ) : (
            <span className={styles.emptyCopy}>No explicit blockers surfaced in the current result.</span>
          )}
        </div>
      </div>

      <div className={styles.infoCard}>
        <span className={styles.sectionLabel}>Missing but important</span>
        <div className={styles.stackList}>
          {important.length ? (
            important.map((item) => (
              <div key={item.key} className={styles.missingItem}>
                <div className={styles.missingTitleRow}>
                  <span className={styles.missingTitle}>{item.title}</span>
                  <TonePill tone={item.severity === "route-affecting" ? "warning" : "muted"}>
                    {item.severity === "route-affecting" ? "Route-affecting" : "Helpful"}
                  </TonePill>
                </div>
                <p className={styles.missingReason}>{item.reason}</p>
              </div>
            ))
          ) : (
            <span className={styles.emptyCopy}>No additional route-affecting inputs are currently highlighted.</span>
          )}
        </div>
      </div>
    </Surface>
  );
}

function ComparisonPanel({ changes }) {
  if (!changes?.length) return null;

  return (
    <Surface
      eyebrow="Session compare"
      title="Compared with previous analysis"
      text="Session-local changes only. No results are persisted."
      bodyClassName={styles.compareBody}
    >
      {changes.map((change) => (
        <span key={change} className={styles.compareChip}>
          {change}
        </span>
      ))}
    </Surface>
  );
}

function StandardCard({ item, sectionKey }) {
  return (
    <article className={styles.standardCard}>
      <div className={styles.standardHeader}>
        <div className={styles.standardTitleWrap}>
          <div className={styles.standardCode}>{item.code || "Standard"}</div>
          <h4 className={styles.standardTitle}>{titleCaseMinor(item.title || "Untitled standard")}</h4>
          {item.shortRationale ? <p className={styles.microRationale}>{item.shortRationale}</p> : null}
        </div>
        <div className={styles.standardPills}>
          <DirectivePill directiveKey={sectionKey} />
          <TonePill tone="muted">{item.applicabilityBucket}</TonePill>
        </div>
      </div>

      <div className={styles.metaGrid}>
        {item.version ? (
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Latest</span>
            <span>{item.version}</span>
          </div>
        ) : null}
        {item.dated_version ? (
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>EU dated</span>
            <span>{item.dated_version}</span>
          </div>
        ) : null}
        {item.harmonized_reference ? (
          <div className={styles.metaCard}>
            <span className={styles.metaLabel}>Reference</span>
            <span>{item.harmonized_reference}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RouteSectionCard({ section, open, onToggle }) {
  const sectionId = `route-section-${slugify(section.key || section.title)}`;

  return (
    <section className={styles.accordionCard} id={sectionId}>
      <button
        type="button"
        className={styles.accordionToggle}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${sectionId}-body`}
      >
        <div>
          <div className={styles.accordionTitleRow}>
            <h3 className={styles.accordionTitle}>{routeTitle(section)}</h3>
            <DirectivePill directiveKey={section.key || "OTHER"} />
          </div>
          <p className={styles.accordionText}>
            {(section.items || []).length} standard{(section.items || []).length === 1 ? "" : "s"} in this route.
          </p>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open ? (
        <div id={`${sectionId}-body`} className={styles.accordionBody}>
          {(section.items || []).length ? (
            section.items.map((item) => (
              <StandardCard
                key={`${section.key}-${item.code || item.title}-${item.version || ""}`}
                item={item}
                sectionKey={section.key || "OTHER"}
              />
            ))
          ) : (
            <p className={styles.emptyCopy}>No standards were returned for this route group.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function StandardsRoutePanel({ viewModel }) {
  const groups = [
    {
      key: "core",
      title: "Core likely applicable",
      text: "This is the primary standards route for the current product description.",
      sections: viewModel.primaryRouteSections,
    },
    {
      key: "conditional",
      title: "Conditional / check applicability",
      text: "These routes often depend on radios, batteries, accessories, or specific product features.",
      sections: viewModel.conditionalRouteSections,
    },
    {
      key: "peripheral",
      title: "Usually not applicable unless specific features are present",
      text: "Keep these in view only if the product description expands.",
      sections: viewModel.secondaryRouteSections,
    },
  ];

  const initialOpenKey = viewModel.primaryRouteSections[0]?.key || "";
  const [openKeys, setOpenKeys] = useState(() =>
    initialOpenKey ? new Set([initialOpenKey]) : new Set()
  );

  const toggleSection = useCallback((key) => {
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <Surface
      eyebrow="4. Primary standards route"
      title="Standards route"
      text="Secondary context stays below the core route. The first section is opened by default."
      bodyClassName={styles.sectionStack}
    >
      {viewModel.routeSections.length ? (
        groups.map((group) =>
          group.sections.length ? (
            <div key={group.key} className={styles.groupBlock}>
              <div className={styles.groupHeading}>
                <h3 className={styles.groupTitle}>{group.title}</h3>
                <p className={styles.groupText}>{group.text}</p>
              </div>
              <div className={styles.sectionStack}>
                {group.sections.map((section) => (
                  <RouteSectionCard
                    key={section.key || section.title}
                    section={section}
                    open={openKeys.has(section.key)}
                    onToggle={() => toggleSection(section.key)}
                  />
                ))}
              </div>
            </div>
          ) : null
        )
      ) : (
        <p className={styles.emptyCopy}>
          No standards route was returned. The overview and trust layer still reflect the current scope assumptions.
        </p>
      )}
    </Surface>
  );
}

function LegislationCard({ item, open, onToggle }) {
  const itemId = `legislation-${slugify(item.directive_key || item.code || item.title)}`;

  return (
    <section className={styles.accordionCard}>
      <button
        type="button"
        className={styles.accordionToggle}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${itemId}-body`}
      >
        <div>
          <div className={styles.accordionTitleRow}>
            <h3 className={styles.accordionTitle}>{titleCaseMinor(item.title || "Untitled legislation")}</h3>
            <DirectivePill directiveKey={item.directive_key || "OTHER"} />
          </div>
          {item.shortRationale ? <p className={styles.microRationale}>{item.shortRationale}</p> : null}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open ? (
        <div id={`${itemId}-body`} className={styles.accordionBody}>
          {item.code ? (
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Reference</span>
              <span>{item.code}</span>
            </div>
          ) : null}
          {item.scope ? (
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Scope</span>
              <span>{item.scope}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function flattenLegislationGroups(groups) {
  return (groups || []).flatMap((group) =>
    (group.items || []).map((item) => ({
      ...item,
      _groupKey: group.groupKey || group.key || "other",
    }))
  );
}

function ParallelObligationsPanel({ viewModel }) {
  const conditionalItems = flattenLegislationGroups(viewModel.conditionalLegislationGroups);
  const peripheralItems = flattenLegislationGroups(viewModel.peripheralLegislationGroups);
  const groups = [
    {
      key: "conditional",
      title: "Conditional / check applicability",
      text: "These frameworks often turn on when the product includes specific features or market facts.",
      items: conditionalItems,
    },
    {
      key: "peripheral",
      title: "Usually not applicable unless specific features are present",
      text: "Keep these in reserve for expanded product claims, environments, or technologies.",
      items: peripheralItems,
    },
  ];

  const initialOpenKey =
    conditionalItems[0]?.directive_key ||
    conditionalItems[0]?.code ||
    conditionalItems[0]?.title ||
    peripheralItems[0]?.directive_key ||
    peripheralItems[0]?.code ||
    peripheralItems[0]?.title ||
    "";
  const [openKeys, setOpenKeys] = useState(() =>
    initialOpenKey ? new Set([initialOpenKey]) : new Set()
  );

  const toggleItem = useCallback((key) => {
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <Surface
      eyebrow="5. Parallel obligations / adjacent frameworks"
      title="Parallel obligations"
      text="The CE route stays above; this section is for adjacent frameworks and obligations around it."
      bodyClassName={styles.sectionStack}
    >
      {groups.some((group) => group.items.length) ? (
        groups.map((group) =>
          group.items.length ? (
            <div key={group.key} className={styles.groupBlock}>
              <div className={styles.groupHeading}>
                <h3 className={styles.groupTitle}>{group.title}</h3>
                <p className={styles.groupText}>{group.text}</p>
              </div>
              <div className={styles.sectionStack}>
                {group.items.map((item) => {
                  const key = item.directive_key || item.code || item.title;
                  return (
                    <LegislationCard
                      key={`${group.key}-${key}`}
                      item={item}
                      open={openKeys.has(key)}
                      onToggle={() => toggleItem(key)}
                    />
                  );
                })}
              </div>
            </div>
          ) : null
        )
      ) : (
        <p className={styles.emptyCopy}>No parallel obligations were returned beyond the primary standards route.</p>
      )}
    </Surface>
  );
}

function EvidencePanel({ viewModel }) {
  return (
    <Surface
      eyebrow="6. Evidence expectations / common blockers"
      title="Evidence and common gaps"
      text="This is a practical pre-lab checklist for the major routes and frameworks currently in view."
      bodyClassName={styles.evidenceGrid}
    >
      {viewModel.evidenceNeeds.length ? (
        viewModel.evidenceNeeds.map((need) => (
          <div key={need.key} className={styles.evidenceCard}>
            <div className={styles.evidenceHeader}>
              <h3 className={styles.groupTitle}>{need.label}</h3>
              <DirectivePill directiveKey={need.key} />
            </div>
            <div className={styles.evidenceSection}>
              <span className={styles.metaLabel}>Typical evidence expected</span>
              <div className={styles.chipList}>
                {need.typicalEvidence.map((item) => (
                  <span key={item} className={styles.listChip}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.evidenceSection}>
              <span className={styles.metaLabel}>Common missing information</span>
              <div className={styles.chipList}>
                {need.commonMissing.map((item) => (
                  <span key={item} className={styles.listChip}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.evidenceSection}>
              <span className={styles.metaLabel}>Common blockers</span>
              <div className={styles.chipList}>
                {need.blockers.map((item) => (
                  <span key={item} className={styles.listChip}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className={styles.emptyCopy}>
          No evidence prompts were returned. The trust layer still shows whether the scope is assumption-heavy.
        </p>
      )}
    </Surface>
  );
}

function SupportingContextPanel({ result, viewModel, description, copied, onCopy, isNarrow }) {
  const [open, setOpen] = useState(!isNarrow);

  useEffect(() => {
    setOpen(!isNarrow);
  }, [isNarrow]);

  return (
    <details className={styles.contextPanel} open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className={styles.contextSummary}>
        <div>
          <span className={styles.contextEyebrow}>7. Supporting context rail</span>
          <h2 className={styles.contextTitle}>Supporting context</h2>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </summary>

      <div className={styles.contextBody}>
        <div className={styles.infoCard}>
          <span className={styles.sectionLabel}>Description used for current result</span>
          <p className={styles.contextText}>{description || "No description captured."}</p>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.sectionLabel}>Triggered directive families</span>
          <div className={styles.chipList}>
            {viewModel.triggeredDirectives.length ? (
              viewModel.triggeredDirectives.map((directiveKey) => (
                <DirectivePill key={directiveKey} directiveKey={directiveKey} />
              ))
            ) : (
              <span className={styles.emptyCopy}>No directive families were returned.</span>
            )}
          </div>
        </div>

        <div className={styles.infoCard}>
          <span className={styles.sectionLabel}>Copy / export</span>
          <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary, styles.fullWidthButton)} onClick={onCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied to clipboard" : "Copy analysis summary"}
          </button>
        </div>

        {result?.future_watchlist?.length ? (
          <div className={styles.infoCard}>
            <span className={styles.sectionLabel}>Future watchlist</span>
            <div className={styles.chipList}>
              {result.future_watchlist.slice(0, 5).map((item) => (
                <span key={item} className={styles.listChip}>
                  {titleCaseMinor(item)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div className={styles.errorBanner} role="alert">
      <AlertTriangle size={16} />
      <div>
        <div className={styles.errorTitle}>Analysis error</div>
        <div className={styles.errorText}>{message}</div>
      </div>
    </div>
  );
}

function ScrollTopButton({ visible }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      className={styles.scrollTop}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <ArrowUp size={15} />
    </button>
  );
}

export default function AnalyzeWorkspace() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNarrow = useIsNarrowViewport();
  const [description, setDescription] = useState(() => searchParams.get("q") || "");
  const [analyzedDescription, setAnalyzedDescription] = useState("");
  const [metadata, setMetadata] = useState(EMPTY_METADATA);
  const [result, setResult] = useState(null);
  const [resultRevision, setResultRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dismissDirty, setDismissDirty] = useState(false);
  const [comparisonChanges, setComparisonChanges] = useState(null);
  const [analysisCopied, setAnalysisCopied] = useState(false);
  const [previousSnapshot, setPreviousSnapshot] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const analysisAbortRef = useRef(null);
  const copyResetTimerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const resultsRef = useRef(null);
  const [templateOrder] = useState(() => Array.from({ length: 48 }, () => Math.random()));

  const viewModel = useMemo(
    () => buildAnalysisViewModel(result, analyzedDescription || description),
    [analyzedDescription, description, result]
  );
  const templates = useMemo(
    () => buildTemplateChoices(metadata, templateOrder),
    [metadata, templateOrder]
  );
  const suggestionGroups = useSuggestionGroups(description, viewModel.backendChips, viewModel.guidanceItems);
  const dirty = Boolean(result && analyzedDescription.trim() !== description.trim() && !dismissDirty);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadataOptions({ signal: controller.signal })
      .then((data) => setMetadata(data || EMPTY_METADATA))
      .catch((fetchError) => {
        if (fetchError?.name !== "AbortError") {
          setMetadata(EMPTY_METADATA);
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      analysisAbortRef.current?.abort();
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== description) {
      setDescription(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const trimmed = String(description || "").trim();
    const current = searchParams.get("q") || "";

    if (trimmed) {
      if (current !== trimmed) {
        next.set("q", trimmed);
        setSearchParams(next, { replace: true });
      }
      return;
    }

    if (current) {
      next.delete("q");
      setSearchParams(next, { replace: true });
    }
  }, [description, searchParams, setSearchParams]);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [resultRevision, result]);

  const resetCopied = useCallback(() => {
    setAnalysisCopied(false);
    if (copyResetTimerRef.current) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = null;
  }, []);

  const cancelActiveAnalysis = useCallback(() => {
    if (analysisAbortRef.current) {
      analysisAbortRef.current.abort();
      analysisAbortRef.current = null;
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result) return;

    const text = buildClipboardSummary({
      result,
      description: analyzedDescription || description,
      routeSections: viewModel.routeSections,
      legislationGroups: viewModel.legislationGroups,
    });

    const fallbackCopy = (value) => {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    };

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      setAnalysisCopied(true);
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      copyResetTimerRef.current = window.setTimeout(() => {
        setAnalysisCopied(false);
        copyResetTimerRef.current = null;
      }, 2200);
    } catch (_) {
      fallbackCopy(text);
      setAnalysisCopied(true);
    }
  }, [analyzedDescription, description, result, viewModel.legislationGroups, viewModel.routeSections]);

  const runAnalysis = useCallback(async () => {
    const payload = String(description || "").trim();
    if (!payload) return;

    if (result) {
      setPreviousSnapshot({
        result,
        description: analyzedDescription || description,
      });
    }

    cancelActiveAnalysis();
    resetCopied();
    setBusy(true);
    setError("");
    setDismissDirty(false);

    const controller = new AbortController();
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    analysisAbortRef.current = controller;

    try {
      const data = await requestAnalysis(payload, { signal: controller.signal });
      if (analysisAbortRef.current !== controller || requestSequenceRef.current !== requestId) {
        return;
      }

      const nextComparison = result
        ? buildComparisonSummary(result, analyzedDescription || description, data, payload)
        : null;

      startTransition(() => {
        setResult(data);
        setAnalyzedDescription(payload);
        setComparisonChanges(nextComparison);
        setResultRevision((current) => current + 1);
      });
    } catch (requestError) {
      if (requestError?.name !== "AbortError" && analysisAbortRef.current === controller) {
        setError(requestError?.message || "Analysis failed.");
      }
    } finally {
      if (analysisAbortRef.current === controller) {
        analysisAbortRef.current = null;
      }
      if (requestSequenceRef.current === requestId) {
        setBusy(false);
      }
    }
  }, [analyzedDescription, cancelActiveAnalysis, description, resetCopied, result]);

  const handleRestorePrevious = useCallback(() => {
    if (!previousSnapshot) return;
    cancelActiveAnalysis();
    resetCopied();
    setBusy(false);
    setError("");
    setDismissDirty(false);
    setComparisonChanges(null);
    setDescription(previousSnapshot.description || "");
    setAnalyzedDescription(previousSnapshot.description || "");
    setResult(previousSnapshot.result);
    setPreviousSnapshot(null);
    setResultRevision((current) => current + 1);
  }, [cancelActiveAnalysis, previousSnapshot, resetCopied]);

  const handleReset = useCallback(() => {
    cancelActiveAnalysis();
    resetCopied();
    setBusy(false);
    setResult(null);
    setAnalyzedDescription("");
    setDescription("");
    setError("");
    setDismissDirty(false);
    setComparisonChanges(null);
    setPreviousSnapshot(null);
    setResultRevision((current) => current + 1);
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cancelActiveAnalysis, resetCopied, setSearchParams]);

  return (
    <>
      <PageMeta
        title="Analyze"
        description="Analyzer-first EU regulatory scoping for compliance teams working through incomplete product detail."
        canonicalPath="/analyze"
      />

      <AppShell
        actions={
          <HeaderActions
            result={result}
            totalStandards={viewModel.totalStandards}
            onReset={handleReset}
            onRestorePrevious={handleRestorePrevious}
            previousSnapshot={previousSnapshot}
            onCopy={handleCopy}
            copied={analysisCopied}
          />
        }
        mainClassName={layoutStyles.main}
      >
        <div className={layoutStyles.zone}>
          <div className={layoutStyles.zoneHeader}>
            <span className={layoutStyles.zoneEyebrow}>Analyzer-first workflow</span>
            <h1 className={layoutStyles.zoneTitle}>Trustworthy compliance scoping, before formal review.</h1>
            <p className={layoutStyles.zoneText}>
              RuleGrid is tuned for decision clarity: tighten the description, review the trust layer, and see what missing inputs could still move the route.
            </p>
          </div>
        </div>

        <div className={cx(layoutStyles.zone, !result ? layoutStyles.landingStack : "")}>
          <ComposerSurface
            description={description}
            onDescriptionChange={(nextValue) => {
              setDescription(nextValue);
              if (dismissDirty) setDismissDirty(false);
            }}
            onAnalyze={runAnalysis}
            onReset={handleReset}
            onRestorePrevious={handleRestorePrevious}
            onCopy={handleCopy}
            copied={analysisCopied}
            previousSnapshot={previousSnapshot}
            busy={busy}
            dirty={dirty}
            onDismissDirty={() => setDismissDirty(true)}
            suggestionGroups={suggestionGroups}
            templates={templates}
            hasResult={Boolean(result)}
          />

          <AnalyzeStatus busy={busy} />
          <ErrorBanner message={error} />

          {!result && !busy ? <EmptyStateGuidance templates={templates} onPickExample={setDescription} /> : null}
        </div>

        <div ref={resultsRef} />

        {result ? (
          <div className={layoutStyles.resultsGrid}>
            <div className={layoutStyles.resultsMain}>
              <OverviewPanel result={result} viewModel={viewModel} />
              <TrustLayerPanel viewModel={viewModel} />
              <MissingInputsPanel description={analyzedDescription || description} result={result} viewModel={viewModel} />
              <ComparisonPanel changes={comparisonChanges} />
              <StandardsRoutePanel key={`standards-${resultRevision}`} viewModel={viewModel} />
              <ParallelObligationsPanel key={`parallel-${resultRevision}`} viewModel={viewModel} />
              <EvidencePanel viewModel={viewModel} />
            </div>

            <div className={layoutStyles.resultsAside}>
              <SupportingContextPanel
                result={result}
                viewModel={viewModel}
                description={analyzedDescription || description}
                copied={analysisCopied}
                onCopy={handleCopy}
                isNarrow={isNarrow}
              />
            </div>
          </div>
        ) : null}
      </AppShell>

      <ScrollTopButton visible={scrolled} />
    </>
  );
}
