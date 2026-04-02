// Generic text and array utilities.

export function joinText(base, addition) {
  const current = String(base || "").trim();
  const next    = String(addition || "").trim();

  if (!next) return current;
  if (!current) return next;

  // Whole-word match: avoids "no Wi-Fi" blocking the "Wi-Fi" chip.
  const escaped = next.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(?<![a-z\\d])${escaped}(?![a-z\\d])`, "i").test(current)) return current;

  const separator = /[\s,;:]$/.test(current) ? " " : current.endsWith(".") ? " " : ", ";
  return `${current}${separator}${next}`;
}

export function uniqueBy(items, getKey) {
  const map = new Map();
  (items || []).forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

/** URL-safe slug from any string — used for anchor IDs in results nav. */
export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Returns short "understood" fact labels extracted from the product description.
 * Used in the Trust layer and Action Required panel.
 */
export function getUnderstoodFacts(description) {
  const d = String(description || "").toLowerCase();
  const facts = [];

  if (/mains|230v|240v|corded/.test(d))              facts.push("Mains power");
  else if (/rechargeable|lithium|li.?ion/.test(d))   facts.push("Battery powered");
  else if (/usb.?powered|usb.?c\s*power/.test(d))   facts.push("USB powered");
  else if (/ac.?adapt|external.*power/.test(d))      facts.push("External adapter");

  if (/no.?wireless|no.?radio|no wireless/.test(d))  facts.push("No radio");
  else {
    if (/wi.?fi/.test(d))          facts.push("Wi-Fi");
    if (/bluetooth|ble\b/.test(d)) facts.push("Bluetooth");
    if (/nfc\b/.test(d))           facts.push("NFC");
  }

  if (/local.?only|no.?cloud/.test(d))               facts.push("Local only");
  else if (/cloud.?account|cloud.?required/.test(d)) facts.push("Cloud required");
  else if (/ota|firmware.?update/.test(d))            facts.push("OTA updates");

  if (/\bconsumer|household/.test(d))                facts.push("Consumer");
  else if (/professional|industrial|commercial/.test(d)) facts.push("Professional");

  if (/indoor\b/.test(d))                            facts.push("Indoor");
  else if (/outdoor|weather|ip\d/.test(d))           facts.push("Outdoor");

  if (/wearable|on.?body|worn\b/.test(d))            facts.push("Wearable");
  if (/food.?contact|food.?touch/.test(d))           facts.push("Food contact");

  return [...new Set(facts)].slice(0, 6);
}
