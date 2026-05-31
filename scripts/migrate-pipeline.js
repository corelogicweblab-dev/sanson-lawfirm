#!/usr/bin/env node
/**
 * Migration pipeline utilities
 *   node scripts/migrate-pipeline.js --check
 *   node scripts/migrate-pipeline.js --manifest
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const migrationsDir = path.join(__dirname, "migrations");
const manifestPath = path.join(__dirname, "migration-manifest.json");

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function check() {
  const manifest = loadManifest();
  const diskFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const manifestFiles = manifest.migrations.map((m) => m.file);
  let ok = true;

  console.log("Migration pipeline check\n");

  for (const m of manifest.migrations) {
    const exists = diskFiles.includes(m.file);
    console.log(`  ${exists ? "✓" : "✗"} ${m.version} ${m.file}`);
    if (!exists) ok = false;
  }

  for (const f of diskFiles) {
    if (!manifestFiles.includes(f)) {
      console.log(`  ⚠ On disk but not in manifest: ${f}`);
      ok = false;
    }
  }

  if (manifest.schema_version !== manifest.migrations[manifest.migrations.length - 1]?.version) {
    console.log("  ✗ schema_version mismatch in manifest");
    ok = false;
  }

  process.exit(ok ? 0 : 1);
}

function printManifest() {
  const manifest = loadManifest();
  console.log(`Schema version: ${manifest.schema_version}`);
  console.log(`Rollback policy: ${manifest.rollback_policy}\n`);
  for (const m of manifest.migrations) {
    console.log(`  ${m.version} [${m.type}] ${m.file} (phase ${m.phase})`);
  }
  console.log("\nApply via Supabase SQL Editor in order, then verify GET /api/v1/ops/migrations");
}

const arg = process.argv[2];
if (arg === "--manifest") printManifest();
else if (arg === "--check") check();
else {
  console.log("Usage: node scripts/migrate-pipeline.js --check | --manifest");
  process.exit(1);
}
