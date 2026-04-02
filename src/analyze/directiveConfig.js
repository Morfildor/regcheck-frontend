/** Short display labels for each directive key. */
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

/** Canonical sort order for directives in the UI. */
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

/** Colour tokens (dot, bg, bd, text) for each directive key. */
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

/** Colour tokens for overall risk status levels. */
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

/** Colour tokens for missing-information importance levels. */
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

/** Colour tokens for standard section category types. */
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
