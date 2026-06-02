/**
 * Remove Next.js RSC index.txt files from static export.
 * Netlify can serve index.txt instead of index.html → users see raw flight data.
 */
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "apps", "web", "out");

function walk(dir, removed) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, removed);
    else if (ent.name === "index.txt") {
      fs.unlinkSync(full);
      removed.push(full);
    }
  }
}

const removed = [];
walk(outDir, removed);
console.log(
  removed.length
    ? `Removed ${removed.length} RSC index.txt file(s) from static export.`
    : "No index.txt files found in export (already clean)."
);
