import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const e2eDbPath = "packages/web/.e2e/tadoru.db";
const apiBaseUrl = "http://127.0.0.1:4100";
const webBaseUrl = "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL: webBaseUrl,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `mkdir -p packages/web/.e2e && rm -f ${e2eDbPath} ${e2eDbPath}-shm ${e2eDbPath}-wal && bun run packages/web/e2e/init-db.ts && bun run packages/api/src/index.ts`,
      cwd: repoRoot,
      env: {
        ...process.env,
        PORT: "4100",
        DATABASE_URL: e2eDbPath,
        API_URL: apiBaseUrl,
        FRONTEND_URL: webBaseUrl,
        BETTER_AUTH_SECRET: "playwright-e2e-secret-for-local-browser-tests",
        USE_MOCK_AI: "true",
      },
      url: `${apiBaseUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: "bun run dev -- --host 127.0.0.1 --port 4173",
      cwd: __dirname,
      env: {
        ...process.env,
        VITE_API_URL: apiBaseUrl,
      },
      url: webBaseUrl,
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
