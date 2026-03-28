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
  VERTICAL_STANDARD_SCOPE,
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
  { key: "wireless_connectivity", match: /(wifi|wi.?fi|bluetooth|ble\b|nfc\b|radio|wireless|no.?radio|no.?wireless)/i, title: "Wireless connectivity", severity: "blocker", reason: "Can introduce RED and cybersecurity obligations." },
  { key: "battery_type", match: /(battery|rechargeable|lithium|li.?ion|alkaline|nimh|cell)/i, title: "Battery type", severity: "route-affecting", reason: "Changes battery, charger, and transport obligations." },
  { key: "charger_included", match: /(charger|adapter|power supply)/i, title: "Charger included", severity: "route-affecting", reason: "External PSU and included accessories affect evidence scope." },
  { key: "display_laser_uv", match: /(display|laser|uv|light source)/i, title: "Display / laser / UV source", severity: "route-affecting", reason: "Can change safety and adjacent-framework review." },
  { key: "environment", match: /(outdoor|indoor|installation|ip\d|weather|portable|fixed|on.?body|wearable)/i, title: "Intended environment", severity: "helpful", reason: "Installation context can alter safety assumptions and evidence." },
  { key: "consumer_professional", match: /(consumer|professional|industrial|commercial|household|child|patient)/i, title: "Consumer vs professional use", severity: "blocker", reason: "Product identity and route assumptions depend on intended use." },
];

/**
 * Patterns that suppress a guidance item key when matched in the description.
 * If the user already stated these facts, the item is not noise-worthy.
 */
const GUIDANCE_SUPPRESSORS = {
  radio_stack: /(wifi|wi.?fi|bluetooth|ble\b|nfc\b|zigbee|z.?wave|cellular|lte\b|5g\b|no.?radio|no.?wireless)/i,
  connected_architecture: /(cloud.?account|cloud.?required|cloud.?optional|local.?only|local.?control|local.?lan|ota|firmware.?update|app.?control|app.?sync)/i,
  battery: /(lithium|li.?ion|rechargeable.?battery|replaceable.?battery|primary.?cell)/i,
  data_functions: /(camera|microphone|voice.?input|personal.?data|user.?account)/i,
  food_contact: /(food.?contact|wetted.?path|brew.?path|food.?touch)/i,
};

/**
 * Topic clusters for semantic deduplication and product-relevance filtering.
 * If a guidance item's combined text matches a cluster and the product context
 * makes that cluster irrelevant, the item is suppressed before rendering.
 */
const TOPIC_CLUSTERS = {
  medical:     /heart.?rate|physiolog|patient.?data|medical.?claim|clinical|vital.?sign|therapeutic|diagnostic/i,
  body:        /body.?contact|wearable|on.?body|skin.?contact|worn.?on/i,
  camera:      /\bcamera\b|face.?recogni|facial.?detect|video.?capture|optical.?imaging/i,
  microphone:  /\bmicrophone\b|voice.?input|audio.?capture|speech.?rec/i,
  child:       /child.?appeal|intended.?for.?child|toy.?safety|young.?user/i,
  food:        /food.?contact|wetted.?path|food.?touch|ingest|brew.?path/i,
  wireless:    /wifi|wi.?fi|bluetooth|ble\b|nfc\b|radio|wireless|intentional.?radiat/i,
  power:       /power.?source|mains|battery|rechargeable|ac\b|voltage|usb.?power|adapter/i,
  cloud_arch:  /cloud|ota|firmware.?update|app.?control|connected.?arch/i,
  user_group:  /consumer|professional|user.?group|intended.?user|industrial/i,
  environment: /environment|indoor|outdoor|installation.?context|ip.?rating/i,
};

const ROUTE_EVIDENCE_LIBRARY = {
  LVD: {
    label: "LVD",
    typicalEvidence: [
      "Ratings table and nameplate artwork",
      "Wiring, insulation & earthing drawings",
      "Critical component schedule (fuses, PSUs, cords)",
      "Safety test reports (electric strength, temp rise)",
      "User instructions for installation & environment",
    ],
    commonMissing: [
      "Voltage or power rating not locked",
      "Protective class or IP rating inconsistent",
      "Nameplate artwork not finalized",
      "Component ratings not linked to BOM",
    ],
    blockers: [
      "Power architecture still changing",
      "No insulation or earthing drawings",
      "Instructions don't cover real use conditions",
    ],
    nextActions: [
      "Lock power architecture and voltage / current ratings",
      "Confirm protective class (I / II / III) and IP rating",
      "Prepare or obtain insulation and earthing drawings",
      "Schedule LVD safety test session",
    ],
  },
  EMC: {
    label: "EMC",
    typicalEvidence: [
      "Test setup: all ports, cables & modes listed",
      "Emissions & immunity reports per hardware/firmware",
      "Worst-case mode rationale documented",
      "Cable & shielding installation instructions",
      "EMC design record (filters, shielding, routing)",
    ],
    commonMissing: [
      "Shipped accessories excluded from test setup",
      "Worst-case operating mode undocumented",
      "Residential vs. industrial not declared",
      "Firmware version not tied to production",
    ],
    blockers: [
      "No stable port or accessory configuration",
      "No repeatable test mode matrix",
      "Compliance relies on undocumented user constraints",
    ],
    nextActions: [
      "Define and document worst-case operating mode matrix",
      "Confirm all shipped accessories and cable lengths",
      "Declare residential or industrial environment class",
      "Freeze firmware version before EMC testing",
    ],
  },
  RED: {
    label: "RED",
    typicalEvidence: [
      "Radio architecture: module, bands, power, firmware",
      "Antenna evidence: type, gain, placement, variants",
      "RF, EMC & safety reports for final build",
      "Instructions: bands, max power, geographic restrictions",
      "Technical file linking label, DoC & tested build",
    ],
    commonMissing: [
      "Module or chipset not identified",
      "Frequency/power table absent from instructions",
      "Radio-controlling software not frozen",
      "Antenna variant or simulcast not documented",
    ],
    blockers: [
      "Wireless features still undefined",
      "No final module or antenna path selected",
      "User-changeable radio options undocumented",
    ],
    nextActions: [
      "Confirm final radio module, chipset, and firmware version",
      "Document all antenna variants and placement",
      "Build frequency / power table for user instructions",
      "Align DoC, label, and tested build configuration",
    ],
  },
  RED_CYBER: {
    label: "RED Cyber",
    typicalEvidence: [
      "Secure-update design: signing, rollback, delivery",
      "Auth & credential policy (defaults, recovery, access)",
      "Interface/data-flow map: apps, cloud, APIs, sensors",
      "Cybersecurity verification record for exposed services",
      "Category review: payments, childcare, wearable radio",
    ],
    commonMissing: [
      "No inventory of internet-facing services",
      "Default-admin behavior undocumented",
      "OTA mechanism not tied to signing-key process",
      "Personal-data or monetary scope not mapped",
    ],
    blockers: [
      "Network-connected product with no security design",
      "Passwordless or weak-default-credential path open",
      "App or cloud architecture still moving",
    ],
    nextActions: [
      "Inventory all internet-facing services and APIs",
      "Document default credential policy and recovery flows",
      "Tie OTA delivery to a signed firmware process",
      "Map personal-data and monetary processing scope",
    ],
  },
  BATTERY: {
    label: "Battery",
    typicalEvidence: [
      "Battery model, chemistry & capacity per SKU",
      "Charging & protection (cut-offs, temps, limits)",
      "Removability assessment (end-user vs. service only)",
      "Battery marking plan: capacity, symbol, QR code",
      "User info: charging, storage, transport & EoL",
    ],
    commonMissing: [
      "Cell chemistry and Wh rating still unknown",
      "Embedded vs. replaceable not decided",
      "Battery markings absent from label artwork",
      "Charging profile not linked to final pack spec",
    ],
    blockers: [
      "Battery type unknown at scoping stage",
      "Design conflicts with claimed replaceability route",
      "No supplier-backed battery specification exists",
    ],
    nextActions: [
      "Lock battery chemistry, model, and Wh capacity",
      "Decide embedded vs. replaceable and document rationale",
      "Add capacity, symbol, and QR code to label artwork",
      "Obtain charging profile from battery supplier",
    ],
  },
  REACH: {
    label: "REACH",
    typicalEvidence: [
      "Article-level material declarations from all suppliers",
      "Candidate List screening record with date & version",
      "Article 33 communication text for SVHC >0.1% w/w",
      "Annex XVII restriction screening for actual materials",
      "Article 7(2) notification assessment where relevant",
      "SCIP submission status where applicable",
    ],
    commonMissing: [
      "Declarations pre-date recent Candidate List updates",
      "Parts described as RoHS-only, no REACH detail",
      "No per-article view for assemblies or accessories",
      "Annex XVII screening not documented",
      "Article 33 communication text not prepared",
    ],
    blockers: [
      "No BOM substance data for core materials",
      "Supplier can't confirm Candidate List status",
      "Likely SVHC with no Art. 33/7(2) decision recorded",
    ],
    nextActions: [
      "Request article-level declarations from all suppliers",
      "Run Candidate List screening on current BOM",
      "Prepare Article 33 consumer communication text",
      "Assess Article 7(2) notification threshold and owner",
    ],
  },
  ROHS: {
    label: "RoHS",
    typicalEvidence: [
      "Homogeneous-material declarations for final BOM",
      "Scope & EEE category decision with exclusions",
      "Exemption review: applicability & expiry dates",
      "Technical file and DoC linked to sold model",
    ],
    commonMissing: [
      "Supplier files stop at assembly level",
      "Exemption assumed from legacy data, not verified",
      "Accessories, cables or spare parts excluded",
    ],
    blockers: [
      "No material declarations for high-risk parts",
      "Compliance depends on unvalidated exemption",
    ],
    nextActions: [
      "Collect homogeneous-material declarations for final BOM",
      "Confirm EEE category and any scope exclusions",
      "Verify Annex III/IV exemption wording and expiry",
      "Include accessories, cables, and spare parts in scope",
    ],
  },
  WEEE: {
    label: "WEEE",
    typicalEvidence: [
      "EEE scope & category decision per product family",
      "Producer-of-record mapping per Member State",
      "Crossed-out bin marking artwork & placement",
      "Country-by-country registration & reporting ownership",
    ],
    commonMissing: [
      "EEE category assumed but not locked",
      "No owner for national producer registration",
      "Marking placement on product/packaging undecided",
    ],
    blockers: [
      "Markets known but no producer strategy exists",
      "WEEE ownership not assigned to any team",
    ],
    nextActions: [
      "Confirm WEEE category for each product family",
      "Assign producer-of-record for each target market",
      "Finalise crossed-out bin marking placement",
      "Set up or join national take-back schemes",
    ],
  },
  FCM: {
    label: "FCM",
    typicalEvidence: [
      "Wetted-path BOM: all food-contact parts & inks",
      "Food types, contact times & temperatures defined",
      "Compliance evidence per applicable FCM measure",
    ],
    commonMissing: [
      "Food-contact path described at assembly level only",
      "No worst-case contact conditions chosen",
      "Supplier docs for seals, coatings or inks missing",
    ],
    blockers: [
      "Food-contact parts with no traceable supplier",
      "Intended food type or temperature not locked",
    ],
    nextActions: [
      "Map the complete wetted-path BOM at material level",
      "Define worst-case food type, temperature, and contact time",
      "Collect supplier compliance docs for seals, coatings, inks",
    ],
  },
  FCM_PLASTIC: {
    label: "FCM Plastic",
    typicalEvidence: [
      "Plastic resin & additive declarations per grade",
      "Migration tests matched to simulants & use case",
      "Plastic DoC: substances, restrictions, use conditions",
    ],
    commonMissing: [
      "Final polymer or additive formulation not frozen",
      "Migration conditions don't match actual contact",
      "Multilayer construction not documented clearly",
    ],
    blockers: [
      "No supplier declaration for plastic food-contact parts",
      "No migration evidence for worst-case use",
    ],
    nextActions: [
      "Freeze polymer and additive formulation with supplier",
      "Match migration test simulants to actual food types",
      "Obtain plastic DoC for each grade in the wetted path",
    ],
  },
  CRA: {
    label: "CRA",
    typicalEvidence: [
      "Product boundary, asset inventory & software ownership",
      "Cybersecurity technical file: design, dependencies, support",
      "Vulnerability handling & disclosure process with named owner",
    ],
    commonMissing: [
      "App/cloud responsibilities not mapped to product",
      "Support period and patch-delivery path not defined",
      "No maintainable software inventory for release",
    ],
    blockers: [
      "No owner for vulnerability handling or patches",
      "Software architecture still moving, boundary can't be frozen",
    ],
    nextActions: [
      "Define product boundary and software inventory",
      "Assign coordinated vulnerability disclosure owner",
      "Commit to a minimum security-update support period",
      "Map app and cloud responsibilities to product boundary",
    ],
  },
  ECO: {
    label: "Ecodesign",
    typicalEvidence: [
      "Applicability matrix for relevant implementing measures",
      "Mode definitions: off, standby, networked-standby, radios",
      "Energy test reports per hardware/firmware/accessories",
      "Product info, repair & spare-part review",
    ],
    commonMissing: [
      "No mapping to relevant horizontal or specific measure",
      "Power modes & default settings inconsistently defined",
      "EPS or display-specific obligations not checked",
      "Repair or spare-part obligations not assessed",
    ],
    blockers: [
      "Relevant implementing measures not checked at all",
      "Energy-mode behavior not final enough to review",
    ],
    nextActions: [
      "Map SKU to every applicable ecodesign implementing measure",
      "Define and lock off, standby, and networked-standby modes",
      "Run energy measurements per hardware/firmware/accessories",
      "Check EPS, display, and repair/spare-part obligations",
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
    /air.?condition/, /heat.?pump/, /dehumidif/, /hvac/, /chiller/,
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

function resolveProductType(result, routeSections, descriptionText) {
  const rawType = result?.product_type || "";

  const allCodes = (routeSections || [])
    .flatMap((section) => section.items || [])
    .map((item) => String(item?.code || "").toUpperCase());

  const productText = [
    rawType,
    result?.summary || "",
    descriptionText || "",
    ...(result?.all_traits || []),
  ].join(" ").toLowerCase();

  for (const [stdKey, scope] of Object.entries(VERTICAL_STANDARD_SCOPE)) {
    const hasStandard = allCodes.some((code) => code.includes(stdKey.toUpperCase()));
    if (!hasStandard) continue;

    for (const { pattern, type } of scope.detect) {
      if (pattern.test(productText)) return type;
    }

    // Standard matched but no specific subtype detected — use the default type
    return scope.defaultType;
  }

  return rawType;
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

function normalizeMissingInputs(guidanceItems, descriptionText, result, routeSections) {
  const lowered = String(descriptionText || "").toLowerCase();

  // Combined context: description + product type + backend traits
  const allContext = [
    lowered,
    (result?.product_type || "").toLowerCase(),
    (result?.summary || "").toLowerCase(),
    ...(result?.all_traits || []).map((t) => String(t).toLowerCase()),
  ].join(" ");

  const routeKeys = new Set((routeSections || []).map((s) => s.key));

  // Product-family flags derived from combined context
  const isAppliance = /coffee|kettle|air.?fry|oven|vacuum|robot.?vac|air.?purif|fan\b|heater|dishwasher|washing|dryer|blender|mixer|toaster|fridge|freezer|appliance/.test(allContext);
  const isIndustrial = /\bindustrial\b|din.?rail|control.?cabinet|plc\b|hmi\b/.test(allContext);
  const isWearable = /wearable|on.?body|smartwatch|fitness.?band|earphone|headphone|personal.?care|toothbrush|earwear/.test(allContext);
  const isMedical = /\bmedical\b|\bpatient\b|clinical|therapeutic|diagnostic|mdr\b/.test(allContext);
  const isCameraProduct = /\bcamera\b|cctv|doorbell.?cam|webcam|dashcam|security.?cam|surveillance/.test(allContext);
  const hasChildContext = /\bchild\b|children|toy\b|infant|kid\b/.test(allContext);
  const hasMicContext = /microphone|mic\b|voice.?assistant|\bspeaker\b/.test(allContext);
  const hasFoodContext = /food|drink|water|coffee|kettle|blender|kitchen|cook|bake|grinder/.test(allContext);

  /** Returns true if the item's topic is irrelevant for the detected product context. */
  function isTopicIrrelevantForProduct(itemText) {
    const t = String(itemText).toLowerCase();
    if (TOPIC_CLUSTERS.medical.test(t) && !isMedical && !isWearable) return true;
    if (TOPIC_CLUSTERS.body.test(t) && !isWearable) return true;
    if (TOPIC_CLUSTERS.camera.test(t) && !isCameraProduct && !/camera|imaging|optical/.test(lowered)) return true;
    if (TOPIC_CLUSTERS.microphone.test(t) && !hasMicContext) return true;
    if (TOPIC_CLUSTERS.child.test(t) && !hasChildContext) return true;
    if (TOPIC_CLUSTERS.food.test(t) && !hasFoodContext) return true;
    return false;
  }

  /** Returns true if the item's topic is already answered by the description. */
  function isAlreadyStated(item) {
    const suppressor = GUIDANCE_SUPPRESSORS[item.key];
    if (suppressor && lowered && suppressor.test(lowered)) return true;
    const itemText = `${item.title || ""} ${item.reason || ""} ${item.description || ""} ${item.message || ""}`.toLowerCase();
    if (TOPIC_CLUSTERS.wireless.test(itemText) && /wifi|wi.?fi|bluetooth|ble\b|nfc\b|no.?wireless|no.?radio|no wireless/.test(lowered)) return true;
    if (TOPIC_CLUSTERS.power.test(itemText) && /mains|230v|240v|rechargeable|lithium|battery|ac.?power/.test(lowered)) return true;
    if (TOPIC_CLUSTERS.user_group.test(itemText) && /consumer|professional|industrial|household/.test(lowered)) return true;
    if (TOPIC_CLUSTERS.cloud_arch.test(itemText) && /cloud|ota|local.?only|no.?cloud|app.?control/.test(lowered)) return true;
    return false;
  }

  // Process backend guidance items with filtering
  const items = (guidanceItems || [])
    .filter((item) => !isAlreadyStated(item))
    .filter((item) => {
      const combinedText = `${item.title || ""} ${item.reason || ""} ${item.description || ""} ${item.message || ""} ${item.key || ""}`;
      return !isTopicIrrelevantForProduct(combinedText);
    })
    .map((item) => {
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

  // Semantic deduplication: keep only the first item per topic cluster
  const seenClusters = new Set();
  const seenKeys = new Set();
  const deduped = items.filter((item) => {
    if (seenKeys.has(item.key)) return false;
    seenKeys.add(item.key);
    const itemText = `${item.title} ${item.reason}`.toLowerCase();
    for (const [cluster, re] of Object.entries(TOPIC_CLUSTERS)) {
      if (re.test(itemText)) {
        if (seenClusters.has(cluster)) return false;
        seenClusters.add(cluster);
        break;
      }
    }
    return true;
  });

  // Add frontend-generated hints only where relevant and not already present
  MISSING_INPUT_HINTS.forEach((hint) => {
    if (!lowered || hint.match.test(lowered)) return;
    if (deduped.some((item) => item.key === hint.key)) return;
    const hintText = `${hint.title} ${hint.reason}`;
    if (isTopicIrrelevantForProduct(hintText)) return;

    if (hint.key === "wireless_connectivity") {
      const connectivityContext = /cloud|app\b|connected|ota|remote.?control|sync/.test(lowered);
      const radioInRoute = routeKeys.has("RED") || routeKeys.has("RED_CYBER");
      const smartProductType = /smart|iot|connected/.test(allContext);
      if (!connectivityContext && !radioInRoute && !smartProductType && !isWearable && !isCameraProduct) return;
    }
    if (hint.key === "consumer_professional") {
      const consumerImplied = isAppliance || /household|domestic|home.?use/.test(allContext);
      const professionalImplied = isIndustrial;
      if (consumerImplied || professionalImplied) return;
    }

    let severity = hint.severity;
    if (hint.key === "wireless_connectivity" && isIndustrial) severity = "route-affecting";

    deduped.push({ key: hint.key, title: hint.title, severity, reason: hint.reason, examples: [] });
  });

  return deduped.sort((a, b) => {
    const rank = { blocker: 0, "route-affecting": 1, helpful: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}

function inferRiskDrivers(result, routeSections, descriptionText) {
  const drivers = [];
  const lowered = String(descriptionText || "").toLowerCase();
  const traits = new Set(result?.all_traits || []);
  const hasRadioRoute = routeSections.some((s) => s.key === "RED" || s.key === "RED_CYBER");

  if (hasRadioRoute || traits.has("radio") || /wifi|wi.?fi|bluetooth|nfc\b|wireless/.test(lowered)) {
    drivers.push("radio transmission (RED)");
  }
  if (traits.has("cloud") || traits.has("ota") || /cloud.?account|ota|firmware.?update|app.?control/.test(lowered)) {
    drivers.push("cloud / OTA connectivity");
  }
  if (traits.has("battery_powered") || /lithium|li.?ion|rechargeable.?battery/.test(lowered)) {
    drivers.push("lithium battery");
  }
  if (/wearable|on.?body|body.?contact|worn\b|personal care|toothbrush|earphone|headphone/.test(lowered)) {
    drivers.push("body-contact use");
  }
  if (traits.has("camera") || traits.has("microphone") || /camera|microphone|personal.?data|voice.?assistant/.test(lowered)) {
    drivers.push("personal data processing");
  }
  if (/medical|patient|health.?monitor|clinical|therapeutic|diagnostic/.test(lowered)) {
    drivers.push("medical-boundary uncertainty");
  }

  return drivers;
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
  };
}
