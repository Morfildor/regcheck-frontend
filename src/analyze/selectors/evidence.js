/**
 * Evidence selectors.
 * Covers: route-evidence library and evidence-needs builder.
 */
import { resolveLegislationLibraryKey } from "./legislation";

export const ROUTE_EVIDENCE_LIBRARY = {
  LVD: {
    label: "LVD",
    typicalEvidence: [
      "Ratings table and nameplate artwork",
      "Wiring, insulation & earthing drawings",
      "Critical component schedule (fuses, PSUs, cords)",
      "Safety test reports (electric strength, temp rise)",
      "User instructions for installation & environment",
    ],
    commonMissing: [
      "Voltage or power rating not locked",
      "Protective class or IP rating inconsistent",
      "Nameplate artwork not finalized",
      "Component ratings not linked to BOM",
    ],
    blockers: [
      "Power architecture still changing",
      "No insulation or earthing drawings",
      "Instructions don't cover real use conditions",
    ],
    nextActions: [
      "Lock power architecture and voltage / current ratings",
      "Confirm protective class (I / II / III) and IP rating",
      "Prepare or obtain insulation and earthing drawings",
      "Schedule LVD safety test session",
    ],
  },
  EMC: {
    label: "EMC",
    typicalEvidence: [
      "Test setup: all ports, cables & modes listed",
      "Emissions & immunity reports per hardware/firmware",
      "Worst-case mode rationale documented",
      "Cable & shielding installation instructions",
      "EMC design record (filters, shielding, routing)",
    ],
    commonMissing: [
      "Shipped accessories excluded from test setup",
      "Worst-case operating mode undocumented",
      "Residential vs. industrial not declared",
      "Firmware version not tied to production",
    ],
    blockers: [
      "No stable port or accessory configuration",
      "No repeatable test mode matrix",
      "Compliance relies on undocumented user constraints",
    ],
    nextActions: [
      "Define and document worst-case operating mode matrix",
      "Confirm all shipped accessories and cable lengths",
      "Declare residential or industrial environment class",
      "Freeze firmware version before EMC testing",
    ],
  },
  RED: {
    label: "RED",
    typicalEvidence: [
      "Radio architecture: module, bands, power, firmware",
      "Antenna evidence: type, gain, placement, variants",
      "RF, EMC & safety reports for final build",
      "Instructions: bands, max power, geographic restrictions",
      "Technical file linking label, DoC & tested build",
    ],
    commonMissing: [
      "Module or chipset not identified",
      "Frequency/power table absent from instructions",
      "Radio-controlling software not frozen",
      "Antenna variant or simulcast not documented",
    ],
    blockers: [
      "Wireless features still undefined",
      "No final module or antenna path selected",
      "User-changeable radio options undocumented",
    ],
    nextActions: [
      "Confirm final radio module, chipset, and firmware version",
      "Document all antenna variants and placement",
      "Build frequency / power table for user instructions",
      "Align DoC, label, and tested build configuration",
    ],
  },
  RED_CYBER: {
    label: "RED Cyber",
    typicalEvidence: [
      "Secure-update design: signing, rollback, delivery",
      "Auth & credential policy (defaults, recovery, access)",
      "Interface/data-flow map: apps, cloud, APIs, sensors",
      "Cybersecurity verification record for exposed services",
      "Category review: payments, childcare, wearable radio",
    ],
    commonMissing: [
      "No inventory of internet-facing services",
      "Default-admin behavior undocumented",
      "OTA mechanism not tied to signing-key process",
      "Personal-data or monetary scope not mapped",
    ],
    blockers: [
      "Network-connected product with no security design",
      "Passwordless or weak-default-credential path open",
      "App or cloud architecture still moving",
    ],
    nextActions: [
      "Inventory all internet-facing services and APIs",
      "Document default credential policy and recovery flows",
      "Tie OTA delivery to a signed firmware process",
      "Map personal-data and monetary processing scope",
    ],
  },
  BATTERY: {
    label: "Battery",
    typicalEvidence: [
      "Battery model, chemistry & capacity per SKU",
      "Charging & protection (cut-offs, temps, limits)",
      "Removability assessment (end-user vs. service only)",
      "Battery marking plan: capacity, symbol, QR code",
      "User info: charging, storage, transport & EoL",
    ],
    commonMissing: [
      "Cell chemistry and Wh rating still unknown",
      "Embedded vs. replaceable not decided",
      "Battery markings absent from label artwork",
      "Charging profile not linked to final pack spec",
    ],
    blockers: [
      "Battery type unknown at scoping stage",
      "Design conflicts with claimed replaceability route",
      "No supplier-backed battery specification exists",
    ],
    nextActions: [
      "Lock battery chemistry, model, and Wh capacity",
      "Decide embedded vs. replaceable and document rationale",
      "Add capacity, symbol, and QR code to label artwork",
      "Obtain charging profile from battery supplier",
    ],
  },
  REACH: {
    label: "REACH",
    typicalEvidence: [
      "Article-level material declarations from all suppliers",
      "Candidate List screening record with date & version",
      "Article 33 communication text for SVHC >0.1% w/w",
      "Annex XVII restriction screening for actual materials",
      "Article 7(2) notification assessment where relevant",
      "SCIP submission status where applicable",
    ],
    commonMissing: [
      "Declarations pre-date recent Candidate List updates",
      "Parts described as RoHS-only, no REACH detail",
      "No per-article view for assemblies or accessories",
      "Annex XVII screening not documented",
      "Article 33 communication text not prepared",
    ],
    blockers: [
      "No BOM substance data for core materials",
      "Supplier can't confirm Candidate List status",
      "Likely SVHC with no Art. 33/7(2) decision recorded",
    ],
    nextActions: [
      "Request article-level declarations from all suppliers",
      "Run Candidate List screening on current BOM",
      "Prepare Article 33 consumer communication text",
      "Assess Article 7(2) notification threshold and owner",
    ],
  },
  ROHS: {
    label: "RoHS",
    typicalEvidence: [
      "Homogeneous-material declarations for final BOM",
      "Scope & EEE category decision with exclusions",
      "Exemption review: applicability & expiry dates",
      "Technical file and DoC linked to sold model",
    ],
    commonMissing: [
      "Supplier files stop at assembly level",
      "Exemption assumed from legacy data, not verified",
      "Accessories, cables or spare parts excluded",
    ],
    blockers: [
      "No material declarations for high-risk parts",
      "Compliance depends on unvalidated exemption",
    ],
    nextActions: [
      "Collect homogeneous-material declarations for final BOM",
      "Confirm EEE category and any scope exclusions",
      "Verify Annex III/IV exemption wording and expiry",
      "Include accessories, cables, and spare parts in scope",
    ],
  },
  WEEE: {
    label: "WEEE",
    typicalEvidence: [
      "EEE scope & category decision per product family",
      "Producer-of-record mapping per Member State",
      "Crossed-out bin marking artwork & placement",
      "Country-by-country registration & reporting ownership",
    ],
    commonMissing: [
      "EEE category assumed but not locked",
      "No owner for national producer registration",
      "Marking placement on product/packaging undecided",
    ],
    blockers: [
      "Markets known but no producer strategy exists",
      "WEEE ownership not assigned to any team",
    ],
    nextActions: [
      "Confirm WEEE category for each product family",
      "Assign producer-of-record for each target market",
      "Finalise crossed-out bin marking placement",
      "Set up or join national take-back schemes",
    ],
  },
  FCM: {
    label: "FCM",
    typicalEvidence: [
      "Wetted-path BOM: all food-contact parts & inks",
      "Food types, contact times & temperatures defined",
      "Compliance evidence per applicable FCM measure",
    ],
    commonMissing: [
      "Food-contact path described at assembly level only",
      "No worst-case contact conditions chosen",
      "Supplier docs for seals, coatings or inks missing",
    ],
    blockers: [
      "Food-contact parts with no traceable supplier",
      "Intended food type or temperature not locked",
    ],
    nextActions: [
      "Map the complete wetted-path BOM at material level",
      "Define worst-case food type, temperature, and contact time",
      "Collect supplier compliance docs for seals, coatings, inks",
    ],
  },
  FCM_PLASTIC: {
    label: "FCM Plastic",
    typicalEvidence: [
      "Plastic resin & additive declarations per grade",
      "Migration tests matched to simulants & use case",
      "Plastic DoC: substances, restrictions, use conditions",
    ],
    commonMissing: [
      "Final polymer or additive formulation not frozen",
      "Migration conditions don't match actual contact",
      "Multilayer construction not documented clearly",
    ],
    blockers: [
      "No supplier declaration for plastic food-contact parts",
      "No migration evidence for worst-case use",
    ],
    nextActions: [
      "Freeze polymer and additive formulation with supplier",
      "Match migration test simulants to actual food types",
      "Obtain plastic DoC for each grade in the wetted path",
    ],
  },
  CRA: {
    label: "CRA",
    typicalEvidence: [
      "Product boundary, asset inventory & software ownership",
      "Cybersecurity technical file: design, dependencies, support",
      "Vulnerability handling & disclosure process with named owner",
    ],
    commonMissing: [
      "App/cloud responsibilities not mapped to product",
      "Support period and patch-delivery path not defined",
      "No maintainable software inventory for release",
    ],
    blockers: [
      "No owner for vulnerability handling or patches",
      "Software architecture still moving, boundary can't be frozen",
    ],
    nextActions: [
      "Define product boundary and software inventory",
      "Assign coordinated vulnerability disclosure owner",
      "Commit to a minimum security-update support period",
      "Map app and cloud responsibilities to product boundary",
    ],
  },
  ECO: {
    label: "Ecodesign",
    typicalEvidence: [
      "Applicability matrix for relevant implementing measures",
      "Mode definitions: off, standby, networked-standby, radios",
      "Energy test reports per hardware/firmware/accessories",
      "Product info, repair & spare-part review",
    ],
    commonMissing: [
      "No mapping to relevant horizontal or specific measure",
      "Power modes & default settings inconsistently defined",
      "EPS or display-specific obligations not checked",
      "Repair or spare-part obligations not assessed",
    ],
    blockers: [
      "Relevant implementing measures not checked at all",
      "Energy-mode behavior not final enough to review",
    ],
    nextActions: [
      "Map SKU to every applicable ecodesign implementing measure",
      "Define and lock off, standby, and networked-standby modes",
      "Run energy measurements per hardware/firmware/accessories",
      "Check EPS, display, and repair/spare-part obligations",
    ],
  },
};

export function buildEvidenceNeeds(routeSections, legislationGroups) {
  const evidenceMap = new Map();

  routeSections.forEach((section) => {
    const template = ROUTE_EVIDENCE_LIBRARY[section.key];
    if (template) evidenceMap.set(section.key, { key: section.key, ...template });
  });

  legislationGroups.forEach((group) => {
    (group.items || []).forEach((item) => {
      const key = resolveLegislationLibraryKey(item);
      const template = ROUTE_EVIDENCE_LIBRARY[key];
      if (template) evidenceMap.set(key, { key, ...template });
    });
  });

  return Array.from(evidenceMap.values());
}
