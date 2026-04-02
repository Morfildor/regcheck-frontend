/**
 * Main selector assembler.
 * Combines all concern-based sub-modules into the AnalysisViewModel
 * and the template-choice list consumed by the workspace.
 */
import {
  buildCompactLegislationItems,
  buildDirectiveBreakdown,
  buildDynamicTemplates,
  buildGuidanceItems,
  buildLegislationGroups,
  buildRouteSections,
  directiveRank,
  isParallelObligationDirectiveKey,
} from "../helpers";

import { inferBaseSafetyRoute, resolveProductType, decorateRouteSections, buildRedGroup } from "./standards";
import { inferMaturity, inferConfidence } from "./summary";
import { normalizeMissingInputs, inferAssumptions, inferRiskDrivers } from "./facts";
import { decorateLegislationGroups } from "./legislation";
import { buildEvidenceNeeds } from "./evidence";

/** @typedef {import("../types").AnalysisResult} AnalysisResult */
/** @typedef {import("../types").AnalysisMetadata} AnalysisMetadata */
/** @typedef {import("../types").AnalysisViewModel} AnalysisViewModel */

export function buildTemplateChoices(metadata, templateOrder) {
  const pool = buildDynamicTemplates(metadata?.products || []);
  return [...pool]
    .map((item, index) => ({ item, sort: templateOrder[index % templateOrder.length] }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

/**
 * @param {AnalysisResult | null} result
 * @param {string} descriptionText
 * @returns {AnalysisViewModel}
 */
export function buildAnalysisViewModel(result, descriptionText = "") {
  const routeSections = buildRouteSections(result).filter(
    (section) => !isParallelObligationDirectiveKey(section.key)
  );
  const guidanceItems = buildGuidanceItems(result);
  const legislationItems = buildCompactLegislationItems(result);
  const legislationGroups = buildLegislationGroups(result);
  const directiveBreakdown = buildDirectiveBreakdown(routeSections);
  const baseSafetyRoute = inferBaseSafetyRoute(result, routeSections);
  const decoratedRouteSections = decorateRouteSections(routeSections, baseSafetyRoute);
  const isRadioProduct = decoratedRouteSections.some((s) => s.key === "RED");
  const redGroup = isRadioProduct ? buildRedGroup(decoratedRouteSections) : null;
  // For radio products, LVD and EMC are folded into the RED group — exclude them from standalone display
  const displayRouteSections = isRadioProduct
    ? decoratedRouteSections.filter((s) => s.key !== "LVD" && s.key !== "EMC")
    : decoratedRouteSections;
  const decoratedLegislationGroups = decorateLegislationGroups(legislationGroups);
  const missingInputs = normalizeMissingInputs(guidanceItems, descriptionText, result, routeSections);
  const assumptions = inferAssumptions(result, decoratedRouteSections, descriptionText);
  const resultMaturity = inferMaturity(result, assumptions, missingInputs);
  const classificationConfidence = inferConfidence(result, missingInputs);
  const riskDrivers = inferRiskDrivers(result, decoratedRouteSections, descriptionText);
  const evidenceNeeds = buildEvidenceNeeds(decoratedRouteSections, decoratedLegislationGroups);
  const totalStandards = decoratedRouteSections.reduce(
    (count, section) => count + (section.items || []).length,
    0
  );
  const triggeredDirectives = [...new Set(decoratedRouteSections.map((section) => section.key))].sort(
    (a, b) => directiveRank(a) - directiveRank(b)
  );
  const backendChips = result
    ? (result?.suggested_quick_adds || []).map((item) => ({
        label: item.label,
        text: item.text,
      }))
    : null;
  const primaryRoute = baseSafetyRoute || decoratedRouteSections[0] || null;
  const primaryRouteSections = decoratedRouteSections.filter(
    (section) => section.sectionKind === "core"
  );
  const conditionalRouteSections = decoratedRouteSections.filter(
    (section) => section.sectionKind === "conditional"
  );
  const secondaryRouteSections = decoratedRouteSections.filter(
    (section) => section.sectionKind === "secondary"
  );
  const primaryLegislationGroups = decoratedLegislationGroups.filter((group) => group.groupKey === "ce");
  const conditionalLegislationGroups = decoratedLegislationGroups.filter((group) => group.groupKey === "non_ce");
  const peripheralLegislationGroups = decoratedLegislationGroups.filter(
    (group) => group.groupKey !== "ce" && group.groupKey !== "non_ce"
  );
  const warnings = missingInputs.filter((item) => item.severity !== "helpful");
  const productIdentity = {
    type: resolveProductType(result, decoratedRouteSections, descriptionText),
    family: result?.product_family || "",
    subtype: result?.product_subtype || "",
    stage: result?.product_match_stage || "",
    summary: result?.summary || "",
  };
  const standardGroups = {
    core: primaryRouteSections,
    conditional: conditionalRouteSections,
    peripheral: secondaryRouteSections,
  };
  const secondaryRoutes = [...conditionalRouteSections, ...secondaryRouteSections];
  const clarificationState = {
    status: warnings.length ? "needs-input" : "stable",
    count: guidanceItems.length,
  };
  const decisionSignals = {
    primaryRouteLabel:
      primaryRoute?.label || primaryRoute?.title || primaryRouteSections[0]?.title || primaryRouteSections[0]?.key || "",
    blockerCount: missingInputs.filter((item) => item.severity === "blocker").length,
    routeAffectingCount: missingInputs.filter((item) => item.severity === "route-affecting").length,
    clarificationCount: guidanceItems.length,
    directiveCount: triggeredDirectives.length,
  };

  return {
    productIdentity,
    routeSections: decoratedRouteSections,
    guidanceItems,
    legislationItems,
    legislationGroups: decoratedLegislationGroups,
    directiveBreakdown,
    baseSafetyRoute,
    totalStandards,
    triggeredDirectives,
    backendChips,
    assumptions,
    resultMaturity,
    classificationConfidence,
    missingInputs,
    evidenceNeeds,
    primaryRouteSections,
    secondaryRouteSections,
    conditionalRouteSections,
    primaryLegislationGroups,
    conditionalLegislationGroups,
    peripheralLegislationGroups,
    primaryRoute,
    secondaryRoutes,
    standardGroups,
    warnings,
    clarificationState,
    decisionSignals,
    riskDrivers,
    isRadioProduct,
    redGroup,
    displayRouteSections,
  };
}
