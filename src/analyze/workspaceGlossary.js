/** One-line definitions shown in glossary tooltips for each directive key. */
export const DIRECTIVE_GLOSSARY = {
  LVD: "Low Voltage Directive (2014/35/EU) — applies to electrical equipment 50–1000 V AC / 75–1500 V DC.",
  EMC: "Electromagnetic Compatibility Directive (2014/30/EU) — governs emissions and immunity of electrical apparatus.",
  RED: "Radio Equipment Directive (2014/53/EU) — applies to Wi-Fi, Bluetooth, cellular, and other intentional radiators.",
  RED_CYBER: "RED Art. 3(3)(d/e/f) cybersecurity delegated act — adds security requirements for internet-connected radio equipment.",
  ROHS: "RoHS Directive (2011/65/EU) — restricts ten hazardous substances in electrical and electronic equipment.",
  REACH: "REACH Regulation (EC 1907/2006) — chemical substance duties including SVHC communication and Annex XVII restrictions.",
  WEEE: "WEEE Directive (2012/19/EU) — producer registration, take-back obligations, and crossed-bin marking for EEE.",
  GPSR: "General Product Safety Regulation (EU 2023/988) — applies to all consumer products; replaces GPSD from Dec 2024.",
  CRA: "Cyber Resilience Act (EU 2024/2847) — cybersecurity-by-design for products with digital elements; most obligations from Dec 2027.",
  MDR: "Medical Device Regulation (EU 2017/745) — clinical evidence, notified body, and UDI required for medical devices.",
  GDPR: "GDPR (EU 2016/679) — personal data processing duties including lawful basis, rights, and security measures.",
  BATTERY: "EU Battery Regulation (EU 2023/1542) — labelling, chemistry disclosure, removability, and EoL duties for batteries.",
  ECO: "Ecodesign Directive (2009/125/EC) framework — binding requirements set in implementing measures for energy-related products.",
  ESPR: "Ecodesign for Sustainable Products Regulation (EU 2024/1781) — successor to ESPR; product-specific measures forthcoming.",
  AI_Act: "AI Act (EU 2024/1689) — risk-based requirements for AI systems; high-risk AI requires conformity assessment.",
  FCM: "Food Contact Materials Regulation (EC 1935/2004) — inertness and traceability for materials contacting food.",
};

export const RISK_GLOSSARY = {
  low: "Low risk: few high-severity obligations identified. Standard CE marking should proceed without critical blockers.",
  medium: "Medium risk: some obligations require attention. Clarify open items before scoping evidence.",
  high: "High risk: multiple high-severity obligations identified. Prioritize clarification before testing.",
  critical: "Critical risk: severe obligations identified across multiple areas. Immediate expert review required.",
};

export const CONFIDENCE_GLOSSARY = {
  "high confidence": "Product matched with high certainty. The route is unlikely to shift with more detail.",
  "preliminary only": "Blockers are open. Resolve them before relying on this route.",
  "needs confirmation": "Route is plausible but open items may shift specific obligations.",
};

export const MATURITY_GLOSSARY = {
  "initial scope": "Blockers are unresolved. The route may change significantly with more product detail.",
  "conditional scope": "No blockers, but route-affecting items remain. Scope is plausible, not finalized.",
  "evidence-ready scope": "No blockers or route-affecting gaps. Scope is stable and ready for evidence planning.",
};

export const APPLICABILITY_GLOSSARY = {
  "core applicable": "Applies directly to this product type. Include in the primary compliance scope.",
  "conditional": "Applicability depends on product features or market facts. Verify whether the condition is met.",
  "supplementary": "Lower-priority — may apply depending on further design or use-case details.",
  "route review": "Applicability uncertain. Review the full directive scope against this product.",
};

export const SEVERITY_GLOSSARY = {
  blocker: "Missing input that can materially change the compliance route. Resolve before relying on this result.",
  "route-affecting": "Missing input that may shift specific obligations or evidence scope. Confirm before testing.",
  helpful: "Optional detail that can tighten the route but is unlikely to change it materially.",
};

/** Returns timing / applicability label for a directive key, or null. */
export function getTimingLabel(directiveKey) {
  const key = String(directiveKey || "").toUpperCase();
  if (key === "CRA") return "Obligations from Dec 2027";
  if (key === "GDPR") return "Only if personal data processed";
  if (key === "MDR") return "Only if marketed with medical claim";
  if (key === "ESPR") return "Review-dependent";
  if (key === "AI_ACT" || key === "AI_Act") return "Upcoming — risk classification required";
  return null;
}

/** Maps directive keys to their curated detail page paths. */
export const DIRECTIVE_PAGE_MAP = {
  LVD: "/directives/lvd.md",
  EMC: "/directives/emc.md",
  RED: "/directives/red.md",
  RED_CYBER: "/directives/red.md",
  ROHS: "/directives/rohs.md",
};

/** Badge config for applicabilityBucket values. */
export const APPLICABILITY_BADGE = {
  "core applicable": { label: "Mandatory", icon: "check", tone: "positive" },
  "conditional":     { label: "Conditional", icon: "warning", tone: "warning" },
  "supplementary":   { label: "Supplementary", icon: "muted", tone: "muted" },
  "route review":    { label: "Review", icon: "muted", tone: "muted" },
};
