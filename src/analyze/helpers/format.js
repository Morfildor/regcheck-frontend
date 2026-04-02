// Text formatting and label utilities.

export function titleCase(input) {
  return String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function gapLabel(key) {
  const labels = {
    product_type:               "Product type",
    power_source:               "Power source",
    radio_scope_confirmation:   "Radio scope",
    radio_technology:           "Radio technology",
    wifi_band:                  "Wi-Fi band",
    food_contact_materials:     "Food-contact materials",
    connectivity_architecture:  "Connected design",
    redcyber_auth_scope:        "Login and auth",
    redcyber_transaction_scope: "Payments",
    contradictions:             "Contradictions",
  };
  return labels[key] || titleCase(key);
}

export function titleCaseList(values) {
  return (values || []).map((value) => titleCase(String(value)));
}

export function titleCaseMinor(input) {
  const small = new Set(["and", "or", "of", "the", "to", "for", "in", "on"]);

  return String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (["LVD", "EMC", "RED", "CRA", "GDPR", "ESPR", "ROHS", "REACH", "MD"].includes(upper)) {
        return upper;
      }
      if (upper === "AI") return "AI";
      const lower = word.toLowerCase();
      if (index > 0 && small.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function formatUiLabel(value) {
  return titleCaseMinor(String(value || ""));
}

export function prettyValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function formatStageLabel(stage) {
  const map = {
    family:    "Family match",
    subtype:   "Subtype match",
    ambiguous: "Ambiguous",
  };
  return map[String(stage || "").toLowerCase()] || formatUiLabel(stage || "unknown");
}
