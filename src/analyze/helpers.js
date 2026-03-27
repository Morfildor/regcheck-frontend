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

  // ── Cybersecurity ─────────────────────────────────────────────────────────
  if (/18031/.test(code)) return "Cybersecurity";

  // ── RF Exposure ───────────────────────────────────────────────────────────
  // EN 62479 / EN 50663 / EN 62311: general RF exposure assessment
  // EN 50566: handheld and body-mounted devices
  // EN 50364: low-frequency fields (induction, wireless charging proximity)
  if (/62479|50663|62311|50566|50364/.test(code)) return "RF Exposure";

  // ── EMF ───────────────────────────────────────────────────────────────────
  // EN 62233: measurement of EMF for household appliances
  if (/62233/.test(code)) return "EMF";

  // ── Optical / photobiological radiation ───────────────────────────────────
  // EN 62471: photobiological safety of lamps and lamp systems
  // EN 60825: laser safety
  if (/62471/.test(code)) return "Photobiological Safety";
  if (/60825/.test(code)) return "Laser Safety";

  // ── Battery safety ────────────────────────────────────────────────────────
  // EN 62133-1/-2: portable sealed secondary cells (nickel / lithium)
  // EN 62619: stationary lithium-ion battery systems
  if (/62133|62619/.test(code)) return "Battery Safety";
  // EN 62281: safety of primary and secondary lithium cells during transport
  if (/62281/.test(code)) return "Battery Transport";

  // ── Safety – horizontal (general / cross-sector Part 1 standards) ─────────
  // EN 60335-1: household appliances – general requirements
  // EN 62368-1: AV / ICT equipment – current horizontal safety standard
  // EN 60950-1: legacy IT equipment safety (superseded by 62368-1)
  // EN 60065: legacy audio/video equipment safety (superseded by 62368-1)
  // EN 61010-1: measurement, control, and laboratory equipment
  if (/60335-1\b/.test(code) || /62368-1\b/.test(code)) return "Horizontal Safety";
  if (/60950-1\b/.test(code) || /60065\b/.test(code)) return "Horizontal Safety";
  if (/61010-1\b/.test(code)) return "Horizontal Safety";

  // ── Safety – vertical (product-specific Part 2 standards) ────────────────
  // EN 60335-2-XX: specific household appliance types
  // EN 60745-2-XX: specific handheld power tool types
  if (/60335-2-\d+/.test(code)) return "Vertical Safety";
  if (/60745-2-\d+/.test(code)) return "Vertical Safety";

  // ── Safety – specialist types ─────────────────────────────────────────────
  // EN 60745-1: handheld motor-operated electric tools – general
  // EN 60598-X: luminaires (general and specific)
  // EN 61558-X: safety of transformers, reactors, and power supply units
  // EN 60730-X: automatic electrical controls
  // EN 61347-X: lamp control gear
  // EN 60204-1: safety of machinery – electrical equipment
  if (/60745-1\b/.test(code)) return "Power Tool Safety";
  if (/60598/.test(code)) return "Luminaire Safety";
  if (/61558/.test(code)) return "Transformer Safety";
  if (/60730/.test(code)) return "Control Safety";
  if (/61347/.test(code)) return "Lamp Gear Safety";
  if (/60204/.test(code)) return "Machine Electrical Safety";

  // ── Functional safety / risk assessment ───────────────────────────────────
  // EN ISO 13849-X: safety-related parts of control systems (PLr)
  // EN 62061: functional safety of safety-related electrical systems (SIL)
  // EN ISO 12100: risk assessment and risk reduction for machinery
  if (/13849|62061/.test(code)) return "Functional Safety";
  if (/12100/.test(code)) return "Risk Assessment";

  // ── Radio – specific bands / technologies ─────────────────────────────────
  // ETSI EN 301 893: 5 GHz RLAN (Wi-Fi 5)
  // ETSI EN 303 687: 6 GHz RLAN (Wi-Fi 6E / Wi-Fi 7)
  // ETSI EN 300 328: 2.4 GHz ISM (Wi-Fi b/g/n/ax, Bluetooth, BLE, Zigbee, Thread)
  // ETSI EN 302 065 / EN 303 883: UWB
  // ETSI EN 303 417: wireless power transmission (Qi-family)
  // ETSI EN 300 330: NFC and RFID short-range devices
  // ETSI EN 300 440: short-range devices above 1 GHz
  // ETSI EN 300 220: short-range devices below 1 GHz (SRD)
  // ETSI EN 301 511: GSM handsets
  // ETSI EN 301 908-X: IMT / LTE / 5G cellular base and mobile stations
  // ETSI EN 303 348: 5G NR user equipment
  // ETSI EN 303 413: GNSS receivers
  // ETSI EN 303 131 / EN 302 755: DVB-T / DAB broadcast receivers
  // ETSI EN 301 489-X: EMC for radio equipment (all sub-parts)
  if (/301\s*893/.test(code)) return "Wi-Fi 5 GHz";
  if (/303\s*687/.test(code)) return "Wi-Fi 6 GHz";
  if (/300\s*328/.test(code)) return "Wi-Fi / BT 2.4 GHz";
  if (/302\s*065|303\s*883/.test(code)) return "UWB";
  if (/303\s*417/.test(code)) return "Wireless Power";
  if (/300\s*330/.test(code)) return "NFC / RFID";
  if (/300\s*440/.test(code)) return "Short Range Radio";
  if (/300\s*220/.test(code)) return "SRD";
  if (/301\s*511/.test(code)) return "GSM";
  if (/301\s*908|303\s*348/.test(code)) return "Cellular";
  if (/303\s*413/.test(code)) return "GNSS";
  if (/303\s*131|302\s*755/.test(code)) return "Broadcast Receiver";
  if (/301\s*489/.test(code)) return "Radio EMC";

  // ── EMC – conducted limits ────────────────────────────────────────────────
  // EN 61000-3-2 / EN 61000-3-12: harmonic current emissions
  // EN 61000-3-3 / EN 61000-3-11: voltage fluctuations and flicker
  if (/61000-3-2|61000-3-12/.test(code)) return "Harmonics";
  if (/61000-3-3|61000-3-11/.test(code)) return "Flicker";

  // ── EMC – immunity ────────────────────────────────────────────────────────
  // EN 55014-2: household appliances – immunity
  // EN 55035: multimedia equipment – immunity (replaces EN 55024)
  // EN 55024: IT equipment – immunity (legacy)
  // EN 55020: broadcast receivers – immunity (legacy)
  // EN 61000-4-X: all immunity test standards (ESD, RF, EFT, surge, etc.)
  // EN 61000-6-1/-2: generic immunity for residential / industrial
  if (/55014-2|55035|55024|55020|61000-4|61000-6-1\b|61000-6-2\b/.test(code)) return "Immunity";

  // ── EMC – emissions ───────────────────────────────────────────────────────
  // EN 55014-1: household appliances – emissions
  // EN 55032: multimedia equipment – emissions (replaces EN 55022)
  // EN 55022: IT equipment – emissions (legacy)
  // EN 55013: broadcast receivers – emissions (legacy)
  // EN 55011: industrial, scientific, medical (ISM) equipment
  // EN 55015: electrical lighting and similar equipment
  // EN 61000-6-3/-4: generic emissions for residential / industrial
  if (/55014-1|55032|55022|55013|55011|55015|61000-6-3\b|61000-6-4\b/.test(code)) return "Emissions";

  // ── Energy / standby power ────────────────────────────────────────────────
  // EN 50564: measurement of low-power-mode and off-mode power consumption
  // EN 62301: measurement of standby power
  // EN 62087: power consumption of audio/video and related equipment
  if (/50564|62301|62087/.test(code)) return "Standby Power";

  // ── Title-based fallbacks ─────────────────────────────────────────────────
  if (/bluetooth/i.test(title) || /bluetooth/i.test(code)) return "Bluetooth";
  if (/wi.?fi|wlan/i.test(title) || /wi.?fi|wlan/i.test(code)) return "Wi-Fi";
  if (/emission/i.test(title)) return "Emissions";
  if (/immunit/i.test(title)) return "Immunity";
  if (/radio/i.test(title)) return "Radio";
  if (/laser/i.test(title)) return "Laser Safety";
  if (/battery/i.test(title)) return "Battery Safety";
  if (/standby|power consumption/i.test(title)) return "Standby Power";
  if (/safety/i.test(title)) return "Safety";

  return null;
}

// Maps vertical standard codes to the product types they cover.
// Used to resolve the correct product type when the backend returns a generic
// label (e.g. "heat pump") for a standard that also covers other product types.
export const VERTICAL_STANDARD_SCOPE = {
  "60335-2-40": {
    // EN 60335-2-40: Particular requirements for electrical heat pumps,
    // air-conditioners and dehumidifiers
    scopeLabel: "Heat pumps, air conditioners and dehumidifiers",
    productTypes: ["Heat pump", "Air conditioner", "Dehumidifier"],
    detect: [
      { pattern: /air.?condition/i, type: "Air conditioner" },
      { pattern: /dehumidif/i,      type: "Dehumidifier" },
    ],
    defaultType: "Heat pump",
  },
};

export function getStandardScope(code) {
  // Strip any leading org prefixes (e.g. "EN", "IEC", "EN IEC", "BS EN") and
  // find the numeric part like "60335-2-40"
  const normalized = String(code || "")
    .replace(/^(?:(?:EN|IEC|BS|DIN|NF)\s*)+/i, "")
    .trim();
  return VERTICAL_STANDARD_SCOPE[normalized] || null;
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






export function buildClipboardSummary({ result, description, routeSections, legislationGroups, missingInputs = [], evidenceNeeds = [] }) {
  const confidence =
    result?.confidence_panel?.confidence || result?.product_match_confidence || "low";
  const confidenceLabel = formatUiLabel(confidence);
  const isPreliminary = String(confidence).toLowerCase() !== "high";
  const traits = result?.all_traits || [];
  const riskLabel = formatUiLabel(result?.overall_risk || "medium");
  const productType = formatUiLabel(result?.product_type || "unclear");

  const blockers = missingInputs.filter((item) => item.severity === "blocker");
  const routeAffecting = missingInputs.filter((item) => item.severity === "route-affecting");
  const hasWarnings = blockers.length > 0 || routeAffecting.length > 0;

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
    // Headline metrics — most important at top
    `Confidence:  ${confidenceLabel}${isPreliminary ? "  (re-run with more detail to improve)" : ""}`,
    `Risk level:  ${riskLabel}`,
    `Match:       ${productType}  ·  ${totalStandards} standard${totalStandards === 1 ? "" : "s"}`,
    result?.summary ? `Summary:     ${result.summary}` : null,
    "",
    // Warnings before the route — highest priority
    hasWarnings ? "WARNINGS" : null,
    hasWarnings ? divider.slice(0, 40) : null,
    ...blockers.map((item) => `  ▲ [Blocker]         ${item.title}: ${item.reason}`),
    ...routeAffecting.map((item) => `  · [Route-affecting] ${item.title}: ${item.reason}`),
    hasWarnings ? "" : null,
    // Standards route
    "STANDARDS ROUTE",
    divider.slice(0, 40),
    ...routeSections.flatMap((section) => [
      `${routeTitle(section)}  (${(section.items || []).length})`,
      ...sortStandardItems(section.items || []).map((item) =>
        `  • ${item.code}${item.title ? `  —  ${item.title}` : ""}`
      ),
      "",
    ]),
    // Parallel obligations
    "PARALLEL OBLIGATIONS",
    divider.slice(0, 40),
    ...(parallelItems.length
      ? parallelItems.map((item) => `  • ${item.code || item.title}${item.title && item.code ? `  —  ${item.title}` : ""}`)
      : ["  None returned beyond the primary directive route."]),
    "",
    // Next actions
    ...(nextActionLines.length
      ? ["NEXT ACTIONS (pre-lab)", divider.slice(0, 40), ...nextActionLines, ""]
      : []),
    // Detected traits
    ...(traits.length ? [`Detected traits: ${traits.join(", ")}`, ""] : []),
    // Description at end for reference
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
