// Directive metadata lookups and route-label helpers.

import { DIR_SHORT, DIR_ORDER, DIR_TONES, STATUS, IMPORTANCE, SECTION_TONES } from "../directiveConfig";
import { titleCase, titleCaseMinor } from "./format";

export { DIR_SHORT, DIR_ORDER, DIR_TONES, STATUS, IMPORTANCE, SECTION_TONES };

const PARALLEL_OBLIGATION_ROUTE_KEYS = new Set(["CRA", "GDPR"]);

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

export function routeTitle(section) {
  const titles = {
    LVD:       "LVD safety route",
    EMC:       "EMC compatibility route",
    RED:       "RED wireless route",
    RED_CYBER: "RED cybersecurity route",
    ROHS:      "RoHS materials route",
    REACH:     "REACH chemicals route",
    GDPR:      "GDPR data route",
    AI_Act:    "AI Act route",
    ESPR:      "ESPR route",
    ECO:       "Ecodesign route",
    BATTERY:   "Battery Regulation route",
    FCM:       "Food contact materials route",
    FCM_PLASTIC: "Food contact plastics route",
    CRA:       "Cyber Resilience Act route",
    MD:        "Machinery Directive route",
    MACH_REG:  "Machinery Regulation route",
    OTHER:     "Additional route",
  };

  return titleCaseMinor(
    titles[section?.key] ||
      section?.title ||
      directiveShort(section?.key) ||
      "Additional route"
  );
}

export function normalizeStandardDirective(item) {
  const code = String(item?.code || "").toUpperCase();
  if (code.startsWith("EN 18031-")) return "RED_CYBER";

  return (
    item?.directive_key  ||
    item?.directive      ||
    item?.legislation_key ||
    item?.section_key    ||
    "OTHER"
  );
}
