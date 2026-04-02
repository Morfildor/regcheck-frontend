/**
 * Facts selectors.
 * Covers: missing-input normalization, assumption inference, risk-driver inference.
 */
import { titleCaseMinor } from "../helpers";

export const MISSING_INPUT_HINTS = [
  { key: "wireless_connectivity", match: /(wifi|wi.?fi|bluetooth|ble\b|nfc\b|radio|wireless|no.?radio|no.?wireless)/i, title: "Wireless connectivity", severity: "blocker", reason: "Can introduce RED and cybersecurity obligations." },
  { key: "battery_type", match: /(battery|rechargeable|lithium|li.?ion|alkaline|nimh|cell)/i, title: "Battery type", severity: "route-affecting", reason: "Changes battery, charger, and transport obligations." },
  { key: "charger_included", match: /(charger|adapter|power supply)/i, title: "Charger included", severity: "route-affecting", reason: "External PSU and included accessories affect evidence scope." },
  { key: "display_laser_uv", match: /(display|laser|uv|light source)/i, title: "Display / laser / UV source", severity: "route-affecting", reason: "Can change safety and adjacent-framework review." },
  { key: "environment", match: /(outdoor|indoor|installation|ip\d|weather|portable|fixed|on.?body|wearable)/i, title: "Intended environment", severity: "helpful", reason: "Installation context can alter safety assumptions and evidence." },
  { key: "consumer_professional", match: /(consumer|professional|industrial|commercial|household|child|patient)/i, title: "Consumer vs professional use", severity: "blocker", reason: "Product identity and route assumptions depend on intended use." },
];

const GUIDANCE_SUPPRESSORS = {
  radio_stack: /(wifi|wi.?fi|bluetooth|ble\b|nfc\b|zigbee|z.?wave|cellular|lte\b|5g\b|no.?radio|no.?wireless)/i,
  connected_architecture: /(cloud.?account|cloud.?required|cloud.?optional|local.?only|local.?control|local.?lan|ota|firmware.?update|app.?control|app.?sync)/i,
  battery: /(lithium|li.?ion|rechargeable.?battery|replaceable.?battery|primary.?cell)/i,
  data_functions: /(camera|microphone|voice.?input|personal.?data|user.?account)/i,
  food_contact: /(food.?contact|wetted.?path|brew.?path|food.?touch)/i,
};

export const TOPIC_CLUSTERS = {
  medical:     /heart.?rate|physiolog|patient.?data|medical.?claim|clinical|vital.?sign|therapeutic|diagnostic/i,
  body:        /body.?contact|wearable|on.?body|skin.?contact|worn.?on/i,
  camera:      /\bcamera\b|face.?recogni|facial.?detect|video.?capture|optical.?imaging/i,
  microphone:  /\bmicrophone\b|voice.?input|audio.?capture|speech.?rec/i,
  child:       /child.?appeal|intended.?for.?child|toy.?safety|young.?user/i,
  food:        /food.?contact|wetted.?path|food.?touch|ingest|brew.?path/i,
  wireless:    /wifi|wi.?fi|bluetooth|ble\b|nfc\b|radio|wireless|intentional.?radiat/i,
  power:       /power.?source|mains|battery|rechargeable|ac\b|voltage|usb.?power|adapter/i,
  cloud_arch:  /cloud|ota|firmware.?update|app.?control|connected.?arch/i,
  user_group:  /consumer|professional|user.?group|intended.?user|industrial/i,
  environment: /environment|indoor|outdoor|installation.?context|ip.?rating/i,
};

export function inferAssumptions(result, routeSections, descriptionText) {
  const lowered = String(descriptionText || "").toLowerCase();
  const assumptions = [];

  const hasRadio = routeSections.some((section) => section.key === "RED" || section.key === "RED_CYBER");
  const hasBattery = /battery|rechargeable|lithium|cell/.test(lowered);
  const hasProfessionalUse = /professional|industrial|commercial/.test(lowered);
  const hasConsumerUse = /consumer|household|home/.test(lowered);
  const hasMains = /mains|230v|240v|plug|corded|ac power/.test(lowered);

  if (hasMains) assumptions.push("mains-powered equipment");
  else if (!hasBattery) assumptions.push("no battery unless specified");

  if (!hasRadio) assumptions.push("no radio unless specified");
  if (!hasProfessionalUse && !hasConsumerUse) assumptions.push("consumer use assumed");

  if ((result?.product_type || "").includes("coffee") || routeSections.some((section) => section.key === "LVD")) {
    assumptions.push("mains-powered household appliance");
  }

  return [...new Set(assumptions)];
}

export function inferRiskDrivers(result, routeSections, descriptionText) {
  const drivers = [];
  const lowered = String(descriptionText || "").toLowerCase();
  const traits = new Set(result?.all_traits || []);
  const hasRadioRoute = routeSections.some((s) => s.key === "RED" || s.key === "RED_CYBER");

  if (hasRadioRoute || traits.has("radio") || /wifi|wi.?fi|bluetooth|nfc\b|wireless/.test(lowered)) {
    drivers.push("radio transmission (RED)");
  }
  if (traits.has("cloud") || traits.has("ota") || /cloud.?account|ota|firmware.?update|app.?control/.test(lowered)) {
    drivers.push("cloud / OTA connectivity");
  }
  if (traits.has("battery_powered") || /lithium|li.?ion|rechargeable.?battery/.test(lowered)) {
    drivers.push("lithium battery");
  }
  if (/wearable|on.?body|body.?contact|worn\b|personal care|toothbrush|earphone|headphone/.test(lowered)) {
    drivers.push("body-contact use");
  }
  if (traits.has("camera") || traits.has("microphone") || /camera|microphone|personal.?data|voice.?assistant/.test(lowered)) {
    drivers.push("personal data processing");
  }
  if (/medical|patient|health.?monitor|clinical|therapeutic|diagnostic/.test(lowered)) {
    drivers.push("medical-boundary uncertainty");
  }

  return drivers;
}

export function normalizeMissingInputs(guidanceItems, descriptionText, result, routeSections) {
  const lowered = String(descriptionText || "").toLowerCase();

  const allContext = [
    lowered,
    (result?.product_type || "").toLowerCase(),
    (result?.summary || "").toLowerCase(),
    ...(result?.all_traits || []).map((t) => String(t).toLowerCase()),
  ].join(" ");

  const routeKeys = new Set((routeSections || []).map((s) => s.key));

  const isAppliance = /coffee|kettle|air.?fry|oven|vacuum|robot.?vac|air.?purif|fan\b|heater|dishwasher|washing|dryer|blender|mixer|toaster|fridge|freezer|appliance/.test(allContext);
  const isIndustrial = /\bindustrial\b|din.?rail|control.?cabinet|plc\b|hmi\b/.test(allContext);
  const isWearable = /wearable|on.?body|smartwatch|fitness.?band|earphone|headphone|personal.?care|toothbrush|earwear/.test(allContext);
  const isMedical = /\bmedical\b|\bpatient\b|clinical|therapeutic|diagnostic|mdr\b/.test(allContext);
  const isCameraProduct = /\bcamera\b|cctv|doorbell.?cam|webcam|dashcam|security.?cam|surveillance/.test(allContext);
  const hasChildContext = /\bchild\b|children|toy\b|infant|kid\b/.test(allContext);
  const hasMicContext = /microphone|mic\b|voice.?assistant|\bspeaker\b/.test(allContext);
  const hasFoodContext = /food|drink|water|coffee|kettle|blender|kitchen|cook|bake|grinder/.test(allContext);
  const isMains = /mains|230v|240v|corded.?power|ac.?power|wired.?power/.test(allContext);
  const hasBattery = /battery|rechargeable|lithium|li.?ion/.test(allContext);

  function isTopicIrrelevantForProduct(itemText) {
    const t = String(itemText).toLowerCase();
    if (TOPIC_CLUSTERS.medical.test(t) && !isMedical && !isWearable) return true;
    if (TOPIC_CLUSTERS.body.test(t) && !isWearable) return true;
    if (TOPIC_CLUSTERS.camera.test(t) && !isCameraProduct && !/camera|imaging|optical/.test(lowered)) return true;
    if (TOPIC_CLUSTERS.microphone.test(t) && !hasMicContext) return true;
    if (TOPIC_CLUSTERS.child.test(t) && !hasChildContext) return true;
    if (TOPIC_CLUSTERS.food.test(t) && !hasFoodContext) return true;
    if (/battery.?type|battery.?setup|charger|charging|battery.?chemistry/.test(t) && isMains && !hasBattery) return true;
    return false;
  }

  function isAlreadyStated(item) {
    const suppressor = GUIDANCE_SUPPRESSORS[item.key];
    if (suppressor && lowered && suppressor.test(lowered)) return true;
    const itemText = `${item.title || ""} ${item.reason || ""} ${item.description || ""} ${item.message || ""}`.toLowerCase();
    if (TOPIC_CLUSTERS.wireless.test(itemText) && /wifi|wi.?fi|bluetooth|ble\b|nfc\b|no.?wireless|no.?radio|no wireless/.test(allContext)) return true;
    if (TOPIC_CLUSTERS.power.test(itemText) && /mains|230v|240v|rechargeable|lithium|battery|ac.?power/.test(allContext)) return true;
    if (TOPIC_CLUSTERS.user_group.test(itemText) && /consumer|professional|industrial|household/.test(allContext)) return true;
    if (TOPIC_CLUSTERS.cloud_arch.test(itemText) && /cloud|ota|local.?only|no.?cloud|app.?control/.test(allContext)) return true;
    return false;
  }

  function filterRelevantExamples(examples) {
    return (examples || []).filter((ex) => {
      const e = String(ex).toLowerCase();
      if (/heart.?rate|physiolog|vital.?sign|health.?data|activity.?data/.test(e) && !isMedical && !isWearable) return false;
      if (/cloud.?video|video.?history|camera.?footage/.test(e) && !isCameraProduct) return false;
      if (/body.?contact|skin.?contact|worn.?on|wearable/.test(e) && !isWearable) return false;
      return true;
    });
  }

  const items = (guidanceItems || [])
    .filter((item) => !isAlreadyStated(item))
    .filter((item) => {
      const combinedText = `${item.title || ""} ${item.reason || ""} ${item.description || ""} ${item.message || ""} ${item.key || ""}`;
      return !isTopicIrrelevantForProduct(combinedText);
    })
    .map((item) => {
      const key = item.key || item.title || "missing-input";
      const severity = item.importance === "high" ? "blocker" : item.importance === "medium" ? "route-affecting" : "helpful";
      return {
        key,
        title: item.title || titleCaseMinor(item.message || key),
        severity,
        reason: item.description || item.message || "More detail would tighten this route.",
        examples: filterRelevantExamples(item.choices || item.examples || []),
      };
    });

  const seenClusters = new Set();
  const seenKeys = new Set();
  const deduped = items.filter((item) => {
    if (seenKeys.has(item.key)) return false;
    seenKeys.add(item.key);
    const itemText = `${item.title} ${item.reason}`.toLowerCase();
    for (const [cluster, re] of Object.entries(TOPIC_CLUSTERS)) {
      if (re.test(itemText)) {
        if (seenClusters.has(cluster)) return false;
        seenClusters.add(cluster);
        break;
      }
    }
    return true;
  });

  MISSING_INPUT_HINTS.forEach((hint) => {
    if (!lowered || hint.match.test(lowered)) return;
    if (deduped.some((item) => item.key === hint.key)) return;
    const hintText = `${hint.title} ${hint.reason}`;
    if (isTopicIrrelevantForProduct(hintText)) return;

    if (hint.key === "wireless_connectivity") {
      const connectivityContext = /cloud|app\b|connected|ota|remote.?control|sync/.test(lowered);
      const radioInRoute = routeKeys.has("RED") || routeKeys.has("RED_CYBER");
      const smartProductType = /smart|iot|connected/.test(allContext);
      if (!connectivityContext && !radioInRoute && !smartProductType && !isWearable && !isCameraProduct) return;
    }
    if (hint.key === "consumer_professional") {
      const consumerImplied = isAppliance || /household|domestic|home.?use/.test(allContext);
      const professionalImplied = isIndustrial;
      if (consumerImplied || professionalImplied) return;
    }
    if (hint.key === "battery_type" && isMains && !hasBattery) return;
    if (hint.key === "charger_included" && isMains && !hasBattery) return;

    let severity = hint.severity;
    if (hint.key === "wireless_connectivity" && isIndustrial) severity = "route-affecting";

    deduped.push({ key: hint.key, title: hint.title, severity, reason: hint.reason, examples: [] });
  });

  return deduped.sort((a, b) => {
    const rank = { blocker: 0, "route-affecting": 1, helpful: 2 };
    return rank[a.severity] - rank[b.severity];
  });
}
