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

const ROUTE_SECTION_CLASS = {
  core: styles.routeCardCore,
  conditional: styles.routeCardConditional,
  secondary: styles.routeCardSecondary,
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

const SCOPE_GAPS = [
  {
    id: "power",
    detect: (d) => !/mains|230v|240v|ac\s*power|rechargeable|lithium|battery|usb.?c?\s*power|external.*adapter|powered via/.test(d),
    chips: [
      { label: "Mains powered", text: "mains powered (230 V AC)" },
      { label: "Battery powered", text: "rechargeable lithium battery" },
      { label: "External adapter", text: "powered via external AC/DC adapter" },
    ],
    priority: 1,
  },
  {
    id: "connectivity",
    detect: (d) => !/wifi|wi.?fi|bluetooth|ble\b|nfc\b|cellular|lte\b|5g\b|zigbee|z.?wave|no.?radio|no.?wireless|no wireless/.test(d),
    chips: [
      { label: "Wi-Fi", text: "Wi-Fi" },
      { label: "Bluetooth LE", text: "Bluetooth LE" },
      { label: "No wireless", text: "no wireless connectivity" },
    ],
    priority: 2,
  },
  {
    id: "user",
    detect: (d) => !/consumer|household|professional|industrial|commercial/.test(d),
    chips: [
      { label: "Consumer use", text: "consumer use" },
      { label: "Professional use", text: "professional use" },
    ],
    priority: 3,
  },
  {
    id: "environment",
    detect: (d) => !/indoor|outdoor|installation|ip\d|weather/.test(d),
    chips: [
      { label: "Indoor only", text: "indoor use only" },
      { label: "Outdoor rated", text: "outdoor rated" },
    ],
    priority: 4,
  },
  {
    id: "cloud",
    detect: (d) =>
      /wifi|wi.?fi|bluetooth|wireless|connected/.test(d) &&
      !/cloud|account.?required|local.?only|local.?lan|no.?cloud/.test(d),
    chips: [
      { label: "Cloud account required", text: "cloud account required" },
      { label: "Local control only", text: "local control only, no cloud" },
    ],
    priority: 5,
  },
  {
    id: "battery-type",
    detect: (d) => /battery|rechargeable/.test(d) && !/lithium|li.?ion|alkaline|nimh/.test(d),
    chips: [
      { label: "Lithium-ion", text: "lithium-ion" },
      { label: "Primary cells", text: "primary (non-rechargeable) cells" },
    ],
    priority: 6,
  },
];

function buildSuggestions(description, backendChips, guidanceItems) {
  const lowered = String(description || "").toLowerCase();
  const seen = new Set();
  const results = [];

  function add(label, text, priority) {
    const key = (text || "").toLowerCase().trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    results.push({ label, text, priority });
  }

  // Fixed scope gaps — client-side, highest priority
  SCOPE_GAPS.forEach((gap) => {
    if (gap.detect(lowered)) {
      gap.chips.forEach((chip) => add(chip.label, chip.text, gap.priority));
    }
  });

  // Backend guidance choices — filter already-mentioned words
  (guidanceItems || []).slice(0, 3).forEach((item, i) => {
    (item.choices || []).slice(0, 3).forEach((choice) => {
      const choiceLowered = choice.toLowerCase();
      const keyWord = choiceLowered.split(/\s+/).find((w) => w.length > 4);
      if (keyWord && lowered.includes(keyWord)) return;
      add(choice, choice, 10 + i);
    });
  });

  // Backend suggested chips — deduplicated, skip vague meta-prompts and already-mentioned
  (backendChips || []).forEach((chip, i) => {
    const chipText = (chip.text || "").toLowerCase();
    if (/architecture|boundary|function boundary|connectivity architecture/.test(chipText)) return;
    const keyWord = chipText.split(/\s+/).find((w) => w.length > 4);
    if (keyWord && lowered.includes(keyWord)) return;
    add(chip.label, chip.text, 20 + i);
  });

  return results.sort((a, b) => a.priority - b.priority).slice(0, 7);
}

function useSuggestions(description, backendChips, guidanceItems) {
  const deferredDescription = useDeferredValue(description);
  return useMemo(
    () => buildSuggestions(deferredDescription, backendChips, guidanceItems),
    [backendChips, deferredDescription, guidanceItems]
  );
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

function CompactList({
  items,
  className = styles.compactList,
  itemClassName = styles.compactListItem,
  markerClassName = styles.compactMarker,
  renderItem = (item) => item,
}) {
  if (!items?.length) return null;

  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={`${String(item)}-${index}`} className={itemClassName}>
          <span className={markerClassName} />
          <span>{renderItem(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function DetailList({ items }) {
  return (
    <CompactList
      items={items}
      className={styles.detailList}
      itemClassName={styles.detailListItem}
      markerClassName={styles.detailBullet}
    />
  );
}

function ComposerStatus({ active, viewModel, dirty }) {
  if (!active) return null;
  const openItems = viewModel.decisionSignals.blockerCount + viewModel.decisionSignals.routeAffectingCount;
  const parts = [
    formatUiLabel(viewModel.productIdentity.type || "Product"),
    viewModel.classificationConfidence.label,
    `${viewModel.totalStandards} standard${viewModel.totalStandards === 1 ? "" : "s"}`,
    openItems ? `${openItems} open item${openItems === 1 ? "" : "s"}` : "route stable",
  ];
  return (
    <p className={styles.composerStatus}>
      {dirty ? <span className={styles.composerDirtyDot} /> : null}
      {parts.join(" · ")}
    </p>
  );
}

function HeaderActions({ result, totalStandards, onReset, onCopy, copied }) {
  if (!result) {
    return <span className={styles.headerHint}>Describe the product to get a scoped route.</span>;
  }

  return (
    <div className={styles.headerActions}>
      <TonePill tone="strong">{formatUiLabel(result?.overall_risk || "medium")} risk</TonePill>
      <span className={styles.headerMetric}>{totalStandards} standards</span>
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

const ANALYSIS_STEPS = [
  "Reading product description",
  "Identifying directive families",
  "Mapping standards route",
  "Checking parallel obligations",
  "Finalizing compliance scope",
];

function AnalyzeStatus({ busy }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!busy) {
      setActiveStep(0);
      return;
    }
    setActiveStep(0);
    const delays = [700, 1500, 2400, 3400];
    const timers = delays.map((delay, i) =>
      setTimeout(() => setActiveStep(i + 1), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [busy]);

  if (!busy) return null;

  const progress = Math.round((activeStep / (ANALYSIS_STEPS.length - 1)) * 85);

  return (
    <div className={styles.analyzeCard} role="status" aria-live="polite">
      <div className={styles.analyzeCardHeader}>
        <LoaderCircle size={14} className={styles.spin} />
        <span className={styles.analyzeCardTitle}>Analyzing product</span>
        <span className={styles.analyzeCardProgress}>{progress}%</span>
      </div>
      <div className={styles.analyzeSteps}>
        {ANALYSIS_STEPS.map((step, i) => (
          <div
            key={step}
            className={cx(
              styles.analyzeStep,
              i < activeStep ? styles.analyzeStepDone : "",
              i === activeStep ? styles.analyzeStepActive : "",
              i > activeStep ? styles.analyzeStepPending : ""
            )}
          >
            <span className={styles.analyzeStepDot}>
              {i < activeStep ? <Check size={9} /> : i === activeStep ? <LoaderCircle size={9} className={styles.spin} /> : null}
            </span>
            <span className={styles.analyzeStepLabel}>{step}</span>
          </div>
        ))}
      </div>
      <div className={styles.analyzeProgressTrack}>
        <div className={styles.analyzeProgressFill} style={{ width: `${progress}%` }} />
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
  previousSnapshot,
  busy,
  dirty,
  suggestions,
  templates,
  viewModel,
  hasResult,
}) {
  const analyzeLabel = hasResult ? "Re-run analysis" : "Analyze product";

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
        className={cx(styles.textarea, hasResult ? styles.textareaCompact : "")}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        aria-label="Describe your product"
        placeholder="Example: Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path."
      />

      <ComposerStatus active={hasResult} viewModel={viewModel} dirty={dirty} />

      {/* Template chips: visible before first analysis, hide when keyword already present */}
      {!hasResult ? (
        <div className={styles.templateRow}>
          {templates.slice(0, 10).filter((template) => {
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
      </div>

      {/* Flat scope-defining chips */}
      {suggestions.length > 0 ? (
        <div className={styles.suggestionArea}>
          <span className={styles.suggestionAreaLabel}>Also specify</span>
          <div className={styles.suggestionRow}>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.text}
                type="button"
                className={styles.suggestionChip}
                onClick={() => onDescriptionChange(joinText(description, suggestion.text))}
              >
                + {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </Surface>
  );
}

function EmptyStateGuidance() {
  const sections = [
    {
      key: "helps",
      icon: Search,
      label: "What helps most",
      items: EXAMPLE_DETAILS.map((item) => titleCaseMinor(item)),
    },
    {
      key: "returns",
      icon: Waypoints,
      label: "The analyzer returns",
      items: ["Directive families", "Standards route", "Parallel obligations", "Clarification prompts"],
    },
  ];

  return (
    <div className={styles.guidanceGrid}>
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.key} className={styles.guidanceCard}>
            <div className={styles.guidanceCardTitle}>
              <Icon size={14} />
              <span className={styles.sectionLabel}>{section.label}</span>
            </div>
            <CompactList
              items={section.items}
              className={styles.guidanceList}
              itemClassName={styles.guidanceItem}
              markerClassName={styles.guidanceMarker}
            />
          </div>
        );
      })}
    </div>
  );
}

function OverviewPanel({ result, viewModel }) {
  const openIssueCount = viewModel.decisionSignals.blockerCount + viewModel.decisionSignals.routeAffectingCount;
  const metrics = [
    { label: "Match stage", value: formatStageLabel(viewModel.productIdentity.stage || "unknown") },
    { label: "Scope", value: viewModel.resultMaturity.label },
    { label: "Risk", value: formatUiLabel(result?.overall_risk || "medium") },
    { label: "Standards", value: String(viewModel.totalStandards) },
    { label: "Open issues", value: String(openIssueCount) },
  ];

  return (
    <Surface eyebrow="Product identification" bodyClassName={styles.overviewBody}>
      <div className={styles.identityCard}>
        <div className={styles.identityCardTop}>
          <span className={styles.identityLabel}>Matched product type</span>
          <TonePill tone={viewModel.classificationConfidence.tone}>
            {viewModel.classificationConfidence.label} confidence
          </TonePill>
        </div>
        <h2 className={styles.identityType}>
          {formatUiLabel(viewModel.productIdentity.type || "Product route")}
        </h2>
        {result?.summary ? (
          <p className={styles.identitySummary}>{result.summary}</p>
        ) : null}
      </div>

      <div className={styles.metricGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <span className={styles.metricLabel}>{metric.label}</span>
            <strong className={styles.metricValue}>{metric.value}</strong>
          </div>
        ))}
      </div>

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
  const trustSummary = [
    `${viewModel.decisionSignals.blockerCount} blocker${viewModel.decisionSignals.blockerCount === 1 ? "" : "s"}`,
    `${viewModel.decisionSignals.directiveCount} ${viewModel.decisionSignals.directiveCount === 1 ? "family" : "families"}`,
    `${viewModel.decisionSignals.clarificationCount} clarification${viewModel.decisionSignals.clarificationCount === 1 ? "" : "s"}`,
  ].join(" / ");

  return (
    <details className={styles.trustBar}>
      <summary className={styles.trustBarSummary}>
        <span className={styles.trustBarLabel}>Confidence</span>
        <div className={styles.trustBarPills}>
          <TonePill tone={viewModel.resultMaturity.tone} strong>{viewModel.resultMaturity.label}</TonePill>
          <TonePill tone={viewModel.classificationConfidence.tone}>{viewModel.classificationConfidence.label}</TonePill>
          <span className={styles.trustBarMeta}>{trustSummary}</span>
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

function ClarificationStrip({
  description,
  result,
  viewModel,
  dirty,
  busy,
  onReanalyze,
  onApplyMissingInput,
}) {
  const blocking = viewModel.missingInputs.filter((item) => item.severity === "blocker");
  const routeAffecting = viewModel.missingInputs.filter((item) => item.severity === "route-affecting");
  const [open, setOpen] = useState(false);
  const knownFacts = extractKnownFacts(description, result);
  const helpful = viewModel.missingInputs.filter((item) => item.severity === "helpful");
  const allMissing = [...blocking, ...routeAffecting, ...helpful];
  const previewItems = allMissing.slice(0, 3);

  if (!allMissing.length && !dirty) return null;

  let headline = allMissing.length ? "Clarifications are available" : "Description updated";
  if (blocking.length || routeAffecting.length) {
    headline = `${blocking.length} blocker${blocking.length === 1 ? "" : "s"} and ${routeAffecting.length} route-affecting item${
      routeAffecting.length === 1 ? "" : "s"
    } are open`;
  } else if (allMissing.length) {
    headline = `${allMissing.length} optional clarification${allMissing.length === 1 ? "" : "s"} can tighten this route`;
  }

  const summaryText = dirty
    ? "Description changed. Re-run when you want the route refreshed."
    : blocking.length
      ? "These inputs can move the route materially."
      : routeAffecting.length
        ? "These inputs can still shift scope or evidence needs."
        : "Everything left is optional detail.";

  return (
    <section className={cx(styles.clarificationStrip, open ? styles.clarificationStripOpen : "")}>
      <div className={styles.clarificationSummary}>
        <button
          type="button"
          className={styles.clarificationToggle}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="analysis-clarification-body"
        >
          <div className={styles.clarificationHeading}>
            <span className={styles.clarificationEyebrow}>Clarifications</span>
            <strong className={styles.clarificationTitle}>{headline}</strong>
            <span className={styles.clarificationText}>{summaryText}</span>
          </div>

          <div className={styles.clarificationSummaryRight}>
            <div className={styles.clarificationPreview}>
              {blocking.length ? (
                <TonePill tone="warning">{blocking.length} blocker{blocking.length === 1 ? "" : "s"}</TonePill>
              ) : null}
              {routeAffecting.length ? (
                <TonePill tone="strong">
                  {routeAffecting.length} route-affecting
                </TonePill>
              ) : null}
              {!blocking.length && !routeAffecting.length && allMissing.length ? (
                <TonePill tone="muted">Optional only</TonePill>
              ) : null}
              {previewItems.map((item) => (
                <span key={item.key} className={styles.clarificationPreviewChip}>
                  {item.title}
                </span>
              ))}
              {allMissing.length > previewItems.length ? (
                <span className={styles.clarificationOverflow}>+{allMissing.length - previewItems.length}</span>
              ) : null}
            </div>

            {open ? (
              <ChevronUp size={15} className={styles.clarificationChevron} />
            ) : (
              <ChevronDown size={15} className={styles.clarificationChevron} />
            )}
          </div>
        </button>

        {dirty ? (
          <button
            type="button"
            className={cx(styles.actionButton, styles.actionButtonPrimary, styles.clarificationRunButton)}
            onClick={onReanalyze}
          >
            {busy ? <LoaderCircle size={14} className={styles.spin} /> : <RefreshCcw size={14} />}
            {busy ? "Starting new run" : "Re-run"}
          </button>
        ) : null}
      </div>

      {open ? (
        <div id="analysis-clarification-body" className={styles.clarificationBody}>
          {knownFacts.length ? (
            <div className={styles.clarificationMetaRow}>
              <span className={styles.sectionLabel}>Known</span>
              <div className={styles.chipList}>
                {knownFacts.map((fact) => (
                  <span key={fact} className={styles.listChip}>
                    {fact}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {viewModel.assumptions.length ? (
            <div className={styles.clarificationMetaRow}>
              <span className={styles.sectionLabel}>Assumed</span>
              <div className={styles.chipList}>
                {viewModel.assumptions.map((assumption) => (
                  <span key={assumption} className={styles.listChip}>
                    {titleCaseMinor(assumption)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {allMissing.length ? (
            <div className={styles.clarificationList}>
              {allMissing.map((item) => (
                <div key={item.key} className={styles.clarificationItem}>
                  <div className={styles.clarificationItemHeader}>
                    <span className={styles.clarificationItemTitle}>{item.title}</span>
                    <TonePill tone={missingSeverityTone(item.severity)}>
                      {missingSeverityLabel(item.severity)}
                    </TonePill>
                  </div>
                  <p className={styles.clarificationItemText}>{item.reason}</p>
                  <MissingInputExamples item={item} onApplyMissingInput={onApplyMissingInput} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ComparisonPanel({ changes }) {
  if (!changes?.length) return null;

  return (
    <Surface
      eyebrow="Session compare"
      title="Compared with previous analysis"
      text="Session-local changes only. No results are persisted."
      bodyClassName={styles.compareList}
    >
      {changes.map((change) => (
        <div key={change} className={styles.compareItem}>
          <span className={styles.compareMarker} />
          <span>{change}</span>
        </div>
      ))}
    </Surface>
  );
}


function StandardCard({ item, sectionKey }) {
  const hasVersionInfo = item.version || item.dated_version || item.harmonized_reference;
  return (
    <article className={styles.standardCard}>
      {/* Row 1: code badge + directive pill + applicability */}
      <div className={styles.standardCardTop}>
        <span className={styles.standardCode}>{item.code || "Standard"}</span>
        <DirectivePill directiveKey={sectionKey} />
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
          {item.dated_version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Harmonized standard</span>
              <span className={styles.versionValue}>{item.dated_version}</span>
            </div>
          ) : null}
          {item.version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>EU latest standard</span>
              <span className={styles.versionValue}>{item.version}</span>
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

function RouteQuickNav({ sections, openKeys }) {
  const orderedSections = (sections || []).filter(Boolean);

  if (!orderedSections.length) return null;

  const scrollToSection = (keyOrTitle) => {
    const target = document.getElementById(`route-section-${slugify(keyOrTitle)}`);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 108;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className={styles.routeNavWrap}>
      <span className={styles.sectionLabel}>Jump to section</span>
      <div className={styles.routeNav}>
      {orderedSections.map((section) => (
        <button
          key={`jump-${section.key || section.title}`}
          type="button"
          className={cx(
            styles.routeNavChip,
            ROUTE_SECTION_CLASS[section.sectionKind],
            openKeys?.has(section.key || section.title) ? styles.routeNavChipActive : ""
          )}
          onClick={() => scrollToSection(section.key || section.title)}
          aria-label={`Jump to ${routeTitle(section)}`}
          aria-pressed={openKeys?.has(section.key || section.title) || false}
        >
          <span className={styles.routeNavLabel}>{directiveShort(section.key || "OTHER")}</span>
          <span className={styles.routeNavMeta}>
            {(section.items || []).length} standard{(section.items || []).length === 1 ? "" : "s"}
          </span>
        </button>
      ))}
      </div>
    </div>
  );
}

function RouteSectionCard({ section, open, onToggle }) {
  const sectionId = `route-section-${slugify(section.key || section.title)}`;
  const applicabilityTone =
    section.sectionKind === "core" ? "strong" : section.sectionKind === "conditional" ? "warning" : "muted";

  return (
    <section className={cx(styles.accordionCard, ROUTE_SECTION_CLASS[section.sectionKind])} id={sectionId}>
      <button
        type="button"
        className={styles.accordionToggle}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${sectionId}-body`}
      >
        <div className={styles.accordionCopy}>
          <div className={styles.accordionTitleRow}>
            <h3 className={styles.accordionTitle}>{routeTitle(section)}</h3>
            {section.shortRationale ? <p className={styles.microRationale}>{section.shortRationale}</p> : null}
            <p className={styles.accordionText}>
              {(section.items || []).length} standard{(section.items || []).length === 1 ? "" : "s"} in this route
            </p>
          </div>
          {/* Pills always below the text — never beside it */}
          <div className={styles.accordionTitleMeta}>
            <DirectivePill directiveKey={section.key || "OTHER"} />
            <TonePill tone={applicabilityTone}>{section.applicabilityBucket || "Route review"}</TonePill>
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
  const [openKeys, setOpenKeys] = useState(() => {
    const coreKeys = viewModel.routeSections
      .filter((s) => s.sectionKind === "core")
      .map((s) => s.key);
    if (coreKeys.length) return new Set(coreKeys);
    const first = viewModel.routeSections[0]?.key;
    return first ? new Set([first]) : new Set();
  });

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
      eyebrow="Compliance route"
      title="Standards"
      text="Ordered by directive family: LVD and EMC first, then RED and RED Cyber, followed by further applicable routes."
      bodyClassName={styles.sectionStack}
    >
      <RouteQuickNav sections={viewModel.routeSections} openKeys={openKeys} />

      {viewModel.routeSections.length ? (
        <div className={styles.sectionStack}>
          {viewModel.routeSections.map((section) => (
            <RouteSectionCard
              key={section.key || section.title}
              section={section}
              open={openKeys.has(section.key)}
              onToggle={() => toggleSection(section.key)}
            />
          ))}
        </div>
      ) : (
        <p className={styles.emptyCopy}>
          No standards route was returned. The overview and trust layer still reflect the current scope assumptions.
        </p>
      )}
    </Surface>
  );
}

function ParallelObligationCard({ item }) {
  const [open, setOpen] = useState(false);
  const cardId = `parallel-card-${slugify(item.directive_key || item.code || item.title || "item")}`;

  const previewText = item.shortRationale || item.summary || item.scope || item.rationale || "";
  const normalizedPreview = String(previewText || "").trim();

  const detailItems = [
    item.rationale && String(item.rationale).trim() !== normalizedPreview
      ? { key: "why-applies", label: "Why it applies", value: item.rationale }
      : null,
    (item.scope || item.summary) && String(item.scope || item.summary).trim() !== normalizedPreview
      ? { key: "scope", label: "Scope", value: item.scope || item.summary }
      : null,
    item.applicabilityBucket
      ? { key: "review-status", label: "Review status", value: item.applicabilityBucket }
      : null,
  ].filter(Boolean);

  const hasDetails = detailItems.length > 0;

  return (
    <article className={styles.obligationCard} id={cardId}>
      <button
        type="button"
        className={styles.obligationCardToggle}
        onClick={hasDetails ? () => setOpen((p) => !p) : undefined}
        aria-expanded={hasDetails ? open : undefined}
        aria-controls={hasDetails ? `${cardId}-body` : undefined}
        style={hasDetails ? undefined : { cursor: "default", pointerEvents: "none" }}
      >
        <div className={styles.obligationCardTop}>
          <div className={styles.obligationCardPills}>
            <DirectivePill directiveKey={item.directive_key || "OTHER"} />
            {item.code ? <span className={styles.standardCode}>{item.code}</span> : null}
          </div>
          {hasDetails ? (
            <ChevronDown
              size={14}
              className={cx(styles.obligationCardChevron, open ? styles.obligationCardChevronOpen : "")}
            />
          ) : null}
        </div>
        <div className={styles.obligationCardBody}>
          <h4 className={styles.obligationTitle}>{titleCaseMinor(item.title || "Untitled obligation")}</h4>
          {normalizedPreview ? <p className={styles.obligationPreview}>{normalizedPreview}</p> : null}
        </div>
      </button>

      {open && hasDetails ? (
        <div id={`${cardId}-body`} className={styles.obligationDetail}>
          {detailItems.map((detail) => (
            <div key={detail.key} className={styles.obligationDetailItem}>
              <span className={styles.obligationDetailLabel}>{detail.label}</span>
              <p className={styles.obligationDetailValue}>{detail.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
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
  const routeDirectiveKeys = new Set(viewModel.routeSections.map((s) => s.key));
  const filterNonRoute = (items) => items.filter((item) => !routeDirectiveKeys.has(item.directive_key));

  const conditionalItems = filterNonRoute(flattenLegislationGroups(viewModel.conditionalLegislationGroups));
  const peripheralItems = filterNonRoute(flattenLegislationGroups(viewModel.peripheralLegislationGroups));
  const groups = [
    {
      key: "conditional",
      title: "Check applicability",
      text: "These frameworks often turn on when the product includes specific features or market facts.",
      items: conditionalItems,
    },
    {
      key: "peripheral",
      title: "Additional frameworks",
      text: "Keep these in reserve for expanded product claims, environments, or technologies.",
      items: peripheralItems,
    },
  ];

  return (
    <Surface
      eyebrow="Adjacent frameworks"
      title="Parallel obligations"
      text="Frameworks outside the primary standards route that may still matter depending on product features or market claims."
      bodyClassName={styles.sectionStack}
    >
      {groups.some((group) => group.items.length) ? (
        groups.map((group) =>
          group.items.length ? (
            <div key={group.key} className={styles.obligationGroup}>
              <div className={styles.obligationGroupHeader}>
                <span className={styles.obligationGroupTitle}>{group.title}</span>
                <span className={styles.obligationGroupCount}>{group.items.length}</span>
              </div>
              <p className={styles.obligationGroupDesc}>{group.text}</p>
              <div className={styles.sectionStack}>
                {group.items.map((item) => (
                  <ParallelObligationCard
                    key={`${group.key}-${item.directive_key || item.code || item.title}`}
                    item={item}
                  />
                ))}
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
              <DetailList items={need.typicalEvidence} />
            </div>
            <div className={styles.evidenceSection}>
              <span className={styles.metaLabel}>Common missing information</span>
              <DetailList items={need.commonMissing} />
            </div>
            <div className={styles.evidenceSection}>
              <span className={styles.metaLabel}>Common blockers</span>
              <DetailList items={need.blockers} />
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

function SupportingContextPanel({ result, viewModel, description, copied, onCopy }) {
  const [open, setOpen] = useState(false);

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
            <CompactList items={result.future_watchlist.slice(0, 5)} renderItem={(item) => titleCaseMinor(item)} />
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
  const [description, setDescription] = useState(() => searchParams.get("q") || "");
  const [analyzedDescription, setAnalyzedDescription] = useState("");
  const [metadata, setMetadata] = useState(EMPTY_METADATA);
  const [result, setResult] = useState(null);
  const [resultRevision, setResultRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [comparisonChanges, setComparisonChanges] = useState(null);
  const [analysisCopied, setAnalysisCopied] = useState(false);
  const [previousSnapshot, setPreviousSnapshot] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const analysisAbortRef = useRef(null);
  const copyResetTimerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const resultsRef = useRef(null);
  const shouldAutorun = useRef(searchParams.get("autorun") === "1");
  const [templateOrder] = useState(() => Array.from({ length: 48 }, () => Math.random()));

  const viewModel = useMemo(
    () => buildAnalysisViewModel(result, analyzedDescription || description),
    [analyzedDescription, description, result]
  );
  const templates = useMemo(
    () => buildTemplateChoices(metadata, templateOrder),
    [metadata, templateOrder]
  );
  const suggestions = useSuggestions(description, viewModel.backendChips, viewModel.guidanceItems);
  const dirty = Boolean(result && analyzedDescription.trim() !== description.trim());

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
      const el = resultsRef.current;
      if (!el) return;
      const header = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
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
    setComparisonChanges(null);
    setPreviousSnapshot(null);
    setResultRevision((current) => current + 1);
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cancelActiveAnalysis, resetCopied, setSearchParams]);

  // Auto-run analysis when arriving from home page with ?autorun=1
  useEffect(() => {
    if (!shouldAutorun.current) return;
    shouldAutorun.current = false;
    const next = new URLSearchParams(searchParams);
    next.delete("autorun");
    setSearchParams(next, { replace: true });
    if (description.trim()) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            onCopy={handleCopy}
            copied={analysisCopied}
          />
        }
        mainClassName={layoutStyles.main}
      >
        {!result ? (
          <div className={layoutStyles.landingStack}>
            <ComposerSurface
              description={description}
              onDescriptionChange={setDescription}
              onAnalyze={runAnalysis}
              onReset={handleReset}
              onRestorePrevious={handleRestorePrevious}
              previousSnapshot={previousSnapshot}
              busy={busy}
              dirty={dirty}
              suggestions={suggestions}
              templates={templates}
              viewModel={viewModel}
              hasResult={false}
            />
            <AnalyzeStatus busy={busy} />
            <ErrorBanner message={error} />
            {!busy ? <EmptyStateGuidance /> : null}
          </div>
        ) : (
          <div className={layoutStyles.resultsGrid}>
            <div className={layoutStyles.resultsMain} ref={resultsRef}>
              <OverviewPanel result={result} viewModel={viewModel} />
              <TrustLayerPanel viewModel={viewModel} />
              <ClarificationStrip
                key={`clarifications-${resultRevision}`}
                description={analyzedDescription || description}
                result={result}
                viewModel={viewModel}
                dirty={dirty}
                busy={busy}
                onReanalyze={runAnalysis}
                onApplyMissingInput={(text) => {
                  setDescription((current) => joinText(current, text));
                }}
              />
              <ComparisonPanel changes={comparisonChanges} />
              <StandardsRoutePanel key={`standards-${resultRevision}`} viewModel={viewModel} />
              <ParallelObligationsPanel key={`parallel-${resultRevision}`} viewModel={viewModel} />
              <EvidencePanel viewModel={viewModel} />
              <SupportingContextPanel
                result={result}
                viewModel={viewModel}
                description={analyzedDescription || description}
                copied={analysisCopied}
                onCopy={handleCopy}
              />
            </div>

            <div className={layoutStyles.resultsAside}>
              <ComposerSurface
                description={description}
                onDescriptionChange={setDescription}
                onAnalyze={runAnalysis}
                onReset={handleReset}
                onRestorePrevious={handleRestorePrevious}
                previousSnapshot={previousSnapshot}
                busy={busy}
                dirty={dirty}
                suggestions={suggestions}
                templates={templates}
                viewModel={viewModel}
                hasResult={true}
              />
              <AnalyzeStatus busy={busy} />
              <ErrorBanner message={error} />
            </div>
          </div>
        )}
      </AppShell>

      <ScrollTopButton visible={scrolled} />
    </>
  );
}
