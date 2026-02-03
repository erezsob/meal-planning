import { describe, expect, it } from "vitest";
import {
	formatDateKey,
	getShoppingItemKey,
	getWeekDates,
	getWeekStart,
	isDishTag,
} from "./constants";

describe("Date functions", () => {
	describe("getWeekStart", () => {
		it("returns Monday for a Monday", () => {
			const monday = new Date("2026-02-02"); // Monday
			const result = getWeekStart(monday);
			expect(result.getDay()).toBe(1); // Monday
			expect(formatDateKey(result)).toBe("2026-02-02");
		});

		it("returns previous Monday for a Wednesday", () => {
			const wednesday = new Date("2026-02-04"); // Wednesday
			const result = getWeekStart(wednesday);
			expect(formatDateKey(result)).toBe("2026-02-02"); // Monday of that week
		});

		it("returns previous Monday for a Sunday", () => {
			const sunday = new Date("2026-02-08"); // Sunday
			const result = getWeekStart(sunday);
			expect(formatDateKey(result)).toBe("2026-02-02"); // Monday of that week
		});

		it("returns previous Monday for a Saturday", () => {
			const saturday = new Date("2026-02-07"); // Saturday
			const result = getWeekStart(saturday);
			expect(formatDateKey(result)).toBe("2026-02-02");
		});

		it("sets time to midnight", () => {
			const date = new Date("2026-02-04T15:30:00");
			const result = getWeekStart(date);
			expect(result.getHours()).toBe(0);
			expect(result.getMinutes()).toBe(0);
			expect(result.getSeconds()).toBe(0);
			expect(result.getMilliseconds()).toBe(0);
		});
	});

	describe("formatDateKey", () => {
		it("formats date as YYYY-MM-DD", () => {
			const date = new Date("2026-02-03");
			expect(formatDateKey(date)).toBe("2026-02-03");
		});

		it("pads single-digit month", () => {
			const date = new Date("2026-01-15");
			expect(formatDateKey(date)).toBe("2026-01-15");
		});

		it("pads single-digit day", () => {
			const date = new Date("2026-02-05");
			expect(formatDateKey(date)).toBe("2026-02-05");
		});

		it("handles December correctly", () => {
			const date = new Date("2026-12-25");
			expect(formatDateKey(date)).toBe("2026-12-25");
		});
	});

	describe("getWeekDates", () => {
		it("returns array of 7 dates", () => {
			const monday = new Date("2026-02-02");
			const dates = getWeekDates(monday);
			expect(dates).toHaveLength(7);
		});

		it("starts with provided Monday", () => {
			const monday = new Date("2026-02-02");
			const dates = getWeekDates(monday);
			expect(formatDateKey(dates[0])).toBe("2026-02-02");
		});

		it("ends with Sunday", () => {
			const monday = new Date("2026-02-02");
			const dates = getWeekDates(monday);
			expect(formatDateKey(dates[6])).toBe("2026-02-08");
		});

		it("returns consecutive days", () => {
			const monday = new Date("2026-02-02");
			const dates = getWeekDates(monday);
			const keys = dates.map(formatDateKey);
			expect(keys).toEqual([
				"2026-02-02",
				"2026-02-03",
				"2026-02-04",
				"2026-02-05",
				"2026-02-06",
				"2026-02-07",
				"2026-02-08",
			]);
		});
	});
});

describe("Type guards", () => {
	describe("isDishTag", () => {
		it("returns true for valid tags", () => {
			expect(isDishTag("high-protein")).toBe(true);
			expect(isDishTag("vegetarian")).toBe(true);
			expect(isDishTag("quick")).toBe(true);
			expect(isDishTag("meal-prep")).toBe(true);
		});

		it("returns false for invalid tags", () => {
			expect(isDishTag("invalid-tag")).toBe(false);
			expect(isDishTag("")).toBe(false);
			expect(isDishTag("HIGH-PROTEIN")).toBe(false); // case-sensitive
		});
	});
});

describe("Utility functions", () => {
	describe("getShoppingItemKey", () => {
		it("creates stable key from item properties", () => {
			const item = { name: "Tomatoes", unit: "kg", category: "Produce" };
			expect(getShoppingItemKey(item)).toBe("Tomatoes|kg|Produce");
		});

		it("handles empty unit", () => {
			const item = { name: "Eggs", unit: "", category: "Dairy" };
			expect(getShoppingItemKey(item)).toBe("Eggs||Dairy");
		});

		it("produces different keys for different items", () => {
			const item1 = { name: "Milk", unit: "L", category: "Dairy" };
			const item2 = { name: "Milk", unit: "cup", category: "Dairy" };
			expect(getShoppingItemKey(item1)).not.toBe(getShoppingItemKey(item2));
		});
	});
});
