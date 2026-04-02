/**
 * Standards-route selectors.
 * Covers: base-safety-route detection, route-section decoration,
 * per-standard rationale, and RED article grouping.
 */
import { titleCaseMinor, VERTICAL_STANDARD_SCOPE } from "../helpers";

export const BASE_SAFETY_ROUTE_COPY = {
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

const CORE_DIRECTIVE_KEYS = new Set(["LVD", "EMC"]);
const CONDITIONAL_DIRECTIVE_KEYS = new Set(["RED", "RED_CYBER"]);

// ── RED article grouping ────────────────────────────────────────────────────

const RED_ARTICLE_DEFINITIONS = [
  { key: "3.1a", label: "Article 3.1(a) — Safety / Health" },
  { key: "3.1b", label: "Article 3.1(b) — EMC" },
  { key: "3.2",  label: "Article 3.2 — Radio / Spectrum" },
  { key: "3.3",  label: "Article 3.3 — Additional requirements" },
];

const SECTION_KEY_TO_RED_ARTICLE = { LVD: "3.1a", EMC: "3.1b", RED: "3.2" };

function inferRedArticleFromCode(code) {
  const c = String(code || "").toUpperCase();
  if (/62368|60335|60950|60065|61010-1/.test(c)) return "3.1a";
  if (/60825|62471/.test(c)) return "3.1a";
  if (/62133|62619|62281/.test(c)) return "3.1a";
  if (/62479|50663|62311|50566|50364|62233/.test(c)) return "3.1a";
  if (/60335-2-\d+|60745|60598|61558|60730|61347|60204/.test(c)) return "3.1a";
  if (/13849|62061|12100/.test(c)) return "3.1a";
  if (/301\s*489/.test(c)) return "3.1b";
  if (/55014|55032|55022|55013|55011|55015|55035|55024|55020/.test(c)) return "3.1b";
  if (/61000-3|61000-4|61000-6/.test(c)) return "3.1b";
  return "3.2";
}

export function buildRedGroup(decoratedRouteSections) {
  const hasRed = (decoratedRouteSections || []).some((s) => s.key === "RED");
  if (!hasRed) return null;

  const branchItems = { "3.1a": [], "3.1b": [], "3.2": [], "3.3": [] };

  (decoratedRouteSections || [])
    .filter((s) => SECTION_KEY_TO_RED_ARTICLE[s.key] !== undefined)
    .forEach((section) => {
      (section.items || []).forEach((item) => {
        let rawArticleKey;
        if (item.article_key) {
          rawArticleKey = String(item.article_key).toLowerCase();
        } else if (section.key !== "RED") {
          rawArticleKey = SECTION_KEY_TO_RED_ARTICLE[section.key];
        } else {
          rawArticleKey = inferRedArticleFromCode(item.code);
        }
        if (branchItems[rawArticleKey] !== undefined) {
          branchItems[rawArticleKey].push(item);
        }
      });
    });

  const redSection = (decoratedRouteSections || []).find((s) => s.key === "RED");

  const branches = RED_ARTICLE_DEFINITIONS
    .map(({ key, label }) => ({ key, label, items: branchItems[key] || [] }))
    .filter((branch) => {
      if (branch.key !== "3.3") return true;
      return branch.items.length > 0;
    });

  const totalItems = branches.reduce((sum, b) => sum + b.items.length, 0);

  return {
    key: "RED",
    sectionKind: "core",
    applicabilityBucket: "Core applicable",
    shortRationale: redSection?.shortRationale || "Includes intentional radio transmission.",
    totalItems,
    branches,
  };
}

// ── Route-section decoration ────────────────────────────────────────────────

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

export function decorateRouteSections(sections, baseSafetyRoute) {
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

// ── Base-safety-route inference ─────────────────────────────────────────────

export function inferBaseSafetyRoute(result, routeSections) {
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

// ── Product-type resolution ─────────────────────────────────────────────────

export function resolveProductType(result, routeSections, descriptionText) {
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

    return scope.defaultType;
  }

  return rawType;
}
