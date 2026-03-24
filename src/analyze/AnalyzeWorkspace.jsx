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
      eyebrow={hasResult ? "Refine" : "Analyze"}
      title={hasResult ? "Refine the current scope" : "Describe the product"}
      text={
        hasResult
          ? "Keep the current result visible while you tighten the description, then re-run."
          : "Include product function, power source, radios, battery, accessories, and intended environment."
      }
      bodyClassName={styles.composerBody}
    >
      <textarea
        id="analyze-description"
        className={styles.textarea}
        rows={hasResult ? 6 : 8}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        aria-label="Describe your product"
        placeholder="Example: Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path."
      />

      {/* Template chips: visible when textarea is short, each chip hides when its product type is mentioned */}
      {!hasResult && description.trim().length < 32 ? (
        <div className={styles.templateRow}>
          {templates.slice(0, 10).filter((template) => {
            // Hide a chip if its core keyword is already in the description
            const d = description.toLowerCase();
            const keyword = template.label.toLowerCase().replace(/smart\s+/, "");
            const firstWord = keyword.split(/\s+/)[0];
            return !d.includes(firstWord) || firstWord.length < 4;
          }).map((template) => (
            <button
              key={template.label}
              type="button"
              className={styles.templateChip}
              onClick={() => onDescriptionChange(template.text)}
            >
              {template.label}
            </button>
          ))}
        </div>
      ) : null}

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
            Previous
          </button>
        ) : null}
        <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary, styles.desktopOnlyAction)} onClick={onCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <DirtyNotice dirty={dirty} busy={busy} onReanalyze={onAnalyze} onDismiss={onDismissDirty} />

      {/* Contextual suggestion chips — shown when there's a description to refine */}
      {suggestionGroups.length > 0 ? (
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
        </div>
      ) : null}
    </Surface>
  );
}

function EmptyStateGuidance() {
  return (
    <div className={styles.guidanceGrid}>
      <div className={styles.guidanceCard}>
        <div className={styles.guidanceCardTitle}>
          <Search size={14} />
          <span className={styles.sectionLabel}>What helps most</span>
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
          <Waypoints size={14} />
          <span className={styles.sectionLabel}>The analyzer returns</span>
        </div>
        <div className={styles.chipList}>
          {["Directive families", "Standards route", "Parallel obligations", "Clarification prompts"].map((item) => (
            <span key={item} className={styles.listChip}>{item}</span>
          ))}
        </div>
      </div>
    </div>
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
      eyebrow="Product identification"
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

      <div className={styles.signalCard}>
        <span className={styles.signalLabel}>Primary route</span>
        <div className={styles.signalRow}>
          <TonePill tone="strong">{titleCaseMinor(viewModel.decisionSignals.primaryRouteLabel || "Route not locked")}</TonePill>
          {viewModel.triggeredDirectives.slice(0, 5).map((directiveKey) => (
            <DirectivePill key={directiveKey} directiveKey={directiveKey} />
          ))}
        </div>
      </div>
    </Surface>
  );
}

function TrustLayerPanel({ viewModel }) {
  return (
    <details className={styles.trustBar}>
      <summary className={styles.trustBarSummary}>
        <span className={styles.trustBarLabel}>Confidence</span>
        <div className={styles.trustBarPills}>
          <TonePill tone={viewModel.resultMaturity.tone} strong>{viewModel.resultMaturity.label}</TonePill>
          <TonePill tone={viewModel.classificationConfidence.tone}>{viewModel.classificationConfidence.label}</TonePill>
          <span className={styles.trustBarMeta}>
            {viewModel.decisionSignals.blockerCount} blocker{viewModel.decisionSignals.blockerCount === 1 ? "" : "s"} · {viewModel.decisionSignals.directiveCount} {viewModel.decisionSignals.directiveCount === 1 ? "family" : "families"} · {viewModel.decisionSignals.clarificationCount} clarification{viewModel.decisionSignals.clarificationCount === 1 ? "" : "s"}
          </span>
        </div>
        <ChevronDown size={13} className={styles.trustBarChevron} />
      </summary>
      <div className={styles.trustBarBody}>
        <span className={styles.sectionLabel} style={{ width: "100%", marginBottom: 2 }}>Assumptions</span>
        {viewModel.assumptions.length ? (
          viewModel.assumptions.map((assumption) => (
            <span key={assumption} className={styles.listChip}>{titleCaseMinor(assumption)}</span>
          ))
        ) : (
          <span className={styles.emptyCopy}>No explicit assumptions surfaced.</span>
        )}
      </div>
    </details>
  );
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

function MissingInputsPanel({ description, result, viewModel, onApplyMissingInput }) {
  const knownFacts = extractKnownFacts(description, result);
  const blocking = viewModel.missingInputs.filter((item) => item.severity === "blocker");
  const important = viewModel.missingInputs.filter((item) => item.severity !== "blocker");
  const allMissing = [...blocking, ...important];

  return (
    <Surface
      eyebrow="Missing inputs"
      title="What could change this result"
      bodyClassName={styles.composerBody}
    >
      {/* Known facts + assumptions as a single chip strip */}
      {(knownFacts.length > 0 || viewModel.assumptions.length > 0) ? (
        <div className={styles.missingHeader}>
          <span className={styles.sectionLabel} style={{ flexShrink: 0 }}>Known</span>
          {knownFacts.map((fact) => (
            <span key={fact} className={styles.listChip}>{fact}</span>
          ))}
          {viewModel.assumptions.length > 0 && knownFacts.length > 0 ? (
            <span style={{ color: "var(--text-soft)", fontSize: "0.8rem", padding: "0 4px" }}>·</span>
          ) : null}
          {viewModel.assumptions.length > 0 ? (
            <>
              <span className={styles.sectionLabel} style={{ flexShrink: 0 }}>Assumed</span>
              {viewModel.assumptions.map((a) => (
                <span key={a} className={styles.listChip}>{titleCaseMinor(a)}</span>
              ))}
            </>
          ) : null}
        </div>
      ) : null}

      {/* Flat list of all missing items */}
      {allMissing.length > 0 ? (
        <div className={styles.missingList}>
          {allMissing.map((item) => (
            <div key={item.key} className={styles.missingItem}>
              <div className={styles.missingTitleRow}>
                <span className={styles.missingTitle}>{item.title}</span>
                <TonePill tone={item.severity === "blocker" ? "warning" : item.severity === "route-affecting" ? "warning" : "muted"}>
                  {item.severity === "blocker" ? "Blocker" : item.severity === "route-affecting" ? "Route-affecting" : "Helpful"}
                </TonePill>
              </div>
              <p className={styles.missingReason}>{item.reason}</p>
              <MissingInputExamples item={item} onApplyMissingInput={onApplyMissingInput} />
            </div>
          ))}
        </div>
      ) : (
        <span className={styles.emptyCopy}>No missing inputs surfaced in the current result.</span>
      )}
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

function abbrevBucket(bucket) {
  if (!bucket) return null;
  if (bucket.startsWith("Core")) return "Core";
  if (bucket.startsWith("Conditional")) return "Conditional";
  return "Peripheral";
}

function StandardCard({ item, sectionKey }) {
  const hasVersionInfo = item.version || item.dated_version || item.harmonized_reference;
  return (
    <article className={styles.standardCard}>
      {/* Row 1: code badge + directive pill + applicability */}
      <div className={styles.standardCardTop}>
        <span className={styles.standardCode}>{item.code || "Standard"}</span>
        <DirectivePill directiveKey={sectionKey} />
        {item.applicabilityBucket
          ? <TonePill tone="muted">{abbrevBucket(item.applicabilityBucket)}</TonePill>
          : null}
      </div>

      {/* Row 2: title + rationale */}
      <div className={styles.standardCardBody}>
        <h4 className={styles.standardTitle}>{titleCaseMinor(item.title || "Untitled standard")}</h4>
        {item.shortRationale
          ? <p className={styles.microRationale}>{item.shortRationale}</p>
          : null}
      </div>

      {/* Row 3: version data with renamed labels */}
      {hasVersionInfo ? (
        <div className={styles.standardVersionRow}>
          {item.version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>EU latest standard</span>
              <span className={styles.versionValue}>{item.version}</span>
            </div>
          ) : null}
          {item.dated_version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Harmonized standard</span>
              <span className={styles.versionValue}>{item.dated_version}</span>
            </div>
          ) : null}
          {item.harmonized_reference ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>OJ reference</span>
              <span className={styles.versionValue}>{item.harmonized_reference}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RouteQuickNav({ sections }) {
  const orderedSections = (sections || []).filter(Boolean);

  if (!orderedSections.length) return null;

  const scrollToSection = (keyOrTitle) => {
    const target = document.getElementById(`route-section-${slugify(keyOrTitle)}`);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 108;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className={styles.routeNav}>
      {orderedSections.map((section) => (
        <button
          key={`jump-${section.key || section.title}`}
          type="button"
          className={styles.routeNavChip}
          onClick={() => scrollToSection(section.key || section.title)}
        >
          <span>{directiveShort(section.key || "OTHER")}</span>
          <span className={styles.routeNavCount}>{(section.items || []).length}</span>
        </button>
      ))}
    </div>
  );
}

function RouteSectionCard({ section, open, onToggle }) {
  const sectionId = `route-section-${slugify(section.key || section.title)}`;
  const applicabilityTone =
    section.sectionKind === "core" ? "strong" : section.sectionKind === "conditional" ? "warning" : "muted";

  return (
    <section className={styles.accordionCard} id={sectionId}>
      <button
        type="button"
        className={styles.accordionToggle}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${sectionId}-body`}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.accordionTitleRow}>
            <h3 className={styles.accordionTitle}>{routeTitle(section)}</h3>
            {section.shortRationale ? <p className={styles.microRationale}>{section.shortRationale}</p> : null}
            <p className={styles.accordionText}>
              {(section.items || []).length} standard{(section.items || []).length === 1 ? "" : "s"}
            </p>
          </div>
          {/* Pills always below the text — never beside it */}
          <div className={styles.accordionTitleMeta}>
            <DirectivePill directiveKey={section.key || "OTHER"} />
            <TonePill tone={applicabilityTone}>{section.items?.[0]?.applicabilityBucket || "Route review"}</TonePill>
          </div>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
      eyebrow="Standards route"
      title="Standards route"
      bodyClassName={styles.sectionStack}
    >
      <RouteQuickNav sections={viewModel.routeSections} />

      {viewModel.routeSections.length ? (
        groups.map((group) =>
          group.sections.length ? (
            <div key={group.key} className={styles.groupBlock}>
              <div className={styles.groupHeadingLabel}>{group.title}</div>
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
  const hasBody = item.code || item.scope || item.shortRationale || item.summary || item.rationale;

  return (
    <section className={styles.legislationCard}>
      <div
        className={styles.legislationCardHeader}
        role={hasBody ? "button" : undefined}
        onClick={hasBody ? onToggle : undefined}
        style={hasBody ? { cursor: "pointer" } : undefined}
        aria-expanded={hasBody ? open : undefined}
      >
        {/* Pills row */}
        <div className={styles.legislationPillRow}>
          <DirectivePill directiveKey={item.directive_key || "OTHER"} />
          {item.applicabilityBucket
            ? <TonePill tone={item.applicabilityBucket?.startsWith("Core") ? "strong" : "muted"}>
                {abbrevBucket(item.applicabilityBucket)}
              </TonePill>
            : null}
        </div>
        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <h3 className={styles.legislationTitle}>{titleCaseMinor(item.title || "Untitled legislation")}</h3>
          {hasBody ? (open ? <ChevronUp size={14} style={{ color: "var(--text-soft)", flexShrink: 0, marginTop: 3 }} /> : <ChevronDown size={14} style={{ color: "var(--text-soft)", flexShrink: 0, marginTop: 3 }} />) : null}
        </div>
        {/* Rationale preview (always visible) */}
        {item.shortRationale && !open ? (
          <p className={styles.microRationale}>{item.shortRationale}</p>
        ) : null}
      </div>

      {open && hasBody ? (
        <div id={`${itemId}-body`} className={styles.legislationBody}>
          {item.code ? (
            <div className={styles.legislationField}>
              <span className={styles.legislationFieldLabel}>Reference</span>
              <span className={styles.legislationCodeValue}>{item.code}</span>
            </div>
          ) : null}
          {(item.shortRationale || item.rationale) ? (
            <div className={styles.legislationField}>
              <span className={styles.legislationFieldLabel}>Why it applies</span>
              <span className={styles.legislationFieldValue}>{item.shortRationale || item.rationale}</span>
            </div>
          ) : null}
          {(item.scope || item.summary) ? (
            <div className={styles.legislationField}>
              <span className={styles.legislationFieldLabel}>Scope</span>
              <span className={styles.legislationFieldValue}>{item.scope || item.summary}</span>
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
      eyebrow="Parallel obligations"
      title="Parallel obligations"
      bodyClassName={styles.sectionStack}
    >
      {groups.some((group) => group.items.length) ? (
        groups.map((group) =>
          group.items.length ? (
            <div key={group.key} className={styles.groupBlock}>
              <div className={styles.groupHeadingLabel}>{group.title}</div>
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
      eyebrow="Evidence gaps"
      title="Evidence and common gaps"
      text="A practical pre-lab checklist for the major routes currently in view."
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
          <span className={styles.contextEyebrow}>Analysis context</span>
          <h2 className={styles.contextTitle}>Supporting context</h2>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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

          {!result && !busy ? <EmptyStateGuidance /> : null}
        </div>

        <div ref={resultsRef} />

        {result ? (
          <div className={layoutStyles.resultsGrid}>
            <div className={layoutStyles.resultsMain}>
              <OverviewPanel result={result} viewModel={viewModel} />
              <TrustLayerPanel viewModel={viewModel} />
              <MissingInputsPanel
                description={analyzedDescription || description}
                result={result}
                viewModel={viewModel}
                onApplyMissingInput={(text) => {
                  setDescription((current) => joinText(current, text));
                  setDismissDirty(false);
                }}
              />
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
