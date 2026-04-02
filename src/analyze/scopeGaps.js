import { useDeferredValue, useMemo } from "react";

/**
 * Each entry describes one dimension of product scope that is commonly missing
 * from initial descriptions. `detect(lowercasedDescription)` returns true when
 * the gap is present; `chips` are the quick-add options shown to the user.
 */
export const SCOPE_GAPS = [
  {
    id: "power",
    question: "Power source?",
    detect: (d) => !/mains|230v|240v|ac\s*power|rechargeable|lithium|battery|usb.?c?\s*power|external.*adapter|powered via/.test(d),
    chips: [
      { label: "Mains (230V)", text: "mains powered (230 V AC)" },
      { label: "Rechargeable battery", text: "rechargeable lithium battery" },
      { label: "Replaceable battery", text: "replaceable battery cells" },
      { label: "AC adapter", text: "powered via external AC/DC adapter" },
    ],
  },
  {
    id: "connectivity",
    question: "Wireless?",
    detect: (d) => !/wifi|wi.?fi|bluetooth|ble\b|nfc\b|cellular|lte\b|5g\b|zigbee|z.?wave|no.?radio|no.?wireless|no wireless/.test(d),
    chips: [
      { label: "Wi-Fi", text: "Wi-Fi" },
      { label: "Bluetooth", text: "Bluetooth LE" },
      { label: "NFC", text: "NFC" },
      { label: "None", text: "no wireless connectivity" },
    ],
  },
  {
    id: "user",
    question: "Who uses it?",
    detect: (d) => !/consumer|household|professional|industrial|commercial|child|patient/.test(d),
    chips: [
      { label: "Consumers", text: "consumer use" },
      { label: "Professionals", text: "professional use" },
      { label: "Child-related", text: "intended for use by children" },
      { label: "Patient-related", text: "patient-related use" },
    ],
  },
  {
    id: "environment",
    question: "Where used?",
    detect: (d) => !/indoor|outdoor|installation|ip\d|weather|portable\b|fixed\b|on.?body|wearable/.test(d),
    chips: [
      { label: "Indoors", text: "indoor use only" },
      { label: "Outdoors", text: "outdoor rated" },
      { label: "Portable", text: "portable device" },
      { label: "On-body", text: "worn on body" },
    ],
  },
  {
    id: "cloud",
    question: "App / cloud?",
    detect: (d) =>
      /wifi|wi.?fi|bluetooth|wireless|connected/.test(d) &&
      !/cloud|account.?required|local.?only|local.?lan|no.?cloud|app.?only|app.?control|app.?sync/.test(d),
    chips: [
      { label: "Cloud required", text: "cloud account required" },
      { label: "App only", text: "app control, local only, no cloud dependency" },
      { label: "Cloud optional", text: "cloud optional, local control also available" },
      { label: "Local only", text: "local control only, no cloud" },
    ],
  },
  {
    id: "battery-type",
    question: "Battery type?",
    detect: (d) => /battery|rechargeable/.test(d) && !/lithium|li.?ion|alkaline|nimh/.test(d),
    chips: [
      { label: "Li-ion", text: "lithium-ion" },
      { label: "Non-rechargeable", text: "primary (non-rechargeable) cells" },
    ],
  },
];

export function buildScopeGapGroups(description) {
  const lowered = String(description || "").toLowerCase();
  return SCOPE_GAPS
    .filter((gap) => gap.detect(lowered))
    .map(({ id, question, chips }) => ({ id, question, chips }));
}

export function useScopeGapGroups(description) {
  const deferredDescription = useDeferredValue(description);
  return useMemo(() => buildScopeGapGroups(deferredDescription), [deferredDescription]);
}
