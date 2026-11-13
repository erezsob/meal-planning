import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const UI_PATHSPECS = [
	"src/routes",
	"src/components",
	"lib/components",
	"src/styles.css",
];

/**
 * @returns {string} Absolute git root.
 */
export function repoRoot() {
	return execSync("git rev-parse --show-toplevel", {
		encoding: "utf8",
	}).trim();
}

/**
 * @param {string} args
 * @param {string} root
 * @returns {string[]}
 */
function gitLines(args, root) {
	const output = execSync(`git ${args}`, {
		encoding: "utf8",
		cwd: root,
	});

	return output
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

/**
 * Hash of uncommitted UI files. `null` when those paths match HEAD.
 * @returns {string | null}
 */
export function uiChangeHash() {
	const root = repoRoot();
	const spec = UI_PATHSPECS.join(" ");
	const changed = gitLines(`diff --name-only HEAD -- ${spec}`, root);
	const deleted = new Set(
		gitLines(`diff --name-only --diff-filter=D HEAD -- ${spec}`, root),
	);
	const untracked = gitLines(
		`ls-files --others --exclude-standard -- ${spec}`,
		root,
	);
	const files = [...new Set([...changed, ...untracked])].sort();

	if (files.length === 0) {
		return null;
	}

	const parts = files.map((file) => {
		const absolute = path.join(root, file);
		if (deleted.has(file) || !fs.existsSync(absolute)) {
			return `${file}\0deleted`;
		}

		const digest = createHash("sha256")
			.update(fs.readFileSync(absolute))
			.digest("hex");
		return `${file}\0${digest}`;
	});

	return createHash("sha256").update(parts.join("\n")).digest("hex");
}
