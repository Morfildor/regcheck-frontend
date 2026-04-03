import { useMemo } from "react";
import layoutStyles from "../AnalyzeWorkspaceLayout.module.css";
import { directiveShort, slugify } from "../helpers";
import { useResultsActiveSection, scrollToResultsSection } from "../hooks/useResultsActiveSection";
import { cx } from "./Pills";
import styles from "./ResultsSidebarNav.module.css";

function buildMainItems(viewModel) {
  const hasStandards = viewModel.routeSections.length > 0;
  const hasIssues    = viewModel.missingInputs.length > 0;
  const hasParallel  =
    (viewModel.conditionalLegislationGroups?.length || 0) +
    (viewModel.peripheralLegislationGroups?.length || 0) > 0;
  const hasEvidence  = viewModel.evidenceNeeds.length > 0;
  const blockerCount = viewModel.decisionSignals.blockerCount;

  return [
    { id: "section-summary",        label: "Summary" },
    hasStandards
      ? { id: "section-standards",  label: "Standards",      count: viewModel.totalStandards, accent: true }
      : null,
    hasIssues
      ? { id: "section-clarifications", label: "Clarifications", count: blockerCount > 0 ? blockerCount : null, warning: blockerCount > 0 }
      : null,
    hasParallel ? { id: "section-parallel", label: "Obligations" } : null,
    hasEvidence ? { id: "section-evidence",  label: "Evidence"    } : null,
  ].filter(Boolean);
}

function buildDirectiveItems(viewModel) {
  if (!viewModel.routeSections.length) return [];
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
}

export default function ResultsSidebarNav({ viewModel, children }) {
  const mainItems      = useMemo(() => buildMainItems(viewModel),      [viewModel]);
  const directiveItems = useMemo(() => buildDirectiveItems(viewModel), [viewModel]);

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

  const activeId = useResultsActiveSection(allSectionIds);

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
              const isSub    = item.level === "sub";
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
                    onClick={() => scrollToResultsSection(item.id)}
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
              onClick={() => scrollToResultsSection(item.id)}
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
                styles.pageSectionNavSubItem,
                activeId === dir.id ? styles.pageSectionNavItemActive : ""
              )}
              onClick={() => scrollToResultsSection(dir.id)}
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
