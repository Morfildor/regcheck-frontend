import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

const DIR_NAME = {
  LVD: "Low Voltage Directive",
  EMC: "EMC Directive",
  RED: "RF / Radio Equipment",
  RED_CYBER: "RED Cybersecurity DA",
  CRA: "Cyber Resilience Act",
  ROHS: "RoHS Directive",
  REACH: "REACH Regulation",
  GDPR: "Data & Privacy",
  AI_Act: "AI Act",
  ESPR: "ESPR / Ecodesign",
  OTHER: "Other",
  SYSTEM: "System",
};

const DIR_SHORT = {
  LVD: "LVD",
  EMC: "EMC",
  RED: "RED",
  RED_CYBER: "RED-Cyber",
  CRA: "CRA",
  ROHS: "RoHS",
  REACH: "REACH",
  GDPR: "GDPR",
  AI_Act: "AI Act",
  ESPR: "ESPR",
  OTHER: "Other",
  SYSTEM: "System",
};

const DIR_ORDER = [
  "LVD",
  "EMC",
  "RED",
  "RED_CYBER",
  "CRA",
  "ROHS",
  "REACH",
  "GDPR",
  "AI_Act",
  "ESPR",
  "OTHER",
];

const DIR = {
  LVD: { dot: "#6f7566", pill: "#ece8dc", ring: "#cfc7b7", ink: "#505647", accent: "#8a9484", header: "#d8d3c8" },
  EMC: { dot: "#5f8d8b", pill: "#e6f0ef", ring: "#bbd1cf", ink: "#456a69", accent: "#5f8d8b", header: "#d0e4e3" },
  RED: { dot: "#2f5f69", pill: "#e3eef0", ring: "#b2c7cc", ink: "#294b53", accent: "#2f5f69", header: "#cde0e4" },
  RED_CYBER: { dot: "#9f7084", pill: "#f1e7eb", ring: "#d8c0c9", ink: "#7a5667", accent: "#9f7084", header: "#e8d8df" },
  CRA: { dot: "#60795f", pill: "#e8efe7", ring: "#c1cec0", ink: "#4a6149", accent: "#60795f", header: "#d5e3d4" },
  ROHS: { dot: "#b7903e", pill: "#f7efd9", ring: "#e5d3a1", ink: "#8f6e2d", accent: "#b7903e", header: "#f0e5c3" },
  REACH: { dot: "#aa7868", pill: "#f5eae6", ring: "#e3cbc2", ink: "#83584a", accent: "#aa7868", header: "#e8d8d0" },
  GDPR: { dot: "#7f9995", pill: "#edf3f2", ring: "#cad9d8", ink: "#607773", accent: "#7f9995", header: "#daeaea" },
  AI_Act: { dot: "#9f7084", pill: "#f1e7eb", ring: "#d8c0c9", ink: "#7a5667", accent: "#9f7084", header: "#e8d8df" },
  ESPR: { dot: "#b7903e", pill: "#f7f0dd", ring: "#e5d7aa", ink: "#8f6e2d", accent: "#b7903e", header: "#f0e8ca" },
  OTHER: { dot: "#8d8779", pill: "#f0ece3", ring: "#d5cec0", ink: "#686356", accent: "#8d8779", header: "#e5e0d7" },
  SYSTEM: { dot: "#8d8779", pill: "#f0ece3", ring: "#d5cec0", ink: "#686356", accent: "#8d8779", header: "#e5e0d7" },
};

const STS = {
  FAIL: { icon: "✕", label: "FAIL", bg: "#f8eef1", border: "#e6d0d6", text: "#8b6474", dot: "#c97a90" },
  WARN: { icon: "!", label: "WARN", bg: "#fbf5e8", border: "#ecdcae", text: "#9e7d36", dot: "#c9a040" },
  PASS: { icon: "✓", label: "PASS", bg: "#eef4ee", border: "#ccd7ca", text: "#566554", dot: "#6a9068" },
  INFO: { icon: "·", label: "INFO", bg: "#eff5f5", border: "#cadada", text: "#517674", dot: "#7fa8a6" },
};

const STD_RE = /^(EN|IEC|ISO|ETSI|EN IEC|EN ISO|IEC EN|UL|ASTM|CISPR|ITU|IEC\/EN)\b/i;

// IMPROVEMENT: mode descriptions shown as tooltips on the segmented control
const MODE_DESCRIPTIONS = {
  quick: "Fast scan, key directives only",
  standard: "Full directive + standards mapping",
  deep: "All edge cases, Part 2 standards",
};

const QUICK_CHIPS = [
  { label: "Heating element", text: "heating element" },
  { label: "Wi-Fi / BT", text: "Wi-Fi and Bluetooth connectivity" },
  { label: "OTA updates", text: "OTA firmware updates" },
  { label: "Battery", text: "rechargeable lithium battery" },
  { label: "Food-contact", text: "food-contact materials" },
  { label: "Cloud account", text: "cloud account and user data storage" },
  { label: "Motor / pump", text: "motor and pump" },
  { label: "Display / UI", text: "display and touch UI" },
];

const PRODUCT_TEMPLATES = [
  { label: "Air fryer", text: "Smart air fryer with Wi-Fi app control, mains powered, OTA updates, cloud recipe sync, and food-contact basket coating." },
  { label: "Coffee machine", text: "Connected espresso machine with app control, mains powered, OTA updates, cloud brew profiles, water tank sensor, and food-contact brew path." },
  { label: "Robot vacuum", text: "Robot vacuum cleaner with Wi-Fi and Bluetooth, LiDAR navigation, OTA firmware updates, cloud cleaning schedule, rechargeable lithium battery, and camera." },
  { label: "Air purifier", text: "Smart air purifier with Wi-Fi control, PM2.5 sensor, OTA firmware updates, cloud air quality logging, and mains power." },
];

/* ------------------------------------------------------------------ */
/* Pure helpers                                                         */
/* ------------------------------------------------------------------ */

function unique(arr) { return [...new Set((arr || []).filter(Boolean))]; }
function normalizeStdName(s) { return (s || "").replace(/\s+/g, " ").trim(); }
function getDirectiveListFromFinding(f) {
  return (f.directive || "").split(",").map((x) => x.trim()).filter(Boolean).map((d) => (d === "RF" ? "RED" : d));
}
function statusRank(s) { return { FAIL: 4, WARN: 3, PASS: 2, INFO: 1 }[s] || 1; }
function priorityStatus(statuses) {
  if (!statuses || !statuses.length) return "INFO";
  return [...statuses].sort((a, b) => statusRank(b) - statusRank(a))[0];
}
function isStandardFinding(f) {
  const art = (f.article || "").trim();
  return STD_RE.test(art) || /review$/i.test(art);
}
function titleCase(s) {
  return String(s || "").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());
}
function prettyDirectiveName(key) { return DIR_NAME[key] || titleCase(key); }
function prettyTag(s) {
  return String(s || "").replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (m) => m.toUpperCase());
}
function firstNonEmpty(...values) {
  for (const v of values) { if (typeof v === "string" && v.trim()) return v.trim(); }
  return "";
}
function cleanReference(ref) { return String(ref || "").replace(/\s+/g, " ").trim(); }
function cleanVersionText(v) { return String(v || "").replace(/\s+/g, " ").trim(); }

function getStandardMeta(item) {
  return {
    harmonizedReference: cleanReference(item?.harmonized_reference || item?.harmonised_reference || ""),
    harmonizedVersion: cleanVersionText(item?.dated_version || item?.harmonized_version || item?.harmonised_version || ""),
    stateOfTheArtVersion: cleanVersionText(item?.version || item?.state_of_the_art_version || ""),
    evidence: cleanVersionText(item?.evidence_hint || item?.evidence || ""),
    notes: cleanVersionText(item?.notes || ""),
  };
}

function inferStandardBadge(item) {
  const code = String(item?.code || "").toUpperCase();
  const directive = String(item?.directive || item?.legislation_key || "").toUpperCase();
  const family = String(item?.standard_family || "").toLowerCase();

  if (/EN\s*60335-1\b/.test(code)) return "Base safety standard";
  if (/EN\s*60335-2-\d+\b/.test(code)) return "Part 2 product standard";
  if (/EN\s*60730-1\b/.test(code)) return "Control safety standard";
  if (/EN\s*60730-2-/.test(code)) return "Control Part 2 standard";
  if (/EN\s*55014-1\b/.test(code)) return "Emission standard";
  if (/EN\s*55014-2\b/.test(code)) return "Immunity standard";
  if (/EN\s*61000-3-2\b/.test(code)) return "Harmonics standard";
  if (/EN\s*61000-3-3\b/.test(code)) return "Flicker standard";
  if (/EN\s*61000-3-11\b/.test(code)) return "Voltage fluctuation standard";
  if (/EN\s*61000-3-12\b/.test(code)) return "Harmonics standard";
  if (/EN\s*62233\b/.test(code)) return "EMF assessment standard";
  if (/EN\s*62311\b/.test(code)) return "RF exposure standard";
  if (/EN\s*62479\b/.test(code)) return "Low-power RF exposure";
  if (/EN\s*300 328\b/.test(code)) return "2.4 GHz radio standard";
  if (/EN\s*301 489-1\b/.test(code)) return "Radio EMC common standard";
  if (/EN\s*301 489-17\b/.test(code)) return "Radio EMC short-range";
  if (/EN\s*301 489-52\b/.test(code)) return "Radio EMC cellular";
  if (/EN\s*300 220\b/.test(code)) return "Short-range radio standard";
  if (/EN\s*300 330\b/.test(code)) return "Low-frequency radio standard";
  if (/EN\s*301 893\b/.test(code)) return "5 GHz radio standard";
  if (/EN\s*18031-1\b/.test(code)) return "Cybersecurity network standard";
  if (/EN\s*18031-2\b/.test(code)) return "Cybersecurity access standard";
  if (/EN\s*18031-3\b/.test(code)) return "Cybersecurity privacy standard";
  if (/EN\s*63000\b/.test(code)) return "RoHS technical documentation";

  if (directive === "LVD") {
    if (family.includes("60335-2")) return "Part 2 product standard";
    if (family.includes("60335-1")) return "Base safety standard";
    if (family.includes("60730")) return "Control safety standard";
    return "Safety standard";
  }
  if (directive === "EMC") return "Standard";
  if (directive === "RED") return "RF standard";
  if (directive === "RED_CYBER") return "Cybersecurity standard";
  if (directive === "ROHS") return "Substance compliance standard";
  if (directive === "REACH") return "Chemical compliance standard";

  return firstNonEmpty(
    item?.standard_family ? prettyTag(item.standard_family) : "",
    item?.category ? `${prettyTag(item.category)} standard` : "",
    "Standard"
  );
}

function buildStandardTags(item) {
  const directive = String(item?.directive || item?.legislation_key || "OTHER").toUpperCase();
  const category = String(item?.category || "").toLowerCase();
  const code = String(item?.code || "").toUpperCase();
  const title = String(item?.title || "").toLowerCase();
  const tags = [inferStandardBadge(item)];

  if (directive === "LVD") tags.push("LVD");
  if (directive === "EMC") tags.push("EMC");
  if (directive === "RED") tags.push("RED");
  if (directive === "RED_CYBER") tags.push("Cybersecurity");
  if (directive === "ROHS") tags.push("RoHS");

  if (/55014-1/.test(code) || category.includes("emission")) tags.push("Emission");
  if (/55014-2/.test(code) || category.includes("immunity")) tags.push("Immunity");
  if (/61000-3-2|61000-3-12/.test(code) || /harmonic/.test(title)) tags.push("Harmonics");
  if (/61000-3-3|61000-3-11/.test(code) || /flicker|voltage change/.test(title)) tags.push("Flicker");
  if (/301 489-/.test(code)) tags.push("Radio EMC");
  if (/300 328/.test(code)) tags.push("2.4 GHz");
  if (/301 893/.test(code)) tags.push("5 GHz");
  if (/300 220/.test(code)) tags.push("Short-range");
  if (/300 330/.test(code)) tags.push("Low frequency");
  if (/62311|62479/.test(code) || category === "emf") tags.push("EMF");
  if (/18031-1/.test(code)) tags.push("Network");
  if (/18031-2/.test(code)) tags.push("Access control");
  if (/18031-3/.test(code)) tags.push("Personal data");
  if (/18031-/.test(code)) tags.push("RED DA");
  if (/60335-2-/.test(code)) tags.push("Part 2");
  if (/60335-1\b/.test(code)) tags.push("Base");

  return unique(tags).filter((t) => t !== "LVD" && t !== "EMC" && t !== "RED").slice(0, 3);
}

function summarizeStandardCard(item, finding) {
  const code = String(item?.code || "").toUpperCase();
  const title = String(item?.title || "").trim();
  const directive = String(item?.directive || item?.legislation_key || "OTHER").toUpperCase();

  if (/EN\s*60335-1\b/.test(code)) return "General household appliance electrical safety standard.";
  if (/EN\s*60335-2-\d+\b/.test(code)) return "Product-specific Part 2 appliance safety standard.";
  if (/EN\s*55014-1\b/.test(code)) return "EMC emissions requirements for household appliances and similar equipment.";
  if (/EN\s*55014-2\b/.test(code)) return "EMC immunity requirements for household appliances and similar equipment.";
  if (/EN\s*61000-3-2\b/.test(code)) return "Harmonic current emissions limits for mains-connected equipment.";
  if (/EN\s*61000-3-3\b/.test(code)) return "Voltage fluctuation and flicker limits for mains-connected equipment.";
  if (/EN\s*61000-3-11\b/.test(code)) return "Voltage changes, fluctuations and flicker limits for conditionally connected equipment.";
  if (/EN\s*61000-3-12\b/.test(code)) return "Harmonic current limits for equipment with higher input current.";
  if (/EN\s*300 328\b/.test(code)) return "Radio spectrum requirements for 2.4 GHz wideband transmission systems such as Wi-Fi and Bluetooth.";
  if (/EN\s*301 489-1\b/.test(code)) return "Common EMC requirements for radio equipment.";
  if (/EN\s*301 489-17\b/.test(code)) return "EMC requirements for 2.4 GHz and 5 GHz short-range radio technologies.";
  if (/EN\s*301 893\b/.test(code)) return "Radio spectrum requirements for 5 GHz wireless access systems.";
  if (/EN\s*62311\b/.test(code)) return "Assessment of RF exposure for electronic and radio equipment.";
  if (/EN\s*62479\b/.test(code)) return "RF exposure assessment method for low-power electronic and radio equipment.";
  if (/EN\s*18031-1\b/.test(code)) return "Cybersecurity requirements for protecting network functions of radio equipment.";
  if (/EN\s*18031-2\b/.test(code)) return "Cybersecurity requirements for access control and protection against misuse.";
  if (/EN\s*18031-3\b/.test(code)) return "Cybersecurity and personal data/privacy protection requirements.";
  if (/EN\s*63000\b/.test(code)) return "Technical documentation standard for RoHS substance restriction compliance.";

  if (directive === "EMC") return title || "EMC standard applicable to the product configuration.";
  if (directive === "RED") return title || "RF standard applicable to the radio functions identified.";
  if (directive === "RED_CYBER") return title || "Cybersecurity standard applicable to the connected radio functions identified.";
  if (directive === "LVD") return title || "Electrical safety standard applicable to the product configuration.";
  if (directive === "ROHS") return title || "Substance compliance standard for technical documentation and material restrictions.";

  return firstNonEmpty(title, finding?.finding, "Applicable standard.");
}

function inferDirectiveFromText(text) {
  const t = (text || "").toLowerCase();
  if (/en\s*18031|18031-1|18031-2|18031-3|red da|delegated act|article 3\.3\(d\)|article 3\.3\(e\)|article 3\.3\(f\)/.test(t)) return "RED_CYBER";
  if (/cyber resilience act|\bcra\b|sbom|vulnerability|secure development/.test(t)) return "CRA";
  if (/rohs|2011\/65\/eu|iec 63000|en iec 63000|62321/.test(t)) return "ROHS";
  if (/\breach\b|1907\/2006|svhc|article 33/.test(t)) return "REACH";
  if (/60335|60730|62233|electrical safety|appliance safety/.test(t)) return "LVD";
  if (/55014|61000|emc|electromagnetic|cispr|harmonic|flicker|esd|surge|immunity/.test(t)) return "EMC";
  if (/300 328|301 489|300 220|300 330|wireless|bluetooth|wifi|wi-fi|zigbee|matter|nfc|lte|5g/.test(t)) return "RED";
  if (/gdpr|privacy|personal data|data protection/.test(t)) return "GDPR";
  if (/ai act|artificial intelligence|machine learning|model/.test(t)) return "AI_Act";
  if (/ecodesign|espr|repairability|durability|energy/.test(t)) return "ESPR";
  return "OTHER";
}

function enrichDirectives(f) {
  const combined = [f.article, f.finding, f.action].filter(Boolean).join(" ");
  const inferred = inferDirectiveFromText(combined);
  let explicit = getDirectiveListFromFinding(f).filter((d) => d !== "SYSTEM");

  if (/en\s*18031|18031-1|18031-2|18031-3/i.test(combined.toLowerCase())) {
    explicit = explicit.filter((d) => d !== "CRA" && d !== "RED");
    explicit.push("RED_CYBER");
  }

  if (inferred === "RED_CYBER" && !explicit.includes("RED_CYBER")) explicit.push("RED_CYBER");
  if (!explicit.length) explicit = inferred ? [inferred] : ["OTHER"];
  return unique(explicit);
}

function standardStatusFromItem(item) {
  return item.item_type === "review" ? "WARN" : "PASS";
}

function buildGroupsFromBackendItems(standards, reviewItems) {
  const all = [...(standards || []), ...(reviewItems || [])];
  const map = new Map();

  all.forEach((row) => {
    const name = normalizeStdName(row.code || row.title || "Unnamed item");
    const directive = row.directive || row.legislation_key || "OTHER";
    const key = directive + "::" + name.toLowerCase();
    const status = standardStatusFromItem(row);
    const findingText = row.title || "";
    const actionText = row.reason || row.notes || "";

    const itemPayload = {
      code: row.code || "",
      title: row.title || "",
      category: row.category || "",
      directive: row.directive || "",
      legislation_key: row.legislation_key || "",
      standard_family: row.standard_family || "",
      item_type: row.item_type || "",
      test_focus: row.test_focus || [],
      keywords: row.keywords || [],
      harmonized_reference: row.harmonized_reference || row.harmonised_reference || "",
      dated_version: row.dated_version || row.harmonized_version || row.harmonised_version || "",
      version: row.version || row.state_of_the_art_version || "",
      evidence_hint: row.evidence_hint || row.evidence || "",
      notes: row.notes || "",
    };

    if (!map.has(key)) {
      map.set(key, {
        name,
        directives: [directive],
        statuses: [status],
        findings: [{ finding: findingText, action: actionText, status, item: itemPayload }],
        actions: actionText ? [actionText] : [],
      });
      return;
    }

    const curr = map.get(key);
    curr.directives = unique([...curr.directives, directive]);
    curr.statuses = unique([...curr.statuses, status]);
    if (actionText) curr.actions = unique([...curr.actions, actionText]);
    curr.findings.push({ finding: findingText, action: actionText, status, item: itemPayload });
  });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function categoriseFindings(findings, knownStdNames) {
  const toCheck = [];
  const notes = [];
  const stdSet = knownStdNames || new Set();

  (findings || []).forEach((f, i) => {
    const row = { ...f, _i: i };
    const art = (f.article || "").trim();
    const findingText = (f.finding || "").trim();

    if (isStandardFinding(f)) return;

    const artLow = art.toLowerCase();
    const findLow = findingText.toLowerCase();
    const coversKnownStd = [...stdSet].some((name) => {
      const n = name.toLowerCase();
      return artLow === n || (n.length > 8 && (artLow.includes(n) || findLow.includes(n)));
    });

    if (coversKnownStd) return;

    const isUncertain =
      /Missing|unclear|not specified|confirm|check whether|verify|not confirmed/i.test(art) ||
      /Missing|unclear|not specified|confirm|check whether|verify|not confirmed/i.test(findingText);

    if (isUncertain) toCheck.push(row);
    else notes.push(row);
  });

  return { toCheck, notes };
}

function tagToneForSignal(signal) {
  if (signal === "high") return { bg: "#f8eef1", bd: "#e6d0d6", tx: "#8b6474" };
  if (signal === "medium") return { bg: "#fbf5e8", bd: "#ecdcae", tx: "#9e7d36" };
  if (signal === "good") return { bg: "#eef4ee", bd: "#ccd7ca", tx: "#566554" };
  return { bg: "#eff5f5", bd: "#cadada", tx: "#517674" };
}

/* ------------------------------------------------------------------ */
/* Atoms                                                                */
/* ------------------------------------------------------------------ */

function DirPill({ dirKey, size = "sm" }) {
  const tone = DIR[dirKey] || DIR.OTHER;
  const fs = size === "sm" ? 11 : 13;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: size === "sm" ? "2px 9px 2px 7px" : "3px 11px 3px 9px",
      borderRadius: 999, border: "1px solid " + tone.ring,
      background: tone.pill, color: tone.ink,
      fontSize: fs, fontWeight: 800, letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone.dot, flexShrink: 0 }} />
      {DIR_SHORT[dirKey] || dirKey}
    </span>
  );
}

function StatusBadge({ status, small }) {
  const s = STS[status] || STS.INFO;
  const fs = small ? 12 : 13;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: small ? "3px 9px" : "4px 11px",
      borderRadius: 999, border: "1px solid " + s.border,
      background: s.bg, color: s.text,
      fontSize: fs, fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* IMPROVEMENT: LoadingSkeleton — animated placeholder while fetching  */
/* ------------------------------------------------------------------ */
function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          borderRadius: 16, border: "1px solid rgba(183,175,163,0.2)",
          overflow: "hidden", background: "rgba(255,255,255,0.5)",
        }}>
          <div style={{
            padding: "13px 16px",
            background: "rgba(255,255,255,0.4)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div className="skeleton-pulse" style={{ width: 10, height: 10, borderRadius: 999 }} />
            <div className="skeleton-pulse" style={{ height: 14, width: `${120 + i * 40}px`, borderRadius: 6 }} />
            <div style={{ flex: 1 }} />
            <div className="skeleton-pulse" style={{ height: 22, width: 28, borderRadius: 99 }} />
          </div>
          <div style={{ padding: "10px 16px 14px", display: "grid", gap: 8 }}>
            {[1, 2].map((j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <div className="skeleton-pulse" style={{ width: 3, height: 36, borderRadius: 99 }} />
                <div className="skeleton-pulse" style={{ height: 14, width: `${60 + j * 80}px`, borderRadius: 6 }} />
                <div style={{ flex: 1 }} />
                <div className="skeleton-pulse" style={{ height: 20, width: 44, borderRadius: 99 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StandardRow                                                          */
/* ------------------------------------------------------------------ */
function StandardRow({ group, expanded, onToggle, compact = false }) {
  const topStatus = priorityStatus(group.statuses);
  const d = (group.directives && group.directives[0]) || "OTHER";
  const tone = DIR[d] || DIR.OTHER;

  return (
    <div style={{ borderBottom: "1px solid rgba(188,178,165,0.15)" }}>
      <div
        onClick={onToggle}
        className="std-row-head"
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: compact ? "11px 10px 11px 0" : "11px 16px 11px 0",
          cursor: "pointer", transition: "background 0.12s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ width: 3, alignSelf: "stretch", borderRadius: 99, background: tone.accent, flexShrink: 0, minHeight: 24, marginLeft: 0 }} />
        <span className="std-row-title" style={{
          flex: 1, fontSize: compact ? 14 : 15, fontWeight: 700, color: "#2c2925",
          minWidth: 0, overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: compact ? "normal" : "nowrap", paddingLeft: 8, lineHeight: 1.35,
        }}>
          {group.name}
        </span>
        <StatusBadge status={topStatus} small={true} />
        <span style={{
          fontSize: 11, color: "#9e9890", marginLeft: 4,
          transition: "transform 0.2s",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block", flexShrink: 0, fontWeight: 900,
        }}>▾</span>
      </div>

      {expanded && (
        <div style={{
          marginLeft: 4, marginBottom: 12,
          borderLeft: "2px solid " + tone.ring,
          paddingLeft: compact ? 10 : 16,
          marginRight: compact ? 4 : 8,
          display: "grid", gap: 8,
        }}>
          {group.findings.map((f, idx) => {
            const rowStatus = f.status || topStatus;
            const signal = rowStatus === "FAIL" ? "high" : rowStatus === "WARN" ? "medium" : rowStatus === "PASS" ? "good" : "neutral";
            const tagTone = tagToneForSignal(signal);
            const tags = buildStandardTags(f.item || {});
            const summary = summarizeStandardCard(f.item || {}, f);
            const meta = getStandardMeta(f.item || {});

            return (
              <div key={group.name + "-" + idx} style={{
                borderRadius: 10, border: "1px solid " + tagTone.bd,
                background: tagTone.bg, padding: compact ? "10px 11px" : "11px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <DirPill dirKey={d} />
                  {tags.map((tag) => (
                    <span key={`${group.name}-${idx}-${tag}`} style={{
                      display: "inline-flex", alignItems: "center",
                      padding: "3px 10px", borderRadius: 999,
                      border: "1px solid rgba(120,112,101,0.18)",
                      background: "rgba(255,255,255,0.68)", color: "#6a6258",
                      fontSize: 12, fontWeight: 800, lineHeight: 1.1, whiteSpace: "nowrap",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {f.item?.code && (
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#2f2c28", lineHeight: 1.3, marginBottom: 10 }}>
                    {f.item.code}
                  </div>
                )}

                {f.item?.title && (
                  <div style={{ fontSize: 14, color: "#5e5850", lineHeight: 1.6, marginBottom: 10 }}>
                    {f.item.title}
                  </div>
                )}

                <div style={{ display: "grid", gap: 7 }}>
                  {meta.harmonizedReference && (
                    <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                      <span style={{ fontWeight: 800, color: "#4c4741" }}>Harmonized reference:</span>{" "}{meta.harmonizedReference}
                    </div>
                  )}
                  {meta.harmonizedVersion && (
                    <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                      <span style={{ fontWeight: 800, color: "#4c4741" }}>Harmonized version:</span>{" "}{meta.harmonizedVersion}
                    </div>
                  )}
                  {meta.stateOfTheArtVersion && (
                    <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                      <span style={{ fontWeight: 800, color: "#4c4741" }}>State-of-the-art version:</span>{" "}{meta.stateOfTheArtVersion}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 800, color: "#4c4741" }}>Match basis:</span>{" "}Traits
                  </div>
                  <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                    <span style={{ fontWeight: 800, color: "#4c4741" }}>Summary:</span>{" "}{summary}
                  </div>
                  {meta.evidence && (
                    <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                      <span style={{ fontWeight: 800, color: "#4c4741" }}>Evidence:</span>{" "}{meta.evidence}
                    </div>
                  )}
                  {meta.notes && (
                    <div style={{ fontSize: 13, color: "#6d675f", lineHeight: 1.55 }}>
                      <span style={{ fontWeight: 800, color: "#4c4741" }}>Notes:</span>{" "}{meta.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DirectiveLane                                                        */
/* ------------------------------------------------------------------ */
function DirectiveLane({ dirKey, groups, expandedStandards, onToggleStandard, compact = false }) {
  const [open, setOpen] = useState(true);
  const tone = DIR[dirKey] || DIR.OTHER;

  return (
    <div style={{ borderRadius: 16, border: "1px solid " + tone.ring, overflow: "hidden", background: "rgba(255,255,255,0.72)" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 16px", cursor: "pointer",
          background: tone.header,
          borderBottom: open ? "1px solid " + tone.ring : "none",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 999, background: tone.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 900, color: tone.ink, flex: 1, letterSpacing: "0.02em" }}>
          {prettyDirectiveName(dirKey)}
        </span>
        <span style={{
          minWidth: 24, height: 24, padding: "0 8px", borderRadius: 999,
          background: tone.ring, color: tone.ink,
          fontWeight: 900, fontSize: 12,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {groups.length}
        </span>
        <span style={{
          fontSize: 11, color: tone.ink, opacity: 0.7,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          display: "inline-block", transition: "transform 0.2s", fontWeight: 900,
        }}>▾</span>
      </div>

      {open && (
        <div style={{ padding: "0 0 4px" }}>
          {groups.map((group) => {
            const key = dirKey + "::" + group.name;
            return (
              <StandardRow
                key={key}
                group={group}
                expanded={!!expandedStandards[key]}
                onToggle={() => onToggleStandard(key)}
                compact={compact}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CheckItem                                                            */
/* ------------------------------------------------------------------ */
function CheckItem({ finding, index }) {
  const directives = enrichDirectives(finding);
  const tone = DIR[directives[0] || "OTHER"] || DIR.OTHER;
  const rawLabel = (finding.article || finding.finding || "").trim();
  const label = rawLabel.replace(/^Missing[:\s]*/i, "").replace(/^Check[:\s]*/i, "").trim();
  const shortLabel = label.length > 72 ? label.slice(0, 70) + "…" : label;
  const body = (finding.action || (finding.article ? finding.finding : "") || "").trim();

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      border: "1px solid " + tone.ring,
      background: "rgba(255,255,255,0.8)",
      display: "grid", gap: 7,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{
          width: 22, height: 22, borderRadius: 999, flexShrink: 0,
          background: tone.accent, color: "#fff",
          fontSize: 11, fontWeight: 900,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {index + 1}
        </span>
        {directives.map((d) => <DirPill key={d} dirKey={d} />)}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#2c2925", lineHeight: 1.45 }}>
        {shortLabel || "Confirm applicability"}
      </div>
      {body && body !== shortLabel && (
        <div style={{ fontSize: 13, color: "#7a746b", lineHeight: 1.55 }}>{body}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LegislationItem                                                      */
/* ------------------------------------------------------------------ */
function LegislationItem({ finding }) {
  const status = finding.status || "INFO";
  const directives = enrichDirectives(finding);
  const s = STS[status] || STS.INFO;
  const d = directives[0] || "OTHER";
  const tone = DIR[d] || DIR.OTHER;

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "12px 14px", borderRadius: 12,
      background: "rgba(255,255,255,0.72)",
      border: "1px solid " + tone.ring,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: tone.pill, border: "1px solid " + tone.ring,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: tone.ink, fontSize: 14, fontWeight: 900,
      }}>
        {s.icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 5 }}>
          {directives.map((dKey) => <DirPill key={dKey} dirKey={dKey} />)}
          <StatusBadge status={status} small={true} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#2f2c28", lineHeight: 1.45 }}>
          {finding.finding || finding.article || "Legislation note"}
        </div>
        {finding.action && (
          <div style={{ marginTop: 4, fontSize: 13, color: "#7a746b", lineHeight: 1.55 }}>{finding.action}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                           */
/* ------------------------------------------------------------------ */
function EmptyState({ title, subtitle }) {
  return (
    <div style={{
      borderRadius: 12, border: "1px dashed rgba(186,176,160,0.7)",
      background: "rgba(250,247,242,0.6)", padding: "24px 20px",
      color: "#807b73", textAlign: "center",
    }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#59544c" }}>{title}</div>
      {subtitle && <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.55 }}>{subtitle}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SummaryBar                                                           */
/* ------------------------------------------------------------------ */
function SummaryBar({ topRisk, standardGroups, standardsByDirective, toCheck }) {
  const riskColor =
    topRisk === "FAIL" ? DIR.RED_CYBER
    : topRisk === "WARN" ? DIR.ROHS
    : topRisk === "PASS" ? DIR.CRA
    : DIR.EMC;

  const items = [
    { label: "Overall Risk", value: topRisk, c: riskColor, big: true },
    { label: "Standards", value: standardGroups.length, c: DIR.LVD },
    { label: "Directives", value: Object.keys(standardsByDirective).length, c: DIR.EMC },
    ...(toCheck.length > 0 ? [{ label: "To Verify", value: toCheck.length, c: DIR.ROHS }] : []),
  ];

  return (
    <div style={{
      display: "flex", gap: 0, borderRadius: 18,
      border: "1px solid rgba(183,175,163,0.3)",
      overflow: "hidden", background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(16px)", flexWrap: "wrap",
    }}>
      {items.map((item, i) => (
        <div key={item.label} style={{
          flex: "1 1 auto", padding: "14px 20px",
          borderRight: i < items.length - 1 ? "1px solid rgba(183,175,163,0.25)" : "none",
          background: i === 0 ? item.c.pill : "transparent",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
            color: item.c.ink, opacity: 0.7, marginBottom: 3, textTransform: "uppercase",
          }}>
            {item.label}
          </div>
          <div style={{ fontSize: item.big ? 24 : 22, fontWeight: 900, color: item.c.ink, lineHeight: 1 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* IMPROVEMENT: CopyButton — copy plain-text summary to clipboard      */
/* ------------------------------------------------------------------ */
function CopyButton({ standardGroups, standardsByDirective, toCheck, notes, topRisk }) {
  const [copied, setCopied] = useState(false);

  function buildTextSummary() {
    const lines = ["RegCheck — EU Compliance Analysis", "=".repeat(40), ""];
    lines.push(`Risk level : ${topRisk}`);
    lines.push(`Standards  : ${standardGroups.length}`);
    lines.push(`Directives : ${Object.keys(standardsByDirective).length}`);
    if (toCheck.length) lines.push(`To verify  : ${toCheck.length}`);
    lines.push("");

    DIR_ORDER.filter((d) => standardsByDirective[d]?.length).forEach((d) => {
      lines.push(`[${DIR_NAME[d] || d}]`);
      standardsByDirective[d].forEach((g) => lines.push(`  • ${g.name}`));
      lines.push("");
    });

    if (toCheck.length) {
      lines.push("THINGS TO CHECK");
      lines.push("-".repeat(30));
      toCheck.forEach((f, i) => {
        const lbl = (f.article || f.finding || "").replace(/^Missing[:\s]*/i, "").replace(/^Check[:\s]*/i, "").trim();
        lines.push(`  ${i + 1}. ${lbl}`);
      });
      lines.push("");
    }

    if (notes.length) {
      lines.push("APPLICABLE LEGISLATIONS");
      lines.push("-".repeat(30));
      notes.forEach((f) => lines.push(`  • ${f.finding || f.article || ""}`));
    }

    return lines.join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildTextSummary()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy results as plain text"
      style={{
        padding: "7px 14px", borderRadius: 10,
        border: "1px solid rgba(197,190,180,0.7)",
        background: copied ? "rgba(96,121,95,0.12)" : "rgba(255,255,255,0.72)",
        color: copied ? "#4a6149" : "#6f6a61",
        fontWeight: 700, fontSize: 13,
        cursor: "pointer", fontFamily: "inherit",
        transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>{copied ? "✓" : "⎘"}</span>
      {copied ? "Copied!" : "Copy results"}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */
export default function App() {
  const [mode, setMode] = useState("standard");
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedStandards, setExpandedStandards] = useState({});
  const [search, setSearch] = useState("");
  const [legsOpen, setLegsOpen] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const inputRef = useRef(null);
  // IMPROVEMENT: ref to scroll results into view after analysis
  const resultsRef = useRef(null);

  const runAnalysis = useCallback(
    function (payloadText) {
      const trimmed = ((payloadText !== undefined ? payloadText : text) || "").trim();
      if (!trimmed) return Promise.resolve();

      setLoading(true);
      setError("");
      // IMPROVEMENT: clear previous results immediately so loading skeleton shows
      setResult(null);

      return fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed, depth: mode, category: "", directives: [] }),
      })
        .then((res) =>
          res.json().then((data) => {
            if (!res.ok) throw new Error((data && data.detail) || "Analysis failed");
            setResult(data);

            const initialExpanded = {};
            buildGroupsFromBackendItems(data.standards || [], data.review_items || []).forEach((group) => {
              const directive = (group.directives && group.directives[0]) || "OTHER";
              initialExpanded[directive + "::" + group.name] = true;
            });
            setExpandedStandards(initialExpanded);

            // IMPROVEMENT: scroll to results after a short frame delay
            setTimeout(() => {
              if (resultsRef.current) {
                resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }, 80);
          })
        )
        .catch((err) => {
          setError((err && err.message) || "Analysis failed");
          setResult(null);
        })
        .finally(() => setLoading(false));
    },
    [mode, text]
  );

  useEffect(() => {
    if (inputRef.current && window.innerWidth > 900) inputRef.current.focus();
  }, []);

  useEffect(() => {
    function onResize() { setViewportWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const standardGroups = useMemo(
    () => buildGroupsFromBackendItems((result && result.standards) || [], (result && result.review_items) || []),
    [result]
  );

  const categorised = useMemo(() => {
    const knownStdNames = new Set(standardGroups.map((g) => g.name));
    return categoriseFindings((result && result.findings) || [], knownStdNames);
  }, [result, standardGroups]);

  const toCheck = categorised.toCheck;
  const notes = categorised.notes;

  const filteredStandardGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return standardGroups;
    return standardGroups.filter((g) => {
      const hay = [
        g.name,
        ...(g.directives || []),
        ...(g.actions || []),
        ...(g.findings || []).map((f) => {
          const item = f.item || {};
          return [
            f.finding || "",
            item.code || "",
            item.title || "",
            item.category || "",
            item.standard_family || "",
            ...(item.test_focus || []),
            ...(item.keywords || []),
            ...buildStandardTags(item),
          ].join(" ");
        }),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [search, standardGroups]);

  const standardsByDirective = useMemo(() => {
    const groups = {};
    filteredStandardGroups.forEach((g) => {
      const d = (g.directives && g.directives[0]) || "OTHER";
      if (!groups[d]) groups[d] = [];
      groups[d].push(g);
    });
    return groups;
  }, [filteredStandardGroups]);

  const topRisk = useMemo(() => {
    const statuses = [
      ...((result && result.findings) || []).map((f) => f.status).filter(Boolean),
      ...standardGroups.flatMap((g) => g.statuses || []),
    ];
    return priorityStatus(statuses);
  }, [result, standardGroups]);

  function appendChip(chipText) {
    setText((t) => {
      const trimmed = t.trimEnd();
      if (!trimmed) return chipText.charAt(0).toUpperCase() + chipText.slice(1);
      return /[.!?]$/.test(trimmed) ? trimmed + " " + chipText : trimmed + ", " + chipText;
    });
    if (inputRef.current) inputRef.current.focus();
  }

  // IMPROVEMENT: expand/collapse all standards at once
  function handleToggleAllStandards(expand) {
    const next = {};
    standardGroups.forEach((group) => {
      const directive = (group.directives && group.directives[0]) || "OTHER";
      next[directive + "::" + group.name] = expand;
    });
    setExpandedStandards(next);
  }

  const allExpanded = standardGroups.length > 0 &&
    standardGroups.every((g) => {
      const d = (g.directives && g.directives[0]) || "OTHER";
      return expandedStandards[d + "::" + g.name];
    });

  const isTablet = viewportWidth < 980;
  const isMobile = viewportWidth < 720;
  const hasResults = !!result;
  const hasSidebar = hasResults && toCheck.length > 0;
  const hasLegislations = hasResults && notes.length > 0;
  // IMPROVEMENT: show skeleton when loading (before first result arrives)
  const showSkeleton = loading && !result;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top left, rgba(133,176,190,0.25), transparent 30%), radial-gradient(ellipse at top right, rgba(204,189,148,0.2), transparent 28%), linear-gradient(180deg,#ddd7cf 0%,#d4cdc4 100%)",
      padding: isMobile ? "14px 10px 90px" : "24px 20px 100px",
      fontFamily: "'DM Sans','Helvetica Neue',Arial,sans-serif",
      color: "#3d3832",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&display=swap');
        *{box-sizing:border-box;}
        ::placeholder{color:#b0a89d;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:rgba(150,140,128,0.35);border-radius:99px;}
        textarea:focus,input:focus{outline:none;}
        .chip-btn:hover{background:rgba(255,255,255,0.95)!important;border-color:#b0a89d!important;}
        .tmpl-btn:hover{background:rgba(255,255,255,0.9)!important;}
        .run-btn:not(:disabled):hover{filter:brightness(1.06);}
        .mode-seg-btn:hover{background:rgba(255,255,255,0.18)!important;}
        .clear-btn:hover{background:rgba(255,255,255,0.95)!important;}
        .icon-btn:hover{background:rgba(255,255,255,0.95)!important;}
        @media (max-width: 720px){
          .std-row-head{align-items:flex-start!important;}
          .std-row-title{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;}
        }

        /* IMPROVEMENT: skeleton shimmer animation */
        @keyframes shimmer {
          0%{background-position:-600px 0}
          100%{background-position:600px 0}
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, rgba(183,175,163,0.2) 25%, rgba(183,175,163,0.38) 50%, rgba(183,175,163,0.2) 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 6px;
        }

        /* IMPROVEMENT: results fade-in animation */
        @keyframes fadeSlideUp {
          from{opacity:0;transform:translateY(10px)}
          to{opacity:1;transform:translateY(0)}
        }
        .results-appear {
          animation: fadeSlideUp 0.3s ease-out both;
        }

        /* IMPROVEMENT: mode tooltip */
        .mode-tooltip-wrap{position:relative;}
        .mode-tooltip-wrap .mode-tooltip{
          display:none;position:absolute;bottom:calc(100% + 7px);left:50%;
          transform:translateX(-50%);
          background:#2a2520;color:#fffdf8;
          font-size:11px;font-weight:600;white-space:nowrap;
          padding:5px 9px;border-radius:7px;pointer-events:none;
          box-shadow:0 4px 12px rgba(0,0,0,0.18);
          z-index:100;
        }
        .mode-tooltip-wrap .mode-tooltip::after{
          content:'';position:absolute;top:100%;left:50%;
          transform:translateX(-50%);
          border:5px solid transparent;border-top-color:#2a2520;
        }
        .mode-tooltip-wrap:hover .mode-tooltip{display:block;}

        /* IMPROVEMENT: search clear button */
        .search-wrap{position:relative;}
        .search-clear{
          position:absolute;right:10px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;
          color:#b0a89d;font-size:14px;padding:2px 4px;line-height:1;
          border-radius:4px;transition:color 0.12s;
        }
        .search-clear:hover{color:#6f6a61;}
      `}</style>

      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 14, width: "100%" }}>

        {/* ── HEADER ── */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 22px", borderRadius: 20,
          background: "rgba(255,255,255,0.55)",
          border: "1px solid rgba(183,175,163,0.3)",
          backdropFilter: "blur(20px)", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg,#8fb6c1,#5d848f)",
              display: "grid", placeItems: "center",
              color: "white", fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em",
            }}>
              RC
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#2a2520", letterSpacing: "-0.03em", lineHeight: 1 }}>
                RegCheck
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9e9890", marginTop: 1 }}>
                EU Product Compliance Analyser
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#8c887f",
              background: "rgba(0,0,0,0.07)", borderRadius: 99, padding: "2px 9px",
              alignSelf: "flex-start", marginTop: 1,
            }}>v3</span>
          </div>

          {hasResults && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {DIR_ORDER.filter((d) => standardsByDirective[d] && standardsByDirective[d].length).map((d) => (
                <DirPill key={d} dirKey={d} />
              ))}
            </div>
          )}
        </header>

        {/* ── SUMMARY BAR ── */}
        {hasResults && (
          <SummaryBar
            topRisk={topRisk}
            standardGroups={standardGroups}
            standardsByDirective={standardsByDirective}
            toCheck={toCheck}
          />
        )}

        {/* ── INPUT PANEL ── */}
        <div style={{
          borderRadius: 22, border: "1px solid rgba(183,175,163,0.3)",
          background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)", overflow: "hidden",
        }}>
          {/* Textarea */}
          <div style={{ padding: "18px 20px 0" }}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runAnalysis(); }}
              placeholder="Describe the product — include power source, connectivity, features, and materials. e.g. Smart air fryer with Wi-Fi, mains powered, OTA updates, food-contact basket coating..."
              style={{
                width: "100%", minHeight: 96, resize: "vertical",
                border: "none", background: "transparent",
                fontSize: 16, lineHeight: 1.65, color: "#2e2b27", fontFamily: "inherit",
              }}
            />
          </div>

          {/* IMPROVEMENT: char count hint below textarea */}
          {text.length > 0 && (
            <div style={{ padding: "0 20px 6px", display: "flex", justifyContent: "flex-end" }}>
              <span style={{
                fontSize: 11, color: text.length < 40 ? "#c9a040" : "#a0998f", fontWeight: 600,
              }}>
                {text.length < 40 ? "Add more detail for better results · " : ""}{text.length} chars
              </span>
            </div>
          )}

          {/* Quick chips */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(188,178,165,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: "#b0a89d",
                letterSpacing: "0.1em", marginRight: 2, textTransform: "uppercase",
              }}>Add</span>
              {QUICK_CHIPS.map((chip) => (
                <button key={chip.label} type="button" className="chip-btn"
                  onClick={() => appendChip(chip.text)}
                  style={{
                    padding: "5px 12px", borderRadius: 99,
                    border: "1px solid rgba(200,192,182,0.7)",
                    background: "rgba(255,255,255,0.65)",
                    color: "#5c5750", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", transition: "all 0.12s", fontFamily: "inherit",
                  }}>
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid rgba(188,178,165,0.18)",
            display: "flex",
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: 12, flexWrap: "wrap",
          }}>
            {/* Templates */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: "#b0a89d",
                letterSpacing: "0.1em", marginRight: 2, textTransform: "uppercase",
              }}>Template</span>
              {PRODUCT_TEMPLATES.map((tpl) => (
                <button key={tpl.label} type="button" className="tmpl-btn"
                  onClick={() => { setText(tpl.text); if (inputRef.current) inputRef.current.focus(); }}
                  style={{
                    padding: "5px 12px", borderRadius: 99,
                    border: "1px solid rgba(200,192,182,0.7)",
                    background: text === tpl.text ? "rgba(143,182,193,0.2)" : "rgba(255,255,255,0.55)",
                    color: text === tpl.text ? "#3e7080" : "#5c5750",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                    transition: "all 0.12s", fontFamily: "inherit",
                  }}>
                  {tpl.label}
                </button>
              ))}
            </div>

            {/* Action group */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

              {/* IMPROVEMENT: mode selector with tooltips */}
              <div style={{
                display: "flex", borderRadius: 12,
                border: "1px solid rgba(197,190,180,0.7)",
                overflow: "visible", background: "rgba(255,255,255,0.45)",
              }}>
                {[["quick", "Quick"], ["standard", "Standard"], ["deep", "Deep"]].map(([val, lbl], i, arr) => {
                  const active = mode === val;
                  return (
                    <div key={val} className="mode-tooltip-wrap" style={{ position: "relative" }}>
                      <div className="mode-tooltip">{MODE_DESCRIPTIONS[val]}</div>
                      <button
                        type="button"
                        className="mode-seg-btn"
                        onClick={() => setMode(val)}
                        style={{
                          padding: "7px 15px", border: "none",
                          borderRight: val !== "deep" ? "1px solid rgba(197,190,180,0.5)" : "none",
                          borderRadius: i === 0 ? "11px 0 0 11px" : i === arr.length - 1 ? "0 11px 11px 0" : 0,
                          background: active ? "linear-gradient(180deg,#6f9199,#567a82)" : "transparent",
                          color: active ? "#fffdf8" : "#7f7a71",
                          fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                        }}>
                        {lbl}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button type="button" className="clear-btn"
                onClick={() => { setText(""); setResult(null); setError(""); setSearch(""); }}
                style={{
                  padding: "8px 15px", borderRadius: 11,
                  border: "1px solid rgba(197,190,180,0.7)",
                  background: "rgba(255,255,255,0.72)",
                  color: "#6f6a61", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                }}>Clear</button>

              <button
                type="button"
                disabled={loading || !text.trim()}
                className="run-btn"
                onClick={() => runAnalysis()}
                style={{
                  padding: "8px 22px", borderRadius: 11,
                  border: "1px solid #5a8188",
                  background: loading || !text.trim()
                    ? "linear-gradient(180deg,#a7b7bb,#95a4a8)"
                    : "linear-gradient(180deg,#6f9199,#567a82)",
                  color: "#fffdf8", fontWeight: 900, fontSize: 14,
                  cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                  boxShadow: loading || !text.trim() ? "none" : "0 6px 20px rgba(86,122,130,0.25)",
                  transition: "all 0.14s", fontFamily: "inherit", letterSpacing: "-0.01em",
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                {loading ? (
                  <>
                    {/* IMPROVEMENT: spinner inside run button */}
                    <span style={{
                      width: 13, height: 13, borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.35)",
                      borderTopColor: "#fff",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Analysing…
                  </>
                ) : (
                  <>
                    Run analysis
                    {/* IMPROVEMENT: keyboard shortcut hint */}
                    <span style={{
                      fontSize: 11, fontWeight: 700, opacity: 0.65,
                      background: "rgba(255,255,255,0.15)", borderRadius: 5,
                      padding: "1px 5px", letterSpacing: 0,
                    }}>⌘↵</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            borderRadius: 14, border: "1px solid #e3c7cf",
            background: "#f9edf1", color: "#906878",
            padding: "13px 16px", fontSize: 14,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
            {error}
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {showSkeleton && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{
              borderRadius: 22, border: "1px solid rgba(183,175,163,0.28)",
              background: "rgba(255,255,255,0.62)", backdropFilter: "blur(18px)", overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 20px 14px",
                borderBottom: "1px solid rgba(188,178,165,0.22)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div className="skeleton-pulse" style={{ height: 18, width: 180, borderRadius: 6 }} />
                <div style={{ flex: 1 }} />
                <div className="skeleton-pulse" style={{ height: 32, width: 200, borderRadius: 11 }} />
              </div>
              <div style={{ padding: "14px" }}>
                <LoadingSkeleton />
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {hasResults && (
          <div
            ref={resultsRef}
            className="results-appear"
            style={{
              display: "grid",
              gridTemplateColumns: hasSidebar && !isTablet ? "1fr 272px" : "1fr",
              gap: 14, alignItems: "start",
            }}
          >
            <div style={{ display: "grid", gap: 14 }}>
              {/* Standards panel */}
              <div style={{
                borderRadius: 22, border: "1px solid rgba(183,175,163,0.28)",
                background: "rgba(255,255,255,0.62)", backdropFilter: "blur(18px)", overflow: "hidden",
              }}>
                {/* Standards header */}
                <div style={{
                  padding: "16px 20px 14px",
                  borderBottom: "1px solid rgba(188,178,165,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 12, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 17, fontWeight: 900, color: "#3a3630", letterSpacing: "-0.02em" }}>
                      Applicable Standards
                    </span>
                    <span style={{
                      minWidth: 26, height: 24, padding: "0 9px", borderRadius: 99,
                      background: "#eef2f0", border: "1px solid #d6ddd8",
                      color: "#5b6862", fontWeight: 900, fontSize: 13,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {filteredStandardGroups.length}
                    </span>

                    {/* IMPROVEMENT: expand / collapse all toggle */}
                    {standardGroups.length > 0 && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleToggleAllStandards(!allExpanded)}
                        title={allExpanded ? "Collapse all" : "Expand all"}
                        style={{
                          padding: "4px 10px", borderRadius: 8,
                          border: "1px solid rgba(197,190,180,0.6)",
                          background: "rgba(255,255,255,0.6)",
                          color: "#7a746b", fontWeight: 700, fontSize: 12,
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {allExpanded ? "Collapse all" : "Expand all"}
                      </button>
                    )}
                  </div>

                  {/* IMPROVEMENT: search with clear button */}
                  <div className="search-wrap" style={{ position: "relative" }}>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter standards…"
                      style={{
                        width: isMobile ? "100%" : 210, maxWidth: "100%",
                        borderRadius: 11, border: "1px solid rgba(198,189,177,0.7)",
                        background: "rgba(255,255,255,0.8)",
                        padding: search ? "8px 30px 8px 13px" : "8px 13px",
                        fontSize: 14, color: "#46413a", fontFamily: "inherit",
                      }}
                    />
                    {search && (
                      <button
                        type="button"
                        className="search-clear"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                      >×</button>
                    )}
                  </div>
                </div>

                {/* Standards lanes */}
                <div style={{ padding: "14px 14px", display: "grid", gap: 10 }}>
                  {!filteredStandardGroups.length ? (
                    <EmptyState
                      title={search ? "No standards match that filter" : "No standards found"}
                      subtitle={search ? "Try a different keyword, or clear the filter." : "Run analysis with a more detailed product description."}
                    />
                  ) : (
                    DIR_ORDER
                      .filter((d) => standardsByDirective[d] && standardsByDirective[d].length)
                      .map((directive) => (
                        <DirectiveLane
                          key={directive}
                          dirKey={directive}
                          groups={standardsByDirective[directive]}
                          expandedStandards={expandedStandards}
                          compact={isMobile}
                          onToggleStandard={(key) =>
                            setExpandedStandards((prev) => {
                              const next = { ...prev };
                              next[key] = !prev[key];
                              return next;
                            })
                          }
                        />
                      ))
                  )}
                </div>
              </div>

              {/* Applicable Legislations */}
              {hasLegislations && (
                <div style={{
                  borderRadius: 22, border: "1px solid rgba(183,175,163,0.28)",
                  background: "rgba(255,255,255,0.62)", backdropFilter: "blur(18px)", overflow: "hidden",
                }}>
                  <div
                    onClick={() => setLegsOpen((o) => !o)}
                    style={{
                      padding: "16px 20px 14px", cursor: "pointer",
                      borderBottom: legsOpen ? "1px solid rgba(188,178,165,0.22)" : "none",
                      display: "flex", alignItems: "center", gap: 10,
                      background: "rgba(255,255,255,0.3)",
                    }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 900, color: "#3a3630", flex: 1, letterSpacing: "-0.02em" }}>
                      Applicable Legislations
                    </span>
                    <span style={{
                      minWidth: 26, height: 24, padding: "0 9px", borderRadius: 99,
                      background: "#eef2f0", border: "1px solid #d6ddd8",
                      color: "#5b6862", fontWeight: 900, fontSize: 13,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {notes.length}
                    </span>
                    <span style={{
                      fontSize: 11, color: "#9e9890", fontWeight: 900,
                      transform: legsOpen ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block", transition: "transform 0.2s",
                    }}>▾</span>
                  </div>

                  {legsOpen && (
                    <div style={{ padding: "14px", display: "grid", gap: 10 }}>
                      {notes.map((f, i) => (
                        <LegislationItem key={f._i + "-" + i} finding={f} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* IMPROVEMENT: Copy results button row — shown below all result panels */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <CopyButton
                  standardGroups={standardGroups}
                  standardsByDirective={standardsByDirective}
                  toCheck={toCheck}
                  notes={notes}
                  topRisk={topRisk}
                />
              </div>
            </div>

            {/* Things to Check sidebar */}
            {hasSidebar && (
              <div style={{
                borderRadius: 20, overflow: "hidden",
                border: "1px solid " + DIR.ROHS.ring,
                background: "rgba(255,255,255,0.62)",
                backdropFilter: "blur(18px)",
              }}>
                <div style={{
                  padding: "15px 16px 12px",
                  borderBottom: "1px solid " + DIR.ROHS.ring,
                  background: DIR.ROHS.header,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: DIR.ROHS.ink, flex: 1, letterSpacing: "-0.01em" }}>
                      Things to Check
                    </span>
                    <span style={{
                      minWidth: 24, height: 24, padding: "0 8px", borderRadius: 99,
                      background: DIR.ROHS.ring, color: DIR.ROHS.ink,
                      fontWeight: 900, fontSize: 12,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {toCheck.length}
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#7a6030", lineHeight: 1.5 }}>
                    Potentially applicable — verify before scoping out.
                  </div>
                </div>
                <div style={{ padding: "12px", display: "grid", gap: 9 }}>
                  {toCheck.map((f, i) => (
                    <CheckItem key={f._i + "-" + i} finding={f} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* IMPROVEMENT: spinner keyframe (appended to existing style block above via inline) */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}