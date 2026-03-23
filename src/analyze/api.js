/** @typedef {import("./types").AnalysisMetadata} AnalysisMetadata */
/** @typedef {import("./types").AnalysisResult} AnalysisResult */

export const ANALYZE_URL =
  process.env.REACT_APP_REGCHECK_API_URL ||
  "https://regcheck-api.onrender.com/analyze";

export const METADATA_URL = ANALYZE_URL.replace(/\/analyze$/, "/metadata/options");

export const EMPTY_METADATA = {
  traits: [],
  products: [],
  legislations: [],
};

/**
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<AnalysisMetadata>}
 */
export async function fetchMetadataOptions({ signal } = {}) {
  const response = await fetch(METADATA_URL, { signal });
  if (!response.ok) {
    throw new Error(`Metadata failed (${response.status})`);
  }

  return response.json();
}

/**
 * @param {string} description
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<AnalysisResult>}
 */
export async function requestAnalysis(description, { signal } = {}) {
  const response = await fetch(ANALYZE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, depth: "deep" }),
    signal,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || `Analysis failed (${response.status})`);
  }

  return data;
}
