/**
 * Summary selectors.
 * Covers: maturity inference, classification confidence, result-level signals.
 */

export function inferMaturity(result, assumptions, missingInputs) {
  if (!result) return { label: "Initial scope", tone: "muted" };
  if (missingInputs.some((item) => item.severity === "blocker")) {
    return { label: "Initial scope", tone: "muted" };
  }
  if (assumptions.length > 1 || missingInputs.some((item) => item.severity === "route-affecting")) {
    return { label: "Conditional scope", tone: "warning" };
  }
  return { label: "Evidence-ready scope", tone: "positive" };
}

export function inferConfidence(result, missingInputs) {
  const confidence = String(result?.confidence_panel?.confidence || result?.product_match_confidence || "").toLowerCase();
  if (confidence === "high" && !missingInputs.some((item) => item.severity === "blocker")) {
    return { label: "High confidence", tone: "positive" };
  }
  if (confidence === "low" || missingInputs.some((item) => item.severity === "blocker")) {
    return { label: "Preliminary only", tone: "muted" };
  }
  return { label: "Needs confirmation", tone: "warning" };
}
