import { useState, useMemo, useEffect } from "react";
import layoutStyles from "../AnalyzeWorkspaceLayout.module.css";
import { directiveShort, slugify } from "../helpers";
import { cx } from "./Pills";
import styles from "./ResultsSidebarNav.module.css";

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const header = document.querySelector("header");
  const headerH = header ? header.getBoundingClientRect().height : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export default function ResultsSidebarNav({ viewModel, children }) {
  const [activeId, setActiveId] = useState(null);

  const hasIssues   = viewModel.missingInputs.length > 0;
  const hasStandards = viewModel.routeSections.length > 0;
  const hasParallel =
    (viewModel.conditionalLegislationGroups?.length || 0) +
    (viewModel.peripheralLegislationGroups?.length || 0) > 0;
  const hasEvidence = viewModel.evidenceNeeds.length > 0;
  const blockerCount = viewModel.decisionSignals.blockerCount;

  const mainItems = useMemo(
    () =>
      [
        { id: "section-summary",   label: "Summary" },
        hasStandards
          ? { id: "section-standards", label: "Standards", count: viewModel.totalStandards, accent: true }
          : null,
        hasIssues
          ? { id: "section-action", label: "Clarifications", count: blockerCount > 0 ? blockerCount : null, warning: blockerCount > 0 }
          : null,
        hasParallel ? { id: "section-parallel", label: "Obligations" } : null,
        hasEvidence ? { id: "section-evidence", label: "Evidence"    } : null,
      ].filter(Boolean),
    [hasStandards, hasIssues, hasParallel, hasEvidence, viewModel.totalStandards, blockerCount]
  );

  const directiveItems = useMemo(() => {
    if (!hasStandards) return [];
    if (viewModel.isRadioProduct && viewModel.redGroup) {
      return [
        { id: "route-section-red", label: "RED", count: viewModel.redGroup.totalItems },
        ...(viewModel.displayRouteSections || [])
          .filter((s) => s.key !== "RED" && s.key !== "LVD" && s.key !== "EMC")
          .map((s) => ({
            id: `route-section-${slugify(s.key || s.title)}`,
            label: directiveShort(s.key || "OTHER"),
            count: (s.items || []).length,
          })),
      ];
    }
    return viewModel.routeSections.map((s) => ({
      id: `route-section-${slugify(s.key || s.title)}`,
      label: directiveShort(s.key || "OTHER"),
      count: (s.items || []).length,
    }));
  }, [hasStandards, viewModel.isRadioProduct, viewModel.redGroup, viewModel.displayRouteSections, viewModel.routeSections]);

  const allSectionIds = useMemo(() => {
    const ids = [];
    for (const item of mainItems) {
      ids.push(item.id);
      if (item.id === "section-standards") {
        for (const dir of directiveItems) ids.push(dir.id);
      }
    }
    return ids;
  }, [mainItems, directiveItems]);

  const flatSidebarItems = useMemo(() => {
    const result = [];
    for (const item of mainItems) {
      result.push({ ...item, level: "main" });
      if (item.id === "section-standards") {
        for (const dir of directiveItems) result.push({ ...dir, level: "sub" });
      }
    }
    return result;
  }, [mainItems, directiveItems]);

  useEffect(() => {
    if (!allSectionIds.length) return;
    const handleScroll = () => {
      const header = document.querySelector("header");
      const offset = (header ? header.getBoundingClientRect().height : 60) + 24;
      let found = null;
      for (const id of allSectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= offset) found = id;
      }
      setActiveId(found || allSectionIds[0] || null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allSectionIds]);

  // Not enough sections to warrant navigation
  if (mainItems.length < 2) {
    return <div className={layoutStyles.resultsContentStack}>{children}</div>;
  }

  return (
    <div className={layoutStyles.resultsWithSidebar}>
      {/* Desktop sticky sidebar */}
      <div className={layoutStyles.resultsSidebarSticky}>
        <nav className={styles.resultsSidebarNav} aria-label="Results sections">
          <ol className={styles.sidebarNavList}>
            {flatSidebarItems.map((item) => {
              const isSub = item.level === "sub";
              const isActive = activeId === item.id;
              return (
                <li key={item.id} className={isSub ? styles.sidebarNavSubEntry : styles.sidebarNavEntry}>
                  <button
                    type="button"
                    className={cx(
                      isSub ? styles.sidebarNavSubBtn : styles.sidebarNavBtn,
                      isActive ? (isSub ? styles.sidebarNavSubBtnActive : styles.sidebarNavBtnActive) : "",
                      !isSub && item.warning ? styles.sidebarNavBtnWarning : ""
                    )}
                    onClick={() => scrollToSection(item.id)}
                  >
                    <span className={isSub ? styles.sidebarNavSubNode : styles.sidebarNavNode} />
                    <span className={styles.sidebarNavLabel}>{item.label}</span>
                    {item.count != null ? (
                      <span className={cx(
                        styles.sidebarNavBadge,
                        !isSub && item.warning ? styles.sidebarNavBadgeWarning : ""
                      )}>
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Content column with mobile chip nav */}
      <div className={layoutStyles.resultsContentStack}>
        <nav className={styles.sidebarNavMobileRow} aria-label="Jump to results section">
          {mainItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cx(
                styles.pageSectionNavItem,
                item.warning ? styles.pageSectionNavWarning : "",
                item.accent  ? styles.pageSectionNavAccent  : "",
                activeId === item.id ? styles.pageSectionNavItemActive : ""
              )}
              onClick={() => scrollToSection(item.id)}
            >
              {item.label}
              {item.count != null ? (
                <span className={cx(
                  styles.pageSectionNavCount,
                  item.warning ? styles.pageSectionNavCountWarning : "",
                  item.accent  ? styles.pageSectionNavCountAccent  : ""
                )}>
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
          {directiveItems.map((dir) => (
            <button
              key={dir.id}
              type="button"
              className={cx(
                styles.pageSectionNavItem,
                activeId === dir.id ? styles.pageSectionNavItemActive : ""
              )}
              onClick={() => scrollToSection(dir.id)}
            >
              {dir.label}
              <span className={styles.pageSectionNavCount}>{dir.count}</span>
            </button>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}
