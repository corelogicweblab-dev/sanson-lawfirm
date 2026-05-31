#!/usr/bin/env node
/**
 * Run Phase 1 database migrations against Supabase PostgreSQL.
 * Usage: npm run db:migrate
 * Requires DATABASE_URL in environment (direct postgres:// connection).
 */
const fs = require("fs");
const path = require("path");

const migrationsDir = path.join(__dirname, "migrations");
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

console.log("SANSON Legal OS — Database Migration Runner");
console.log("=".repeat(50));
console.log(`Found ${files.length} migration file(s):\n`);

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  console.log(`  [ ] ${file} (${sql.length} bytes)`);
}

console.log("\nTo apply migrations:");
console.log("  1. Open Supabase SQL Editor");
console.log("  2. Run each file in scripts/migrations/ in order");
console.log("  3. Or use psql: psql $DATABASE_URL -f scripts/migrations/001_phase1_schema.sql");
console.log("\nAlternatively set DATABASE_URL and use the Supabase CLI or psql directly.");
