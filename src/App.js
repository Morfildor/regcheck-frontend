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

function MetricCard({ label, value, detail }) {
  return (
    <div className="metric-card">
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      {detail ? <div className="metric-card__detail">{detail}</div> : null}
    </div>
  );
}

function TopBar({ result, totalStandards, onReset }) {
  return (
    <header className="topbar">
      <div className="page-shell topbar__inner">
        <div className="brand">
          <div className="brand__mark">
            <Waypoints size={16} strokeWidth={2.3} />
          </div>
          <div>
            <div className="brand__title">RuleGrid</div>
            <div className="brand__subtitle">Guided EU regulatory scoping</div>
          </div>
        </div>

        <div className="topbar__meta">
          {result ? (
            <>
              <RiskPill value={result?.overall_risk || "MEDIUM"} />
              <span className="topbar__count">{totalStandards} standards in route</span>
              <button type="button" className="button button--secondary" onClick={onReset}>
                <RefreshCcw size={14} />
                New analysis
              </button>
            </>
          ) : (
            <span className="topbar__hint">Cleaner hierarchy, same depth of output</span>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroPanel({ result, routeSections, legislationItems, guidanceItems }) {
  const hero = result?.hero_summary || {};
  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const title = result
    ? hero.title || `Review the ${formatUiLabel(result?.product_type || "product")} route`
    : "Professional regulatory scoping for dense product decisions";
  const subtitle = result
    ? result?.summary ||
      hero.subtitle ||
      "Use the overview first, then work through clarifications and route sections."
    : "Describe the actual product configuration and RuleGrid returns a standards route, legislation context, and the questions that materially change scope.";
  const primaryRegimes = hero.primary_regimes || [];

  const supportItems = result
    ? [
        {
          icon: <ListChecks size={16} />,
          title: `${routeSections.length} route sections`,
          text: "Standards are grouped so safety, EMC, radio, and cybersecurity are easier to scan.",
        },
        {
          icon: <ShieldCheck size={16} />,
          title: `${legislationItems.length} legislation items`,
          text: "Applicable frameworks stay visible in the side rail while you read the route.",
        },
        {
          icon: <Search size={16} />,
          title: `${guidanceItems.length} clarification prompts`,
          text: "These are the details most likely to change the scope of the result.",
        },
      ]
    : [
        {
          icon: <Search size={16} />,
          title: "Power and major function",
          text: "Call out mains power, battery, heating, motors, pumps, sensors, or cameras.",
        },
        {
          icon: <Waypoints size={16} />,
          title: "Connectivity and updates",
          text: "Mention Wi-Fi, Bluetooth, cloud dependency, app control, and OTA firmware updates.",
        },
        {
          icon: <ShieldCheck size={16} />,
          title: "Materials and contact paths",
          text: "Include wetted paths, food-contact parts, battery chemistry, or replaceable parts.",
        },
      ];

  return (
    <div className="hero-grid">
      <Panel className="panel--hero" eyebrow="Guided Workspace" title={title} subtitle={subtitle}>
        <div className="hero-panel__content">
          <div className="hero-panel__tags">
            {result ? (
              <>
                <RiskPill value={result?.overall_risk || "MEDIUM"} />
                <span className="soft-tag">Confidence: {formatUiLabel(confidence)}</span>
                {result?.product_type ? (
                  <span className="soft-tag">Product: {formatUiLabel(result.product_type)}</span>
                ) : null}
              </>
            ) : (
              <>
                <span className="soft-tag">
                  <Sparkles size={14} />
                  Guided clarifications
                </span>
                <span className="soft-tag">
                  <ListChecks size={14} />
                  Standards route
                </span>
                <span className="soft-tag">
                  <ShieldCheck size={14} />
                  Legislation context
                </span>
              </>
            )}
          </div>

          {primaryRegimes.length ? (
            <div className="tag-row">
              {primaryRegimes.map((dirKey) => (
                <DirectivePill key={dirKey} dirKey={dirKey} />
              ))}
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel
        className="panel--support"
        eyebrow={result ? "Current Output" : "Best Input"}
        title={result ? "What this analysis covers" : "What to include in the description"}
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

function ComposerPanel({ description, setDescription, templates, chips, onAnalyze, busy, onDirty }) {
  const charMax = 1200;
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const usageState =
    description.length > charMax * 0.9
      ? "counter--danger"
      : description.length > charMax * 0.7
        ? "counter--warn"
        : "";

  return (
    <Panel
      eyebrow="Input"
      title="Describe the product"
      subtitle="Use the real operating setup, not marketing copy. Clear technical detail produces a more stable route."
      action={<span className="keyboard-hint">Ctrl / Cmd + Enter to analyze</span>}
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

        <label className="composer__field">
          <textarea
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
            placeholder="Example: Connected espresso machine with Wi-Fi radio, OTA updates, cloud account, mains power, grinder, pressure system, and food-contact brew path."
            rows={8}
            maxLength={charMax}
            spellCheck={false}
            className="composer__textarea"
          />
          <div className="composer__field-footer">
            <div className="composer__helper">
              Mention power, radios, cloud dependency, updates, core functions, key sensors, and any food-contact or wetted-path detail.
            </div>
            <div className={`counter ${usageState}`.trim()}>
              {wordCount ? <span>{wordCount} words</span> : null}
              <span>
                {description.length} / {charMax}
              </span>
            </div>
          </div>
        </label>

        {chips.length ? (
          <div className="composer__block">
            <div className="micro-label">Add missing detail fast</div>
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
            {busy ? <LoaderCircle size={16} className="spin" /> : <Search size={16} />}
            {busy ? "Analyzing" : "Analyze product"}
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

function OverviewPanel({ result, routeSections, legislationItems, directiveBreakdown }) {
  if (!result) return null;

  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const primaryRegimes = result?.hero_summary?.primary_regimes || [];
  const totalStandards = routeSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );

  return (
    <Panel
      eyebrow="Overview"
      title="Analysis overview"
      subtitle="Start here before reading the route cards. This panel keeps the high-level outcome compact."
    >
      <div className="overview-grid">
        <div className="overview-grid__summary">
          <div className="lead-copy">{result?.summary || "No summary returned from the analysis."}</div>
          {primaryRegimes.length ? (
            <div className="tag-row">
              {primaryRegimes.map((dirKey) => (
                <DirectivePill key={dirKey} dirKey={dirKey} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="metric-grid">
          <MetricCard label="Detected product" value={formatUiLabel(result?.product_type || "unclear")} />
          <MetricCard label="Confidence" value={formatUiLabel(confidence)} />
          <MetricCard label="Overall risk" value={formatUiLabel(result?.overall_risk || "MEDIUM")} />
          <MetricCard label="Standards" value={String(totalStandards)} />
          <MetricCard label="Legislation" value={String(legislationItems.length)} />
        </div>
      </div>

      {directiveBreakdown.length ? (
        <div className="route-breakdown">
          {directiveBreakdown.map(({ key, count }) => (
            <span key={key} className="breakdown-pill">
              <DirectivePill dirKey={key} />
              <span className="breakdown-pill__count">{count}</span>
            </span>
          ))}
        </div>
      ) : null}
    </Panel>
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
        title="Keep the context visible"
        subtitle="The route is on the left. Product identity and legislation stay pinned here."
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
                    return (
                      <div
                        key={`${group.key}-${item.code}-${item.title}`}
                        className="legislation-item"
                        style={{ "--legislation-dot": tone.dot }}
                      >
                        <div className="legislation-item__code">{item.code}</div>
                        <div className="legislation-item__copy">
                          <div className="legislation-item__title">{item.title}</div>
                          <div className="legislation-item__directive">
                            {directiveShort(item.directive_key || "OTHER")}
                          </div>
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
    <Panel
      eyebrow="Clarifications"
      title="Questions that materially change scope"
      subtitle="Use these prompts to strengthen the description before trusting the route."
      action={
        dirty ? (
          <button type="button" className="button button--primary" onClick={onReanalyze} disabled={busy}>
            {busy ? <LoaderCircle size={16} className="spin" /> : <RefreshCcw size={16} />}
            {busy ? "Re-running" : "Re-run analysis"}
          </button>
        ) : (
          <span className="keyboard-hint">Apply a detail below to update the description</span>
        )
      }
    >
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
    </Panel>
  );
}

function StandardItem({ item, sectionKey }) {
  const dirKey = normalizeStandardDirective(item);
  const dirTone = directiveTone(dirKey);
  const sectionTone = SECTION_TONES[sectionKey] || SECTION_TONES.unknown;
  const evidenceList = sentenceCaseList(item.evidence_hint || []);
  const summary = item.standard_summary || item.reason || item.notes || "";
  const metaFields = [
    { label: "Harmonized ref.", value: prettyValue(item.harmonized_reference) },
    { label: "Harmonized version", value: prettyValue(item.dated_version) },
    { label: "EU latest version", value: prettyValue(item.version) },
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
            <p>
              {section.count || 0} standard{section.count === 1 ? "" : "s"}
              {subtitle ? ` • ${subtitle}` : ""}
            </p>
          </div>
        </div>

        <div className="route-section__meta">
          <span className="route-section__count">
            {section.count || 0} item{section.count === 1 ? "" : "s"}
          </span>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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

function StandardsRoutePanel({ sections, directiveBreakdown }) {
  if (!sections.length) return null;

  return (
    <Panel
      eyebrow="Primary Output"
      title="Standards route"
      subtitle="Grouped by route so you can scan the decision path without losing the item-level detail."
    >
      {directiveBreakdown.length ? (
        <div className="route-breakdown">
          {directiveBreakdown.map(({ key, count }) => (
            <span key={key} className="breakdown-pill">
              <DirectivePill dirKey={key} />
              <span className="breakdown-pill__count">{count}</span>
            </span>
          ))}
        </div>
      ) : null}

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
  if (!result) return null;

  const missingItems = result?.missing_information_items || [];
  const inputGapItems = uniqueBy(result?.input_gaps_panel?.items || [], (item) => item.key || item.message);
  const traits = result?.all_traits || [];
  const diagnostics = result?.diagnostics || [];
  const additionalEntries = getAdditionalEntries(result);

  if (!missingItems.length && !inputGapItems.length && !traits.length && !diagnostics.length && !additionalEntries.length) {
    return null;
  }

  return (
    <Panel
      eyebrow="Full Detail"
      title="Structured analysis details"
      subtitle="Nothing is removed. The dense output is grouped so it reads cleanly without hiding the backend response."
    >
      <div className="details-stack">
        {missingItems.length ? (
          <DetailBlock
            title="Missing information from the current description"
            subtitle="These are the direct prompts returned by the analysis."
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
                        <span key={example} className="soft-tag">
                          {example}
                        </span>
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
            title="Input gaps panel"
            subtitle="This mirrors the backend panel items separately from the shorter clarification list."
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
                        <span key={example} className="soft-tag">
                          {example}
                        </span>
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
                <span key={trait} className="soft-tag">
                  {titleCase(trait)}
                </span>
              ))}
            </div>
          </DetailBlock>
        ) : null}

        {diagnostics.length ? (
          <DetailBlock title="Engine diagnostics">
            <div className="diagnostic-list">
              {diagnostics.map((line, index) => (
                <div key={`${line}-${index}`} className="diagnostic-line">
                  {line}
                </div>
              ))}
            </div>
          </DetailBlock>
        ) : null}

        {additionalEntries.length ? (
          <DetailBlock
            title="Additional structured output"
            subtitle="Top-level response fields not already surfaced elsewhere."
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
    </Panel>
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
      {copied ? <Check size={16} /> : <Copy size={16} />}
      {copied ? "Copied summary" : "Copy analysis summary"}
    </button>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="error-banner" role="alert">
      <TriangleAlert size={18} />
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
      icon: <Search size={18} />,
      title: "1. Describe the real product",
      text: "Include power, radios, control model, updates, materials, and any sensitive functions.",
    },
    {
      icon: <Waypoints size={18} />,
      title: "2. Review the route first",
      text: "The analysis overview and route grouping are designed to make the first pass fast.",
    },
    {
      icon: <ShieldCheck size={18} />,
      title: "3. Refine with clarifications",
      text: "Use guided prompts to add scope-changing details, then run the analysis again.",
    },
  ];

  return (
    <Panel
      className="panel--empty"
      eyebrow="Workflow"
      title="A cleaner route starts with a specific product description"
      subtitle="The UI stays simple until there is output, then the route expands into guided sections instead of equal-weight cards."
    >
      <div className="empty-grid">
        {items.map((item) => (
          <div key={item.title} className="empty-card">
            <div className="empty-card__icon">{item.icon}</div>
            <div className="empty-card__title">{item.title}</div>
            <div className="empty-card__text">{item.text}</div>
          </div>
        ))}
      </div>
    </Panel>
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
      <ArrowUp size={16} />
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
        if (!response.ok) {
          throw new Error(`Metadata failed (${response.status})`);
        }
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

  const routeSections = useMemo(() => buildRouteSections(result), [result]);
  const guidanceItems = useMemo(() => buildGuidanceItems(result), [result]);
  const legislationItems = useMemo(() => buildCompactLegislationItems(result), [result]);
  const legislationGroups = useMemo(() => buildLegislationGroups(result), [result]);
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

      <main className="page-shell page-main">
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
        />

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

              <ClarificationsPanel
                items={guidanceItems}
                dirty={clarifyDirty}
                busy={busy}
                onReanalyze={runAnalysis}
                onApply={(text) => {
                  setDescription((current) => {
                    const next = joinText(current, text);
                    if (next !== current) {
                      setClarifyDirty(true);
                    }
                    return next;
                  });
                }}
              />

              <StandardsRoutePanel sections={routeSections} directiveBreakdown={directiveBreakdown} />
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
        ) : (
          <EmptyState />
        )}
      </main>

      <ScrollTopButton visible={scrolled} />
    </div>
  );
}
