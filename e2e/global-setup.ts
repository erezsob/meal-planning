import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

/** Push functions, then wipe the dev deployment the suite is about to use. */
export default function globalSetup() {
	execSync("pnpm exec convex dev --once --typecheck disable", {
		stdio: "inherit",
		cwd: repoRoot,
	});
	execSync("pnpm seed:clear-all", {
		stdio: "inherit",
		cwd: repoRoot,
	});
}
