import {
  buildCompactLegislationItems,
  buildDirectiveBreakdown,
  buildDynamicTemplates,
  buildGuidanceItems,
  buildLegislationGroups,
  buildRouteSections,
  directiveRank,
  isParallelObligationDirectiveKey,
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
    typicalEvidence: [
      "Final ratings table and nameplate artwork covering voltage, frequency, power/current, model ID, and protective class",
      "General arrangement, wiring, and insulation drawings for mains parts, accessible metalwork, and earthing",
      "Critical component schedule for fuses, thermal cut-outs, transformers, relays, cords, plugs, and external PSUs",
      "Safety test reports for electric strength, temperature rise, abnormal operation, and mechanical hazards",
      "User instructions and safety warnings for installation, cleaning, maintenance, and intended environment",
    ],
    commonMissing: [
      "Voltage/frequency range or power rating is still not locked",
      "Protective class, IP rating, or earthing concept is not stated consistently",
      "Final nameplate or importer traceability artwork is missing",
      "Critical component approvals or ratings are not linked back to the BOM",
    ],
    blockers: [
      "Power architecture or protection concept is still changing",
      "No drawings show insulation barriers, earthing, or accessible parts",
      "Instruction set does not cover the real installation or use conditions",
    ],
  },
  EMC: {
    label: "EMC",
    typicalEvidence: [
      "Representative test setup with all ports populated, cable lengths fixed, support equipment listed, and software mode identified",
      "Emissions and immunity reports mapped to the exact hardware variant and firmware build sold",
      "Worst-case mode rationale covering high-load, charging, transmit, motor, heater, or display states as applicable",
      "Installation and use instructions for screened cables, ferrites, grounding, and any residential-use restriction",
      "EMC design record for filters, shielding, cable routing, and enclosure bonding choices",
    ],
    commonMissing: [
      "Accessories or cables shipped with the product were not included in the setup",
      "Worst-case operating mode or family selection logic is undocumented",
      "Residential versus industrial environment is not declared clearly",
      "Firmware version used in testing is not tied to production release",
    ],
    blockers: [
      "No stable configuration exists for ports, accessories, or peripherals",
      "No repeatable mode matrix exists for lab testing",
      "Compliance depends on installation constraints that are not documented for the user",
    ],
  },
  RED: {
    label: "RED",
    typicalEvidence: [
      "Radio architecture file with module or chipset ID, firmware build, supported bands, channel widths, modulation, and max power",
      "Antenna evidence covering type, gain, cable loss, placement, approved variants, and host integration limits",
      "RF, EMC, and safety reports tied to the final hardware and software combination placed on the market",
      "Instructions listing operating frequency bands, maximum RF power, approved accessories or software, and any geographic restrictions",
      "Technical file linking internal photos, label artwork, packaging markings, and the EU declaration to the tested build",
    ],
    commonMissing: [
      "Radio function is described loosely but the actual module or chipset is not identified",
      "Frequency-band or maximum-power table is absent from the instructions",
      "Software that controls radio parameters is not frozen or identified",
      "Antenna variant or simultaneous-transmission scenario is not documented",
    ],
    blockers: [
      "Wireless features are still unclear at product-definition stage",
      "No final module, chipset, or antenna path has been selected",
      "User-replaceable software or antenna options can alter compliance and are undocumented",
    ],
  },
  RED_CYBER: {
    label: "RED Cyber",
    typicalEvidence: [
      "Secure-update design showing signing, authenticity checks, rollback handling, and update-delivery ownership where the returned product category falls under the RED cybersecurity delegated act",
      "Authentication and credential policy covering default passwords, first-time setup, recovery, and privileged access",
      "Interface and data-flow map for apps, cloud services, APIs, local admin paths, cameras, microphones, or telemetry relevant to the applicable RED cybersecurity requirement",
      "Cybersecurity verification record for exposed services, access control, misuse resistance, and protection of personal data and traffic where those essential requirements are in scope",
      "Additional category review for products handling payments or virtual money, or for internet-connected childcare, toy, or wearable radio equipment",
    ],
    commonMissing: [
      "No inventory exists for internet-facing services, apps, APIs, or cloud dependencies",
      "Default-admin or password behavior is not documented clearly",
      "OTA mechanism is described at a high level but not tied to a signing-key process",
      "Personal-data, parental-control, or monetary-function scope is not mapped",
    ],
    blockers: [
      "The product can connect to networks but has no cybersecurity design file",
      "A passwordless or weak-default-credential path is still open",
      "App, cloud, or update architecture is still moving and cannot be assessed reliably",
    ],
  },
  BATTERY: {
    label: "Battery",
    typicalEvidence: [
      "Battery model, chemistry, capacity, and pack configuration linked to the exact SKU sold",
      "Charging and protection description covering cut-offs, temperature sensing, current limits, and user-accessible charging hardware",
      "Removability and replaceability assessment showing whether the battery is end-user, independent-professional, or factory service only",
      "Battery marking plan covering capacity, separate-collection symbol, traceability, and QR-code readiness where applicable",
      "User information for charging, storage, replacement, transport handoff, and end-of-life handling",
    ],
    commonMissing: [
      "Exact cell or pack chemistry and watt-hour rating are still unknown",
      "Embedded versus replaceable battery status has not been decided",
      "Label artwork does not yet cover required battery markings",
      "Charging profile or supplied charger is not linked to the final pack spec",
    ],
    blockers: [
      "Battery type is still unknown at scoping stage",
      "Mechanical design conflicts with the claimed replaceability route",
      "No final supplier-backed battery specification exists for the shipped product",
    ],
  },
  REACH: {
    label: "REACH",
    typicalEvidence: [
      "Article-level material declarations from suppliers for plastics, cables, coatings, adhesives, electronics, accessories, and packaging",
      "Candidate List screening record showing the exact list version and date used for each article, including articles within complex objects",
      "Article 33 communication text and safe-use information where an SVHC is above 0.1% w/w in an article",
      "Annex XVII restriction screening for the actual materials, coatings, plasticisers, flame retardants, and intended uses",
      "Article 7(2) notification assessment, where Candidate List content and tonnage thresholds make it relevant",
      "SCIP submission status, where applicable under the Waste Framework Directive",
    ],
    commonMissing: [
      "Supplier declarations are old and pre-date recent Candidate List updates",
      "Purchased parts are described only as RoHS compliant with no REACH substance detail",
      "No clear per-article view exists for assemblies, accessories, packaging, spare parts, or complex objects",
      "Annex XVII restriction screening has not been documented",
      "Safe-use communication text and 45-day consumer-response ownership are not prepared",
    ],
    blockers: [
      "No BOM substance data exists for the main materials in the product",
      "Supplier cannot confirm Candidate List status for core parts",
      "A likely SVHC issue exists but no Article 33, Article 7(2), or SCIP applicability decision has been recorded",
    ],
  },
  ROHS: {
    label: "RoHS",
    typicalEvidence: [
      "Homogeneous-material declarations or test evidence covering the ten restricted substances for the final BOM",
      "Scope and category decision for the EEE, including any exclusions",
      "Exemption review for any Annex III or Annex IV reliance, including applicability and expiry dates",
      "Technical documentation and declaration-of-conformity linkage for the exact model sold",
    ],
    commonMissing: [
      "Supplier files stop at assembly level and do not support homogeneous-material assessment",
      "An exemption is assumed from legacy data but not verified against the current Annex text",
      "Accessories, cables, spare parts, or packaging-adjacent electronics are outside the evidence set",
    ],
    blockers: [
      "No supplier-backed material declarations exist for high-risk parts such as solder, PVC, connectors, or displays",
      "Compliance depends on an exemption that has not been validated for the final design",
    ],
  },
  WEEE: {
    label: "WEEE",
    typicalEvidence: [
      "EEE scope and category decision, including any exclusion check, for each product family sold in the EU",
      "Producer-of-record and authorised-representative mapping for each Member State where the product is sold",
      "Crossed-out wheeled-bin marking artwork and placement decision, with product traceability information aligned to the market setup",
      "Country-by-country registration, take-back, and reporting ownership for the placed-on-market flow",
    ],
    commonMissing: [
      "EEE category is assumed but not locked",
      "No owner is defined for national producer registration and reporting",
      "Marking placement on product, packaging, or accompanying documents is undecided",
    ],
    blockers: [
      "The go-to-market countries are known but no producer strategy exists",
      "The product is EEE in practice but WEEE ownership has not been assigned",
    ],
  },
  FCM: {
    label: "FCM",
    typicalEvidence: [
      "Wetted-path bill of materials with supplier traceability for all food-contact parts, seals, coatings, and inks",
      "Defined food types, contact times, temperatures, and repeated-use assumptions for the real use case",
      "Supporting declarations or other compliance evidence required by the applicable food-contact measure set",
    ],
    commonMissing: [
      "The actual food-contact path is only described at assembly level",
      "No single set of worst-case contact conditions has been chosen",
      "Supplier documentation for seals, hoses, coatings, or printing inks is missing",
    ],
    blockers: [
      "Food-contact parts are present but there is no traceable supplier chain",
      "The intended food type or time-temperature envelope is not locked",
    ],
  },
  FCM_PLASTIC: {
    label: "FCM Plastic",
    typicalEvidence: [
      "Plastic resin and additive declarations for the exact grade used in the final article",
      "Overall and specific migration test basis matched to the real food simulants and worst foreseeable use",
      "Plastic declaration of compliance covering structure, substances with restrictions, and final use conditions",
    ],
    commonMissing: [
      "Final polymer or additive formulation is not frozen",
      "Migration conditions do not match actual contact time, temperature, or food type",
      "Multilayer or barrier-layer construction is not documented clearly",
    ],
    blockers: [
      "No supplier declaration exists for the plastic food-contact parts",
      "No migration evidence exists for the worst foreseeable use case",
    ],
  },
  CRA: {
    label: "CRA",
    typicalEvidence: [
      "Product-with-digital-elements boundary, asset inventory, and software-component ownership map",
      "Cybersecurity technical documentation covering design choices, known dependencies, and support period",
      "Vulnerability handling, coordinated disclosure, and update-governance process owned by a named team",
    ],
    commonMissing: [
      "App, cloud, and backend responsibilities are not mapped to the product offer",
      "Support period and patch-delivery path are not defined",
      "No maintainable software inventory exists for the released product",
    ],
    blockers: [
      "No owner exists for vulnerability handling and post-market patches",
      "Software architecture is still moving too fast to freeze a compliance boundary",
    ],
  },
  ECO: {
    label: "Ecodesign",
    typicalEvidence: [
      "Applicability matrix against the actual implementing measures that may cover the product, such as standby/networked-standby, external power supplies, electronic displays, or a product-specific rule",
      "Mode definitions and default configuration record for off mode, standby, networked standby, wake functions, radios, displays, and shipped accessories",
      "Energy test reports or calculations tied to the exact hardware, firmware, and included power accessories placed on the market",
      "Required product information, information sheet, repair or spare-part review, and technical file material for the applicable measure",
    ],
    commonMissing: [
      "No mapping exists to the relevant horizontal or product-specific implementing measure",
      "Power modes, network functions, and default settings are not defined consistently",
      "Included external power supply or display-specific obligations have not been checked separately",
      "Repair, spare-part, product-information, or software-setting obligations have not been checked for the product group",
    ],
    blockers: [
      "No evidence exists that the relevant implementing measures were checked at all",
      "Energy-mode behavior is not final enough to support a review",
    ],
  },
};

const LEGISLATION_CONTENT_LIBRARY = {
  REACH: {
    summary:
      "For hardware products, REACH is usually an ongoing article-level check rather than a one-time checkbox. Candidate List updates, Article 33 communication, Article 7(2) notification triggers, and Annex XVII restrictions can all change the release position.",
    rationale:
      "For articles, REACH commonly turns into three practical workstreams: Article 33 communication above 0.1% w/w, Article 7(2) notification to ECHA when threshold conditions are met, and Annex XVII restriction checks for banned or limited substances and uses.",
    scope:
      "Assess each article in the product, including articles inside complex objects, plus accessories, spares, and packaging. Lock the Candidate List version used, screen Annex XVII restrictions, define Article 33 and Article 7(2) ownership, maintain a 45-day consumer-response path, and track SCIP separately where applicable under the Waste Framework Directive.",
  },
  ROHS: {
    summary:
      "For EEE, RoHS is usually a core parallel review. The practical question is whether the final BOM is supported at homogeneous-material level and whether any exemption is being relied on.",
    rationale:
      "Directive 2011/65/EU restricts ten substances in homogeneous materials, subject to scope exclusions and time-limited Annex III or IV exemptions.",
    scope:
      "Confirm the EEE category and scope position, collect homogeneous-material declarations or test data, verify Annex II limits, check any Annex III or IV exemption wording and expiry, and align the technical file and declaration of conformity.",
  },
  WEEE: {
    summary:
      "Review this whenever the product is electrical or electronic equipment and no WEEE exclusion applies. The practical issues are producer registration, marking, and national take-back and reporting duties.",
    rationale:
      "Directive 2012/19/EU makes producers responsible for WEEE management and requires separate-collection marking and traceability for EEE placed on the market.",
    scope:
      "Confirm WEEE scope and category, producer of record or authorised representative in each Member State, bin-marking placement, and who owns registration and reporting.",
  },
  FCM: {
    summary:
      "Review this if any wetted or food-touching part contacts food under normal or foreseeable use. The core question is whether the material can transfer constituents at unacceptable levels or adversely affect the food.",
    rationale:
      "Regulation (EC) No 1935/2004 requires food-contact materials to be sufficiently inert, traceable, and supported by the relevant compliance evidence where specific Union measures apply.",
    scope:
      "Map every food-contact part, intended food types, contact time and temperature, repeated-use conditions, and supplier traceability for seals, coatings, plastics, inks, and metals.",
  },
  FCM_PLASTIC: {
    summary:
      "Plastic food-contact parts usually need a plastics-specific review: authorised substances, migration testing, and a declaration of compliance matched to real use.",
    rationale:
      "Regulation (EU) No 10/2011 sets substance and migration rules for plastic materials and articles intended to come into contact with food.",
    scope:
      "Confirm resin and additive composition, food simulants, worst-case time and temperature, overall and specific migration coverage, and the supplier declaration for the exact grade used.",
  },
  CRA: {
    summary:
      "The Cyber Resilience Act is already in force. For planning, reporting obligations start on 11 September 2026 and most other product obligations apply from 11 December 2027.",
    rationale:
      "Regulation (EU) 2024/2847 applies to products with digital elements and introduces cybersecurity-by-design, vulnerability handling, technical documentation, and lifecycle support duties.",
    scope:
      "Confirm whether the product and any remote data processing solution are part of one offer, who owns coordinated vulnerability disclosure, how long security updates are supported, and whether a maintainable software inventory exists.",
  },
  ECO: {
    summary:
      "This is a framework check, not a standalone product rule. In practice the real review is the active implementing measure set, often starting with Regulation (EU) 2023/826 on standby/networked-standby and then any external-power-supply, display, or product-specific rule that matches the SKU.",
    rationale:
      "Directive 2009/125/EC sets the framework for ecodesign requirements for energy-related products, while binding obligations are set in implementing measures. For many electronics, Regulation (EU) 2023/826 on off mode, standby, and networked standby is a first check, and included external power supplies or displays can bring additional measures.",
    scope:
      "Map the final SKU to every relevant ecodesign measure, then lock testable mode definitions, default settings, included accessories such as external power supplies, product-information obligations, and the technical file for the exact model sold.",
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
  if (/18031/.test(code) || sectionKey === "RED_CYBER") {
    return "Returned RED cyber route points to cybersecurity review for the applicable radio-equipment category.";
  }
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
  if (key === "RED_CYBER") {
    return "Returned RED cyber route indicates cybersecurity review for the applicable radio-equipment category.";
  }
  if (key === "BATTERY") return "Battery chemistry, category, and end-of-life duties can apply.";
  if (key === "REACH") return "Material composition, Candidate List communication, and restriction screening still matter for release readiness.";
  if (key === "ROHS") return "Restricted-substance checks at homogeneous-material level still matter for electronics release.";
  if (key === "FCM" || key === "FCM_PLASTIC") return "Food-contact materials in the wetted path need separate evidence.";

  const firstItemRationale = section?.items?.find((item) => item?.shortRationale)?.shortRationale;
  return firstItemRationale || "";
}

const CORE_DIRECTIVE_KEYS = new Set(["LVD", "EMC"]);
const CONDITIONAL_DIRECTIVE_KEYS = new Set(["RED", "RED_CYBER"]);

function decorateRouteSections(sections, baseSafetyRoute) {
  const hasCoreDirective = (sections || []).some((s) => CORE_DIRECTIVE_KEYS.has(s.key));

  return (sections || []).map((section, index) => {
    const sectionKind = CORE_DIRECTIVE_KEYS.has(section.key)
      ? "core"
      : CONDITIONAL_DIRECTIVE_KEYS.has(section.key)
        ? "conditional"
        : !hasCoreDirective && index === 0
          ? "core"
          : "secondary";

    const applicabilityBucket =
      sectionKind === "core"
        ? "Core applicable"
        : sectionKind === "conditional"
          ? "Conditional"
          : "Supplementary";

    const items = (section.items || []).map((item) => ({
      ...item,
      shortRationale: rationaleForStandard(item, section.key, baseSafetyRoute),
      applicabilityBucket,
    }));

    return {
      ...section,
      sectionKind,
      applicabilityBucket,
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
      items: (group.items || []).map((item) => {
        const libraryKey = resolveLegislationLibraryKey(item);
        const fallbackCopy = LEGISLATION_CONTENT_LIBRARY[libraryKey] || null;
        const summary = item.summary || fallbackCopy?.summary || "";
        const rationale = item.rationale || fallbackCopy?.rationale || "";
        const scope = item.scope || fallbackCopy?.scope || "";

        return {
          ...item,
          summary,
          rationale,
          scope,
          shortRationale: summary || rationale || scope || "",
          applicabilityBucket:
            groupKey === "ce"
              ? "Core applicable"
              : groupKey === "non_ce"
                ? "Conditional"
                : "Supplementary",
        };
      }),
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
      const key = resolveLegislationLibraryKey(item);
      const template = ROUTE_EVIDENCE_LIBRARY[key];
      if (template) evidenceMap.set(key, { key, ...template });
    });
  });

  return Array.from(evidenceMap.values());
}

function resolveLegislationLibraryKey(item) {
  const directiveKey = String(item?.directive_key || item?.key || "").toUpperCase();
  const code = String(item?.code || "").toUpperCase();
  const title = String(item?.title || "").toUpperCase();

  if (directiveKey === "WEEE" || code.includes("2012/19/EU") || title.includes("WEEE")) return "WEEE";
  if (directiveKey === "FCM_PLASTIC" || code.includes("10/2011") || title.includes("PLASTIC FOOD CONTACT")) {
    return "FCM_PLASTIC";
  }
  if (
    directiveKey === "FCM" ||
    code.includes("1935/2004") ||
    title.includes("FOOD CONTACT MATERIAL") ||
    title.includes("FOOD CONTACT")
  ) {
    return "FCM";
  }
  if (directiveKey === "REACH" || code.includes("1907/2006") || title.includes("REACH")) return "REACH";
  if (directiveKey === "ROHS" || code.includes("2011/65/EU") || title.includes("ROHS")) return "ROHS";
  if (directiveKey === "CRA" || code.includes("2024/2847") || title.includes("CYBER RESILIENCE")) return "CRA";
  if (directiveKey === "ECO" || code.includes("2009/125/EC") || title.includes("ECODESIGN")) return "ECO";

  return directiveKey || code;
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
  const routeSections = buildRouteSections(result).filter(
    (section) => !isParallelObligationDirectiveKey(section.key)
  );
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
