import { describe, expect, it } from "vitest";
import { parseLinkifiedSegments } from "./linkify";

describe("parseLinkifiedSegments", () => {
	it("returns empty array for empty string", () => {
		expect(parseLinkifiedSegments("")).toEqual([]);
	});

	it("returns text segment for plain text", () => {
		expect(parseLinkifiedSegments("Meatball subs")).toEqual([
			{ type: "text", value: "Meatball subs" },
		]);
	});

	it("splits text around a URL", () => {
		expect(
			parseLinkifiedSegments("See https://example.com/recipe for details"),
		).toEqual([
			{ type: "text", value: "See " },
			{ type: "link", value: "https://example.com/recipe" },
			{ type: "text", value: " for details" },
		]);
	});

	it("handles multiple URLs", () => {
		expect(parseLinkifiedSegments("https://a.com and https://b.com")).toEqual([
			{ type: "link", value: "https://a.com" },
			{ type: "text", value: " and " },
			{ type: "link", value: "https://b.com" },
		]);
	});
});
