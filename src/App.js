import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ListChecks,
  LoaderCircle,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Waypoints,
  Zap,
  Radio,
  FlaskConical,
} from "lucide-react";
import "./App.css";
import {
  ANALYZE_URL,
  DEFAULT_TEMPLATES,
  IMPORTANCE,
  METADATA_URL,
  SECTION_TONES,
  STATUS,
  buildClipboardSummary,
  buildCompactLegislationItems,
  buildDirectiveBreakdown,
  buildDynamicTemplates,
  buildGuidanceItems,
  buildGuidedChips,
  buildLegislationGroups,
  buildRouteSections,
  directiveShort,
  directiveTone,
  formatUiLabel,
  gapLabel,
  getAdditionalEntries,
  joinText,
  normalizeStandardDirective,
  prettyValue,
  routeTitle,
  sentenceCaseList,
  serializePreview,
  titleCase,
  titleCaseMinor,
  uniqueBy,
} from "./appHelpers";

function Panel({ eyebrow, title, subtitle, action, className = "", children }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(eyebrow || title || subtitle || action) && (
        <header className="panel__header">
          <div className="panel__heading">
            {eyebrow ? <div className="panel__eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="panel__title">{title}</h2> : null}
            {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="panel__action">{action}</div> : null}
        </header>
      )}
      <div className="panel__body">{children}</div>
    </section>
  );
}

function DirectivePill({ dirKey }) {
  const tone = directiveTone(dirKey);
  return (
    <span
      className="directive-pill"
      style={{
        "--pill-bg": tone.bg,
        "--pill-border": tone.bd,
        "--pill-text": tone.text,
        "--pill-dot": tone.dot,
      }}
    >
      <span className="directive-pill__dot" />
      {directiveShort(dirKey)}
    </span>
  );
}

function RiskPill({ value }) {
  const tone = STATUS[value] || STATUS.MEDIUM;
  return (
    <span
      className="status-pill"
      style={{
        "--pill-bg": tone.bg,
        "--pill-border": tone.bd,
        "--pill-text": tone.text,
      }}
    >
      {formatUiLabel(value || "MEDIUM")} risk
    </span>
  );
}

function ImportancePill({ value }) {
  const tone = IMPORTANCE[value] || IMPORTANCE.medium;
  return (
    <span
      className="importance-pill"
      style={{
        "--pill-bg": tone.bg,
        "--pill-border": tone.bd,
        "--pill-text": tone.text,
        "--pill-dot": tone.dot,
      }}
    >
      <span className="importance-pill__dot" />
      {formatUiLabel(value)}
    </span>
  );
}



function TopBar({ result, totalStandards, onReset }) {
  return (
    <header className="topbar">
      <div className="page-shell topbar__inner">
        <div className="brand">
          <div className="brand__mark">
            <Waypoints size={15} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand__title">RuleGrid</div>
            <div className="brand__subtitle">EU regulatory scoping</div>
          </div>
        </div>

        <div className="topbar__meta">
          {result ? (
            <>
              <RiskPill value={result?.overall_risk || "MEDIUM"} />
              <span className="topbar__count">{totalStandards} standards</span>
              <button type="button" className="button button--secondary" onClick={onReset}>
                <RefreshCcw size={13} />
                New analysis
              </button>
            </>
          ) : (
            <span className="topbar__hint">Describe the product — get a standards route</span>
          )}
        </div>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────
   HeroPanel — compact strip on landing, full panel on result
   ────────────────────────────────────────────────────────── */
function HeroPanel({ result, routeSections, legislationItems, guidanceItems }) {
  const hero = result?.hero_summary || {};
  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";

  /* ── Empty / Landing state: compact strip ── */
  if (!result) {
    return (
      <div className="landing-strip">
        <div className="landing-strip__inner">
          <div className="landing-strip__eyebrow">
            <Sparkles size={11} />
            Guided Workspace
          </div>
          <h1 className="landing-strip__title">
            EU regulatory scoping,<br />
            <span className="landing-strip__title--accent">instantly</span>
          </h1>
          <p className="landing-strip__sub">
            Describe the product below and get the applicable standards route, legislation context, and scope-changing clarifications.
          </p>
        </div>
      </div>
    );
  }

  /* ── Result state: full two-column hero ── */
  const title = hero.title || `${formatUiLabel(result?.product_type || "Product")} regulatory route`;
  const subtitle = result?.summary || hero.subtitle || "";

  const supportItems = [
    {
      icon: <ListChecks size={14} />,
      title: `${routeSections.length} route sections`,
      text: "Standards grouped by regime for a faster first pass.",
    },
    {
      icon: <ShieldCheck size={14} />,
      title: `${legislationItems.length} legislation items`,
      text: "Applicable frameworks pinned in the side rail.",
    },
    {
      icon: <Search size={14} />,
      title: `${guidanceItems.length} clarifications`,
      text: "Details most likely to shift scope.",
    },
  ];

  return (
    <div className="hero-grid">
      <Panel className="panel--hero" eyebrow="Guided Workspace" title={title} subtitle={subtitle}>
        <div className="hero-panel__content">
          <div className="hero-panel__tags">
            <RiskPill value={result?.overall_risk || "MEDIUM"} />
            <span className="soft-tag">Confidence: {formatUiLabel(confidence)}</span>
            {result?.product_type ? (
              <span className="soft-tag">{formatUiLabel(result.product_type)}</span>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel
        className="panel--support"
        eyebrow="This output"
        title="What's covered"
      >
        <div className="support-list">
          {supportItems.map((item) => (
            <div key={item.title} className="support-list__item">
              <div className="support-list__icon">{item.icon}</div>
              <div>
                <div className="support-list__title">{item.title}</div>
                <div className="support-list__text">{item.text}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ComposerPanel — landing variant is large & input-first
   ────────────────────────────────────────────────────────── */
function ComposerPanel({ description, setDescription, templates, chips, onAnalyze, busy, onDirty, isLanding }) {
  const charMax = 1200;
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const usageState =
    description.length > charMax * 0.9
      ? "counter--danger"
      : description.length > charMax * 0.7
        ? "counter--warn"
        : "";

  const textareaRef = useRef(null);

  /* Landing: focus textarea on mount */
  useEffect(() => {
    if (isLanding && textareaRef.current) {
      const t = setTimeout(() => textareaRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [isLanding]);

  const sharedTextarea = (
    <label className={isLanding ? "landing-composer__field" : "composer__field"}>
      <textarea
        ref={textareaRef}
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          onDirty(true);
        }}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onAnalyze();
          }
        }}
        placeholder="e.g. Connected espresso machine with Wi-Fi, OTA updates, cloud account, mains power, grinder, pressure system, food-contact brew path."
        rows={isLanding ? 8 : 7}
        maxLength={charMax}
        spellCheck={false}
        className={isLanding ? "landing-composer__textarea" : "composer__textarea"}
      />
      {!isLanding && (
        <div className="composer__field-footer">
          <div className="composer__helper">
            Include: power source · radios · cloud/OTA · core functions · sensors · food-contact or wetted paths
          </div>
          <div className={`counter ${usageState}`.trim()}>
            {wordCount ? <span>{wordCount}w</span> : null}
            <span>{description.length} / {charMax}</span>
          </div>
        </div>
      )}
    </label>
  );

  /* ── Landing variant ── */
  if (isLanding) {
    return (
      <div className="landing-composer">
        {/* Quick start chips — compact, above the input */}
        <div className="landing-composer__quickstart">
          <span className="micro-label">Quick start</span>
          <div className="template-row">
            {templates.slice(0, 5).map((template) => (
              <button
                key={template.label}
                type="button"
                className="chip-button"
                onClick={() => {
                  setDescription(template.text);
                  onDirty(true);
                  textareaRef.current?.focus();
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea + CTA always together — never separated */}
        <div className="landing-composer__input-block">
          {sharedTextarea}

          {/* CTA lives INSIDE the input block, always visible directly below */}
          <div className="landing-composer__cta-row">
            <div className={`counter ${usageState}`.trim()}>
              {wordCount ? <span>{wordCount}w</span> : null}
              <span>{description.length} / {charMax}</span>
            </div>
            <button
              type="button"
              className="button button--primary button--landing-cta"
              onClick={onAnalyze}
              disabled={busy || !description.trim()}
            >
              {busy ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
              {busy ? "Analyzing…" : "Analyze product"}
              {!busy && <span className="cta-hint">⌘↩</span>}
            </button>
          </div>
        </div>

        {/* Hints — three inline pills, compact and discreet */}
        <div className="input-hints">
          <div className="input-hint">
            <span className="input-hint__icon"><Zap size={11} /></span>
            <span><strong>Power & function</strong> — mains, battery, heating, motors, sensors</span>
          </div>
          <div className="input-hint">
            <span className="input-hint__icon"><Radio size={11} /></span>
            <span><strong>Connectivity</strong> — Wi-Fi, Bluetooth, cloud, OTA</span>
          </div>
          <div className="input-hint">
            <span className="input-hint__icon"><FlaskConical size={11} /></span>
            <span><strong>Materials</strong> — wetted paths, food-contact, battery chemistry</span>
          </div>
        </div>

        {/* Guided chips — only shown if backend provides them, collapsed by default feel */}
        {chips.length ? (
          <div className="landing-composer__chips">
            <div className="micro-label">Add detail</div>
            <div className="template-row">
              {chips.map((chip) => (
                <button
                  key={`${chip.label}-${chip.text}`}
                  type="button"
                  className="chip-button chip-button--soft"
                  onClick={() => {
                    setDescription((current) => joinText(current, chip.text));
                    onDirty(true);
                  }}
                >
                  + {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /* ── Refinement variant (post-result) ── */
  return (
    <Panel
      eyebrow="Input"
      title="Refine description"
      subtitle="Add missing detail and re-run to tighten the route."
      action={<span className="keyboard-hint">⌘ + Enter to analyze</span>}
    >
      <div className="composer">
        <div className="composer__block">
          <div className="micro-label">Quick start</div>
          <div className="template-row">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.label}
                type="button"
                className="chip-button"
                onClick={() => {
                  setDescription(template.text);
                  onDirty(true);
                }}
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>

        {sharedTextarea}

        {chips.length ? (
          <div className="composer__block">
            <div className="micro-label">Add missing detail</div>
            <div className="template-row">
              {chips.map((chip) => (
                <button
                  key={`${chip.label}-${chip.text}`}
                  type="button"
                  className="chip-button chip-button--soft"
                  onClick={() => {
                    setDescription((current) => joinText(current, chip.text));
                    onDirty(true);
                  }}
                >
                  + {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="composer__actions">
          <button
            type="button"
            className="button button--primary"
            onClick={onAnalyze}
            disabled={busy || !description.trim()}
          >
            {busy ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
            {busy ? "Analyzing…" : "Analyze product"}
          </button>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setDescription("");
              onDirty(true);
            }}
            disabled={!description}
          >
            Clear
          </button>
        </div>
      </div>
    </Panel>
  );
}

function OverviewPanel({ result, routeSections, legislationItems }) {
  if (!result) return null;

  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const totalStandards = routeSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );

  const metrics = [
    { label: "Product",     value: formatUiLabel(result?.product_type || "unclear") },
    { label: "Risk",        value: formatUiLabel(result?.overall_risk || "MEDIUM"),
      highlight: (result?.overall_risk || "MEDIUM").toUpperCase() === "HIGH" },
    { label: "Confidence",  value: formatUiLabel(confidence) },
    { label: "Standards",   value: String(totalStandards) },
    { label: "Legislation", value: String(legislationItems.length) },
  ];

  return (
    <div className="overview-bar">
      <p className="overview-bar__summary">
        {result?.summary || "Analysis complete."}
      </p>
      <div className="overview-bar__metrics">
        {metrics.map(({ label, value, highlight }) => (
          <div key={label} className="overview-metric">
            <span className="overview-metric__label">{label}</span>
            <span className={`overview-metric__value${highlight ? " overview-metric__value--high" : ""}`}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnapshotRail({ result, routeSections, legislationGroups, description }) {
  if (!result) return null;

  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const totalStandards = routeSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );
  const totalLegislation = legislationGroups.reduce(
    (count, group) => count + (group.items || []).length,
    0
  );

  return (
    <aside className="side-column">
      <Panel
        className="panel--sidebar"
        eyebrow="Snapshot"
        title="Context"
        subtitle="Product identity and legislation pinned alongside the route."
      >
        <div className="snapshot-list">
          {[
            ["Product", formatUiLabel(result?.product_type || "unclear")],
            ["Confidence", formatUiLabel(confidence)],
            ["Risk", formatUiLabel(result?.overall_risk || "MEDIUM")],
            ["Standards", totalStandards],
            ["Legislation", totalLegislation],
          ].map(([label, value]) => (
            <div key={label} className="snapshot-row">
              <span className="snapshot-row__label">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <CopyResultsButton
          result={result}
          description={description}
          routeSections={routeSections}
          legislationGroups={legislationGroups}
        />

        <div className="sidebar-section">
          <div className="sidebar-section__heading">Applicable legislation</div>
          <div className="sidebar-section__subheading">
            Secondary context to the standards route
          </div>

          <div className="legislation-group-list">
            {legislationGroups.map((group) => (
              <div key={group.key || group.title} className="legislation-group">
                <div className="legislation-group__header">
                  <span>{titleCaseMinor(group.title)}</span>
                  <span>{(group.items || []).length}</span>
                </div>
                <div className="legislation-group__items">
                  {(group.items || []).map((item) => {
                    const tone = directiveTone(item.directive_key || "OTHER");
                    const shortCode = directiveShort(item.directive_key || "OTHER");
                    return (
                      <div
                        key={`${group.key}-${item.code}-${item.title}`}
                        className="legislation-item"
                        style={{
                          "--legislation-dot": tone.dot,
                          "--legislation-dot-bg": tone.bg,
                          "--legislation-dot-border": tone.bd,
                          "--legislation-dot-text": tone.text,
                        }}
                      >
                        <div className="legislation-item__badge">{shortCode}</div>
                        <div className="legislation-item__copy">
                          <div className="legislation-item__title">{item.title}</div>
                          {item.code ? (
                            <div className="legislation-item__code-num">{item.code}</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </aside>
  );
}

function ClarificationsPanel({ items, dirty, busy, onReanalyze, onApply }) {
  if (!items.length) return null;

  return (
    <section className="panel">
      <div className="clarifications-header">
        <div className="clarifications-header__left">
          <span className="clarifications-header__eyebrow">Clarifications</span>
          <span className="clarifications-header__subtitle">
            {items.length} question{items.length === 1 ? "" : "s"} that may change scope
          </span>
        </div>
        {dirty ? (
          <button type="button" className="button button--primary" onClick={onReanalyze} disabled={busy}>
            {busy ? <LoaderCircle size={15} className="spin" /> : <RefreshCcw size={15} />}
            {busy ? "Re-running" : "Re-run analysis"}
          </button>
        ) : (
          <span className="keyboard-hint">Apply a detail below to update</span>
        )}
      </div>
      <div className="panel__body">
        <div className="clarification-list">
          {items.map((item, index) => {
            const tone = IMPORTANCE[item.importance] || IMPORTANCE.medium;
            return (
              <article
                key={item.key}
                className="clarification-card"
                style={{
                  "--card-accent": tone.dot,
                  "--card-border": tone.bd,
                  "--card-bg": tone.bg,
                }}
              >
                <div className="clarification-card__header">
                  <div className="clarification-card__title-group">
                    <ImportancePill value={item.importance} />
                    <h3>{item.title}</h3>
                  </div>
                  <div className="clarification-card__index">{String(index + 1).padStart(2, "0")}</div>
                </div>
                <p className="clarification-card__text">{item.why}</p>
                {item.choices?.length ? (
                  <div className="template-row">
                    {item.choices.map((choice) => (
                      <button
                        key={`${item.key}-${choice}`}
                        type="button"
                        className="chip-button chip-button--soft"
                        onClick={() => onApply(choice)}
                      >
                        + {choice}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StandardItem({ item, sectionKey }) {
  const dirKey = normalizeStandardDirective(item);
  const dirTone = directiveTone(dirKey);
  const sectionTone = SECTION_TONES[sectionKey] || SECTION_TONES.unknown;
  const evidenceList = sentenceCaseList(item.evidence_hint || []);
  const summary = item.standard_summary || item.reason || item.notes || "";
  const metaFields = [
    { label: "Legislation",   value: prettyValue(item.harmonized_reference) },
    { label: "EU Harmonized", value: prettyValue(item.dated_version) },
    { label: "EU Latest",     value: prettyValue(item.version) },
  ].filter((field) => field.value && field.value !== "—");

  return (
    <article
      className="standard-item"
      style={{
        "--item-accent": dirTone.dot,
        "--item-accent-bg": dirTone.bg,
        "--item-accent-border": dirTone.bd,
      }}
    >
      <div className="standard-item__header">
        <div className="standard-item__chips">
          <span className="code-chip">{item.code || "No code"}</span>
          <DirectivePill dirKey={dirKey} />
          <span
            className="status-pill status-pill--soft"
            style={{
              "--pill-bg": sectionTone.bg,
              "--pill-border": sectionTone.bd,
              "--pill-text": sectionTone.text,
            }}
          >
            {formatUiLabel(item.harmonization_status || sectionKey || "unknown")}
          </span>
        </div>
        <h4 className="standard-item__title">{titleCaseMinor(item.title || "Untitled standard")}</h4>
      </div>

      {summary && summary !== item.title ? (
        <p className="standard-item__summary">{summary}</p>
      ) : null}

      {metaFields.length ? (
        <div className="standard-item__meta-grid">
          {metaFields.map((field) => (
            <div key={field.label} className="standard-item__meta-card">
              <div className="micro-label">{field.label}</div>
              <div className="standard-item__meta-value">{field.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {evidenceList.length ? (
        <div className="standard-item__evidence">
          <div className="micro-label">Evidence expected</div>
          <div className="tag-row">
            {evidenceList.map((entry) => (
              <span key={entry} className="soft-tag">
                {entry}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function RouteSection({ section }) {
  const [open, setOpen] = useState(true);
  const tone = directiveTone(section.key);
  const title = routeTitle(section);
  const subtitle =
    section.title && titleCaseMinor(section.title) !== title ? titleCaseMinor(section.title) : "";

  return (
    <section
      className="route-section"
      style={{
        "--route-tone-bg": tone.bg,
        "--route-tone-border": tone.bd,
        "--route-tone-dot": tone.dot,
      }}
    >
      <button type="button" className="route-section__toggle" onClick={() => setOpen((current) => !current)}>
        <div className="route-section__title-wrap">
          <div className="route-section__indicator" />
          <div>
            <div className="route-section__title-row">
              <h3>{title}</h3>
              <DirectivePill dirKey={section.key} />
            </div>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>

        <div className="route-section__meta">
          <span className="route-section__count">
            {section.count || 0} standard{section.count === 1 ? "" : "s"}
          </span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {open ? (
        <div className="route-section__body">
          {(section.items || []).map((item) => (
            <StandardItem
              key={`${section.key}-${item.code || item.title}-${item.version || ""}`}
              item={item}
              sectionKey={item.harmonization_status || "unknown"}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RegimeNav({ directiveBreakdown }) {
  if (!directiveBreakdown.length) return null;
  return (
    <div className="regime-nav">
      <div className="regime-nav__inner">
        {directiveBreakdown.map(({ key, count }) => {
          const tone = directiveTone(key);
          return (
            <div
              key={key}
              className="regime-chip"
              style={{
                "--chip-dot": tone.dot,
                "--chip-bg": tone.bg,
                "--chip-border": tone.bd,
                "--chip-text": tone.text,
              }}
            >
              <span className="regime-chip__dot" />
              <span className="regime-chip__label">{directiveShort(key)}</span>
              <span className="regime-chip__count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StandardsRoutePanel({ sections, directiveBreakdown }) {
  if (!sections.length) return null;

  return (
    <Panel
      className="panel--standards"
      eyebrow="Primary Output"
      title="Standards route"
      subtitle="Grouped by regime — scan the path without losing item-level detail."
    >
      <RegimeNav directiveBreakdown={directiveBreakdown} />

      <div className="route-stack">
        {sections.map((section) => (
          <RouteSection key={section.key || section.title} section={section} />
        ))}
      </div>
    </Panel>
  );
}

function DetailBlock({ title, subtitle, children }) {
  return (
    <section className="detail-block">
      <div className="detail-block__header">
        <h3>{title}</h3>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StructuredValue({ value }) {
  const text = serializePreview(value);

  if (Array.isArray(value)) {
    const primitiveArray = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        ["string", "number", "boolean"].includes(typeof item)
    );
    if (primitiveArray) {
      return (
        <div className="tag-row">
          {value.length ? (
            value.map((item, index) => (
              <span key={`${String(item)}-${index}`} className="soft-tag">
                {String(item)}
              </span>
            ))
          ) : (
            <span className="empty-copy">No values</span>
          )}
        </div>
      );
    }
  }

  if (typeof value === "object" && value !== null) {
    return <pre className="json-preview">{text}</pre>;
  }

  return <div className="detail-value">{text}</div>;
}

function DetailsPanel({ result }) {
  const [open, setOpen] = useState(false);

  if (!result) return null;

  const missingItems = result?.missing_information_items || [];
  const inputGapItems = uniqueBy(result?.input_gaps_panel?.items || [], (item) => item.key || item.message);
  const traits = result?.all_traits || [];
  const diagnostics = result?.diagnostics || [];
  const additionalEntries = getAdditionalEntries(result);

  if (!missingItems.length && !inputGapItems.length && !traits.length && !diagnostics.length && !additionalEntries.length) {
    return null;
  }

  const sectionCount = [
    missingItems.length,
    inputGapItems.length,
    traits.length,
    diagnostics.length,
    additionalEntries.length,
  ].filter(Boolean).length;

  return (
    <section className="panel">
      <button
        type="button"
        className={`details-toggle ${open ? "details-toggle--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="details-toggle__left">
          <span className="details-toggle__eyebrow">Full Detail</span>
          <span className="details-toggle__title">
            Structured analysis — {sectionCount} section{sectionCount === 1 ? "" : "s"}
          </span>
        </div>
        <ChevronDown size={15} className="details-toggle__chevron" />
      </button>

      {open ? (
        <div className="details-panel-body">
          {missingItems.length ? (
            <DetailBlock
              title="Missing information"
              subtitle="Direct prompts returned by the analysis engine."
            >
              <div className="detail-grid">
                {missingItems.map((item) => (
                  <article key={`${item.key}-${item.message}`} className="detail-card">
                    <div className="detail-card__header">
                      <div className="detail-card__title">{gapLabel(item.key)}</div>
                      {item.importance ? <ImportancePill value={item.importance} /> : null}
                    </div>
                    <p className="detail-card__text">{item.message || "No message returned."}</p>
                    {item.examples?.length ? (
                      <div className="tag-row">
                        {item.examples.map((example) => (
                          <span key={example} className="soft-tag">{example}</span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </DetailBlock>
          ) : null}

          {inputGapItems.length ? (
            <DetailBlock
              title="Input gaps"
              subtitle="Backend panel items, separate from the clarification list."
            >
              <div className="detail-grid">
                {inputGapItems.map((item) => (
                  <article key={`${item.key}-${item.message}`} className="detail-card">
                    <div className="detail-card__header">
                      <div className="detail-card__title">{gapLabel(item.key)}</div>
                      {item.importance ? <ImportancePill value={item.importance} /> : null}
                    </div>
                    <p className="detail-card__text">{item.message || "No message returned."}</p>
                    {item.examples?.length ? (
                      <div className="tag-row">
                        {item.examples.map((example) => (
                          <span key={example} className="soft-tag">{example}</span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </DetailBlock>
          ) : null}

          {traits.length ? (
            <DetailBlock title="Detected traits">
              <div className="tag-row">
                {traits.map((trait) => (
                  <span key={trait} className="soft-tag">{titleCase(trait)}</span>
                ))}
              </div>
            </DetailBlock>
          ) : null}

          {diagnostics.length ? (
            <details className="raw-json">
              <summary>Engine diagnostics ({diagnostics.length})</summary>
              <div style={{ margin: "0 15px 15px" }}>
                <div className="diagnostic-list">
                  {diagnostics.map((line, index) => (
                    <div key={`${line}-${index}`} className="diagnostic-line">{line}</div>
                  ))}
                </div>
              </div>
            </details>
          ) : null}

          {additionalEntries.length ? (
            <DetailBlock
              title="Additional structured output"
              subtitle="Top-level response fields not surfaced elsewhere."
            >
              <div className="detail-grid">
                {additionalEntries.map(([key, value]) => (
                  <article key={key} className="detail-card">
                    <div className="detail-card__header">
                      <div className="detail-card__title">{titleCaseMinor(key)}</div>
                    </div>
                    <StructuredValue value={value} />
                  </article>
                ))}
              </div>
            </DetailBlock>
          ) : null}

          <details className="raw-json">
            <summary>Raw analysis JSON</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      ) : null}
    </section>
  );
}

function CopyResultsButton({ result, description, routeSections, legislationGroups }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = buildClipboardSummary({
      result,
      description,
      routeSections,
      legislationGroups,
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch (_) {
      setCopied(false);
    }
  }, [description, legislationGroups, result, routeSections]);

  return (
    <button type="button" className="button button--secondary button--full" onClick={handleCopy}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copied" : "Copy analysis summary"}
    </button>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="error-banner" role="alert">
      <TriangleAlert size={16} />
      <div>
        <div className="error-banner__title">Analysis error</div>
        <div className="error-banner__text">{message}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  const items = [
    {
      icon: <Search size={16} />,
      title: "1. Describe the real product",
      text: "Include power, radios, control model, updates, materials, and any sensitive functions.",
    },
    {
      icon: <Waypoints size={16} />,
      title: "2. Review the route first",
      text: "The overview and route grouping are designed to make the first pass fast.",
    },
    {
      icon: <ShieldCheck size={16} />,
      title: "3. Refine with clarifications",
      text: "Use guided prompts to add scope-changing details, then re-run.",
    },
  ];

  return (
    <div className="empty-state-compact">
      {items.map((item) => (
        <div key={item.title} className="empty-state-step">
          <div className="empty-state-step__icon">{item.icon}</div>
          <div>
            <div className="empty-state-step__title">{item.title}</div>
            <div className="empty-state-step__text">{item.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScrollTopButton({ visible }) {
  return (
    <button
      type="button"
      className={`scroll-top ${visible ? "scroll-top--visible" : ""}`.trim()}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <ArrowUp size={15} />
    </button>
  );
}

export default function App() {
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [clarifyDirty, setClarifyDirty] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 360);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch(METADATA_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Metadata failed (${response.status})`);
        return response.json();
      })
      .then((data) => setMetadata(data))
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setMetadata({ traits: [], products: [], legislations: [] });
        }
      });

    return () => controller.abort();
  }, []);

  const templates = useMemo(() => {
    const dynamic = buildDynamicTemplates(metadata?.products || []);
    return dynamic.length ? dynamic : DEFAULT_TEMPLATES;
  }, [metadata]);

  const routeSections      = useMemo(() => buildRouteSections(result),          [result]);
  const guidanceItems      = useMemo(() => buildGuidanceItems(result),           [result]);
  const legislationItems   = useMemo(() => buildCompactLegislationItems(result), [result]);
  const legislationGroups  = useMemo(() => buildLegislationGroups(result),       [result]);
  const directiveBreakdown = useMemo(() => buildDirectiveBreakdown(routeSections), [routeSections]);

  const totalStandards = useMemo(
    () => routeSections.reduce((count, section) => count + (section.items || []).length, 0),
    [routeSections]
  );

  const chips = useMemo(() => {
    const backend = (result?.suggested_quick_adds || []).map((item) => ({
      label: titleCase(item.label),
      text: item.text,
    }));
    const frontend = buildGuidedChips(metadata, result);
    return uniqueBy([...backend, ...frontend], (item) => item.text).slice(0, 12);
  }, [metadata, result]);

  useEffect(() => {
    if (!result || !resultsRef.current) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [result]);

  const runAnalysis = useCallback(async () => {
    const payloadDescription = String(description || "").trim();
    if (!payloadDescription) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: payloadDescription, depth: "deep" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || `Analysis failed (${response.status})`);
      }

      setResult(data);
      setClarifyDirty(false);
    } catch (requestError) {
      setError(requestError?.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  }, [description]);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setDescription("");
    setError("");
    setClarifyDirty(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="app-shell">
      <TopBar result={result} totalStandards={totalStandards} onReset={resetAnalysis} />

      <main className={`page-shell page-main ${!result ? "page-main--landing" : ""}`.trim()}>
        <HeroPanel
          result={result}
          routeSections={routeSections}
          legislationItems={legislationItems}
          guidanceItems={guidanceItems}
        />

        <ComposerPanel
          description={description}
          setDescription={setDescription}
          templates={templates}
          chips={chips}
          onAnalyze={runAnalysis}
          busy={busy}
          onDirty={setClarifyDirty}
          isLanding={!result}
        />

        {!result && <EmptyState />}

        {error ? <ErrorBanner message={error} /> : null}

        <div ref={resultsRef} />

        {result ? (
          <div className="workspace-grid">
            <div className="workspace-main">
              <OverviewPanel
                result={result}
                routeSections={routeSections}
                legislationItems={legislationItems}
                directiveBreakdown={directiveBreakdown}
              />

              <StandardsRoutePanel sections={routeSections} directiveBreakdown={directiveBreakdown} />

              <ClarificationsPanel
                items={guidanceItems}
                dirty={clarifyDirty}
                busy={busy}
                onReanalyze={runAnalysis}
                onApply={(text) => {
                  setDescription((current) => {
                    const next = joinText(current, text);
                    if (next !== current) setClarifyDirty(true);
                    return next;
                  });
                }}
              />

              <DetailsPanel result={result} />

              <div className="footer-note">
                <span>
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>RuleGrid</span>
              </div>
            </div>

            <SnapshotRail
              result={result}
              routeSections={routeSections}
              legislationGroups={legislationGroups}
              description={description}
            />
          </div>
        ) : null}
      </main>

      <ScrollTopButton visible={scrolled} />
    </div>
  );
}