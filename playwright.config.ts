import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 45_000,
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "node tests/start-server.mjs",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    env: {
      PORT: "3100",
      HOSTNAME: "127.0.0.1",
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: "f41d20b73ac5908e67db2af1096ce83b4f4a761e539d0291b604d8ac9127ee31",
      DATABASE_PATH: path.join(mkdtempSync(path.join(tmpdir(), "vector-e2e-")), "vector.db"),
    },
  },
});
