/**
 * Legislation selectors.
 * Covers: legislation-content library, key resolution, group decoration.
 */

export const LEGISLATION_CONTENT_LIBRARY = {
  REACH: {
    summary:
      "For hardware products, REACH is usually an ongoing article-level check rather than a one-time checkbox. Candidate List updates, Article 33 communication, Article 7(2) notification triggers, and Annex XVII restrictions can all change the release position.",
    rationale:
      "For articles, REACH commonly turns into three practical workstreams: Article 33 communication above 0.1% w/w, Article 7(2) notification to ECHA when threshold conditions are met, and Annex XVII restriction checks for banned or limited substances and uses.",
    scope:
      "Assess each article in the product, including articles inside complex objects, plus accessories, spares, and packaging. Lock the Candidate List version used, screen Annex XVII restrictions, define Article 33 and Article 7(2) ownership, maintain a 45-day consumer-response path, and track SCIP separately where applicable under the Waste Framework Directive.",
  },
  ROHS: {
    summary:
      "For EEE, RoHS is usually a core parallel review. The practical question is whether the final BOM is supported at homogeneous-material level and whether any exemption is being relied on.",
    rationale:
      "Directive 2011/65/EU restricts ten substances in homogeneous materials, subject to scope exclusions and time-limited Annex III or IV exemptions.",
    scope:
      "Confirm the EEE category and scope position, collect homogeneous-material declarations or test data, verify Annex II limits, check any Annex III or IV exemption wording and expiry, and align the technical file and declaration of conformity.",
  },
  WEEE: {
    summary:
      "Review this whenever the product is electrical or electronic equipment and no WEEE exclusion applies. The practical issues are producer registration, marking, and national take-back and reporting duties.",
    rationale:
      "Directive 2012/19/EU makes producers responsible for WEEE management and requires separate-collection marking and traceability for EEE placed on the market.",
    scope:
      "Confirm WEEE scope and category, producer of record or authorised representative in each Member State, bin-marking placement, and who owns registration and reporting.",
  },
  FCM: {
    summary:
      "Review this if any wetted or food-touching part contacts food under normal or foreseeable use. The core question is whether the material can transfer constituents at unacceptable levels or adversely affect the food.",
    rationale:
      "Regulation (EC) No 1935/2004 requires food-contact materials to be sufficiently inert, traceable, and supported by the relevant compliance evidence where specific Union measures apply.",
    scope:
      "Map every food-contact part, intended food types, contact time and temperature, repeated-use conditions, and supplier traceability for seals, coatings, plastics, inks, and metals.",
  },
  FCM_PLASTIC: {
    summary:
      "Plastic food-contact parts usually need a plastics-specific review: authorised substances, migration testing, and a declaration of compliance matched to real use.",
    rationale:
      "Regulation (EU) No 10/2011 sets substance and migration rules for plastic materials and articles intended to come into contact with food.",
    scope:
      "Confirm resin and additive composition, food simulants, worst-case time and temperature, overall and specific migration coverage, and the supplier declaration for the exact grade used.",
  },
  CRA: {
    summary:
      "The Cyber Resilience Act is already in force. For planning, reporting obligations start on 11 September 2026 and most other product obligations apply from 11 December 2027.",
    rationale:
      "Regulation (EU) 2024/2847 applies to products with digital elements and introduces cybersecurity-by-design, vulnerability handling, technical documentation, and lifecycle support duties.",
    scope:
      "Confirm whether the product and any remote data processing solution are part of one offer, who owns coordinated vulnerability disclosure, how long security updates are supported, and whether a maintainable software inventory exists.",
  },
  ECO: {
    summary:
      "This is a framework check, not a standalone product rule. In practice the real review is the active implementing measure set, often starting with Regulation (EU) 2023/826 on standby/networked-standby and then any external-power-supply, display, or product-specific rule that matches the SKU.",
    rationale:
      "Directive 2009/125/EC sets the framework for ecodesign requirements for energy-related products, while binding obligations are set in implementing measures. For many electronics, Regulation (EU) 2023/826 on off mode, standby, and networked standby is a first check, and included external power supplies or displays can bring additional measures.",
    scope:
      "Map the final SKU to every relevant ecodesign measure, then lock testable mode definitions, default settings, included accessories such as external power supplies, product-information obligations, and the technical file for the exact model sold.",
  },
};

export function resolveLegislationLibraryKey(item) {
  const directiveKey = String(item?.directive_key || item?.key || "").toUpperCase();
  const code = String(item?.code || "").toUpperCase();
  const title = String(item?.title || "").toUpperCase();

  if (directiveKey === "WEEE" || code.includes("2012/19/EU") || title.includes("WEEE")) return "WEEE";
  if (directiveKey === "FCM_PLASTIC" || code.includes("10/2011") || title.includes("PLASTIC FOOD CONTACT")) {
    return "FCM_PLASTIC";
  }
  if (
    directiveKey === "FCM" ||
    code.includes("1935/2004") ||
    title.includes("FOOD CONTACT MATERIAL") ||
    title.includes("FOOD CONTACT")
  ) {
    return "FCM";
  }
  if (directiveKey === "REACH" || code.includes("1907/2006") || title.includes("REACH")) return "REACH";
  if (directiveKey === "ROHS" || code.includes("2011/65/EU") || title.includes("ROHS")) return "ROHS";
  if (directiveKey === "CRA" || code.includes("2024/2847") || title.includes("CYBER RESILIENCE")) return "CRA";
  if (directiveKey === "ECO" || code.includes("2009/125/EC") || title.includes("ECODESIGN")) return "ECO";

  return directiveKey || code;
}

export function decorateLegislationGroups(groups) {
  return (groups || []).map((group) => {
    const groupKey = group.groupKey || group.key || "other";
    return {
      ...group,
      groupKey,
      items: (group.items || []).map((item) => {
        const libraryKey = resolveLegislationLibraryKey(item);
        const fallbackCopy = LEGISLATION_CONTENT_LIBRARY[libraryKey] || null;
        const summary = item.summary || fallbackCopy?.summary || "";
        const rationale = item.rationale || fallbackCopy?.rationale || "";
        const scope = item.scope || fallbackCopy?.scope || "";

        return {
          ...item,
          summary,
          rationale,
          scope,
          shortRationale: summary || rationale || scope || "",
          applicabilityBucket:
            groupKey === "ce"
              ? "Core applicable"
              : groupKey === "non_ce"
                ? "Conditional"
                : "Supplementary",
        };
      }),
    };
  });
}
