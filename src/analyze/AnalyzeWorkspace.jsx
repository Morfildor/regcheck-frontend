import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
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
import OnboardingBanner from "../shared/ui/OnboardingBanner";
import DisclaimerBanner from "../shared/ui/DisclaimerBanner";
import layoutStyles from "./AnalyzeWorkspaceLayout.module.css";
import styles from "./AnalyzeWorkspace.module.css";
import { EMPTY_METADATA, fetchMetadataOptions, requestAnalysis } from "./api";
import { buildAnalysisViewModel, buildTemplateChoices } from "./selectors";
import {
  buildClipboardSummary,
  directiveShort,
  directiveTone,
  formatUiLabel,
  inferStandardCategory,
  joinText,
  routeTitle,
  titleCaseMinor,
} from "./helpers";
import ScrollingTemplateRows from "./ScrollingTemplateRows";

const EXAMPLE_DETAILS = [
  "power source",
  "connectivity",
  "battery",
  "intended use",
  "included accessories",
  "environment / installation context",
];

const DIRECTIVE_GLOSSARY = {
  LVD: "Low Voltage Directive (2014/35/EU) — applies to electrical equipment 50–1000 V AC / 75–1500 V DC.",
  EMC: "Electromagnetic Compatibility Directive (2014/30/EU) — governs emissions and immunity of electrical apparatus.",
  RED: "Radio Equipment Directive (2014/53/EU) — applies to Wi-Fi, Bluetooth, cellular, and other intentional radiators.",
  RED_CYBER: "RED Art. 3(3)(d/e/f) cybersecurity delegated act — adds security requirements for internet-connected radio equipment.",
  ROHS: "RoHS Directive (2011/65/EU) — restricts ten hazardous substances in electrical and electronic equipment.",
  REACH: "REACH Regulation (EC 1907/2006) — chemical substance duties including SVHC communication and Annex XVII restrictions.",
  WEEE: "WEEE Directive (2012/19/EU) — producer registration, take-back obligations, and crossed-bin marking for EEE.",
  GPSR: "General Product Safety Regulation (EU 2023/988) — applies to all consumer products; replaces GPSD from Dec 2024.",
  CRA: "Cyber Resilience Act (EU 2024/2847) — cybersecurity-by-design for products with digital elements; most obligations from Dec 2027.",
  MDR: "Medical Device Regulation (EU 2017/745) — clinical evidence, notified body, and UDI required for medical devices.",
  GDPR: "GDPR (EU 2016/679) — personal data processing duties including lawful basis, rights, and security measures.",
  BATTERY: "EU Battery Regulation (EU 2023/1542) — labelling, chemistry disclosure, removability, and EoL duties for batteries.",
  ECO: "Ecodesign Directive (2009/125/EC) framework — binding requirements set in implementing measures for energy-related products.",
  ESPR: "Ecodesign for Sustainable Products Regulation (EU 2024/1781) — successor to ESPR; product-specific measures forthcoming.",
  AI_Act: "AI Act (EU 2024/1689) — risk-based requirements for AI systems; high-risk AI requires conformity assessment.",
  FCM: "Food Contact Materials Regulation (EC 1935/2004) — inertness and traceability for materials contacting food.",
};

const RISK_GLOSSARY = {
  low: "Low risk: few high-severity obligations identified. Standard CE marking should proceed without critical blockers.",
  medium: "Medium risk: some obligations require attention. Clarify open items before scoping evidence.",
  high: "High risk: multiple high-severity obligations identified. Prioritize clarification before testing.",
  critical: "Critical risk: severe obligations identified across multiple areas. Immediate expert review required.",
};

const CONFIDENCE_GLOSSARY = {
  "high confidence": "Product matched with high certainty. The route is unlikely to shift with more detail.",
  "preliminary only": "Blockers are open. Resolve them before relying on this route.",
  "needs confirmation": "Route is plausible but open items may shift specific obligations.",
};

const MATURITY_GLOSSARY = {
  "initial scope": "Blockers are unresolved. The route may change significantly with more product detail.",
  "conditional scope": "No blockers, but route-affecting items remain. Scope is plausible, not finalized.",
  "evidence-ready scope": "No blockers or route-affecting gaps. Scope is stable and ready for evidence planning.",
};

const APPLICABILITY_GLOSSARY = {
  "core applicable": "Applies directly to this product type. Include in the primary compliance scope.",
  "conditional": "Applicability depends on product features or market facts. Verify whether the condition is met.",
  "supplementary": "Lower-priority — may apply depending on further design or use-case details.",
  "route review": "Applicability uncertain. Review the full directive scope against this product.",
};

const SEVERITY_GLOSSARY = {
  blocker: "Missing input that can materially change the compliance route. Resolve before relying on this result.",
  "route-affecting": "Missing input that may shift specific obligations or evidence scope. Confirm before testing.",
  helpful: "Optional detail that can tighten the route but is unlikely to change it materially.",
};

/** Returns timing / applicability label for a directive key, or null. */
function getTimingLabel(directiveKey) {
  const key = String(directiveKey || "").toUpperCase();
  if (key === "CRA") return "Obligations from Dec 2027";
  if (key === "GDPR") return "Only if personal data processed";
  if (key === "MDR") return "Only if marketed with medical claim";
  if (key === "ESPR") return "Review-dependent";
  if (key === "AI_ACT" || key === "AI_Act") return "Upcoming — risk classification required";
  return null;
}

/** Maps directive keys to their curated detail page paths. */
const DIRECTIVE_PAGE_MAP = {
  LVD: "/directives/lvd.md",
  EMC: "/directives/emc.md",
  RED: "/directives/red.md",
  RED_CYBER: "/directives/red.md",
  ROHS: "/directives/rohs.md",
};

/** Badge config for applicabilityBucket values. */
const APPLICABILITY_BADGE = {
  "core applicable": { label: "Mandatory", icon: "check", tone: "positive" },
  "conditional":     { label: "Conditional", icon: "warning", tone: "warning" },
  "supplementary":   { label: "Supplementary", icon: "muted", tone: "muted" },
  "route review":    { label: "Review", icon: "muted", tone: "muted" },
};

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

/** Returns short "understood" fact labels extracted from the description — surfaced in Action Required. */
function getUnderstoodFacts(description) {
  const d = String(description || "").toLowerCase();
  const facts = [];

  if (/mains|230v|240v|corded/.test(d)) facts.push("Mains power");
  else if (/rechargeable|lithium|li.?ion/.test(d)) facts.push("Battery powered");
  else if (/usb.?powered|usb.?c\s*power/.test(d)) facts.push("USB powered");
  else if (/ac.?adapt|external.*power/.test(d)) facts.push("External adapter");

  if (/no.?wireless|no.?radio|no wireless/.test(d)) facts.push("No radio");
  else {
    if (/wi.?fi/.test(d)) facts.push("Wi-Fi");
    if (/bluetooth|ble\b/.test(d)) facts.push("Bluetooth");
    if (/nfc\b/.test(d)) facts.push("NFC");
  }

  if (/local.?only|no.?cloud/.test(d)) facts.push("Local only");
  else if (/cloud.?account|cloud.?required/.test(d)) facts.push("Cloud required");
  else if (/ota|firmware.?update/.test(d)) facts.push("OTA updates");

  if (/\bconsumer|household/.test(d)) facts.push("Consumer");
  else if (/professional|industrial|commercial/.test(d)) facts.push("Professional");

  if (/indoor\b/.test(d)) facts.push("Indoor");
  else if (/outdoor|weather|ip\d/.test(d)) facts.push("Outdoor");

  if (/wearable|on.?body|worn\b/.test(d)) facts.push("Wearable");
  if (/food.?contact|food.?touch/.test(d)) facts.push("Food contact");

  return [...new Set(facts)].slice(0, 6);
}

const SCOPE_GAPS = [
  {
    id: "power",
    question: "Power source?",
    detect: (d) => !/mains|230v|240v|ac\s*power|rechargeable|lithium|battery|usb.?c?\s*power|external.*adapter|powered via/.test(d),
    chips: [
      { label: "Mains (230V)", text: "mains powered (230 V AC)" },
      { label: "Rechargeable battery", text: "rechargeable lithium battery" },
      { label: "Replaceable battery", text: "replaceable battery cells" },
      { label: "AC adapter", text: "powered via external AC/DC adapter" },
    ],
  },
  {
    id: "connectivity",
    question: "Wireless?",
    detect: (d) => !/wifi|wi.?fi|bluetooth|ble\b|nfc\b|cellular|lte\b|5g\b|zigbee|z.?wave|no.?radio|no.?wireless|no wireless/.test(d),
    chips: [
      { label: "Wi-Fi", text: "Wi-Fi" },
      { label: "Bluetooth", text: "Bluetooth LE" },
      { label: "NFC", text: "NFC" },
      { label: "None", text: "no wireless connectivity" },
    ],
  },
  {
    id: "user",
    question: "Who uses it?",
    detect: (d) => !/consumer|household|professional|industrial|commercial|child|patient/.test(d),
    chips: [
      { label: "Consumers", text: "consumer use" },
      { label: "Professionals", text: "professional use" },
      { label: "Child-related", text: "intended for use by children" },
      { label: "Patient-related", text: "patient-related use" },
    ],
  },
  {
    id: "environment",
    question: "Where used?",
    detect: (d) => !/indoor|outdoor|installation|ip\d|weather|portable\b|fixed\b|on.?body|wearable/.test(d),
    chips: [
      { label: "Indoors", text: "indoor use only" },
      { label: "Outdoors", text: "outdoor rated" },
      { label: "Portable", text: "portable device" },
      { label: "On-body", text: "worn on body" },
    ],
  },
  {
    id: "cloud",
    question: "App / cloud?",
    detect: (d) =>
      /wifi|wi.?fi|bluetooth|wireless|connected/.test(d) &&
      !/cloud|account.?required|local.?only|local.?lan|no.?cloud|app.?only|app.?control|app.?sync/.test(d),
    chips: [
      { label: "Cloud required", text: "cloud account required" },
      { label: "App only", text: "app control, local only, no cloud dependency" },
      { label: "Cloud optional", text: "cloud optional, local control also available" },
      { label: "Local only", text: "local control only, no cloud" },
    ],
  },
  {
    id: "battery-type",
    question: "Battery type?",
    detect: (d) => /battery|rechargeable/.test(d) && !/lithium|li.?ion|alkaline|nimh/.test(d),
    chips: [
      { label: "Li-ion", text: "lithium-ion" },
      { label: "Non-rechargeable", text: "primary (non-rechargeable) cells" },
    ],
  },
];

function buildScopeGapGroups(description) {
  const lowered = String(description || "").toLowerCase();
  return SCOPE_GAPS
    .filter((gap) => gap.detect(lowered))
    .map(({ id, question, chips }) => ({ id, question, chips }));
}

function useScopeGapGroups(description) {
  const deferredDescription = useDeferredValue(description);
  return useMemo(() => buildScopeGapGroups(deferredDescription), [deferredDescription]);
}


function TonePill({ children, tone = "muted", strong = false, tip }) {
  const el = (
    <span className={cx(styles.pill, PILL_TONE_CLASS[tone], strong ? styles.pillStrong : "")}>
      {children}
    </span>
  );
  return tip ? <GlossaryTip title={tip}>{el}</GlossaryTip> : el;
}

function GlossaryTip({ directiveKey, title, children }) {
  const definition = title || DIRECTIVE_GLOSSARY[directiveKey];
  const [tipPos, setTipPos] = useState(null);
  const spanRef = useRef(null);
  const hideTimerRef = useRef(null);

  if (!definition) return <>{children}</>;

  return (
    <span
      ref={spanRef}
      className={styles.glossaryTip}
      onMouseEnter={() => {
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
        const rect = spanRef.current?.getBoundingClientRect();
        if (rect) setTipPos({ x: rect.left + rect.width / 2, y: rect.top });
      }}
      onMouseLeave={() => {
        hideTimerRef.current = setTimeout(() => setTipPos(null), 180);
      }}
    >
      {children}
      {tipPos && createPortal(
        <span
          className={styles.glossaryTipFloat}
          style={{ left: tipPos.x, top: tipPos.y }}
        >
          {definition}
        </span>,
        document.body
      )}
    </span>
  );
}

function DirectivePill({ directiveKey, linkToPage = false }) {
  const tone = directiveTone(directiveKey);
  const shortLabel = directiveShort(directiveKey);
  const pagePath = DIRECTIVE_PAGE_MAP[directiveKey];

  const inner = (
    <span
      className={styles.directivePill}
      style={{
        "--directive-bg": tone.bg,
        "--directive-border": tone.bd,
        "--directive-text": tone.text,
      }}
    >
      {shortLabel}
    </span>
  );

  const pill = <GlossaryTip directiveKey={directiveKey}>{inner}</GlossaryTip>;

  if (linkToPage && pagePath) {
    return (
      <a
        href={pagePath}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.directivePillLink}
        aria-label={`View ${shortLabel} directive details (opens in new tab)`}
        title="View directive summary"
      >
        {pill}
      </a>
    );
  }

  return pill;
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
    return <span className={styles.headerHint}>Describe your product to get a scoped route.</span>;
  }

  return (
    <div className={styles.headerActions}>
      <TonePill tone="strong" tip={RISK_GLOSSARY[result?.overall_risk?.toLowerCase() || "medium"]}>{formatUiLabel(result?.overall_risk || "medium")} risk</TonePill>
      <span className={styles.headerMetric}>{totalStandards} standard{totalStandards === 1 ? "" : "s"}</span>
      <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary, styles.actionButtonSm)} onClick={onCopy} aria-live="polite" title="Copy analysis summary to clipboard">
        {copied ? <Check size={13} /> : <Download size={13} />}
        {copied ? "Copied" : "Export"}
      </button>
      <button type="button" className={cx(styles.actionButton, styles.actionButtonGhost, styles.actionButtonSm)} onClick={onReset} title="Start a new analysis">
        <RefreshCcw size={13} />
        New
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
        className={cx(styles.textarea, hasResult ? styles.textareaCompact : "", showValidation ? styles.textareaError : "")}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
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
        <ScrollingTemplateRows
          templates={templates}
          onSelect={onDescriptionChange}
        />
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
        <button type="button" className={cx(styles.actionButton, styles.actionButtonGhost)} onClick={onReset}>
          Reset
        </button>
        {previousSnapshot ? (
          <button type="button" className={cx(styles.actionButton, styles.actionButtonGhost)} onClick={onRestorePrevious}>
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

function EmptyStateGuidance({ hasError }) {
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
    <div className={styles.emptyStateBody}>
      {hasError ? (
        <div className={styles.apiUnavailableCard}>
          <p className={styles.apiUnavailableTitle}>API may be starting up</p>
          <p className={styles.apiUnavailableText}>
            The analyzer backend sometimes takes a moment to wake up after inactivity. Paste a
            product description below and try again — it usually responds within 10–20 seconds.
          </p>
        </div>
      ) : null}
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
    </div>
  );
}

function OverviewPanel({ result, viewModel }) {
  const openIssueCount = viewModel.decisionSignals.blockerCount + viewModel.decisionSignals.routeAffectingCount;
  const riskLevel = (result?.overall_risk || "medium").toLowerCase();
  const riskTone = riskLevel === "high" || riskLevel === "critical" ? "warning" : riskLevel === "low" ? "positive" : null;

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
        <div className={cx(styles.identityStat, riskTone === "warning" ? styles.identityStatWarning : riskTone === "positive" ? styles.identityStatPositive : "")}>
          <span className={styles.identityStatLabel}>Risk</span>
          <strong className={styles.identityStatValue}>{formatUiLabel(result?.overall_risk || "medium")}</strong>
        </div>
        <div className={styles.identityStat}>
          <span className={styles.identityStatLabel}>Standards</span>
          <strong className={styles.identityStatValue}>{viewModel.totalStandards}</strong>
        </div>
        <div className={cx(styles.identityStat, openIssueCount > 2 ? styles.identityStatWarning : openIssueCount === 0 ? styles.identityStatPositive : styles.identityStatActive)}>
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
          <TonePill tone={viewModel.resultMaturity.tone} strong tip={MATURITY_GLOSSARY[viewModel.resultMaturity.label.toLowerCase()]}>{viewModel.resultMaturity.label}</TonePill>
          <TonePill tone={viewModel.classificationConfidence.tone} tip={CONFIDENCE_GLOSSARY[viewModel.classificationConfidence.label.toLowerCase()]}>{viewModel.classificationConfidence.label}</TonePill>
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
        <p className={styles.trustBarDisclaimer}>
          Preliminary result — requires expert review before formal assessment or certification decisions.
        </p>
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

function ActionRequiredItem({ item, onApplyMissingInput }) {
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

function ActionRequiredPanel({
  description,
  result,
  viewModel,
  dirty,
  busy,
  onReanalyze,
  onApplyMissingInput,
}) {
  const blocking = viewModel.missingInputs.filter((i) => i.severity === "blocker");
  const routeAffecting = viewModel.missingInputs.filter((i) => i.severity === "route-affecting");
  const helpful = viewModel.missingInputs.filter((i) => i.severity === "helpful");
  const [showAllRoute, setShowAllRoute] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const understoodFacts = useMemo(() => getUnderstoodFacts(description), [description]);

  const hasAny = blocking.length || routeAffecting.length || helpful.length;
  if (!hasAny && !dirty) return null;

  const totalCritical = blocking.length + routeAffecting.length;
  const ROUTE_INITIAL_LIMIT = 3;
  const visibleRouteAffecting = showAllRoute ? routeAffecting : routeAffecting.slice(0, ROUTE_INITIAL_LIMIT);
  const hiddenRouteCount = routeAffecting.length - ROUTE_INITIAL_LIMIT;

  function scrollToStandards() {
    const el = document.getElementById("section-standards");
    if (!el) return;
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  return (
    <section
      id="section-action"
      className={cx(
        styles.actionRequiredSection,
        blocking.length ? styles.actionRequiredCritical : ""
      )}
    >
      <div className={styles.actionRequiredHeader}>
        <div className={styles.actionRequiredMeta}>
          <span className={styles.actionRequiredLabel}>Action required</span>
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
        <div className={styles.actionRequiredHeaderRight}>
          <button
            type="button"
            className={styles.jumpToStandardsBtn}
            onClick={scrollToStandards}
            title="Jump to standards route"
          >
            Standards <ArrowRight size={11} />
          </button>
          {dirty ? (
            <button
              type="button"
              className={cx(styles.actionButton, styles.actionButtonPrimary, styles.actionRequiredRunBtn)}
              onClick={onReanalyze}
              disabled={busy}
            >
              {busy ? <LoaderCircle size={13} className={styles.spin} /> : <RefreshCcw size={13} />}
              Re-run
            </button>
          ) : null}
        </div>
      </div>

      {/* Understood facts — compact confidence strip */}
      {understoodFacts.length > 0 ? (
        <div className={styles.understoodStrip}>
          <span className={styles.understoodLabel}>Understood:</span>
          {understoodFacts.map((fact) => (
            <span key={fact} className={styles.understoodFact}>{fact}</span>
          ))}
        </div>
      ) : null}

      {/* Critical blockers — always fully visible */}
      {blocking.length ? (
        <div className={styles.actionItemList}>
          {blocking.map((item) => (
            <ActionRequiredItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
          ))}
        </div>
      ) : null}

      {/* Route-affecting — show first few, expand on demand */}
      {routeAffecting.length ? (
        <div className={cx(styles.actionItemList, blocking.length ? styles.actionItemListSeparated : "")}>
          {visibleRouteAffecting.map((item) => (
            <ActionRequiredItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
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
                <ActionRequiredItem key={item.key} item={item} onApplyMissingInput={onApplyMissingInput} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PageSectionNav({ viewModel }) {
  const hasIssues = viewModel.missingInputs.length > 0;
  const hasStandards = viewModel.routeSections.length > 0;
  const hasParallel =
    (viewModel.conditionalLegislationGroups?.length || 0) +
    (viewModel.peripheralLegislationGroups?.length || 0) > 0;
  const hasEvidence = viewModel.evidenceNeeds.length > 0;
  const blockerCount = viewModel.decisionSignals.blockerCount;

  const navItems = [
    { id: "section-summary", label: "Summary" },
    hasIssues ? { id: "section-action", label: "Action required", count: blockerCount > 0 ? blockerCount : null, warning: blockerCount > 0 } : null,
    hasStandards ? { id: "section-standards", label: "Standards", count: viewModel.totalStandards, accent: true } : null,
    hasParallel ? { id: "section-parallel", label: "Obligations" } : null,
    hasEvidence ? { id: "section-evidence", label: "Evidence" } : null,
  ].filter(Boolean);

  if (navItems.length < 3) return null;

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  return (
    <nav className={styles.pageSectionNav} aria-label="Jump to results section">
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cx(
            styles.pageSectionNavItem,
            item.warning ? styles.pageSectionNavWarning : "",
            item.accent ? styles.pageSectionNavAccent : ""
          )}
          onClick={() => scrollTo(item.id)}
        >
          {item.label}
          {item.count != null ? (
            <span className={cx(styles.pageSectionNavCount, item.warning ? styles.pageSectionNavCountWarning : "", item.accent ? styles.pageSectionNavCountAccent : "")}>
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
      {viewModel.routeSections.length > 0 ? (
        <div className={styles.pageSectionNavDirectives}>
          {viewModel.isRadioProduct && viewModel.redGroup ? (
            <>
              <button
                key="dir-RED"
                type="button"
                className={styles.pageSectionNavItem}
                onClick={() => scrollTo("route-section-red")}
                title="Jump to RED route"
              >
                RED
                <span className={styles.pageSectionNavCount}>
                  {viewModel.redGroup.totalItems}
                </span>
              </button>
              {(viewModel.displayRouteSections || [])
                .filter((s) => s.key !== "RED" && s.key !== "LVD" && s.key !== "EMC")
                .map((section) => (
                  <button
                    key={`dir-${section.key || section.title}`}
                    type="button"
                    className={styles.pageSectionNavItem}
                    onClick={() => scrollTo(`route-section-${slugify(section.key || section.title)}`)}
                    title={`Jump to ${routeTitle(section)}`}
                  >
                    {directiveShort(section.key || "OTHER")}
                    <span className={styles.pageSectionNavCount}>
                      {(section.items || []).length}
                    </span>
                  </button>
                ))}
            </>
          ) : (
            viewModel.routeSections.map((section) => {
              const isLVD = (section.key || "").toUpperCase() === "LVD";
              const dirId = `route-section-${slugify(section.key || section.title)}`;
              return (
                <button
                  key={`dir-${section.key || section.title}`}
                  type="button"
                  className={cx(
                    styles.pageSectionNavItem,
                    isLVD ? styles.pageSectionNavLVD : ""
                  )}
                  onClick={() => scrollTo(dirId)}
                  title={`Jump to ${routeTitle(section)}`}
                >
                  {directiveShort(section.key || "OTHER")}
                  <span className={styles.pageSectionNavCount}>
                    {(section.items || []).length}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </nav>
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


function StandardCard({ item }) {
  const hasVersionInfo = item.version || item.dated_version || item.harmonized_reference;
  const categoryTag = inferStandardCategory(item);
  return (
    <article className={styles.standardCard}>
      <div className={styles.standardCardTop}>
        <span className={styles.standardCode}>{item.code || "Standard"}</span>
        {categoryTag ? <TonePill tone="muted">{categoryTag}</TonePill> : null}
      </div>
      <div className={styles.standardCardBody}>
        <h4 className={styles.standardTitle}>{titleCaseMinor(item.title || "Untitled standard")}</h4>
        {item.shortRationale ? <p className={styles.microRationale}>{item.shortRationale}</p> : null}
      </div>
      {hasVersionInfo ? (
        <div className={styles.standardVersionRow}>
          {item.dated_version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Harmonized</span>
              <span className={styles.versionValue}>{item.dated_version}</span>
            </div>
          ) : null}
          {item.version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Latest EU</span>
              <span className={styles.versionValue}>{item.version}</span>
            </div>
          ) : null}
          {item.harmonized_reference ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>OJ ref</span>
              <span className={styles.versionValue}>{item.harmonized_reference}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

// ── RED article-branch components ─────────────────────────────────────────

function RedArticleBranch({ branch, open, onToggle, isLast }) {
  const branchId = `red-branch-${slugify(branch.key)}`;
  return (
    <div className={cx(styles.redArticleBranch, isLast ? styles.redArticleBranchLast : "")}>
      <button
        type="button"
        className={styles.redArticleToggle}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${branchId}-body`}
      >
        <div className={styles.redArticleToggleContent}>
          <span className={styles.redArticleLabel}>{branch.label}</span>
          <span className={styles.redArticleCount}>
            {branch.items.length} standard{branch.items.length === 1 ? "" : "s"}
          </span>
        </div>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open ? (
        <div id={`${branchId}-body`} className={styles.redArticleBody}>
          {branch.items.length ? (
            branch.items.map((item) => (
              <StandardCard
                key={`${branch.key}-${item.code || item.title}-${item.version || ""}`}
                item={item}
              />
            ))
          ) : (
            <p className={styles.emptyCopy}>No standards returned for this article.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RedGroupCard({ redGroup, openBranchKeys, onToggleBranch }) {
  return (
    <section
      className={cx(styles.accordionCard, styles.routeCardCore, styles.redGroupCard)}
      id="route-section-red"
    >
      <div className={styles.redGroupHeader}>
        <div className={styles.accordionCopy}>
          <div className={styles.accordionTitleRow}>
            <h3 className={styles.accordionTitle}>RED wireless route</h3>
            {redGroup.shortRationale ? (
              <p className={styles.microRationale}>{redGroup.shortRationale}</p>
            ) : null}
            <p className={styles.accordionText}>
              {redGroup.totalItems} standard{redGroup.totalItems === 1 ? "" : "s"} across {redGroup.branches.length} article branch{redGroup.branches.length === 1 ? "" : "es"}
            </p>
          </div>
          <div className={styles.accordionTitleMeta}>
            <DirectivePill directiveKey="RED" linkToPage />
            <TonePill tone="strong" tip={APPLICABILITY_GLOSSARY["core applicable"]}>
              Mandatory
            </TonePill>
          </div>
        </div>
      </div>
      <div className={styles.redGroupBranchList}>
        {redGroup.branches.map((branch, index) => (
          <RedArticleBranch
            key={branch.key}
            branch={branch}
            open={openBranchKeys.has(branch.key)}
            onToggle={() => onToggleBranch(branch.key)}
            isLast={index === redGroup.branches.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function RouteQuickNav({ sections, openKeys, isRadioProduct, redGroup }) {
  const orderedSections = (sections || []).filter(Boolean);

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const scrollToSection = (keyOrTitle) =>
    scrollToId(`route-section-${slugify(keyOrTitle)}`);

  if (!orderedSections.length && !isRadioProduct) return null;

  // For radio products: single RED chip + any non-LVD/EMC/RED chips
  if (isRadioProduct && redGroup) {
    const nonRadioSections = orderedSections.filter(
      (s) => s.key !== "RED" && s.key !== "LVD" && s.key !== "EMC"
    );
    const redBranchOpen =
      openKeys?.has("3.1a") || openKeys?.has("3.1b") ||
      openKeys?.has("3.2")  || openKeys?.has("3.3");
    return (
      <div className={styles.routeNavWrap}>
        <div className={styles.routeNav}>
          <button
            type="button"
            className={cx(styles.routeNavChip, styles.routeCardCore, redBranchOpen ? styles.routeNavChipActive : "")}
            onClick={() => scrollToId("route-section-red")}
            aria-label="Jump to RED route"
            aria-pressed={!!redBranchOpen}
          >
            <span className={styles.routeNavLabel}>RED</span>
            <span className={styles.routeNavMeta}>
              {redGroup.totalItems} standard{redGroup.totalItems === 1 ? "" : "s"}
            </span>
          </button>
          {nonRadioSections.map((section) => (
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

  if (!orderedSections.length) return null;

  return (
    <div className={styles.routeNavWrap}>
      <div className={styles.routeNav}>
        {orderedSections.map((section) => {
          const isLVD = (section.key || "").toUpperCase() === "LVD";
          return (
            <button
              key={`jump-${section.key || section.title}`}
              type="button"
              className={cx(
                styles.routeNavChip,
                ROUTE_SECTION_CLASS[section.sectionKind],
                openKeys?.has(section.key || section.title) ? styles.routeNavChipActive : "",
                isLVD ? styles.routeNavChipLVD : ""
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
          );
        })}
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
            <DirectivePill directiveKey={section.key || "OTHER"} linkToPage />
            {(() => {
              const bucketKey = (section.applicabilityBucket || "route review").toLowerCase();
              const badge = APPLICABILITY_BADGE[bucketKey];
              const label = badge?.label ?? (section.applicabilityBucket || "Route review");
              const tone = badge?.tone ?? applicabilityTone;
              return (
                <TonePill
                  tone={tone}
                  tip={APPLICABILITY_GLOSSARY[bucketKey]}
                >
                  {label}
                </TonePill>
              );
            })()}
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
  const isRadioProduct = viewModel.isRadioProduct;
  const redGroup = viewModel.redGroup;
  const displayRouteSections = viewModel.displayRouteSections || viewModel.routeSections;

  const [openKeys, setOpenKeys] = useState(() => {
    if (isRadioProduct) {
      // Default: open Article 3.2 (Radio/Spectrum) for easy scanning
      return new Set(["3.2"]);
    }
    const coreKeys = viewModel.routeSections
      .filter((s) => s.sectionKind === "core")
      .map((s) => s.key);
    if (coreKeys.length) return new Set(coreKeys);
    const first = viewModel.routeSections[0]?.key;
    return first ? new Set([first]) : new Set();
  });
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = useCallback((key) => {
    setOpenKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Non-RED standalone sections (radio products hide LVD/EMC; non-radio use all)
  const nonRedSections = isRadioProduct
    ? displayRouteSections.filter((s) => s.key !== "RED")
    : displayRouteSections;

  const filteredNonRedSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return nonRedSections;
    return nonRedSections.filter(
      (s) =>
        (s.key || "").toLowerCase().includes(q) ||
        (s.title || "").toLowerCase().includes(q) ||
        (s.items || []).some(
          (i) =>
            (i.code || "").toLowerCase().includes(q) ||
            (i.title || "").toLowerCase().includes(q)
        )
    );
  }, [nonRedSections, searchQuery]);

  // Whether the RED group card should be visible given the current search
  const redGroupVisible = useMemo(() => {
    if (!isRadioProduct || !redGroup) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      "red".includes(q) ||
      redGroup.branches.some(
        (branch) =>
          branch.label.toLowerCase().includes(q) ||
          branch.items.some(
            (i) =>
              (i.code || "").toLowerCase().includes(q) ||
              (i.title || "").toLowerCase().includes(q)
          )
      )
    );
  }, [isRadioProduct, redGroup, searchQuery]);

  const hasAnyContent = redGroupVisible || filteredNonRedSections.length > 0;

  const summaryText = isRadioProduct
    ? `${viewModel.totalStandards} standard${viewModel.totalStandards === 1 ? "" : "s"} — RED is the primary route, covering safety (Art. 3.1(a)), EMC (Art. 3.1(b)), and radio spectrum (Art. 3.2).`
    : `${viewModel.totalStandards} standard${viewModel.totalStandards === 1 ? "" : "s"} across ${viewModel.routeSections.length} directive group${viewModel.routeSections.length === 1 ? "" : "s"} — LVD and EMC first, then RED, followed by further applicable routes.`;

  return (
    <Surface
      id="section-standards"
      eyebrow="Compliance route"
      title="Standards"
      text={summaryText}
      bodyClassName={styles.sectionStack}
    >
      <RouteQuickNav
        sections={displayRouteSections}
        openKeys={openKeys}
        isRadioProduct={isRadioProduct}
        redGroup={redGroup}
      />

      {viewModel.routeSections.length > 2 ? (
        <div className={styles.standardsSearch}>
          <Search size={13} className={styles.standardsSearchIcon} />
          <input
            type="search"
            className={styles.standardsSearchInput}
            placeholder="Filter by directive or standard…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter standards"
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.standardsSearchClear}
              onClick={() => setSearchQuery("")}
              aria-label="Clear filter"
            >
              ×
            </button>
          ) : null}
        </div>
      ) : null}

      {hasAnyContent ? (
        <div className={styles.sectionStack}>
          {redGroupVisible ? (
            <RedGroupCard
              redGroup={redGroup}
              openBranchKeys={openKeys}
              onToggleBranch={toggleSection}
            />
          ) : null}
          {filteredNonRedSections.map((section) => (
            <RouteSectionCard
              key={section.key || section.title}
              section={section}
              open={openKeys.has(section.key)}
              onToggle={() => toggleSection(section.key)}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <p className={styles.emptyCopy}>No sections match "{searchQuery}".</p>
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
          {getTimingLabel(item.directive_key) ? (
            <span className={styles.timingBadge}>{getTimingLabel(item.directive_key)}</span>
          ) : null}
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

const EVIDENCE_SECTIONS = [
  { key: "evidence", icon: Check, iconClass: styles.evidenceSectionIconCheck, label: "Typical evidence", field: "typicalEvidence", blockersClass: "" },
  { key: "missing", icon: AlertCircle, iconClass: styles.evidenceSectionIconMissing, label: "Common gaps", field: "commonMissing", blockersClass: "" },
  { key: "blockers", icon: Ban, iconClass: styles.evidenceSectionIconBlocker, label: "Blockers", field: "blockers", blockersClass: styles.evidenceSectionBlockers },
  { key: "nextActions", icon: ArrowRight, iconClass: styles.evidenceSectionIconNext, label: "Next actions", field: "nextActions", blockersClass: "" },
];

function EvidencePanel({ viewModel }) {
  return (
    <Surface
      eyebrow="Evidence gaps"
      title="Evidence and common gaps"
      text="Pre-lab checklist for the active compliance routes."
      bodyClassName={styles.evidenceGrid}
    >
      {viewModel.evidenceNeeds.length ? (
        viewModel.evidenceNeeds.map((need) => (
          <div key={need.key} className={styles.evidenceCard}>
            <div className={styles.evidenceHeader}>
              <h3 className={styles.groupTitle}>{need.label}</h3>
              <DirectivePill directiveKey={need.key} />
            </div>
            {EVIDENCE_SECTIONS.map(({ key, icon: Icon, iconClass, label, field, blockersClass }) =>
              need[field]?.length ? (
                <div key={key} className={cx(styles.evidenceSection, blockersClass)}>
                  <div className={styles.evidenceSectionHeader}>
                    <Icon size={11} className={iconClass} />
                    <span className={blockersClass ? cx(styles.metaLabel, styles.metaLabelBlockers) : styles.metaLabel}>{label}</span>
                  </div>
                  <DetailList items={need[field]} />
                </div>
              ) : null
            )}
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
        <div className={styles.contextSummaryRight}>
          {!open && viewModel.triggeredDirectives.length ? (
            <div className={styles.chipList}>
              {viewModel.triggeredDirectives.slice(0, 3).map((dk) => (
                <DirectivePill key={dk} directiveKey={dk} />
              ))}
              {viewModel.triggeredDirectives.length > 3 ? (
                <span className={styles.clarificationOverflow}>+{viewModel.triggeredDirectives.length - 3}</span>
              ) : null}
            </div>
          ) : null}
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
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
          <button type="button" className={cx(styles.actionButton, styles.actionButtonSecondary, styles.fullWidthButton)} onClick={onCopy} aria-live="polite">
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

function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  const isNetwork = /network|fetch|failed to fetch|load failed|unavailable|timeout|abort/i.test(message);

  return (
    <div className={styles.errorBanner} role="alert">
      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
      <div className={styles.errorBody}>
        <div className={styles.errorTitle}>
          {isNetwork ? "API unreachable" : "Analysis error"}
        </div>
        <div className={styles.errorText}>
          {isNetwork
            ? "The analyzer could not reach the API. The service may be starting up — try again in a moment."
            : message}
        </div>
      </div>
      {onRetry ? (
        <button type="button" className={styles.errorRetry} onClick={onRetry}>
          <RefreshCcw size={13} />
          Try again
        </button>
      ) : null}
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
  const [templateOrder] = useState(() => Array.from({ length: 120 }, () => Math.random()));
  const [asideCollapsed, setAsideCollapsed] = useState(false);

  const viewModel = useMemo(
    () => buildAnalysisViewModel(result, analyzedDescription || description),
    [analyzedDescription, description, result]
  );
  const templates = useMemo(
    () => buildTemplateChoices(metadata, templateOrder),
    [metadata, templateOrder]
  );
  const scopeGapGroups = useScopeGapGroups(description);
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
      missingInputs: viewModel.missingInputs,
      evidenceNeeds: viewModel.evidenceNeeds,
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
  }, [analyzedDescription, description, result, viewModel.legislationGroups, viewModel.routeSections, viewModel.missingInputs, viewModel.evidenceNeeds]);

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
            <OnboardingBanner onLoadSample={(text) => setDescription(text)} />
            <ComposerSurface
              description={description}
              onDescriptionChange={setDescription}
              onAnalyze={runAnalysis}
              onReset={handleReset}
              onRestorePrevious={handleRestorePrevious}
              previousSnapshot={previousSnapshot}
              busy={busy}
              dirty={dirty}
              scopeGapGroups={scopeGapGroups}
              templates={templates}
              viewModel={viewModel}
              hasResult={false}
            />
            <AnalyzeStatus busy={busy} />
            <ErrorBanner message={error} onRetry={error ? runAnalysis : null} />
            {!busy ? <EmptyStateGuidance hasError={Boolean(error)} /> : null}
          </div>
        ) : (
          <div className={cx(layoutStyles.resultsGrid, asideCollapsed ? layoutStyles.resultsGridFull : "")}>
            <div className={cx(layoutStyles.resultsMain, styles.resultsEnter)} ref={resultsRef}>
              {asideCollapsed ? (
                <div className={styles.asideShowBar}>
                  <button
                    type="button"
                    className={styles.asideShowBtn}
                    onClick={() => setAsideCollapsed(false)}
                    title="Show refine panel"
                  >
                    <ChevronRight size={13} />
                    Refine
                  </button>
                </div>
              ) : null}
              <OverviewPanel result={result} viewModel={viewModel} />
              <TrustLayerPanel viewModel={viewModel} />
              <PageSectionNav viewModel={viewModel} />
              <ActionRequiredPanel
                key={`action-${resultRevision}`}
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
              <div id="section-parallel">
                <ParallelObligationsPanel key={`parallel-${resultRevision}`} viewModel={viewModel} />
              </div>
              <div id="section-evidence">
                <EvidencePanel viewModel={viewModel} />
              </div>
              <SupportingContextPanel
                result={result}
                viewModel={viewModel}
                description={analyzedDescription || description}
                copied={analysisCopied}
                onCopy={handleCopy}
              />
              <DisclaimerBanner compact />
            </div>

            <div className={cx(layoutStyles.resultsAside, asideCollapsed ? layoutStyles.resultsAsideHidden : "")}>
              <div className={styles.asideCollapseRow}>
                <button
                  type="button"
                  className={styles.asideCollapseBtn}
                  onClick={() => setAsideCollapsed(true)}
                  title="Collapse refine panel"
                >
                  <ChevronLeft size={13} />
                </button>
              </div>
              <ComposerSurface
                description={description}
                onDescriptionChange={setDescription}
                onAnalyze={runAnalysis}
                onReset={handleReset}
                onRestorePrevious={handleRestorePrevious}
                previousSnapshot={previousSnapshot}
                busy={busy}
                dirty={dirty}
                scopeGapGroups={scopeGapGroups}
                templates={templates}
                viewModel={viewModel}
                hasResult={true}
              />
              <AnalyzeStatus busy={busy} />
              <ErrorBanner message={error} onRetry={error ? runAnalysis : null} />
            </div>
          </div>
        )}
      </AppShell>

      <ScrollTopButton visible={scrolled} />
    </>
  );
}
