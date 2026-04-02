import { useState, useCallback, useMemo } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import Surface from "../../shared/ui/Surface";
import { routeTitle, directiveShort, inferStandardCategory, titleCaseMinor, slugify } from "../helpers";
import { APPLICABILITY_BADGE, APPLICABILITY_GLOSSARY } from "../workspaceGlossary";
import { TonePill, DirectivePill, cx } from "./Pills";
import styles from "./StandardsRoute.module.css";

const ROUTE_SECTION_CLASS = {
  core:        styles.routeCardCore,
  conditional: styles.routeCardConditional,
  secondary:   styles.routeCardSecondary,
};

// ── Standard card ──────────────────────────────────────────────────────────

function StandardCard({ item }) {
  const hasVersionInfo = item.version || item.dated_version || item.harmonized_reference;
  const isHarmonized = Boolean(item.dated_version || item.harmonized_reference);
  const categoryTag = inferStandardCategory(item);
  return (
    <article className={cx(styles.standardCard, isHarmonized ? styles.standardCardHarmonized : "")}>
      <div className={styles.standardCardTop}>
        <span className={styles.standardCode}>{item.code || "Standard"}</span>
        {isHarmonized ? (
          <span className={styles.harmonizedBadge}>Harmonized</span>
        ) : categoryTag ? (
          <TonePill tone="muted">{categoryTag}</TonePill>
        ) : null}
        {isHarmonized && categoryTag ? <TonePill tone="muted">{categoryTag}</TonePill> : null}
      </div>
      <div className={styles.standardCardBody}>
        <h4 className={styles.standardTitle}>{titleCaseMinor(item.title || "Untitled standard")}</h4>
        {item.shortRationale ? <p className={styles.microRationale}>{item.shortRationale}</p> : null}
      </div>
      {hasVersionInfo ? (
        <div className={styles.standardVersionRow}>
          {item.dated_version ? (
            <div className={styles.standardVersionItem}>
              <span className={styles.versionLabel}>Harmonized ref</span>
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

// ── RED article branch ─────────────────────────────────────────────────────

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

// ── RED group card ─────────────────────────────────────────────────────────

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
              {redGroup.totalItems} standard{redGroup.totalItems === 1 ? "" : "s"} across{" "}
              {redGroup.branches.length} article branch{redGroup.branches.length === 1 ? "" : "es"}
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

// ── Route quick nav ────────────────────────────────────────────────────────

function RouteQuickNav({ sections, openKeys, isRadioProduct, redGroup }) {
  const orderedSections = (sections || []).filter(Boolean);

  function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const scrollToSection = (keyOrTitle) =>
    scrollToId(`route-section-${slugify(keyOrTitle)}`);

  if (!orderedSections.length && !isRadioProduct) return null;

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
              aria-pressed={!!openKeys?.has(section.key || section.title)}
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
              aria-pressed={!!openKeys?.has(section.key || section.title)}
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

// ── Route section accordion ────────────────────────────────────────────────

function RouteSectionCard({ section, open, onToggle }) {
  const sectionId = `route-section-${slugify(section.key || section.title)}`;
  const applicabilityTone =
    section.sectionKind === "core" ? "strong"
    : section.sectionKind === "conditional" ? "warning"
    : "muted";

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
          <div className={styles.accordionTitleMeta}>
            <DirectivePill directiveKey={section.key || "OTHER"} linkToPage />
            {(() => {
              const bucketKey = (section.applicabilityBucket || "route review").toLowerCase();
              const badge = APPLICABILITY_BADGE[bucketKey];
              const label = badge?.label ?? (section.applicabilityBucket || "Route review");
              const tone = badge?.tone ?? applicabilityTone;
              return (
                <TonePill tone={tone} tip={APPLICABILITY_GLOSSARY[bucketKey]}>
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

// ── StandardsRoutePanel (exported) ────────────────────────────────────────

export default function StandardsRoutePanel({ viewModel }) {
  const isRadioProduct = viewModel.isRadioProduct;
  const redGroup = viewModel.redGroup;
  const displayRouteSections = viewModel.displayRouteSections || viewModel.routeSections;

  const [openKeys, setOpenKeys] = useState(() => {
    if (isRadioProduct) return new Set(["3.2"]);
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
