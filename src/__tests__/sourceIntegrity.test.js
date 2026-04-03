/**
 * Source integrity checks.
 *
 * These tests catch regressions where the monolithic helpers.js or selectors.js
 * files accidentally accumulate new function definitions instead of staying
 * as thin barrels, and where expected sub-modules or extracted components go
 * missing after a refactor.
 *
 * They do not test runtime behaviour — they test the source structure itself.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

const SRC      = join(__dirname, "..", "analyze");
const HELPERS  = join(SRC, "helpers");
const SELECTORS = join(SRC, "selectors");
const COMPONENTS = join(SRC, "components");

// ── helpers barrel ────────────────────────────────────────────────────────────

describe("helpers.js is a barrel not a monolith", () => {
  const content = readFileSync(join(SRC, "helpers.js"), "utf8");

  test("does not define exported functions directly", () => {
    expect(content).not.toMatch(/^export function /m);
  });

  test("does not define exported constants directly", () => {
    expect(content).not.toMatch(/^export const /m);
  });

  test("re-exports from helpers/ sub-directory", () => {
    expect(content).toMatch(/from.*helpers\//);
  });
});

// ── helpers sub-modules ───────────────────────────────────────────────────────

const HELPER_MODULES = [
  "format",
  "directives",
  "text",
  "standards",
  "routes",
  "legislation",
  "guidance",
  "templates",
  "clipboard",
  "index",
];

describe("helpers/ sub-modules all exist", () => {
  test.each(HELPER_MODULES)("%s.js", (module) => {
    expect(existsSync(join(HELPERS, `${module}.js`))).toBe(true);
  });
});

// ── selectors barrel ──────────────────────────────────────────────────────────

describe("selectors.js is a barrel not a monolith", () => {
  const content = readFileSync(join(SRC, "selectors.js"), "utf8");

  test("does not define exported functions directly", () => {
    expect(content).not.toMatch(/^export function /m);
  });

  test("re-exports from selectors/ sub-directory", () => {
    expect(content).toMatch(/from.*selectors\//);
  });
});

// ── selectors sub-modules ─────────────────────────────────────────────────────

const SELECTOR_MODULES = ["summary", "facts", "standards", "legislation", "evidence", "index"];

describe("selectors/ sub-modules all exist", () => {
  test.each(SELECTOR_MODULES)("%s.js", (module) => {
    expect(existsSync(join(SELECTORS, `${module}.js`))).toBe(true);
  });
});

// ── extracted components ──────────────────────────────────────────────────────

const EXPECTED_COMPONENTS = [
  // Pass 1 / 2 extractions
  "HeaderActions",
  "AnalyzeStatus",
  "ComposerSurface",
  "EmptyStateGuidance",
  "OverviewPanel",
  "TrustLayerPanel",
  "ClarificationsPanel",
  "StandardsRoute",
  "StandardItemCard",      // extracted from StandardsRoute (pass 4)
  "ParallelObligationsPanel",
  "EvidencePanel",
  "ResultsSidebarNav",
  "SupportingContext",
  // Pass 3 extractions
  "ErrorBanner",
  "ScrollTopButton",
  "ComparisonPanel",
  "ResultsAside",
];

describe("expected components all exist", () => {
  test.each(EXPECTED_COMPONENTS)("%s", (component) => {
    const asJsx = existsSync(join(COMPONENTS, `${component}.jsx`));
    const asJs  = existsSync(join(COMPONENTS, `${component}.js`));
    expect(asJsx || asJs).toBe(true);
  });
});

// ── focused test files ────────────────────────────────────────────────────────

const TESTS = join(__dirname);

const EXPECTED_TEST_FILES = [
  "sourceIntegrity.test.js",
  "ScrollingTemplateRows.test.jsx",
  "components.test.jsx",
  "analyzerBehavior.test.jsx",
];

describe("focused test files all exist", () => {
  test.each(EXPECTED_TEST_FILES)("%s", (file) => {
    expect(existsSync(join(TESTS, file))).toBe(true);
  });
});
