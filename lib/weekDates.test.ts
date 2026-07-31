import { describe, expect, it } from "vitest";
import { buildWeekDates } from "./weekDates";

describe("buildWeekDates", () => {
	it("returns seven consecutive ISO dates starting at startDate", () => {
		expect(buildWeekDates("2026-01-01")).toEqual([
			"2026-01-01",
			"2026-01-02",
			"2026-01-03",
			"2026-01-04",
			"2026-01-05",
			"2026-01-06",
			"2026-01-07",
		]);
	});

	it("handles month boundaries", () => {
		expect(buildWeekDates("2026-01-30")).toEqual([
			"2026-01-30",
			"2026-01-31",
			"2026-02-01",
			"2026-02-02",
			"2026-02-03",
			"2026-02-04",
			"2026-02-05",
		]);
	});
});
