#!/usr/bin/env node
/**
 * SANSON Legal OS — Environment validation
 * Usage:
 *   node scripts/validate-env.js
 *   node scripts/validate-env.js --environment production --offline
 *   node scripts/validate-env.js --check-templates
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const REQUIRED_PROD = [
  "DATABASE_URL",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const RECOMMENDED_PROD = [
  "OPENAI_API_KEY",
  "QDRANT_URL",
  "R2_ACCESS_KEY_ID",
  "SUPABASE_URL",
  "FIELD_ENCRYPTION_KEY",
  "CORS_ORIGINS",
];

const TEMPLATES = [
  ".env.example",
  ".env.development.example",
  ".env.staging.example",
  ".env.production.example",
];

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    environment: args.includes("--environment")
      ? args[args.indexOf("--environment") + 1]
      : process.env.ENVIRONMENT || "development",
    offline: args.includes("--offline"),
    checkTemplates: args.includes("--check-templates"),
  };
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
}

function main() {
  const opts = parseArgs();
  let errors = [];
  let warnings = [];

  if (opts.checkTemplates) {
    console.log("Checking environment templates...\n");
    for (const f of TEMPLATES) {
      const p = path.join(root, f);
      if (!fs.existsSync(p)) {
        errors.push(`Missing template: ${f}`);
      } else {
        console.log(`  ✓ ${f}`);
      }
    }
    process.exit(errors.length ? 1 : 0);
  }

  const envPath = path.join(root, ".env");
  const env = opts.offline
    ? loadEnvFile(envPath)
    : { ...process.env, ...loadEnvFile(envPath) };

  console.log(`SANSON Legal OS — Env validation (${opts.environment})\n`);

  if (opts.environment === "production") {
    for (const key of REQUIRED_PROD) {
      if (!env[key] || env[key].includes("xxxxx") || env[key] === "") {
        errors.push(`Missing or placeholder: ${key}`);
      }
    }
    for (const key of RECOMMENDED_PROD) {
      if (!env[key]) warnings.push(`Recommended: ${key}`);
    }
    const db = env.DATABASE_URL || "";
    if (db.split("@").length > 2) {
      errors.push("DATABASE_URL: encode @ in password as %40");
    }
  }

  if (warnings.length) {
    console.log("Warnings:");
    warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }
  if (errors.length) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log(`  ✗ ${e}`));
    process.exit(1);
  }
  console.log("\n✓ Environment validation passed");
}

main();
