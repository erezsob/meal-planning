import { describe, expect, it } from "vitest";
import { formatPlanCreatedAt } from "./planSectionDisplay";

describe("formatPlanCreatedAt", () => {
	it("formats a timestamp as short month, day, and year", () => {
		expect(formatPlanCreatedAt(1_700_000_000_000)).toBe("Nov 14, 2023");
	});
});
