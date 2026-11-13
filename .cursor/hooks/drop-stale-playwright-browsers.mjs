#!/usr/bin/env node
// Shell commands that start Playwright must go through scripts/with-playwright-browsers.sh.
// That script drops a sandbox browser path that has no Chromium install.

import { readFileSync } from "node:fs";

const allow = { permission: "allow" };

const input = JSON.parse(readFileSync(0, "utf8"));
const toolInput = input.tool_input ?? input.arguments ?? {};
const command = typeof toolInput.command === "string" ? toolInput.command : "";

if (
	!command.includes("playwright") ||
	command.includes("with-playwright-browsers.sh")
) {
	process.stdout.write(`${JSON.stringify(allow)}\n`);
	process.exit(0);
}

const wrapped = `bash scripts/with-playwright-browsers.sh bash -c ${JSON.stringify(command)}`;
process.stdout.write(
	`${JSON.stringify({
		permission: "allow",
		updated_input: { ...toolInput, command: wrapped },
	})}\n`,
);
