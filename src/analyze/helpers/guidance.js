// Guidance / clarification item building from API results.

import { gapLabel, titleCaseList } from "./format";

export function buildGuidanceItems(result) {
  const traits   = new Set(result?.all_traits || []);
  const rawItems = result?.input_gaps_panel?.items || result?.missing_information_items || [];
  const items    = [];
  const seen     = new Set();

  const add = (key, title, why, importance, choices = []) => {
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      key,
      title,
      why,
      importance,
      choices:     choices.filter(Boolean).slice(0, 3),
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
    traits.has("cloud")       ||
    traits.has("internet")    ||
    traits.has("app_control") ||
    traits.has("ota")         ||
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
