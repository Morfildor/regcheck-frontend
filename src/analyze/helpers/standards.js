// Standard classification, scope lookup, and sorting.

import { directiveRank, normalizeStandardDirective } from "./directives";

// Maps vertical standard codes to the product types they cover.
export const VERTICAL_STANDARD_SCOPE = {
  "60335-2-40": {
    // EN 60335-2-40: Particular requirements for electrical heat pumps,
    // air-conditioners and dehumidifiers.
    scopeLabel:   "Heat pumps, air conditioners and dehumidifiers",
    productTypes: ["Heat pump", "Air conditioner", "Dehumidifier"],
    detect: [
      { pattern: /air.?condition/i, type: "Air conditioner" },
      { pattern: /dehumidif/i,      type: "Dehumidifier" },
    ],
    defaultType: "Heat pump",
  },
};

export function getStandardScope(code) {
  // Strip any leading org prefixes (EN, IEC, EN IEC, BS EN, etc.) and match
  // the numeric part like "60335-2-40".
  const normalized = String(code || "")
    .replace(/^(?:(?:EN|IEC|BS|DIN|NF)\s*)+/i, "")
    .trim();
  return VERTICAL_STANDARD_SCOPE[normalized] || null;
}

export function inferStandardCategory(item) {
  const code  = String(item?.code  || "").toUpperCase();
  const title = String(item?.title || "").toLowerCase();

  // ── Cybersecurity ─────────────────────────────────────────────────────────
  if (/18031/.test(code)) return "Cybersecurity";

  // ── RF Exposure ───────────────────────────────────────────────────────────
  if (/62479|50663|62311|50566|50364/.test(code)) return "RF Exposure";

  // ── EMF ───────────────────────────────────────────────────────────────────
  if (/62233/.test(code)) return "EMF";

  // ── Optical / photobiological radiation ───────────────────────────────────
  if (/62471/.test(code)) return "Photobiological Safety";
  if (/60825/.test(code)) return "Laser Safety";

  // ── Battery safety ────────────────────────────────────────────────────────
  if (/62133|62619/.test(code)) return "Battery Safety";
  if (/62281/.test(code))       return "Battery Transport";

  // ── Safety – horizontal ───────────────────────────────────────────────────
  if (/60335-1\b/.test(code) || /62368-1\b/.test(code)) return "Horizontal Safety";
  if (/60950-1\b/.test(code) || /60065\b/.test(code))   return "Horizontal Safety";
  if (/61010-1\b/.test(code))                            return "Horizontal Safety";

  // ── Safety – vertical ────────────────────────────────────────────────────
  if (/60335-2-\d+/.test(code)) return "Vertical Safety";
  if (/60745-2-\d+/.test(code)) return "Vertical Safety";

  // ── Safety – specialist ───────────────────────────────────────────────────
  if (/60745-1\b/.test(code)) return "Power Tool Safety";
  if (/60598/.test(code))     return "Luminaire Safety";
  if (/61558/.test(code))     return "Transformer Safety";
  if (/60730/.test(code))     return "Control Safety";
  if (/61347/.test(code))     return "Lamp Gear Safety";
  if (/60204/.test(code))     return "Machine Electrical Safety";

  // ── Functional safety / risk assessment ───────────────────────────────────
  if (/13849|62061/.test(code)) return "Functional Safety";
  if (/12100/.test(code))       return "Risk Assessment";

  // ── Radio – specific bands ────────────────────────────────────────────────
  if (/301\s*893/.test(code))           return "Wi-Fi 5 GHz";
  if (/303\s*687/.test(code))           return "Wi-Fi 6 GHz";
  if (/300\s*328/.test(code))           return "Wi-Fi / BT 2.4 GHz";
  if (/302\s*065|303\s*883/.test(code)) return "UWB";
  if (/303\s*417/.test(code))           return "Wireless Power";
  if (/300\s*330/.test(code))           return "NFC / RFID";
  if (/300\s*440/.test(code))           return "Short Range Radio";
  if (/300\s*220/.test(code))           return "SRD";
  if (/301\s*511/.test(code))           return "GSM";
  if (/301\s*908|303\s*348/.test(code)) return "Cellular";
  if (/303\s*413/.test(code))           return "GNSS";
  if (/303\s*131|302\s*755/.test(code)) return "Broadcast Receiver";
  if (/301\s*489/.test(code))           return "Radio EMC";

  // ── EMC – conducted limits ────────────────────────────────────────────────
  if (/61000-3-2|61000-3-12/.test(code)) return "Harmonics";
  if (/61000-3-3|61000-3-11/.test(code)) return "Flicker";

  // ── EMC – immunity ────────────────────────────────────────────────────────
  if (/55014-2|55035|55024|55020|61000-4|61000-6-1\b|61000-6-2\b/.test(code)) return "Immunity";

  // ── EMC – emissions ───────────────────────────────────────────────────────
  if (/55014-1|55032|55022|55013|55011|55015|61000-6-3\b|61000-6-4\b/.test(code)) return "Emissions";

  // ── Energy / standby power ────────────────────────────────────────────────
  if (/50564|62301|62087/.test(code)) return "Standby Power";

  // ── Title-based fallbacks ─────────────────────────────────────────────────
  if (/bluetooth/i.test(title) || /bluetooth/i.test(code)) return "Bluetooth";
  if (/wi.?fi|wlan/i.test(title) || /wi.?fi|wlan/i.test(code)) return "Wi-Fi";
  if (/emission/i.test(title))                               return "Emissions";
  if (/immunit/i.test(title))                                return "Immunity";
  if (/radio/i.test(title))                                  return "Radio";
  if (/laser/i.test(title))                                  return "Laser Safety";
  if (/battery/i.test(title))                                return "Battery Safety";
  if (/standby|power consumption/i.test(title))              return "Standby Power";
  if (/safety/i.test(title))                                 return "Safety";

  return null;
}

// ── Internal sort helpers ─────────────────────────────────────────────────────

function standardCodeLabel(item) {
  return `${String(item?.code || "")} ${String(item?.title || "")}`.trim();
}

function standardCodeNumber(item) {
  return String(item?.code || "").replace(/\s+/g, " ").trim();
}

function lvdPrimaryRank(item) {
  const label = standardCodeLabel(item);
  const code  = standardCodeNumber(item);

  if (/(?:^|\b)(?:EN|IEC)\s*62368\s*-\s*1(?:\b|$)/i.test(label))  return [0, 0, 0];
  if (/(?:^|\b)(?:EN|IEC)\s*60335\s*-\s*1(?:\b|$)/i.test(label))  return [0, 1, 0];

  const part2Match = code.match(/(?:EN|IEC)\s*60335\s*-\s*2\s*-\s*(\d+)/i);
  if (part2Match) return [1, Number(part2Match[1] || 0), 0];

  if (/(?:^|\b)(?:EN|IEC)\s*62233(?:\b|$)/i.test(label)) return [2, 0, 0];
  if (/(?:^|\b)(?:EN|IEC)\s*62311(?:\b|$)/i.test(label)) return [2, 1, 0];

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
      String(a.code  || "").localeCompare(String(b.code  || ""), undefined, { numeric: true, sensitivity: "base" }) ||
      String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" })
    );
  });
}
