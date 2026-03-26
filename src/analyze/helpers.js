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
  {
    label: "Air fryer",
    text: "Connected air fryer with mains power, heating element, motorized fan, food-contact cooking basket, Wi-Fi app control, OTA updates, and cloud account.",
  },
  {
    label: "Smart speaker",
    text: "Smart speaker with mains power, Wi-Fi and Bluetooth, cloud account, microphone array, voice assistant, OTA firmware updates, and app control.",
  },
  {
    label: "Robot lawn mower",
    text: "Robotic lawn mower with rechargeable lithium battery, outdoor IP-rated enclosure, Wi-Fi and Bluetooth, cloud account, OTA updates, motorized blade, and app control.",
  },
  {
    label: "Blender",
    text: "Countertop blender with mains power, motorized high-speed motor, food-contact jug and blades, electronic speed controls, and no wireless connectivity.",
  },
  {
    label: "Smart plug",
    text: "Smart plug with mains power input and output, Wi-Fi connectivity, energy monitoring, app control, OTA firmware updates, and cloud account.",
  },
  {
    label: "Pet feeder",
    text: "Automatic pet feeder with mains and battery backup power, food-contact hopper and dispenser, Wi-Fi app control, camera, cloud account, and OTA updates.",
  },
  {
    label: "Air conditioner",
    text: "Portable air conditioner with mains power, compressor, refrigerant loop, motorized fan, Wi-Fi app control, OTA firmware updates, and indoor use only.",
  },
  {
    label: "Coffee grinder",
    text: "Electric coffee grinder with mains power, motorized burr grinding mechanism, food-contact grind path and hopper, and no wireless connectivity.",
  },
  {
    label: "Stick vacuum",
    text: "Cordless stick vacuum cleaner with rechargeable lithium battery, motorized suction head, Bluetooth connectivity, app control, and OTA firmware updates.",
  },
{
  label: "VR headset",
  text: "Standalone VR headset with rechargeable lithium battery, USB-C charging, Wi-Fi and Bluetooth radios, app ecosystem, cloud account, sensors, cameras, microphone, speakers, and OTA firmware updates.",
},
{
  label: "Smart display",
  text: "Smart display with mains power, touchscreen, Wi-Fi and Bluetooth, microphone, camera, cloud account, voice assistant, app platform, and OTA software updates.",
},
{
  label: "Router",
  text: "Home Wi-Fi router with mains power, dual-band radio, Ethernet ports, web and app administration, cloud-assisted setup, and firmware updates.",
},
{
  label: "Portable projector",
  text: "Portable smart projector with mains and battery operation, Wi-Fi and Bluetooth, app platform, speakers, display optics, and OTA firmware updates.",
},
{
  label: "Baby monitor",
  text: "Connected baby monitor with camera, microphone, speaker, Wi-Fi radio, app control, cloud account, and remote viewing.",
},
{
  label: "Electric toothbrush",
  text: "Rechargeable electric toothbrush with battery charging base, motor drive, bathroom use, app connectivity, Bluetooth radio, and OTA-capable companion app ecosystem.",
},
{
  label: "Hair dryer",
  text: "Hair dryer with mains power, heating element, motorized fan, handheld personal care use, and no wireless connectivity.",
},
{
  label: "Monitor",
  text: "Computer monitor with mains power, display electronics, HDMI and USB connectivity, no wireless radio, and external peripherals.",
},
{
  label: "Webcam",
  text: "USB webcam with camera, microphone, indicator LEDs, USB power, desktop use, and no standalone wireless connectivity.",
},
{
  label: "Smart lock",
  text: "Connected smart lock with battery power, Bluetooth and Wi-Fi connectivity, mobile app control, cloud account, access credentials, and firmware updates.",
},
{
  label: "Portable EV charger",
  text: "Portable EV charging equipment with mains input, charging cable, control electronics, user interface, and optional app connectivity.",
},
];


const LEGISLATION_GROUP_ORDER = ["ce", "non_ce", "future", "framework", "other"];
const PARALLEL_OBLIGATION_ROUTE_KEYS = new Set(["CRA", "GDPR"]);

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

export function titleCaseList(values) {
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

export function isParallelObligationDirectiveKey(key) {
  return PARALLEL_OBLIGATION_ROUTE_KEYS.has(String(key || "").toUpperCase());
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

export function inferStandardCategory(item) {
  const code = String(item?.code || "").toUpperCase();
  const title = String(item?.title || "").toLowerCase();

  // Cybersecurity
  if (/18031/.test(code)) return "Cybersecurity";

  // RF Exposure
  if (/62479|50663|62311/.test(code)) return "RF Exposure";

  // EMF
  if (/62233/.test(code)) return "EMF";

  // Safety – horizontal (general Part 1 standard)
  if (/60335-1\b/.test(code) || /62368-1\b/.test(code)) return "Horizontal Safety";

  // Safety – vertical (product-specific Part 2 standard)
  if (/60335-2-\d+/.test(code)) return "Vertical Safety";

  // Radio – specific bands / technologies
  if (/301\s*893/.test(code)) return "Wi-Fi 5 GHz";
  if (/303\s*687/.test(code)) return "Wi-Fi 6 GHz";
  if (/300\s*328/.test(code)) return "Wi-Fi / BT 2.4 GHz";
  if (/300\s*330/.test(code)) return "NFC / RFID";
  if (/300\s*440/.test(code)) return "Short Range Radio";
  if (/300\s*220/.test(code)) return "SRD";
  if (/301\s*511/.test(code)) return "GSM";
  if (/301\s*908/.test(code)) return "Cellular";
  if (/303\s*413/.test(code)) return "GNSS";
  if (/301\s*489/.test(code)) return "Radio EMC";

  // EMC – specific limits
  if (/61000-3-2/.test(code)) return "Harmonics";
  if (/61000-3-3/.test(code)) return "Flicker";

  // EMC – immunity (before emissions to avoid false positives)
  if (/55014-2|55035|55024|61000-4|61000-6-1\b|61000-6-2\b/.test(code)) return "Immunity";

  // EMC – emissions
  if (/55014-1|55032|55011|55015|61000-6-3\b|61000-6-4\b/.test(code)) return "Emissions";

  // Title-based fallbacks
  if (/bluetooth/i.test(title) || /bluetooth/i.test(code)) return "Bluetooth";
  if (/wi.?fi|wlan/i.test(title) || /wi.?fi|wlan/i.test(code)) return "Wi-Fi";
  if (/emission/i.test(title)) return "Emissions";
  if (/immunit/i.test(title)) return "Immunity";
  if (/radio/i.test(title)) return "Radio";
  if (/safety/i.test(title)) return "Safety";

  return null;
}

export function joinText(base, addition) {
  const current = String(base || "").trim();
  const next = String(addition || "").trim();

  if (!next) return current;
  if (!current) return next;

  // Whole-word match: avoids "no Wi-Fi" blocking the "Wi-Fi" chip
  const escaped = next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(?<![a-z\\d])${escaped}(?![a-z\\d])`, "i").test(current)) return current;

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

addTemplate(
  "smart_display",
  "mains power, touchscreen, Wi-Fi and Bluetooth radio, microphone, camera, cloud account, app ecosystem, and OTA updates",
  "Smart display"
);
addTemplate(
  "router",
  "mains power, dual-band Wi-Fi radio, Ethernet ports, web administration, app setup, and firmware updates",
  "Router"
);
addTemplate(
  "vr_headset",
  "rechargeable battery, Wi-Fi and Bluetooth radios, cameras, sensors, speakers, microphone, cloud account, and OTA updates",
  "VR headset"
);
addTemplate(
  "electric_toothbrush",
  "rechargeable battery, charging base, motor drive, bathroom use, Bluetooth app sync, and consumer personal care use",
  "Electric toothbrush"
);
addTemplate(
  "baby_monitor",
  "camera, microphone, speaker, Wi-Fi radio, app control, cloud account, and remote viewing",
  "Baby monitor"
);

  // Return the full discovered pool merged with defaults; randomization happens in the component
  const base = uniqueBy(templates.length ? templates : [], (item) => item.label);
  const merged = uniqueBy([...base, ...DEFAULT_TEMPLATES], (item) => item.label);
  return merged;
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
      target.routeImpact = titleCaseList(item.route_impact || []);
    }
  });

  const IMPORTANCE_RANK = { high: 0, medium: 1, low: 2 };
  return items
    .sort((a, b) => (IMPORTANCE_RANK[a.importance] ?? 1) - (IMPORTANCE_RANK[b.importance] ?? 1))
    .slice(0, 6);
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
        normalizedSections.push({
          key: "non_ce",
          title: "Parallel",
          items: syntheticItems,
        });
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

function parallelObligationTitle(key, fallbackTitle) {
  const normalizedKey = String(key || "").toUpperCase();
  if (normalizedKey === "CRA") return "Cyber Resilience Act";
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
      code: directiveShort(section.key),
      title: parallelObligationTitle(section.key, section.title),
      directive_key: section.key,
      rationale: parallelObligationRationale(section.key),
      scope: parallelObligationScope(section),
      summary: parallelObligationRationale(section.key),
      section_key: "non_ce",
      section_title: "Parallel",
    }));
}



export function formatStageLabel(stage) {
  const map = {
    family: "Family match",
    subtype: "Subtype match",
    ambiguous: "Ambiguous",
  };
  return map[String(stage || "").toLowerCase()] || formatUiLabel(stage || "unknown");
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
