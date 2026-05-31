/**
 * On Render: install Python API deps only.
 * Locally: full monorepo turbo build.
 */
const { execSync } = require("child_process");

const isRender = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_NAME);

if (isRender) {
  console.log("[render-build] Installing FastAPI dependencies (apps/backend)...");
  execSync("bash apps/backend/build.sh", { stdio: "inherit" });
} else {
  console.log("[render-build] Running turbo build (local)...");
  execSync("npx turbo run build", { stdio: "inherit" });
}
