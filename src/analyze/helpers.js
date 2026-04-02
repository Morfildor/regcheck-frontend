import { DIR_SHORT, DIR_ORDER, DIR_TONES, STATUS, IMPORTANCE, SECTION_TONES } from "./directiveConfig";
export { DIR_SHORT, DIR_ORDER, DIR_TONES, STATUS, IMPORTANCE, SECTION_TONES };

// DEFAULT_TEMPLATES moved to ./templateData — import from there if needed.


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

const CURATED_TEMPLATE_SPECS = [
  { productId: "coffee_machine", label: "Coffee machine", suffix: "mains power, heating element, pressurised brew group, water tank, burr grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "electric_kettle", label: "Electric kettle", suffix: "mains power, 2200 W heating element, food-contact stainless steel interior, dry-boil protection, and no wireless radio" },
  { productId: "air_fryer", label: "Air fryer", suffix: "mains power, 1500 W heating element, motorized circulation fan, food-contact non-stick cooking basket, electronic timer and temperature controls, and no wireless connectivity" },
  { productId: "coffee_grinder", label: "Coffee grinder", suffix: "mains power, high-speed motor, food-contact grind path and hopper, dosing chute, and no wireless connectivity" },
  { productId: "blender", label: "Blender", suffix: "mains power, 1000 W motor, food-contact BPA-free jug and blades, multiple speed settings, pulse function, and no wireless connectivity" },
  { productId: "microwave_oven", label: "Microwave oven", suffix: "mains power, 800 W magnetron, glass turntable, electronic controls, child lock, and no wireless connectivity" },
  { productId: "dishwasher", label: "Dishwasher", suffix: "mains power, water inlet and drain connections, food-contact interior and spray arms, detergent dispenser, and optional Wi-Fi app integration" },
  { productId: "refrigerator_freezer", label: "Refrigerator / freezer", suffix: "mains power, compressor, refrigerant loop, food-contact interior, electronic thermostat, and no wireless connectivity" },
  { productId: "food_processor", label: "Food processor", suffix: "mains power, high-torque motor, food-contact bowl, multiple interchangeable blades and discs, electronic speed control, and no wireless connectivity" },
  { productId: "rice_cooker", label: "Rice cooker", suffix: "mains power, 700 W heating plate, food-contact inner pot, keep-warm function, mechanical controls, and no wireless connectivity" },
  { productId: "hob", label: "Hob / cooktop", suffix: "mains power, 2000 W induction cooking zone, touch controls, child lock, residual heat indicator, and no wireless connectivity" },
  { productId: "juicer", label: "Juicer", suffix: "mains power, high-speed motor, food-contact pulp container and filter basket, wide feeding chute, and no wireless connectivity" },
  { productId: "robot_vacuum", label: "Robot vacuum cleaner", suffix: "rechargeable lithium battery, motorized suction and brush system, LiDAR navigation, camera, Wi-Fi and Bluetooth radio, cloud account, app control, and OTA firmware updates" },
  { productId: "vacuum_cleaner", label: "Vacuum cleaner", suffix: "rechargeable lithium battery, motorized suction head, swappable attachments, LED floor lights, Bluetooth radio, app control, and OTA firmware updates" },
  { productId: "washing_machine", label: "Washing machine", suffix: "mains power, water inlet and drain connections, drum motor, electronic controls, and optional Wi-Fi app integration for remote start" },
  { productId: "tumble_dryer", label: "Tumble dryer", suffix: "mains power, drum motor, sealed refrigerant heat-pump loop, condensate tank, electronic controls, and Wi-Fi connectivity for app and OTA firmware updates" },
  { productId: "electric_iron", label: "Electric iron", suffix: "mains power, ceramic soleplate, steam boiler, water tank, drip-stop function, and no wireless connectivity" },
  { productId: "high_pressure_cleaner", label: "High-pressure cleaner", suffix: "mains power, high-pressure pump motor, spray gun, lance and nozzle set, detergent tank, and no wireless connectivity" },
  { productId: "oral_hygiene_appliance", label: "Oral hygiene appliance", suffix: "rechargeable lithium battery, inductive charging base, oscillating brush head, bathroom IPX7 rating, Bluetooth radio, and app brushing coaching" },
  { productId: "shaver", label: "Electric shaver", suffix: "rechargeable lithium battery, USB-C charging, motorized shaving heads, bathroom IP67 rating, and no wireless connectivity" },
  { productId: "skin_hair_care_appliance", label: "Skin or hair care appliance", suffix: "mains power, 2200 W heating element, motorized fan, multiple heat and speed settings, cool-shot button, and no wireless connectivity" },
  { productId: "massage_gun", label: "Massage gun / percussion massager", suffix: "rechargeable lithium battery, brushless motor, interchangeable attachment heads, three speed settings, and no wireless connectivity" },
  { productId: "smart_blood_pressure_monitor", label: "Smart blood pressure monitor", suffix: "AA battery power, oscillometric measurement, inflatable cuff, LCD display, Bluetooth radio, app sync, and cloud account" },
  { productId: "smart_scale", label: "Smart body scale / composition monitor", suffix: "AA battery power, load-cell sensors, body composition estimation via bioimpedance, Bluetooth radio, app sync, and cloud account" },
  { productId: "uv_c_sanitizer", label: "UV-C sanitizer", suffix: "mains power, UV-C LED array, enclosed sanitising chamber, safety lid interlock, and no wireless connectivity" },
  { productId: "massage_appliance", label: "Massage appliance", suffix: "mains power, rolling massage nodes, infrared heating, multiple intensity levels, and no wireless connectivity" },
  { productId: "air_purifier", label: "Air purifier", suffix: "mains power, HEPA and activated-carbon filter, motorized fan, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "heat_pump", label: "Heat pump / air conditioner", suffix: "mains power, compressor, refrigerant loop, motorized fan, exhaust hose, Wi-Fi radio, app control, and OTA firmware updates" },
  { productId: "smart_plug", label: "Smart plug / smart outlet", suffix: "mains power input and output, 16 A relay, Wi-Fi radio, real-time energy monitoring, app control, cloud account, and OTA firmware updates" },
  { productId: "smart_lock", label: "Smart lock", suffix: "AA battery power, motorized deadbolt, keypad and fingerprint reader, Bluetooth and Wi-Fi radio, mobile app control, cloud account, and OTA firmware updates" },
  { productId: "smart_doorbell", label: "Smart video doorbell", suffix: "mains or rechargeable battery power, 1080p camera, microphone, speaker, PIR motion sensor, Wi-Fi radio, app control, cloud account, video storage, and OTA firmware updates" },
  { productId: "smart_security_camera", label: "Smart security camera", suffix: "mains power, IP66 weatherproof housing, 4 MP camera, infrared night vision LEDs, microphone, speaker, Wi-Fi radio, cloud account, local microSD storage, and OTA firmware updates" },
  { productId: "smart_thermostat", label: "Smart thermostat", suffix: "mains bus power, temperature and humidity sensors, OLED display, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "smart_smoke_co_alarm", label: "Smart smoke / CO alarm", suffix: "lithium battery, optical smoke sensor, piezo alarm, Wi-Fi radio, push notifications, app control, and OTA firmware updates" },
  { productId: "smart_radiator_valve", label: "Smart thermostatic radiator valve (TRV)", suffix: "AA battery power, motorized valve actuator, temperature sensor, Zigbee radio, and hub-connected app control" },
  { productId: "smart_speaker", label: "Smart speaker", suffix: "mains power, full-range speaker driver, Wi-Fi and Bluetooth radio, microphone array with mute button, voice assistant, cloud account, app control, and OTA firmware updates" },
  { productId: "smart_display", label: "Smart display", suffix: "mains power, touchscreen, Wi-Fi and Bluetooth radio, microphone, camera, voice assistant, cloud account, app platform, and OTA software updates" },
  { productId: "baby_monitor", label: "Baby monitor", suffix: "mains power, 1080p camera, infrared night vision, microphone, speaker, temperature sensor, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "vr_ar_headset", label: "VR / AR headset", suffix: "rechargeable lithium battery, USB-C charging, Wi-Fi 6 and Bluetooth radio, inside-out tracking cameras, IMU sensors, LCD panels, microphone, speakers, app ecosystem, cloud account, and OTA updates" },
  { productId: "home_projector", label: "Home projector / smart projector", suffix: "mains power, LED optic module, autofocus, built-in stereo speakers, Wi-Fi and Bluetooth radio, app platform, cloud account, and OTA firmware updates" },
  { productId: "smart_tv", label: "Television / smart TV", suffix: "mains power, 55-inch LED panel, Wi-Fi and Bluetooth radio, HDMI and USB ports, integrated streaming app platform, cloud account, microphone in remote, and OTA software updates" },
  { productId: "soundbar", label: "Soundbar", suffix: "mains power, stereo speaker array, wireless subwoofer, HDMI ARC, optical input, Wi-Fi and Bluetooth radio, app control, cloud streaming, and OTA firmware updates" },
  { productId: "true_wireless_earbuds", label: "True wireless earbuds (TWS)", suffix: "lithium battery charging case, Bluetooth radio, active noise cancellation, microphone, touch controls, and USB-C charging case" },
  { productId: "wireless_headphones", label: "Wireless headphones / earbuds", suffix: "rechargeable lithium battery, USB-C charging, Bluetooth radio, active noise cancellation, microphone, and no cloud account required" },
  { productId: "bluetooth_speaker", label: "Portable Bluetooth speaker", suffix: "rechargeable lithium battery, dual driver stereo, Wi-Fi and Bluetooth radio, IPX7 water resistance, microphone for calls, and OTA firmware updates" },
  { productId: "e_reader", label: "E-reader", suffix: "rechargeable lithium battery, USB-C charging, 6-inch e-paper display, Wi-Fi radio, cloud-synced library and account, and OTA software updates" },
  { productId: "router", label: "Router", suffix: "mains power, 2.4 GHz and 5 GHz dual-band radio, four Gigabit Ethernet ports, web and app administration, cloud-assisted setup, and OTA firmware updates" },
  { productId: "monitor", label: "Monitor", suffix: "mains power, 27-inch IPS panel, HDMI and DisplayPort inputs, height-adjustable stand, and no wireless radio" },
  { productId: "webcam", label: "Webcam", suffix: "USB desktop camera, built-in microphone, privacy shutter, indicator LED, USB bus power, and no standalone wireless connectivity" },
  { productId: "server", label: "Server / NAS", suffix: "mains power, dual 3.5-inch HDD bays, Gigabit Ethernet, optional Wi-Fi radio, web administration interface, cloud-sync capability, and OTA firmware updates" },
  { productId: "printer_3d", label: "3D printer", suffix: "mains power, heated print bed, stepper motors, hotend with 260 °C nozzle, HEPA exhaust filter, touchscreen, Wi-Fi radio, app control, and OTA firmware updates" },
  { productId: "cordless_power_drill", label: "Cordless power drill / drill driver", suffix: "18 V lithium battery pack, brushless motor, two-speed gearbox, 13 mm keyless chuck, torque clutch, and battery charging cradle" },
  { productId: "angle_grinder", label: "Angle grinder", suffix: "mains power, 850 W motor, 125 mm wheel guard, spindle lock, anti-kickback electronics, and no wireless connectivity" },
  { productId: "electric_garden_tool", label: "Electric garden tool", suffix: "20 V lithium battery, dual-action hedge trimmer blade, hand guard, blade tip protector, and no wireless connectivity" },
  { productId: "portable_ev_charger", label: "Portable EV charger / mode 2 EVSE", suffix: "mains Schuko plug, Type 2 vehicle connector, 7.4 kW single-phase output, pilot signalling electronics, thermal protection, and no wireless connectivity" },
  { productId: "electric_scooter", label: "Electric scooter", suffix: "rechargeable lithium battery, brushless hub motor, regenerative braking, LED lighting front and rear, Bluetooth radio, app control, and OTA firmware updates" },
  { productId: "smart_pet_feeder", label: "Smart pet feeder", suffix: "mains power and battery backup, food-contact hopper and portion dispenser, 1080p camera, microphone, speaker, Wi-Fi radio, cloud account, and OTA updates" },
  { productId: "gps_pet_tracker", label: "GPS pet tracker", suffix: "rechargeable lithium battery, GPS and GLONASS receiver, LTE-M cellular radio, Bluetooth LE radio, IP67 waterproof housing, cloud account, app tracking, and OTA firmware updates" },
  { productId: "smart_toy", label: "Smart connected toy", suffix: "rechargeable lithium battery, drive motors, distance and touch sensors, speaker, microphone, Wi-Fi radio, cloud account, app control, and OTA firmware updates" },
];

function buildCuratedTemplateText(label, suffix) {
  return `${label} with ${suffix}.`;
}

function makeCuratedTemplateChoice(spec, product = null) {
  const label = product?.label || spec.label;
  return {
    label,
    text: buildCuratedTemplateText(label, spec.suffix),
    productId: product?.id || spec.productId,
  };
}

export function buildDynamicTemplates(products) {
  const lookup = new Map((products || []).map((product) => [product.id, product]));
  // Use the backend-aligned template catalog instead of the stale legacy examples below.
  return uniqueBy(
    CURATED_TEMPLATE_SPECS.map((spec) => makeCuratedTemplateChoice(spec, lookup.get(spec.productId))),
    (item) => item.label
  );
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
