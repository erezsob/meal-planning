import fs from "node:fs";
import path from "node:path";
import { repoRoot, uiChangeHash } from "./ui-diff-hash.mjs";

const hash = uiChangeHash();
if (hash === null) {
	process.exit(0);
}

const stampPath = path.join(repoRoot(), "test-results/ui-stamp.json");
if (!fs.existsSync(stampPath)) {
	process.exit(1);
}

try {
	const stamp = JSON.parse(fs.readFileSync(stampPath, "utf8"));
	process.exit(stamp.uiHash === hash ? 0 : 1);
} catch {
	process.exit(1);
}
