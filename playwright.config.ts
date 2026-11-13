import { defineConfig, devices } from "@playwright/test";

/** Matches `pnpm dev` (`vite dev --port 3213`). */
const DEV_SERVER_ORIGIN = "http://localhost:3213";

/**
 * Smoke reuses `pnpm dev` on port 3213 and does not seed.
 */
export default defineConfig({
	testDir: "e2e",
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	reporter: "list",
	use: {
		baseURL: DEV_SERVER_ORIGIN,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"], baseURL: DEV_SERVER_ORIGIN },
		},
	],
	webServer: {
		command: "pnpm dev",
		url: DEV_SERVER_ORIGIN,
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
