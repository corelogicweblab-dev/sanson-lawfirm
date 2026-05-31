#!/usr/bin/env node
/**
 * Run Phase 1 database seed data.
 * Usage: npm run db:seed
 */
const fs = require("fs");
const path = require("path");

const seedFile = path.join(__dirname, "migrations", "002_phase1_seed.sql");
const sql = fs.readFileSync(seedFile, "utf8");

console.log("SANSON Legal OS — Database Seed Runner");
console.log("=".repeat(50));
console.log(`Seed file: 002_phase1_seed.sql (${sql.length} bytes)`);
console.log("\nTo apply seed data:");
console.log("  1. Ensure 001_phase1_schema.sql has been applied first");
console.log("  2. Run 002_phase1_seed.sql in Supabase SQL Editor");
console.log("  3. Or: psql $DATABASE_URL -f scripts/migrations/002_phase1_seed.sql");
