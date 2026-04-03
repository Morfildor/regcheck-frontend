#!/usr/bin/env node
/**
 * Export a clean source snapshot for handoff.
 *
 * Copies only files needed to build/run the frontend into ./export-source/.
 * Does NOT copy node_modules, build output, venv, env secrets, git history,
 * editor state, or local archives.
 *
 * Usage:
 *   node scripts/export-source.mjs
 *   npm run export:source
 *
 * After export, verify it builds cleanly:
 *   cd export-source && npm install && npm run build
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import { join, resolve, sep } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const OUT  = join(ROOT, "export-source");

// Directories never included in the source handoff.
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "build",
  "venv",
  "export-source",
  // AI / IDE local state
  ".claude",
  ".cursor",
  ".idea",
  ".vscode",
  // Common local tooling
  ".parcel-cache",
  ".next",
  "dist",
  "coverage",
]);

// Root-level files that must not be in the handoff (secrets / machine-local).
const SKIP_ROOT_FILES = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
  ".env.test",
  ".env.test.local",
  ".env.production",
  ".env.production.local",
]);

// Root-level filename patterns to exclude (archives, IDE workspaces, logs).
const SKIP_ROOT_PATTERNS = [
  /\.tar\.gz$/i,
  /\.zip$/i,
  /\.tgz$/i,
  /\.log$/i,
  /\.code-workspace$/i,
  /^npm-debug\.log/i,
];

function shouldInclude(src) {
  // src is always an absolute native path.
  const rel   = src.slice(ROOT.length);
  if (!rel)   return true; // root itself

  const parts = rel.split(sep).filter(Boolean);

  // Drop anything whose path passes through a skipped directory.
  if (parts.some((p) => SKIP_DIRS.has(p))) return false;

  // Root-level files: exact-match exclusions and pattern exclusions.
  if (parts.length === 1) {
    if (SKIP_ROOT_FILES.has(parts[0])) return false;
    if (SKIP_ROOT_PATTERNS.some((re) => re.test(parts[0]))) return false;
  }

  return true;
}

// ── Run ───────────────────────────────────────────────────────────────────────

if (existsSync(OUT)) {
  console.log("Removing previous export...");
  rmSync(OUT, { recursive: true, force: true });
}

mkdirSync(OUT, { recursive: true });

cpSync(ROOT, OUT, { recursive: true, filter: shouldInclude });

// ── Verification summary ──────────────────────────────────────────────────────

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full);
    else count += 1;
  }
  return count;
}

function dirSizeMb(dir) {
  function sumBytes(d) {
    let total = 0;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) total += sumBytes(full);
      else total += statSync(full).size;
    }
    return total;
  }
  return (sumBytes(dir) / (1024 * 1024)).toFixed(1);
}

const fileCount = countFiles(OUT);
const sizeMb    = dirSizeMb(OUT);

console.log(`\nSource export written to:\n  ${OUT}`);
console.log(`\nExport contents: ${fileCount} files · ${sizeMb} MB`);

// Sanity check: reject exports that look too large (node_modules leak)
// or too small (something went wrong).
if (fileCount < 20) {
  console.error("\n⚠  Export has very few files — something may be wrong.");
  process.exit(1);
}
if (Number(sizeMb) > 50) {
  console.error(`\n⚠  Export is ${sizeMb} MB — check that node_modules is excluded.`);
  process.exit(1);
}

console.log("\nTo verify a clean install:");
console.log("  cd export-source");
console.log("  npm install");
console.log("  npm run build");
