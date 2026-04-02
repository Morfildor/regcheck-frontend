import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AppShell from "../app/AppShell";
import PageMeta from "../shared/ui/PageMeta";
import OnboardingBanner from "../shared/ui/OnboardingBanner";
import DisclaimerBanner from "../shared/ui/DisclaimerBanner";
import layoutStyles from "./AnalyzeWorkspaceLayout.module.css";
import styles from "./AnalyzeWorkspace.module.css";
import { EMPTY_METADATA, fetchMetadataOptions, requestAnalysis } from "./api";
import { buildAnalysisViewModel, buildTemplateChoices } from "./selectors";
import {
  buildClipboardSummary,
  directiveShort,
  formatUiLabel,
  joinText,
} from "./helpers";
import { useScopeGapGroups } from "./scopeGaps";

// ── Extracted components ─────────────────────────────────────────────────────
import HeaderActions           from "./components/HeaderActions";
import AnalyzeStatus           from "./components/AnalyzeStatus";
import ComposerSurface         from "./components/ComposerSurface";
import EmptyStateGuidance      from "./components/EmptyStateGuidance";
import OverviewPanel           from "./components/OverviewPanel";
import TrustLayerPanel         from "./components/TrustLayerPanel";
import ActionRequiredPanel     from "./components/ActionRequiredPanel";
import StandardsRoutePanel     from "./components/StandardsRoute";
import ParallelObligationsPanel from "./components/ParallelObligationsPanel";
import EvidencePanel           from "./components/EvidencePanel";
import ResultsSidebarNav       from "./components/ResultsSidebarNav";
import SupportingContext       from "./components/SupportingContext";
import ErrorBanner             from "./components/ErrorBanner";
import ScrollTopButton         from "./components/ScrollTopButton";
import ComparisonPanel         from "./components/ComparisonPanel";
import ResultsAside            from "./components/ResultsAside";

// ── Root-only utilities ───────────────────────────────────────────────────────

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function listDiff(previousItems, nextItems) {
  const previous = new Set(previousItems);
  const next     = new Set(nextItems);
  return {
    added:   [...next].filter((item) => !previous.has(item)),
    removed: [...previous].filter((item) => !next.has(item)),
  };
}

function summarizeItems(items, limit = 3) {
  if (!items.length) return "";
  const visible = items.slice(0, limit);
  const suffix  = items.length > limit ? ` +${items.length - limit} more` : "";
  return `${visible.join(", ")}${suffix}`;
}

function buildComparisonSummary(previousResult, previousDescription, nextResult, nextDescription) {
  if (!previousResult || !nextResult) return null;

  const previousViewModel = buildAnalysisViewModel(previousResult, previousDescription);
  const nextViewModel     = buildAnalysisViewModel(nextResult, nextDescription);
  const changes = [];

  if ((previousResult.product_type || "") !== (nextResult.product_type || "")) {
    changes.push(
      `Product identity changed: ${formatUiLabel(previousResult.product_type || "unclear")} -> ${formatUiLabel(nextResult.product_type || "unclear")}`
    );
  }
  if (previousViewModel.classificationConfidence.label !== nextViewModel.classificationConfidence.label) {
    changes.push(`Confidence changed: ${previousViewModel.classificationConfidence.label} -> ${nextViewModel.classificationConfidence.label}`);
  }
  if (previousViewModel.resultMaturity.label !== nextViewModel.resultMaturity.label) {
    changes.push(`Maturity changed: ${previousViewModel.resultMaturity.label} -> ${nextViewModel.resultMaturity.label}`);
  }

  const legislationDiff = listDiff(
    previousViewModel.legislationItems.map((item) => item.directive_key || item.code || item.title),
    nextViewModel.legislationItems.map((item) => item.directive_key || item.code || item.title)
  );
  if (legislationDiff.added.length) {
    changes.push(`Added legislations: ${summarizeItems(legislationDiff.added.map((item) => directiveShort(item)))}`);
  }

  const standardDiff = listDiff(
    previousViewModel.routeSections.flatMap((s) => (s.items || []).map((i) => i.code || i.title)),
    nextViewModel.routeSections.flatMap((s) => (s.items || []).map((i) => i.code || i.title))
  );
  if (standardDiff.removed.length) {
    changes.push(`Removed standards: ${summarizeItems(standardDiff.removed)}`);
  }

  return changes.length ? changes : null;
}

// ── Main exported component ───────────────────────────────────────────────────

export default function AnalyzeWorkspace() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [description, setDescription]               = useState(() => searchParams.get("q") || "");
  const [analyzedDescription, setAnalyzedDescription] = useState("");
  const [metadata, setMetadata]                     = useState(EMPTY_METADATA);
  const [result, setResult]                         = useState(null);
  const [resultRevision, setResultRevision]         = useState(0);
  const [busy, setBusy]                             = useState(false);
  const [error, setError]                           = useState("");
  const [comparisonChanges, setComparisonChanges]   = useState(null);
  const [analysisCopied, setAnalysisCopied]         = useState(false);
  const [previousSnapshot, setPreviousSnapshot]     = useState(null);
  const [scrolled, setScrolled]                     = useState(false);
  const [asideCollapsed, setAsideCollapsed]         = useState(false);
  const [templateOrder]                             = useState(() => Array.from({ length: 120 }, () => Math.random()));

  const analysisAbortRef   = useRef(null);
  const copyResetTimerRef  = useRef(null);
  const requestSequenceRef = useRef(0);
  const resultsRef         = useRef(null);
  const shouldAutorun      = useRef(searchParams.get("autorun") === "1");

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

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMetadataOptions({ signal: controller.signal })
      .then((data) => setMetadata(data || EMPTY_METADATA))
      .catch((err) => { if (err?.name !== "AbortError") setMetadata(EMPTY_METADATA); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      analysisAbortRef.current?.abort();
      if (copyResetTimerRef.current) window.clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== description) setDescription(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    const next    = new URLSearchParams(searchParams);
    const trimmed = String(description || "").trim();
    const current = searchParams.get("q") || "";
    if (trimmed) {
      if (current !== trimmed) { next.set("q", trimmed); setSearchParams(next, { replace: true }); }
      return;
    }
    if (current) { next.delete("q"); setSearchParams(next, { replace: true }); }
  }, [description, searchParams, setSearchParams]);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    const timer = window.setTimeout(() => {
      const el = resultsRef.current;
      if (!el) return;
      const header       = document.querySelector("header");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const top          = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [resultRevision, result]);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const resetCopied = useCallback(() => {
    setAnalysisCopied(false);
    if (copyResetTimerRef.current) window.clearTimeout(copyResetTimerRef.current);
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
      description:       analyzedDescription || description,
      routeSections:     viewModel.routeSections,
      legislationGroups: viewModel.legislationGroups,
      missingInputs:     viewModel.missingInputs,
      evidenceNeeds:     viewModel.evidenceNeeds,
    });
    const fallbackCopy = (value) => {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity  = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    };
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else fallbackCopy(text);
      setAnalysisCopied(true);
      if (copyResetTimerRef.current) window.clearTimeout(copyResetTimerRef.current);
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
      setPreviousSnapshot({ result, description: analyzedDescription || description });
    }
    cancelActiveAnalysis();
    resetCopied();
    setBusy(true);
    setError("");

    const controller = new AbortController();
    const requestId  = requestSequenceRef.current + 1;
    requestSequenceRef.current  = requestId;
    analysisAbortRef.current    = controller;

    try {
      const data = await requestAnalysis(payload, { signal: controller.signal });
      if (analysisAbortRef.current !== controller || requestSequenceRef.current !== requestId) return;
      const nextComparison = result
        ? buildComparisonSummary(result, analyzedDescription || description, data, payload)
        : null;
      startTransition(() => {
        setResult(data);
        setAnalyzedDescription(payload);
        setComparisonChanges(nextComparison);
        setResultRevision((n) => n + 1);
      });
    } catch (err) {
      if (err?.name !== "AbortError" && analysisAbortRef.current === controller) {
        setError(err?.message || "Analysis failed.");
      }
    } finally {
      if (analysisAbortRef.current === controller) analysisAbortRef.current = null;
      if (requestSequenceRef.current === requestId) setBusy(false);
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
    setResultRevision((n) => n + 1);
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
    setResultRevision((n) => n + 1);
    setSearchParams({}, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [cancelActiveAnalysis, resetCopied, setSearchParams]);

  // Auto-run on arrival with ?autorun=1
  useEffect(() => {
    if (!shouldAutorun.current) return;
    shouldAutorun.current = false;
    const next = new URLSearchParams(searchParams);
    next.delete("autorun");
    setSearchParams(next, { replace: true });
    if (description.trim()) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const composerProps = {
    description,
    onDescriptionChange: setDescription,
    onAnalyze:           runAnalysis,
    onReset:             handleReset,
    onRestorePrevious:   handleRestorePrevious,
    previousSnapshot,
    busy,
    dirty,
    scopeGapGroups,
    templates,
    viewModel,
  };

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
            <ComposerSurface {...composerProps} hasResult={false} />
            <AnalyzeStatus busy={busy} />
            <ErrorBanner message={error} onRetry={error ? runAnalysis : null} />
            {!busy ? <EmptyStateGuidance hasError={Boolean(error)} /> : null}
          </div>
        ) : (
          <div className={cx(layoutStyles.resultsGrid, asideCollapsed ? layoutStyles.resultsGridFull : "")}>
            {/* ── Main results column ── */}
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

              <ResultsSidebarNav viewModel={viewModel}>
                <div className={styles.standardsHeroSection}>
                  <StandardsRoutePanel key={`standards-${resultRevision}`} viewModel={viewModel} />
                </div>
                <ActionRequiredPanel
                  key={`action-${resultRevision}`}
                  description={analyzedDescription || description}
                  viewModel={viewModel}
                  dirty={dirty}
                  busy={busy}
                  onReanalyze={runAnalysis}
                  onApplyMissingInput={(text) =>
                    setDescription((current) => joinText(current, text))
                  }
                />
                <div id="section-parallel">
                  <ParallelObligationsPanel key={`parallel-${resultRevision}`} viewModel={viewModel} />
                </div>
                <div id="section-evidence">
                  <EvidencePanel viewModel={viewModel} />
                </div>
              </ResultsSidebarNav>

              <ComparisonPanel changes={comparisonChanges} />
              <TrustLayerPanel viewModel={viewModel} />
              <SupportingContext
                result={result}
                viewModel={viewModel}
                description={analyzedDescription || description}
                copied={analysisCopied}
                onCopy={handleCopy}
              />
              <DisclaimerBanner compact />
            </div>

            {/* ── Refine aside ── */}
            <div className={cx(
              layoutStyles.resultsAside,
              layoutStyles.resultsAsideHasResult,
              asideCollapsed ? layoutStyles.resultsAsideHidden : ""
            )}>
              <ResultsAside
                onCollapse={() => setAsideCollapsed(true)}
                composerProps={composerProps}
                busy={busy}
                error={error}
                onRetry={error ? runAnalysis : null}
              />
            </div>
          </div>
        )}
      </AppShell>

      <ScrollTopButton visible={scrolled} />
    </>
  );
}
