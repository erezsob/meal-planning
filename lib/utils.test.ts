import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
	it("merges class names", () => {
		const result = cn("foo", "bar");
		expect(result).toBe("foo bar");
	});

	it("handles conditional classes", () => {
		const isActive = true;
		const result = cn("base", isActive && "active");
		expect(result).toBe("base active");
	});

	it("filters falsy values", () => {
		const result = cn("base", false, null, undefined, "end");
		expect(result).toBe("base end");
	});

	it("resolves Tailwind conflicts (last wins)", () => {
		// twMerge should resolve conflicting utilities
		const result = cn("px-4", "px-6");
		expect(result).toBe("px-6");
	});

	it("preserves non-conflicting Tailwind classes", () => {
		const result = cn("px-4 py-2", "text-red-500");
		expect(result).toBe("px-4 py-2 text-red-500");
	});

	it("handles array inputs via clsx", () => {
		const result = cn(["foo", "bar"], "baz");
		expect(result).toBe("foo bar baz");
	});

	it("handles object inputs via clsx", () => {
		const result = cn({ active: true, disabled: false }, "base");
		expect(result).toBe("active base");
	});
});
