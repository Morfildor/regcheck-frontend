#!/usr/bin/env node
/**
 * Export a clean source snapshot for handoff.
 *
 * Copies only files needed to build/run the frontend into ./export-source/.
 * Does NOT copy node_modules, build output, venv, env secrets, or git history.
 *
 * Usage:
 *   node scripts/export-source.mjs
 *   npm run export:source
 *
 * After export, verify it builds cleanly:
 *   cd export-source && npm install && npm run build
 */

import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { join, resolve, sep } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const OUT  = join(ROOT, "export-source");

// Directories that are never part of the source handoff.
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "build",
  "venv",
  "export-source",
]);

// Root-level files that must not be in the handoff (machine-local or secret).
const SKIP_ROOT_FILES = new Set([
  ".env.local",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
]);

function shouldInclude(src) {
  // src is always an absolute native path.
  const rel   = src.slice(ROOT.length);
  if (!rel)   return true; // root itself

  const parts = rel.split(sep).filter(Boolean);

  // Drop anything whose path passes through a skipped directory.
  if (parts.some((p) => SKIP_DIRS.has(p))) return false;

  // Drop env/secret files at the root level.
  if (parts.length === 1 && SKIP_ROOT_FILES.has(parts[0])) return false;

  return true;
}

// ── Run ───────────────────────────────────────────────────────────────────────

if (existsSync(OUT)) {
  console.log("Removing previous export...");
  rmSync(OUT, { recursive: true, force: true });
}

mkdirSync(OUT, { recursive: true });

cpSync(ROOT, OUT, { recursive: true, filter: shouldInclude });

console.log(`\nSource export written to:\n  ${OUT}`);
console.log("\nTo verify a clean install:");
console.log("  cd export-source");
console.log("  npm install");
console.log("  npm run build");
