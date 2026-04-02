// Clipboard / export summary builder.

import { routeTitle, directiveShort } from "./directives";
import { formatUiLabel } from "./format";
import { sortStandardItems } from "./standards";

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

  const blockers       = missingInputs.filter((item) => item.severity === "blocker");
  const routeAffecting = missingInputs.filter((item) => item.severity === "route-affecting");
  const hasWarnings    = blockers.length > 0 || routeAffecting.length > 0;

  const totalStandards = routeSections.reduce((sum, s) => sum + (s.items || []).length, 0);

  const primaryDirectives = routeSections
    .filter((s) => s.sectionKind === "core")
    .slice(0, 3)
    .map((s) => directiveShort(s.key || "OTHER"));
  const routeLine = primaryDirectives.length
    ? primaryDirectives.join(" / ")
    : routeSections.slice(0, 3).map((s) => directiveShort(s.key || "OTHER")).join(" / ") || "—";

  const parallelItems = legislationGroups
    .filter((group) => group.key === "non_ce" || group.groupKey === "non_ce")
    .flatMap((group) => group.items || []);

  const nextActionLines = evidenceNeeds.flatMap((need) =>
    (need.nextActions || []).map((action) => `  [${need.label}] ${action}`)
  );

  const divider     = "─────────────────────────────────────────────────";
  const dividerMid  = divider.slice(0, 40);

  return [
    "RuleGrid — Regulatory scoping summary",
    divider,
    "",
    `Product:     ${productType}`,
    `Confidence:  ${confidenceLabel}${isPreliminary ? "  (preliminary — re-run with more detail to improve)" : ""}`,
    `Route:       ${routeLine}  ·  ${totalStandards} standard${totalStandards === 1 ? "" : "s"}`,
    result?.summary ? `Summary:     ${result.summary}` : null,
    "",
    hasWarnings ? "OPEN QUESTIONS" : null,
    hasWarnings ? dividerMid : null,
    ...blockers.map((item) =>
      `  ▲ Blocker         — ${item.title}${item.reason ? `: ${item.reason}` : ""}`
    ),
    ...routeAffecting.map((item) =>
      `  · Route-affecting — ${item.title}${item.reason ? `: ${item.reason}` : ""}`
    ),
    hasWarnings ? "" : null,
    "STANDARDS ROUTE",
    dividerMid,
    ...routeSections.flatMap((section) => [
      `${routeTitle(section)}  (${(section.items || []).length})`,
      ...sortStandardItems(section.items || []).map((item) =>
        `  • ${item.code}${item.title ? `  —  ${item.title}` : ""}`
      ),
      "",
    ]),
    "PARALLEL OBLIGATIONS",
    dividerMid,
    ...(parallelItems.length
      ? parallelItems.map((item) =>
          `  • ${item.code || item.title}${item.title && item.code ? `  —  ${item.title}` : ""}`
        )
      : ["  None beyond the primary directive route."]),
    "",
    ...(nextActionLines.length
      ? ["NEXT ACTIONS", dividerMid, ...nextActionLines, ""]
      : []),
    "DESCRIPTION USED",
    dividerMid,
    description || "(none)",
    "",
    divider,
    "RuleGrid · First-pass scoping only · Not a conformity decision or legal advice",
  ]
    .flat()
    .filter((line) => line !== null)
    .join("\n");
}
