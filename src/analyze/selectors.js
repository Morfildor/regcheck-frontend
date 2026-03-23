import {
  buildCompactLegislationItems,
  buildDirectiveBreakdown,
  buildDynamicTemplates,
  buildGuidanceItems,
  buildLegislationGroups,
  buildRouteSections,
  directiveRank,
  titleCaseMinor,
} from "./helpers";

/** @typedef {import("./types").AnalysisResult} AnalysisResult */
/** @typedef {import("./types").AnalysisMetadata} AnalysisMetadata */
/** @typedef {import("./types").AnalysisViewModel} AnalysisViewModel */

const BASE_SAFETY_ROUTE_COPY = {
  EN_60335: {
    key: "EN_60335",
    label: "EN 60335 appliance route",
    shortLabel: "EN 60335",
    description:
      "Primary function points to household and similar appliance safety under EN 60335-1 with the relevant Part 2 standard.",
    note:
      "Connected features do not move an appliance into EN 62368-1 when the primary function remains cooking, cleaning, heating, cooling, or a similar physical appliance function.",
  },
  EN_62368: {
    key: "EN_62368",
    label: "EN 62368 AV/ICT route",
    shortLabel: "EN 62368",
    description:
      "Primary function points to audio/video, information, or communications equipment safety under EN 62368-1.",
    note:
      "This is the base safety path for products such as routers, smart displays, laptops, monitors, speakers, and other AV/ICT equipment.",
  },
};

const MISSING_INPUT_HINTS = [
  { key: "wireless_connectivity", match: /(wifi|bluetooth|radio|wireless|connect)/i, title: "Wireless connectivity", severity: "blocker", reason: "Can introduce RED and cybersecurity obligations." },
  { key: "battery_type", match: /(battery|rechargeable|lithium|cell)/i, title: "Battery type", severity: "route-affecting", reason: "Changes battery, charger, and transport obligations." },
  { key: "charger_included", match: /(charger|adapter|power supply)/i, title: "Charger included", severity: "route-affecting", reason: "External PSU and included accessories affect evidence scope." },
  { key: "display_laser_uv", match: /(display|laser|uv|light source)/i, title: "Display / laser / UV source", severity: "route-affecting", reason: "Can change safety and adjacent-framework review." },
  { key: "environment", match: /(outdoor|indoor|installation|ip|weather)/i, title: "Intended environment", severity: "helpful", reason: "Installation context can alter safety assumptions and evidence." },
  { key: "consumer_professional", match: /(consumer|professional|industrial|commercial)/i, title: "Consumer vs professional use", severity: "blocker", reason: "Product identity and route assumptions depend on intended use." },
];

const ROUTE_EVIDENCE_LIBRARY = {
  LVD: {
    label: "LVD",
    typicalEvidence: ["Safety test basis", "Ratings and nameplate data", "Construction details"],
    commonMissing: ["Voltage range", "Protective class", "Critical component list"],
    blockers: ["Unclear power architecture", "Unknown installation environment"],
  },
  EMC: {
    label: "EMC",
    typicalEvidence: ["Emissions evidence", "Immunity evidence", "Operating mode coverage"],
    commonMissing: ["Configured accessories", "Worst-case operating modes", "Representative setup"],
    blockers: ["No defined configuration", "No accessory list"],
  },
  RED: {
    label: "RED",
    typicalEvidence: ["Radio test reports", "Module details", "Antenna data", "Firmware and network architecture"],
    commonMissing: ["Intentional radio description", "Transmit bands", "Integrated module documentation"],
    blockers: ["Wireless features still unclear", "No module or antenna details"],
  },
  BATTERY: {
    label: "Battery",
    typicalEvidence: ["Battery category", "Chemistry details", "Removability review"],
    commonMissing: ["Pack chemistry", "Capacity data", "Embedded vs replaceable status"],
    blockers: ["Battery type unknown", "No end-of-life category decision"],
  },
  REACH: {
    label: "REACH",
    typicalEvidence: ["SVHC screening", "Supplier material declarations"],
    commonMissing: ["Material composition", "Updated supplier declarations"],
    blockers: ["No BOM substance data"],
  },
};

function inferBaseSafetyRoute(result, routeSections) {
  if (!result) return null;

  const rows = (routeSections || []).flatMap((section) => section.items || []);
  const codeStrings = rows.map((item) => String(item?.code || "").toUpperCase());
  const titleStrings = rows.map((item) => String(item?.title || "").toLowerCase());

  const has60335 =
    codeStrings.some((code) => /(?:^|\b)(?:EN|IEC)\s*60335(?:-\d+)?(?:\b|\s|$)/i.test(code)) ||
    titleStrings.some((title) => title.includes("household and similar electrical appliances"));

  const has62368 =
    codeStrings.some((code) => /(?:^|\b)(?:EN|IEC)\s*62368(?:-\d+)?(?:\b|\s|$)/i.test(code)) ||
    titleStrings.some(
      (title) =>
        title.includes("audio/video") ||
        title.includes("information and communication technology") ||
        title.includes("communications technology equipment")
    );

  const productText = [
    result?.product_type || "",
    result?.summary || "",
    ...(result?.all_traits || []),
  ]
    .join(" ")
    .toLowerCase();

  const applianceHints = [
    /coffee/, /espresso/, /kettle/, /air.?fry/, /oven/, /vacuum/,
    /robot.?vac/, /air.?purifier/, /fan\b/, /heater/, /dishwasher/,
    /washing.?machine/, /dryer/, /blender/, /mixer/, /toaster/,
    /fridge/, /freezer/, /appliance/,
  ];

  const avictHints = [
    /router/, /modem/, /gateway/, /access.?point/, /switch\b/, /laptop/,
    /desktop/, /server/, /nas\b/, /monitor/, /display/, /smart.?display/,
    /smart.?speaker/, /speaker/, /television/, /smart.?tv/, /stream(ing)?/,
    /set.?top/, /projector/, /voip/, /ict/, /communications?/, /audio/,
    /video/, /network/,
  ];

  const hasApplianceHint = applianceHints.some((re) => re.test(productText));
  const hasAvictHint = avictHints.some((re) => re.test(productText));

  if (has60335 && !has62368) return BASE_SAFETY_ROUTE_COPY.EN_60335;
  if (has62368 && !has60335) return BASE_SAFETY_ROUTE_COPY.EN_62368;

  if (has60335 && has62368) {
    if (hasApplianceHint && !hasAvictHint) return BASE_SAFETY_ROUTE_COPY.EN_60335;
    if (hasAvictHint && !hasApplianceHint) return BASE_SAFETY_ROUTE_COPY.EN_62368;
  }

  if (hasAvictHint && !hasApplianceHint) return BASE_SAFETY_ROUTE_COPY.EN_62368;
  if (hasApplianceHint && !hasAvictHint) return BASE_SAFETY_ROUTE_COPY.EN_60335;

  return null;
}

function inferAssumptions(result, routeSections, descriptionText) {
  const lowered = String(descriptionText || "").toLowerCase();
  const assumptions = [];

  const hasRadio = routeSections.some((section) => section.key === "RED" || section.key === "RED_CYBER");
  const hasBattery = /battery|rechargeable|lithium|cell/.test(lowered);
  const hasProfessionalUse = /professional|industrial|commercial/.test(lowered);
  const hasConsumerUse = /consumer|household|home/.test(lowered);
  const hasMains = /mains|230v|240v|plug|corded|ac power/.test(lowered);

  if (hasMains) assumptions.push("mains-powered equipment");
  else if (!hasBattery) assumptions.push("no battery unless specified");

  if (!hasRadio) assumptions.push("no radio unless specified");
  if (!hasProfessionalUse && !hasConsumerUse) assumptions.push("consumer use assumed");

  if ((result?.product_type || "").includes("coffee") || routeSections.some((section) => section.key === "LVD")) {
    assumptions.push("mains-powered household appliance");
  }

  return [...new Set(assumptions)];
}

function inferMaturity(result, assumptions, missingInputs) {
  if (!result) return { label: "Initial scope", tone: "muted" };
  if (missingInputs.some((item) => item.severity === "blocker")) {
    return { label: "Initial scope", tone: "muted" };
  }
  if (assumptions.length > 1 || missingInputs.some((item) => item.severity === "route-affecting")) {
    return { label: "Conditional scope", tone: "warning" };
  }
  return { label: "Evidence-ready scope", tone: "positive" };
}

function inferConfidence(result, missingInputs) {
  const confidence = String(result?.confidence_panel?.confidence || result?.product_match_confidence || "").toLowerCase();
  if (confidence === "high" && !missingInputs.some((item) => item.severity === "blocker")) {
    return { label: "High confidence", tone: "positive" };
  }
  if (confidence === "low" || missingInputs.some((item) => item.severity === "blocker")) {
    return { label: "Preliminary only", tone: "muted" };
  }
  return { label: "Needs confirmation", tone: "warning" };
}

function normalizeMissingInputs(result, guidanceItems, descriptionText) {
  const lowered = String(descriptionText || "").toLowerCase();
  const items = (guidanceItems || []).map((item) => {
    const key = item.key || item.title || "missing-input";
    const severity = item.importance === "high" ? "blocker" : item.importance === "medium" ? "route-affecting" : "helpful";
    return {
      key,
      title: item.title || titleCaseMinor(item.message || key),
      severity,
      reason: item.description || item.message || "More detail would tighten this route.",
      examples: item.choices || item.examples || [],
    };
  });

  MISSING_INPUT_HINTS.forEach((hint) => {
    if (!lowered || hint.match.test(lowered)) return;
    if (items.some((item) => item.key === hint.key)) return;
    items.push({
      key: hint.key,
      title: hint.title,
      severity: hint.severity,
      reason: hint.reason,
      examples: [],
    });
  });

  return items.sort((a, b) => {
    const rank = { blocker: 0, "route-affecting": 1, helpful: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}

function rationaleForStandard(item, sectionKey, baseSafetyRoute) {
  const code = String(item?.code || "").toUpperCase();
  const title = String(item?.title || "");

  if (/60335/.test(code)) return "Household appliance safety route.";
  if (/62368/.test(code)) return "AV/ICT equipment safety route.";
  if (/62233/.test(code)) return "EMF assessment for household appliances.";
  if (/55014|61000/.test(code) || sectionKey === "EMC") return "Active electronics capable of electromagnetic disturbance.";
  if (/300|301/.test(code) || sectionKey === "RED") return "Includes intentional radio transmission.";
  if (baseSafetyRoute?.key === "EN_60335" && sectionKey === "LVD") return "Mains-powered electrical equipment within voltage scope.";
  if (baseSafetyRoute?.key === "EN_62368" && sectionKey === "LVD") return "Electronic equipment safety route under voltage scope.";
  if (title) return titleCaseMinor(title).replace(/\.$/, "") + ".";
  return "";
}

function rationaleForRouteSection(section, baseSafetyRoute) {
  const key = section?.key || "OTHER";

  if (key === "LVD") {
    return baseSafetyRoute?.key === "EN_62368"
      ? "Electronic equipment safety route under voltage scope."
      : "Mains-powered electrical equipment within voltage scope.";
  }
  if (key === "EMC") return "Active electronics capable of electromagnetic disturbance.";
  if (key === "RED") return "Includes intentional radio transmission.";
  if (key === "RED_CYBER") return "Connected radio equipment with network, update, or authentication exposure.";
  if (key === "BATTERY") return "Battery chemistry, category, and end-of-life duties can apply.";
  if (key === "REACH") return "Material composition and SVHC screening still matter for release readiness.";
  if (key === "FCM" || key === "FCM_PLASTIC") return "Food-contact materials in the wetted path need separate evidence.";

  const firstItemRationale = section?.items?.find((item) => item?.shortRationale)?.shortRationale;
  return firstItemRationale || "";
}

function decorateRouteSections(sections, baseSafetyRoute) {
  return (sections || []).map((section, index) => {
    const sectionKind =
      index === 0 ? "core" : section.key === "RED" || section.key === "RED_CYBER" ? "conditional" : "secondary";
    const items = (section.items || []).map((item) => ({
      ...item,
      shortRationale: rationaleForStandard(item, section.key, baseSafetyRoute),
      applicabilityBucket:
        index === 0
          ? "Core likely applicable"
          : section.key === "RED" || section.key === "RED_CYBER"
            ? "Conditional / check applicability"
            : "Usually not applicable unless specific features are present",
    }));

    return {
      ...section,
      sectionKind,
      items,
      shortRationale: rationaleForRouteSection({ ...section, items }, baseSafetyRoute),
    };
  });
}

function decorateLegislationGroups(groups) {
  return (groups || []).map((group) => {
    const groupKey = group.groupKey || group.key || "other";
    return {
      ...group,
      groupKey,
      items: (group.items || []).map((item) => ({
        ...item,
        shortRationale: item.rationale || item.scope || item.summary || "",
        applicabilityBucket:
          groupKey === "ce"
            ? "Core likely applicable"
            : groupKey === "non_ce"
              ? "Conditional / check applicability"
              : "Usually not applicable unless specific features are present",
        })),
    };
  });
}

function buildEvidenceNeeds(routeSections, legislationGroups) {
  const evidenceMap = new Map();

  routeSections.forEach((section) => {
    const template = ROUTE_EVIDENCE_LIBRARY[section.key];
    if (template) evidenceMap.set(section.key, { key: section.key, ...template });
  });

  legislationGroups.forEach((group) => {
    (group.items || []).forEach((item) => {
      const key = item.directive_key || item.key || item.code;
      const template = ROUTE_EVIDENCE_LIBRARY[key];
      if (template) evidenceMap.set(key, { key, ...template });
    });
  });

  return Array.from(evidenceMap.values());
}

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
  const routeSections = buildRouteSections(result);
  const guidanceItems = buildGuidanceItems(result);
  const legislationItems = buildCompactLegislationItems(result);
  const legislationGroups = buildLegislationGroups(result);
  const directiveBreakdown = buildDirectiveBreakdown(routeSections);
  const baseSafetyRoute = inferBaseSafetyRoute(result, routeSections);
  const decoratedRouteSections = decorateRouteSections(routeSections, baseSafetyRoute);
  const decoratedLegislationGroups = decorateLegislationGroups(legislationGroups);
  const missingInputs = normalizeMissingInputs(result, guidanceItems, descriptionText);
  const assumptions = inferAssumptions(result, decoratedRouteSections, descriptionText);
  const resultMaturity = inferMaturity(result, assumptions, missingInputs);
  const classificationConfidence = inferConfidence(result, missingInputs);
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
  const primaryRouteSections = decoratedRouteSections.filter((section, index) => index === 0);
  const conditionalRouteSections = decoratedRouteSections.filter(
    (section) => section.sectionKind === "conditional"
  );
  const secondaryRouteSections = decoratedRouteSections.filter(
    (section, index) => index !== 0 && section.sectionKind !== "conditional"
  );
  const primaryLegislationGroups = decoratedLegislationGroups.filter((group) => group.groupKey === "ce");
  const conditionalLegislationGroups = decoratedLegislationGroups.filter((group) => group.groupKey === "non_ce");
  const peripheralLegislationGroups = decoratedLegislationGroups.filter(
    (group) => group.groupKey !== "ce" && group.groupKey !== "non_ce"
  );
  const warnings = missingInputs.filter((item) => item.severity !== "helpful");
  const productIdentity = {
    type: result?.product_type || "",
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
  };
}
