// Clipboard / export summary builder.

import { routeTitle, directiveShort } from "./directives";
import { formatUiLabel } from "./format";
import { sortStandardItems } from "./standards";

function sectionHead(label, width = 48) {
  const pad = Math.max(0, width - label.length - 5);
  return `─── ${label} ${"─".repeat(pad)}`;
}

export function buildClipboardSummary({
  result,
  description,
  routeSections,
  legislationGroups,
  missingInputs = [],
  evidenceNeeds = [],
}) {
  const confidence      = result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const confidenceLabel = formatUiLabel(confidence);
  const isPreliminary   = String(confidence).toLowerCase() !== "high";
  const productType     = formatUiLabel(result?.product_type || "unclear");

  const blockers       = missingInputs.filter((i) => i.severity === "blocker");
  const routeAffecting = missingInputs.filter((i) => i.severity === "route-affecting");

  const totalStandards = routeSections.reduce((sum, s) => sum + (s.items || []).length, 0);
  const coreSections   = routeSections.filter((s) => s.sectionKind === "core");

  // Primary route: core directives first
  const routeDirectives = (coreSections.length ? coreSections : routeSections)
    .slice(0, 4)
    .map((s) => directiveShort(s.key || "OTHER"));
  const routeLine = routeDirectives.length ? routeDirectives.join(" / ") : "—";

  const parallelItems = legislationGroups
    .filter((g) => g.key === "non_ce" || g.groupKey === "non_ce")
    .flatMap((g) => g.items || []);

  const nextActionLines = evidenceNeeds.flatMap((need) =>
    (need.nextActions || []).map((action) => `  [${need.label}] ${action}`)
  );

  const div = "─".repeat(49);
  const hasBlockers       = blockers.length > 0;
  const hasRouteAffecting = routeAffecting.length > 0;

  return [
    "RuleGrid — Regulatory scoping summary",
    div,
    "",
    `Product:     ${productType}`,
    `Confidence:  ${confidenceLabel}${isPreliminary ? "  ⚠ preliminary" : ""}`,
    `Route:       ${routeLine}  ·  ${totalStandards} standard${totalStandards === 1 ? "" : "s"}`,
    result?.summary ? `\n${result.summary}` : null,
    "",

    // Clarifications needed
    hasBlockers || hasRouteAffecting ? sectionHead("Clarifications needed") : null,
    ...blockers.map((i) =>
      `  ▲ Blocker: ${i.title}${i.reason ? `\n     ${i.reason}` : ""}`
    ),
    hasBlockers && hasRouteAffecting ? "" : null,
    ...routeAffecting.map((i) =>
      `  · Route-affecting: ${i.title}${i.reason ? `\n     ${i.reason}` : ""}`
    ),
    hasBlockers || hasRouteAffecting ? "" : null,

    // Standards by directive
    sectionHead("Standards route"),
    ...routeSections.flatMap((section) => {
      const count = (section.items || []).length;
      const bucket = section.applicabilityBucket ? `  ·  ${section.applicabilityBucket}` : "";
      return [
        `${routeTitle(section)}  (${count} standard${count === 1 ? "" : "s"}${bucket})`,
        section.shortRationale ? `  ${section.shortRationale}` : null,
        ...sortStandardItems(section.items || []).map((item) =>
          `  • ${item.code}${item.title ? `  —  ${item.title}` : ""}`
        ),
        "",
      ];
    }),

    // Next actions
    nextActionLines.length ? sectionHead("Next actions") : null,
    ...nextActionLines,
    nextActionLines.length ? "" : null,

    // Parallel obligations
    parallelItems.length ? sectionHead("Parallel obligations") : null,
    ...parallelItems.map((i) =>
      `  • ${i.code || i.title}${i.title && i.code ? `  —  ${i.title}` : ""}`
    ),
    parallelItems.length ? "" : null,

    div,
    "RuleGrid · First-pass scoping only · Not a conformity decision or legal advice",
  ]
    .flat()
    .filter((line) => line !== null)
    .join("\n");
}
