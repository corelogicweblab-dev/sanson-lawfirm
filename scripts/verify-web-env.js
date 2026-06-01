/**
 * Fail hosting builds early if Firebase client env is missing.
 * NEXT_PUBLIC_* must be present at build time (baked into static export).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const localEnv = path.join(root, "apps", "web", ".env.local");

function loadLocalEnv() {
  if (!fs.existsSync(localEnv)) return;
  const text = fs.readFileSync(localEnv, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadLocalEnv();

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const missing = required.filter((key) => !String(process.env[key] || "").trim());

if (missing.length) {
  console.error("\n[build] Missing required environment variables for sign-in:\n");
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error(
    "\nNetlify: Site settings → Environment variables → Production → add Firebase NEXT_PUBLIC_* values, then redeploy."
  );
  console.error("Local: copy apps/web/.env.production.example to apps/web/.env.local\n");
  process.exit(1);
}

const apiKey = String(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();
const placeholders = new Set([
  "",
  "your-api-key",
  "AIza...",
  "changeme",
  "xxx",
]);
if (
  placeholders.has(apiKey) ||
  !apiKey.startsWith("AIza") ||
  apiKey.length < 30
) {
  console.error("\n[build] NEXT_PUBLIC_FIREBASE_API_KEY is missing or invalid.\n");
  console.error(
    "Copy the real Web API key from Firebase Console → Project settings → Your apps → Web app."
  );
  console.error(
    "It must start with AIza and be ~39 characters. Then redeploy on Netlify.\n"
  );
  process.exit(1);
}

console.log("[build] Firebase client environment OK");
