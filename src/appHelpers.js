export const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

export const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

export const DIR_SHORT = {
  LVD: "LVD",
  EMC: "EMC",
  RED: "RED",
  RED_CYBER: "RED Cyber",
  CRA: "CRA",
  ROHS: "RoHS",
  REACH: "REACH",
  GDPR: "GDPR",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  ECO: "Ecodesign",
  BATTERY: "Battery",
  FCM: "FCM",
  FCM_PLASTIC: "FCM Plastic",
  MD: "MD",
  MACH_REG: "Machinery Reg.",
  OTHER: "Other",
};

export const DIR_ORDER = [
  "LVD",
  "EMC",
  "RED",
  "RED_CYBER",
  "ROHS",
  "REACH",
  "GDPR",
  "FCM",
  "FCM_PLASTIC",
  "BATTERY",
  "ECO",
  "ESPR",
  "CRA",
  "AI_Act",
  "MD",
  "MACH_REG",
  "OTHER",
];

export const DIR_TONES = {
  LVD: {
    dot: "#8fdab8",
    bg: "rgba(143,218,184,0.12)",
    bd: "rgba(143,218,184,0.26)",
    text: "#9ee7c4",
  },
  EMC: {
    dot: "#7fd4ec",
    bg: "rgba(127,212,236,0.12)",
    bd: "rgba(127,212,236,0.26)",
    text: "#8fe0f5",
  },
  RED: {
    dot: "#7db9ff",
    bg: "rgba(125,185,255,0.13)",
    bd: "rgba(125,185,255,0.28)",
    text: "#93c5ff",
  },
  RED_CYBER: {
    dot: "#b9a2ff",
    bg: "rgba(185,162,255,0.13)",
    bd: "rgba(185,162,255,0.28)",
    text: "#cab7ff",
  },
  CRA: {
    dot: "#93e4b7",
    bg: "rgba(147,228,183,0.12)",
    bd: "rgba(147,228,183,0.25)",
    text: "#a7eec4",
  },
  ROHS: {
    dot: "#f3cc76",
    bg: "rgba(243,204,118,0.13)",
    bd: "rgba(243,204,118,0.28)",
    text: "#f6d58c",
  },
  REACH: {
    dot: "#efb382",
    bg: "rgba(239,179,130,0.13)",
    bd: "rgba(239,179,130,0.28)",
    text: "#f5c191",
  },
  GDPR: {
    dot: "#72d6c2",
    bg: "rgba(114,214,194,0.12)",
    bd: "rgba(114,214,194,0.26)",
    text: "#88e1cf",
  },
  AI_Act: {
    dot: "#bfa6ff",
    bg: "rgba(191,166,255,0.12)",
    bd: "rgba(191,166,255,0.26)",
    text: "#cfbcff",
  },
  ESPR: {
    dot: "#f4a56e",
    bg: "rgba(244,165,110,0.12)",
    bd: "rgba(244,165,110,0.26)",
    text: "#f8b684",
  },
  ECO: {
    dot: "#86dca2",
    bg: "rgba(134,220,162,0.12)",
    bd: "rgba(134,220,162,0.25)",
    text: "#99e6b0",
  },
  BATTERY: {
    dot: "#c7e56e",
    bg: "rgba(199,229,110,0.12)",
    bd: "rgba(199,229,110,0.25)",
    text: "#d4ee84",
  },
  FCM: {
    dot: "#f0adc8",
    bg: "rgba(240,173,200,0.13)",
    bd: "rgba(240,173,200,0.28)",
    text: "#f6bdd5",
  },
  FCM_PLASTIC: {
    dot: "#f0adc8",
    bg: "rgba(240,173,200,0.13)",
    bd: "rgba(240,173,200,0.28)",
    text: "#f6bdd5",
  },
  MD: {
    dot: "#9bc1ff",
    bg: "rgba(155,193,255,0.13)",
    bd: "rgba(155,193,255,0.28)",
    text: "#b2d2ff",
  },
  MACH_REG: {
    dot: "#9bc1ff",
    bg: "rgba(155,193,255,0.13)",
    bd: "rgba(155,193,255,0.28)",
    text: "#b2d2ff",
  },
  OTHER: {
    dot: "#a7b7cb",
    bg: "rgba(167,183,203,0.12)",
    bd: "rgba(167,183,203,0.25)",
    text: "#c0cbda",
  },
};

export const STATUS = {
  LOW: {
    bg: "rgba(128,214,168,0.14)",
    bd: "rgba(128,214,168,0.28)",
    text: "#9ce0bc",
  },
  MEDIUM: {
    bg: "rgba(240,192,103,0.15)",
    bd: "rgba(240,192,103,0.30)",
    text: "#f5cc81",
  },
  HIGH: {
    bg: "rgba(244,142,120,0.16)",
    bd: "rgba(244,142,120,0.30)",
    text: "#ffb19e",
  },
  CRITICAL: {
    bg: "rgba(244,110,110,0.17)",
    bd: "rgba(244,110,110,0.32)",
    text: "#ff9b9b",
  },
};

export const IMPORTANCE = {
  high: {
    bg: "rgba(244,142,120,0.14)",
    bd: "rgba(244,142,120,0.28)",
    text: "#ffb19e",
    dot: "#f59d8d",
  },
  medium: {
    bg: "rgba(240,192,103,0.14)",
    bd: "rgba(240,192,103,0.28)",
    text: "#f5cc81",
    dot: "#f0c067",
  },
  low: {
    bg: "rgba(128,214,168,0.13)",
    bd: "rgba(128,214,168,0.26)",
    text: "#9ce0bc",
    dot: "#80d6a8",
  },
};

export const SECTION_TONES = {
  harmonized: {
    bg: "rgba(125,185,255,0.12)",
    bd: "rgba(125,185,255,0.26)",
    text: "#93c5ff",
  },
  state_of_the_art: {
    bg: "rgba(244,165,110,0.12)",
    bd: "rgba(244,165,110,0.26)",
    text: "#f8b684",
  },
  review: {
    bg: "rgba(244,142,120,0.13)",
    bd: "rgba(244,142,120,0.28)",
    text: "#ffb19e",
  },
  unknown: {
    bg: "rgba(167,183,203,0.11)",
    bd: "rgba(167,183,203,0.22)",
    text: "#c0cbda",
  },
};

export const DEFAULT_TEMPLATES = [
  {
    label: "Coffee machine",
    text: "Connected espresso machine with mains power, Wi-Fi app control, OTA updates, cloud account, grinder, pressure, water tank, and food-contact brew path.",
  },
  {
    label: "Electric kettle",
    text: "Electric kettle with mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi control.",
  },
  {
    label: "Air purifier",
    text: "Smart air purifier with mains power, motorized fan, electronic controls, Wi-Fi app control, networked standby, and OTA firmware updates.",
  },
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, Wi-Fi and Bluetooth, cloud account, OTA firmware updates, LiDAR navigation, and camera.",
  },
];

const KNOWN_RESULT_KEYS = new Set([
  "summary",
  "product_type",
  "product_match_confidence",
  "overall_risk",
  "standard_sections",
  "standards",
  "review_items",
  "legislation_sections",
  "missing_information_items",
  "input_gaps_panel",
  "all_traits",
  "diagnostics",
  "suggested_quick_adds",
  "product_family",
  "product_family_confidence",
  "product_subtype",
  "product_subtype_confidence",
  "product_match_stage",
  "product_candidates",
  "functional_classes",
  "confirmed_functional_classes",
  "explicit_traits",
  "confirmed_traits",
  "inferred_traits",
  "trait_evidence",
  "product_match_audit",
  "standard_match_audit",
  "stats",
  "knowledge_base_meta",
  "analysis_audit",
  "top_actions",
  "current_path",
  "future_watchlist",
  "suggested_questions",
]);

const LEGISLATION_GROUP_ORDER = ["ce", "non_ce", "future", "framework", "other"];

export function titleCase(input) {
  return String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function gapLabel(key) {
  const labels = {
    product_type: "Product type",
    power_source: "Power source",
    radio_scope_confirmation: "Radio scope",
    radio_technology: "Radio technology",
    wifi_band: "Wi-Fi band",
    food_contact_materials: "Food-contact materials",
    connectivity_architecture: "Connected design",
    redcyber_auth_scope: "Login and auth",
    redcyber_transaction_scope: "Payments",
    contradictions: "Contradictions",
  };

  return labels[key] || titleCase(key);
}

export function sentenceCaseList(values) {
  return (values || []).map((value) => titleCase(String(value)));
}

export function directiveTone(key) {
  return DIR_TONES[key] || DIR_TONES.OTHER;
}

export function directiveShort(key) {
  return DIR_SHORT[key] || titleCase(key);
}

export function directiveRank(key) {
  const rank = DIR_ORDER.indexOf(key || "OTHER");
  return rank === -1 ? 999 : rank;
}

export function titleCaseMinor(input) {
  const small = new Set(["and", "or", "of", "the", "to", "for", "in", "on"]);

  return String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (
        ["LVD", "EMC", "RED", "CRA", "GDPR", "ESPR", "ROHS", "REACH", "MD"].includes(
          upper
        )
      ) {
        return upper;
      }
      if (upper === "AI") {
        return "AI";
      }
      const lower = word.toLowerCase();
      if (index > 0 && small.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function routeTitle(section) {
  const titles = {
    LVD: "LVD safety route",
    EMC: "EMC compatibility route",
    RED: "RED wireless route",
    RED_CYBER: "RED cybersecurity route",
    ROHS: "RoHS materials route",
    REACH: "REACH chemicals route",
    GDPR: "GDPR data route",
    AI_Act: "AI Act route",
    ESPR: "ESPR route",
    ECO: "Ecodesign route",
    BATTERY: "Battery Regulation route",
    FCM: "Food contact materials route",
    FCM_PLASTIC: "Food contact plastics route",
    CRA: "Cyber Resilience Act route",
    MD: "Machinery Directive route",
    MACH_REG: "Machinery Regulation route",
    OTHER: "Additional route",
  };

  return titleCaseMinor(
    titles[section?.key] ||
      section?.title ||
      directiveShort(section?.key) ||
      "Additional route"
  );
}

export function formatUiLabel(value) {
  return titleCaseMinor(String(value || ""));
}

export function normalizeStandardDirective(item) {
  const code = String(item?.code || "").toUpperCase();
  if (code.startsWith("EN 18031-")) {
    return "RED_CYBER";
  }

  return (
    item?.directive_key ||
    item?.directive ||
    item?.legislation_key ||
    item?.section_key ||
    "OTHER"
  );
}

export function joinText(base, addition) {
  const current = String(base || "").trim();
  const next = String(addition || "").trim();

  if (!next) return current;
  if (!current) return next;
  if (current.toLowerCase().includes(next.toLowerCase())) return current;

  const separator = /[\s,;:]$/.test(current) ? " " : current.endsWith(".") ? " " : ", ";
  return `${current}${separator}${next}`;
}

export function uniqueBy(items, getKey) {
  const map = new Map();
  (items || []).forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

export function prettyValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

export function serializePreview(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    const primitiveArray = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        ["string", "number", "boolean"].includes(typeof item)
    );
    if (primitiveArray) {
      return value.length ? value.join(", ") : "[]";
    }
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function buildDynamicTemplates(products) {
  const lookup = new Map((products || []).map((product) => [product.id, product]));
  const templates = [];

  function addTemplate(productId, suffix, labelOverride) {
    const product = lookup.get(productId);
    if (!product) return;
    templates.push({
      label: labelOverride || product.label,
      text: `${product.label} with ${suffix}.`,
    });
  }

  addTemplate(
    "coffee_machine",
    "mains power, heating, water tank, grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA updates",
    "Coffee machine"
  );
  addTemplate(
    "electric_kettle",
    "mains power, liquid heating, food-contact water path, electronic controls, and optional Wi-Fi radio control",
    "Electric kettle"
  );
  addTemplate(
    "air_purifier",
    "mains power, motorized fan, sensor electronics, Wi-Fi radio, app control, and OTA updates",
    "Air purifier"
  );
  addTemplate(
    "robot_vacuum",
    "rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, and LiDAR navigation",
    "Robot vacuum"
  );
  addTemplate(
    "robot_vacuum_cleaner",
    "rechargeable battery, Wi-Fi and Bluetooth radio, cloud account, OTA updates, and LiDAR navigation",
    "Robot vacuum"
  );

  return uniqueBy(templates.length ? templates : DEFAULT_TEMPLATES, (item) => item.label).slice(
    0,
    4
  );
}

export function buildGuidedChips(metadata, result) {
  const productId = result?.product_type;
  const product = (metadata?.products || []).find((item) => item.id === productId);
  const traits = new Set(result?.all_traits || []);
  const missingItems = result?.missing_information_items || [];
  const chips = [];

  const push = (label, text) => {
    if (!label || !text) return;
    if (!chips.some((item) => item.text === text)) {
      chips.push({ label, text });
    }
  };

  missingItems.forEach((item) =>
    (item.examples || []).slice(0, 2).forEach((example) => push(gapLabel(item.key), example))
  );

  if (product?.implied_traits?.includes("food_contact") || traits.has("food_contact")) {
    push("Food contact", "food-contact plastics, coatings, silicone, rubber, and metal parts");
    push("Water path", "wetted path materials, seals, and water tank");
  }
  if (product?.implied_traits?.includes("motorized") || traits.has("motorized")) {
    push("Motor", "motorized function");
    push("Pump", "pump or fluid transfer function");
  }
  if (traits.has("radio")) {
    push("Wi-Fi", "Wi-Fi radio");
    push("Bluetooth", "Bluetooth LE radio");
    push("OTA", "OTA firmware updates");
  }
  if (!traits.has("radio") && (traits.has("app_control") || traits.has("cloud") || traits.has("ota"))) {
    push("Wi-Fi", "Wi-Fi radio");
    push("Bluetooth", "Bluetooth LE radio");
  }
  if (traits.has("cloud") || traits.has("app_control") || traits.has("internet")) {
    push("Cloud", "cloud account required");
    push("Local control", "local LAN control without cloud dependency");
    push("Patching", "security and firmware patching over the air");
  }
  if (traits.has("battery_powered")) push("Battery", "rechargeable lithium battery");
  if (traits.has("camera")) push("Camera", "integrated camera");
  if (traits.has("microphone")) push("Microphone", "microphone or voice input");

  if (!chips.length) {
    push("Mains", "230 V mains powered");
    push("Consumer", "consumer household use");
    push("App control", "mobile app control");
    push("Wi-Fi", "Wi-Fi radio");
    push("Food contact", "food-contact plastics or coatings");
  }

  return chips.slice(0, 10);
}

export function buildGuidanceItems(result) {
  const traits = new Set(result?.all_traits || []);
  const rawItems = result?.input_gaps_panel?.items || result?.missing_information_items || [];
  const items = [];
  const seen = new Set();

  const add = (key, title, why, importance, choices = []) => {
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      key,
      title,
      why,
      importance,
      choices: choices.filter(Boolean).slice(0, 3),
      routeImpact: [],
    });
  };

  if (traits.has("radio")) {
    add("radio_stack", "Confirm radios", "Changes RED and RF scope.", "high", [
      "Wi-Fi radio",
      "Bluetooth LE radio",
      "NFC radio",
    ]);
  }

  if (
    traits.has("cloud") ||
    traits.has("internet") ||
    traits.has("app_control") ||
    traits.has("ota") ||
    traits.has("wifi")
  ) {
    add(
      "connected_architecture",
      "Confirm connected design",
      "Changes EN 18031 and the cybersecurity route.",
      "high",
      ["cloud account required", "local LAN control without cloud dependency", "OTA firmware updates"]
    );
  }

  if (traits.has("food_contact")) {
    add(
      "food_contact",
      "Confirm wetted materials",
      "Changes food-contact obligations.",
      "medium",
      ["food-contact plastics", "silicone seal", "metal wetted path"]
    );
  }

  if (traits.has("battery_powered")) {
    add(
      "battery",
      "Confirm battery setup",
      "Changes Battery Regulation scope.",
      "medium",
      ["rechargeable lithium battery", "replaceable battery", "battery supplied with the product"]
    );
  }

  if (traits.has("camera") || traits.has("microphone") || traits.has("personal_data_likely")) {
    add(
      "data_functions",
      "Confirm sensitive functions",
      "Changes cybersecurity and privacy expectations.",
      "high",
      ["integrated camera", "microphone or voice input", "user account and profile data"]
    );
  }

  rawItems.forEach((item) => {
    add(item.key, gapLabel(item.key), item.message, item.importance || "medium", item.examples || []);
    const target = items.find((entry) => entry.key === item.key);
    if (target) {
      target.routeImpact = sentenceCaseList(item.route_impact || []);
    }
  });

  return items.slice(0, 6);
}

export function buildCompactLegislationItems(result) {
  const sections = result?.legislation_sections || [];
  const allItems = sections.flatMap((section) =>
    (section.items || []).map((item) => ({
      ...item,
      section_key: section.key,
      section_title: section.title,
    }))
  );

  return uniqueBy(
    [...allItems].sort(
      (a, b) =>
        directiveRank(a.directive_key) - directiveRank(b.directive_key) ||
        String(a.code || "").localeCompare(String(b.code || ""))
    ),
    (item) => `${item.code}-${item.directive_key}-${item.title}`
  );
}

export function compactLegislationGroupLabel(item) {
  const key = item.section_key || item.key;
  if (key === "framework") return "Additional";
  if (key === "non_ce") return "Parallel";
  if (key === "future") return "Future";
  if (key === "ce") return "CE";
  return titleCase(key);
}

function standardCodeLabel(item) {
  return `${String(item?.code || "")} ${String(item?.title || "")}`.trim();
}

function standardCodeNumber(item) {
  return String(item?.code || "").replace(/\s+/g, " ").trim();
}

function lvdPrimaryRank(item) {
  const label = standardCodeLabel(item);
  const code = standardCodeNumber(item);

  if (/(?:^|\b)(?:EN|IEC)\s*60335\s*-\s*1(?:\b|$)/i.test(label)) {
    return [0, 0, 0];
  }
  if (/(?:^|\b)(?:EN|IEC)\s*62368\s*-\s*1(?:\b|$)/i.test(label)) {
    return [0, 1, 0];
  }

  const part2Match = code.match(/(?:EN|IEC)\s*60335\s*-\s*2\s*-\s*(\d+)/i);
  if (part2Match) {
    return [1, Number(part2Match[1] || 0), 0];
  }

  if (/(?:^|\b)(?:EN|IEC)\s*62233(?:\b|$)/i.test(label)) {
    return [2, 0, 0];
  }
  if (/(?:^|\b)(?:EN|IEC)\s*62311(?:\b|$)/i.test(label)) {
    return [2, 1, 0];
  }

  if (/(?:^|\b)(?:EN|IEC)\s*60825(?:-\d+)?(?:\b|$)/i.test(label) || /\blaser\b/i.test(label)) {
    const laserPartMatch = code.match(/(?:EN|IEC)\s*60825\s*-\s*(\d+)/i);
    return [3, Number(laserPartMatch?.[1] || 0), 0];
  }

  return [4, 0, 0];
}

export function sortStandardItems(items, sectionKey = null) {
  return [...(items || [])].sort((a, b) => {
    const aDirective = sectionKey || normalizeStandardDirective(a);
    const bDirective = sectionKey || normalizeStandardDirective(b);

    if (aDirective === "LVD" && bDirective === "LVD") {
      const aRank = lvdPrimaryRank(a);
      const bRank = lvdPrimaryRank(b);
      const rankDiff =
        aRank[0] - bRank[0] ||
        aRank[1] - bRank[1] ||
        aRank[2] - bRank[2];

      if (rankDiff !== 0) return rankDiff;
    }

    return (
      directiveRank(aDirective) - directiveRank(bDirective) ||
      String(a.code || "").localeCompare(String(b.code || ""), undefined, { numeric: true, sensitivity: "base" }) ||
      String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" })
    );
  });
}

export function buildRouteSections(result) {
  const explicitSections = (result?.standard_sections || [])
    .map((section) => ({
      ...section,
      items: sortStandardItems(
        (section.items || []).map((item) => ({
          ...item,
          harmonization_status:
            item.harmonization_status || (item.item_type === "review" ? "review" : "unknown"),
        })),
        section.key
      ),
      count: (section.items || []).length,
    }))
    .sort((a, b) => directiveRank(a.key) - directiveRank(b.key));

  if (explicitSections.length) {
    return explicitSections;
  }

  const rows = [
    ...(result?.standards || []).map((item) => ({
      ...item,
      item_type: item.item_type || "standard",
    })),
    ...(result?.review_items || []).map((item) => ({
      ...item,
      item_type: "review",
      harmonization_status: item.harmonization_status || "review",
    })),
  ];

  const grouped = {};
  rows.forEach((item) => {
    const key = normalizeStandardDirective(item);
    if (!grouped[key]) {
      grouped[key] = {
        key,
        title: routeTitle({ key }),
        items: [],
      };
    }
    grouped[key].items.push(item);
  });

  return Object.values(grouped)
    .map((section) => ({
      ...section,
      items: sortStandardItems(section.items, section.key),
      count: section.items.length,
    }))
    .sort((a, b) => directiveRank(a.key) - directiveRank(b.key));
}

export function buildDirectiveBreakdown(sections) {
  const counts = {};
  (sections || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      const directive = normalizeStandardDirective(item);
      counts[directive] = (counts[directive] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .sort((a, b) => directiveRank(a[0]) - directiveRank(b[0]))
    .map(([key, count]) => ({ key, count }));
}

export function buildLegislationGroups(result) {
  const sections = (result?.legislation_sections || []).filter((section) => (section.items || []).length);
  if (sections.length) {
    return sections
      .map((section) => ({
        ...section,
        items: uniqueBy(
          (section.items || []).map((item) => ({
            ...item,
            section_key: section.key,
          })),
          (item) => `${item.code}-${item.directive_key || item.title}`
        ),
      }))
      .sort(
        (a, b) =>
          LEGISLATION_GROUP_ORDER.indexOf(a.key) - LEGISLATION_GROUP_ORDER.indexOf(b.key)
      );
  }

  const grouped = {};
  buildCompactLegislationItems(result).forEach((item) => {
    const key = item.section_key || "other";
    if (!grouped[key]) {
      grouped[key] = {
        key,
        title: compactLegislationGroupLabel(item),
        items: [],
      };
    }
    grouped[key].items.push(item);
  });

  return Object.values(grouped).sort(
    (a, b) => LEGISLATION_GROUP_ORDER.indexOf(a.key) - LEGISLATION_GROUP_ORDER.indexOf(b.key)
  );
}

export function getAdditionalEntries(result) {
  return Object.entries(result || {}).filter(([key]) => !KNOWN_RESULT_KEYS.has(key));
}


export function formatStageLabel(stage) {
  const map = {
    family: "Family match",
    subtype: "Subtype match",
    ambiguous: "Ambiguous",
  };
  return map[String(stage || "").toLowerCase()] || formatUiLabel(stage || "unknown");
}

export function buildCatalogSummary(result) {
  if (!result) return null;

  const productCandidates = (result?.product_candidates || []).slice(0, 3).map((candidate) => ({
    id: candidate.id,
    label: formatUiLabel(candidate.label || candidate.id),
    confidence: formatUiLabel(candidate.confidence || "medium"),
    matchedAlias: candidate.matched_alias || "",
    score: candidate.score ?? 0,
    reasons: (candidate.reasons || []).slice(0, 3).map((reason) => titleCaseMinor(reason)),
  }));

  return {
    product: formatUiLabel(result?.product_type || "unclear"),
    family: formatUiLabel(result?.product_family || "unclear"),
    familyConfidence: formatUiLabel(result?.product_family_confidence || "low"),
    subtype: result?.product_subtype ? formatUiLabel(result.product_subtype) : "",
    subtypeConfidence: formatUiLabel(result?.product_subtype_confidence || "low"),
    stage: formatStageLabel(result?.product_match_stage),
    candidates: productCandidates,
    functionalClasses: sentenceCaseList(result?.functional_classes || []),
    confirmedFunctionalClasses: sentenceCaseList(result?.confirmed_functional_classes || []),
    currentPath: (result?.current_path || []).map((entry) => titleCaseMinor(entry)),
    topActions: (result?.top_actions || []).filter(Boolean),
    futureWatchlist: (result?.future_watchlist || []).filter(Boolean).map((entry) => titleCaseMinor(entry)),
    stats: result?.stats || {},
    knowledgeBaseMeta: result?.knowledge_base_meta || null,
  };
}

export function buildTraitBuckets(result) {
  const explicit = new Set(result?.explicit_traits || []);
  const confirmed = new Set(result?.confirmed_traits || []);
  const inferred = new Set(result?.inferred_traits || []);

  const evidenceByTrait = new Map(
    (result?.trait_evidence || []).map((item) => [item.trait, item])
  );

  const decorate = (trait) => {
    const evidence = evidenceByTrait.get(trait) || {};
    return {
      key: trait,
      label: titleCaseMinor(trait),
      state: formatUiLabel(evidence.state || ""),
      factBasis: formatUiLabel(evidence.fact_basis || ""),
      confirmed: Boolean(evidence.confirmed),
      evidence: (evidence.evidence || []).slice(0, 3).map((entry) => titleCaseMinor(entry)),
    };
  };

  return {
    explicit: Array.from(explicit).sort().map(decorate),
    confirmed: Array.from(confirmed).sort().map(decorate),
    inferred: Array.from(inferred).sort().map(decorate),
  };
}

export function buildAuditSnapshot(result) {
  if (!result) return null;

  const productAudit = result?.product_match_audit || {};
  const standardAudit = result?.standard_match_audit || {};
  const selected = standardAudit?.selected || [];
  const review = standardAudit?.review || [];
  const rejected = standardAudit?.rejected || [];

  return {
    ambiguityReason: productAudit?.ambiguity_reason || "",
    aliasHits: (productAudit?.alias_hits || []).slice(0, 4),
    clueHits: (productAudit?.clue_hits || []).slice(0, 4),
    retrievalBasis: (productAudit?.retrieval_basis || []).slice(0, 4).map((entry) => titleCaseMinor(entry)),
    negations: (productAudit?.negations || []).slice(0, 3).map((entry) => titleCaseMinor(entry)),
    standardContextTags: (standardAudit?.context_tags || []).slice(0, 8).map((entry) => titleCaseMinor(entry)),
    selectedPreview: selected.slice(0, 4).map((item) => ({
      code: item.code,
      reason: item.reason || "",
      factBasis: formatUiLabel(item.fact_basis || ""),
      confidence: formatUiLabel(item.confidence || ""),
    })),
    counts: {
      selected: selected.length,
      review: review.length,
      rejected: rejected.length,
    },
  };
}


export function buildEngineSidebarSections(result) {
  const summary = buildCatalogSummary(result);
  const traits = buildTraitBuckets(result);
  const audit = buildAuditSnapshot(result);

  if (!summary && !audit) return null;

  const candidateItems = (summary?.candidates || []).slice(0, 3).map((candidate, index) => ({
    key: candidate.id || `${candidate.label}-${index}`,
    title: index === 0 ? `${candidate.label} · winner` : candidate.label,
    detail: [
      candidate.confidence && candidate.confidence !== '—' ? candidate.confidence : '',
      Number.isFinite(candidate.score) ? `score ${candidate.score}` : '',
      candidate.matchedAlias ? `alias ${candidate.matchedAlias}` : '',
    ].filter(Boolean).join(' · '),
    tags: (candidate.reasons || []).slice(0, 3),
  }));

  const evidenceGroups = [
    { key: 'explicit', title: 'Explicit traits', items: (traits?.explicit || []).slice(0, 8).map((item) => item.label) },
    { key: 'confirmed', title: 'Confirmed traits', items: (traits?.confirmed || []).slice(0, 8).map((item) => item.label) },
    { key: 'inferred', title: 'Inferred traits', items: (traits?.inferred || []).slice(0, 8).map((item) => item.label) },
  ].filter((group) => group.items.length);

  const signalGroups = [
    { key: 'alias_hits', title: 'Alias hits', items: audit?.aliasHits || [] },
    { key: 'clue_hits', title: 'Clue hits', items: audit?.clueHits || [] },
    { key: 'retrieval_basis', title: 'Retrieval basis', items: audit?.retrievalBasis || [] },
    { key: 'negations', title: 'Negations', items: audit?.negations || [] },
  ].filter((group) => group.items.length);

  const stats = [
    { key: 'selected', label: 'Selected', value: String(audit?.counts?.selected ?? summary?.stats?.standards_count ?? 0) },
    { key: 'review', label: 'Review', value: String(audit?.counts?.review ?? summary?.stats?.review_items_count ?? 0) },
    { key: 'rejected', label: 'Rejected', value: String(audit?.counts?.rejected ?? 0) },
    { key: 'product_gated', label: 'Product-gated', value: String(summary?.stats?.product_gated_standards_count ?? 0) },
    { key: 'ambiguity', label: 'Ambiguity', value: String(summary?.stats?.ambiguity_flag_count ?? 0) },
  ];

  return {
    stage: summary?.stage || '',
    ambiguityReason: audit?.ambiguityReason || '',
    candidates: candidateItems,
    evidenceGroups,
    signalGroups,
    stats,
  };
}
export function buildClipboardSummary({ result, description, routeSections, legislationGroups }) {
  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const missingItems = result?.missing_information_items || [];
  const traits = result?.all_traits || [];
  const diagnostics = result?.diagnostics || [];

  return [
    "RuleGrid analysis summary",
    "",
    `Input: ${description || ""}`,
    "",
    `Detected product: ${formatUiLabel(result?.product_type || "unclear")}`,
    `Confidence: ${formatUiLabel(confidence)}`,
    `Overall risk: ${formatUiLabel(result?.overall_risk || "MEDIUM")}`,
    "",
    `Summary: ${result?.summary || ""}`,
    "",
    "Standards route:",
    ...routeSections.flatMap((section) => [
      `- ${routeTitle(section)} (${section.count || 0})`,
      ...sortStandardItems(section.items || []).map((item) => `  • ${item.code} — ${item.title}`),
    ]),
    "",
    "Applicable legislation:",
    ...legislationGroups.flatMap((group) => [
      `- ${titleCaseMinor(group.title || compactLegislationGroupLabel(group))}`,
      ...(group.items || []).map((item) => `  • ${item.code} — ${item.title}`),
    ]),
    missingItems.length
      ? [
          "",
          "Missing information items:",
          ...missingItems.map(
            (item) =>
              `- ${gapLabel(item.key)}: ${item.message || ""}${
                item.examples?.length ? ` (${item.examples.join(", ")})` : ""
              }`
          ),
        ]
      : [],
    traits.length ? ["", `Detected traits: ${traits.join(", ")}`] : [],
    diagnostics.length ? ["", "Diagnostics:", ...diagnostics.map((line) => `- ${line}`)] : [],
  ]
    .flat()
    .join("\n");
}
