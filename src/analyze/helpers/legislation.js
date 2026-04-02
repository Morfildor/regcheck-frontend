// Legislation item and group building from API results.

import { directiveRank, directiveShort, isParallelObligationDirectiveKey } from "./directives";
import { titleCase, titleCaseMinor } from "./format";
import { uniqueBy } from "./text";
import { sortStandardItems } from "./standards";
import { buildRouteSections } from "./routes";

const LEGISLATION_GROUP_ORDER = ["ce", "non_ce", "future", "framework", "other"];

// ── Private helpers ───────────────────────────────────────────────────────────

function parallelObligationTitle(key, fallbackTitle) {
  const normalizedKey = String(key || "").toUpperCase();
  if (normalizedKey === "CRA")  return "Cyber Resilience Act";
  if (normalizedKey === "GDPR") return "GDPR";
  return titleCaseMinor(fallbackTitle || directiveShort(normalizedKey) || "Additional obligation");
}

function parallelObligationRationale(key) {
  const normalizedKey = String(key || "").toUpperCase();
  if (normalizedKey === "CRA") {
    return "Connected or software-enabled products can require Cyber Resilience Act review alongside the main CE route.";
  }
  if (normalizedKey === "GDPR") {
    return "Accounts, telemetry, cameras, microphones, or other personal data functions can add GDPR obligations beside product compliance.";
  }
  return "Review alongside the primary standards route.";
}

function parallelObligationScope(section) {
  const codes = sortStandardItems(section.items || [], section.key)
    .map((item) => String(item.code || "").trim())
    .filter(Boolean);

  if (!codes.length) return "";

  const visibleCodes = codes.slice(0, 3);
  const suffix = codes.length > visibleCodes.length ? `, +${codes.length - visibleCodes.length} more` : "";
  return `Returned review references: ${visibleCodes.join(", ")}${suffix}.`;
}

function buildSyntheticParallelLegislationItems(result, existingDirectiveKeys = new Set()) {
  return buildRouteSections(result)
    .filter(
      (section) =>
        isParallelObligationDirectiveKey(section.key) &&
        !existingDirectiveKeys.has(String(section.key || "").toUpperCase())
    )
    .map((section) => ({
      code:          directiveShort(section.key),
      title:         parallelObligationTitle(section.key, section.title),
      directive_key: section.key,
      rationale:     parallelObligationRationale(section.key),
      scope:         parallelObligationScope(section),
      summary:       parallelObligationRationale(section.key),
      section_key:   "non_ce",
      section_title: "Parallel",
    }));
}

// ── Public exports ────────────────────────────────────────────────────────────

export function compactLegislationGroupLabel(item) {
  const key = item.section_key || item.key;
  if (key === "framework") return "Additional";
  if (key === "non_ce")    return "Parallel";
  if (key === "future")    return "Future";
  if (key === "ce")        return "CE";
  return titleCase(key);
}

export function buildCompactLegislationItems(result) {
  const sections = result?.legislation_sections || [];
  const allItems = sections.flatMap((section) =>
    (section.items || []).map((item) => ({
      ...item,
      section_key:   section.key,
      section_title: section.title,
    }))
  );
  const existingDirectiveKeys = new Set(
    allItems.map((item) => String(item.directive_key || "").toUpperCase()).filter(Boolean)
  );
  const syntheticItems = buildSyntheticParallelLegislationItems(result, existingDirectiveKeys);

  return uniqueBy(
    [...allItems, ...syntheticItems].sort(
      (a, b) =>
        directiveRank(a.directive_key) - directiveRank(b.directive_key) ||
        String(a.code || "").localeCompare(String(b.code || ""))
    ),
    (item) => `${item.code}-${item.directive_key}-${item.title}`
  );
}

export function buildLegislationGroups(result) {
  const sections = (result?.legislation_sections || []).filter((section) => (section.items || []).length);
  const existingDirectiveKeys = new Set(
    sections.flatMap((section) =>
      (section.items || []).map((item) => String(item.directive_key || "").toUpperCase()).filter(Boolean)
    )
  );
  const syntheticItems = buildSyntheticParallelLegislationItems(result, existingDirectiveKeys);

  if (sections.length) {
    const normalizedSections = sections
      .map((section) => ({
        ...section,
        items: uniqueBy(
          (section.items || []).map((item) => ({ ...item, section_key: section.key })),
          (item) => `${item.code}-${item.directive_key || item.title}`
        ),
      }))
      .sort(
        (a, b) =>
          LEGISLATION_GROUP_ORDER.indexOf(a.key) - LEGISLATION_GROUP_ORDER.indexOf(b.key)
      );

    if (syntheticItems.length) {
      const index = normalizedSections.findIndex((section) => section.key === "non_ce");
      if (index >= 0) {
        normalizedSections[index] = {
          ...normalizedSections[index],
          items: uniqueBy(
            [...(normalizedSections[index].items || []), ...syntheticItems],
            (item) => `${item.code}-${item.directive_key || item.title}`
          ),
        };
      } else {
        normalizedSections.push({ key: "non_ce", title: "Parallel", items: syntheticItems });
      }
    }

    return normalizedSections.sort(
      (a, b) =>
        LEGISLATION_GROUP_ORDER.indexOf(a.key) - LEGISLATION_GROUP_ORDER.indexOf(b.key)
    );
  }

  const grouped = {};
  buildCompactLegislationItems(result).forEach((item) => {
    const key = item.section_key || "other";
    if (!grouped[key]) {
      grouped[key] = { key, title: compactLegislationGroupLabel(item), items: [] };
    }
    grouped[key].items.push(item);
  });

  return Object.values(grouped).sort(
    (a, b) =>
      LEGISLATION_GROUP_ORDER.indexOf(a.key) - LEGISLATION_GROUP_ORDER.indexOf(b.key)
  );
}
