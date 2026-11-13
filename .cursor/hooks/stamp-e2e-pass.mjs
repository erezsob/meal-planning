import fs from "node:fs";
import path from "node:path";
import { repoRoot, uiChangeHash } from "./ui-diff-hash.mjs";

const root = repoRoot();
const dir = path.join(root, "test-results");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
	path.join(dir, "ui-stamp.json"),
	`${JSON.stringify({
		uiHash: uiChangeHash(),
		verifiedAt: new Date().toISOString(),
	})}\n`,
);
