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
  const traits          = result?.all_traits || [];
  const riskLabel       = formatUiLabel(result?.overall_risk || "medium");
  const productType     = formatUiLabel(result?.product_type || "unclear");

  const blockers       = missingInputs.filter((item) => item.severity === "blocker");
  const routeAffecting = missingInputs.filter((item) => item.severity === "route-affecting");
  const hasWarnings    = blockers.length > 0 || routeAffecting.length > 0;

  const nextActionLines = evidenceNeeds.flatMap((need) =>
    (need.nextActions || []).map((action) => `  [${need.label}] ${action}`)
  );

  const parallelItems = legislationGroups
    .filter((group) => group.key === "non_ce" || group.groupKey === "non_ce")
    .flatMap((group) => group.items || []);

  const totalStandards = routeSections.reduce((sum, s) => sum + (s.items || []).length, 0);
  const divider = "─────────────────────────────────────────────────";

  return [
    "RuleGrid — First-pass regulatory analysis",
    divider,
    "",
    `Confidence:  ${confidenceLabel}${isPreliminary ? "  (re-run with more detail to improve)" : ""}`,
    `Risk level:  ${riskLabel}`,
    `Match:       ${productType}  ·  ${totalStandards} standard${totalStandards === 1 ? "" : "s"}`,
    result?.summary ? `Summary:     ${result.summary}` : null,
    "",
    hasWarnings ? "WARNINGS" : null,
    hasWarnings ? divider.slice(0, 40) : null,
    ...blockers.map((item)       => `  ▲ [Blocker]         ${item.title}: ${item.reason}`),
    ...routeAffecting.map((item) => `  · [Route-affecting] ${item.title}: ${item.reason}`),
    hasWarnings ? "" : null,
    "STANDARDS ROUTE",
    divider.slice(0, 40),
    ...routeSections.flatMap((section) => [
      `${routeTitle(section)}  (${(section.items || []).length})`,
      ...sortStandardItems(section.items || []).map((item) =>
        `  • ${item.code}${item.title ? `  —  ${item.title}` : ""}`
      ),
      "",
    ]),
    "PARALLEL OBLIGATIONS",
    divider.slice(0, 40),
    ...(parallelItems.length
      ? parallelItems.map((item) =>
          `  • ${item.code || item.title}${item.title && item.code ? `  —  ${item.title}` : ""}`
        )
      : ["  None returned beyond the primary directive route."]),
    "",
    ...(nextActionLines.length
      ? ["NEXT ACTIONS (pre-lab)", divider.slice(0, 40), ...nextActionLines, ""]
      : []),
    ...(traits.length ? [`Detected traits: ${traits.join(", ")}`, ""] : []),
    "DESCRIPTION USED",
    divider.slice(0, 40),
    description || "(none)",
    "",
    divider,
    "RuleGrid · First-pass analysis only · Not a conformity decision or legal advice",
  ]
    .flat()
    .filter((line) => line !== null)
    .join("\n");
}
