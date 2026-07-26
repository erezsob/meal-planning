import { describe, expect, it } from "vitest";
import {
	formatMarkdownLink,
	isHttpUrl,
	parseLinkifiedSegments,
	replaceLinkRaw,
	wrapSelectionAsMarkdownLink,
} from "./linkify";

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
			{
				type: "link",
				value: "https://example.com/recipe",
				href: "https://example.com/recipe",
				raw: "https://example.com/recipe",
				start: 4,
			},
			{ type: "text", value: " for details" },
		]);
	});

	it("handles multiple URLs", () => {
		expect(parseLinkifiedSegments("https://a.com and https://b.com")).toEqual([
			{
				type: "link",
				value: "https://a.com",
				href: "https://a.com",
				raw: "https://a.com",
				start: 0,
			},
			{ type: "text", value: " and " },
			{
				type: "link",
				value: "https://b.com",
				href: "https://b.com",
				raw: "https://b.com",
				start: 18,
			},
		]);
	});

	it("parses markdown-style labeled links", () => {
		expect(
			parseLinkifiedSegments("Try [Pasta](https://example.com/recipe) tonight"),
		).toEqual([
			{ type: "text", value: "Try " },
			{
				type: "link",
				value: "Pasta",
				href: "https://example.com/recipe",
				raw: "[Pasta](https://example.com/recipe)",
				start: 4,
			},
			{ type: "text", value: " tonight" },
		]);
	});

	it("does not double-link the URL inside a markdown link", () => {
		expect(
			parseLinkifiedSegments("[Pasta](https://example.com/recipe)"),
		).toEqual([
			{
				type: "link",
				value: "Pasta",
				href: "https://example.com/recipe",
				raw: "[Pasta](https://example.com/recipe)",
				start: 0,
			},
		]);
	});

	it("mixes markdown links and bare URLs", () => {
		expect(
			parseLinkifiedSegments("[Pasta](https://a.com) then https://b.com"),
		).toEqual([
			{
				type: "link",
				value: "Pasta",
				href: "https://a.com",
				raw: "[Pasta](https://a.com)",
				start: 0,
			},
			{ type: "text", value: " then " },
			{
				type: "link",
				value: "https://b.com",
				href: "https://b.com",
				raw: "https://b.com",
				start: 28,
			},
		]);
	});
});

describe("isHttpUrl", () => {
	it("accepts http and https URLs", () => {
		expect(isHttpUrl("https://example.com/recipe")).toBe(true);
		expect(isHttpUrl("http://example.com")).toBe(true);
	});

	it("rejects non-URL text", () => {
		expect(isHttpUrl("Pasta")).toBe(false);
		expect(isHttpUrl("ftp://example.com")).toBe(false);
	});
});

describe("wrapSelectionAsMarkdownLink", () => {
	it("wraps selected text with a pasted URL", () => {
		expect(
			wrapSelectionAsMarkdownLink({
				text: "Try Pasta tonight",
				selectionStart: 4,
				selectionEnd: 9,
				url: "https://example.com/recipe",
			}),
		).toEqual({
			text: "Try [Pasta](https://example.com/recipe) tonight",
			cursor: "Try [Pasta](https://example.com/recipe)".length,
		});
	});

	it("returns null when nothing is selected", () => {
		expect(
			wrapSelectionAsMarkdownLink({
				text: "Pasta",
				selectionStart: 2,
				selectionEnd: 2,
				url: "https://example.com",
			}),
		).toBeNull();
	});

	it("returns null when the pasted text is not a URL", () => {
		expect(
			wrapSelectionAsMarkdownLink({
				text: "Pasta",
				selectionStart: 0,
				selectionEnd: 5,
				url: "not a url",
			}),
		).toBeNull();
	});
});

describe("replaceLinkRaw", () => {
	it("updates a markdown link URL at the given start index", () => {
		expect(
			replaceLinkRaw({
				text: "Try [Pasta](https://old.com) tonight",
				start: 4,
				raw: "[Pasta](https://old.com)",
				nextRaw: "[Pasta](https://new.com)",
			}),
		).toBe("Try [Pasta](https://new.com) tonight");
	});

	it("replaces only the targeted duplicate link", () => {
		const text = "[Pasta](https://a.com) and [Pasta](https://a.com)";
		expect(
			replaceLinkRaw({
				text,
				start: 27,
				raw: "[Pasta](https://a.com)",
				nextRaw: "[Pasta](https://b.com)",
			}),
		).toBe("[Pasta](https://a.com) and [Pasta](https://b.com)");
	});

	it("unlinks by replacing raw with the label", () => {
		expect(
			replaceLinkRaw({
				text: "Try [Pasta](https://example.com) tonight",
				start: 4,
				raw: "[Pasta](https://example.com)",
				nextRaw: "Pasta",
			}),
		).toBe("Try Pasta tonight");
	});
});

describe("formatMarkdownLink", () => {
	it("formats a labeled markdown link", () => {
		expect(formatMarkdownLink({ label: "Pasta", href: "https://a.com" })).toBe(
			"[Pasta](https://a.com)",
		);
	});
});
