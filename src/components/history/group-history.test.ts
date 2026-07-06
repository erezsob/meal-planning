import { describe, expect, it } from "vitest";
import { createMockMealWithDish } from "@/test/mocks/convex";
import {
	type EatenMeal,
	formatHistoryDayHeader,
	getMealDisplayName,
	groupMealsByDay,
} from "./group-history";

describe("groupMealsByDay", () => {
	it("groups meals by day with newest days first", () => {
		const meals = [
			createMockMealWithDish({ day: "2026-02-01", mealType: "dinner" }),
			createMockMealWithDish({
				_id: "meal-2" as never,
				day: "2026-02-03",
				mealType: "breakfast",
			}),
			createMockMealWithDish({
				_id: "meal-3" as never,
				day: "2026-02-03",
				mealType: "lunch",
			}),
		] as EatenMeal[];

		const groups = groupMealsByDay(meals);
		expect(groups).toHaveLength(2);
		expect(groups[0].day).toBe("2026-02-03");
		expect(groups[0].meals.map((m) => m.mealType)).toEqual([
			"breakfast",
			"lunch",
		]);
		expect(groups[1].day).toBe("2026-02-01");
	});
});

describe("formatHistoryDayHeader", () => {
	it("returns Today for today's date", () => {
		const today = new Date();
		const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
		expect(formatHistoryDayHeader(key)).toBe("Today");
	});

	it("returns Yesterday for yesterday", () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
		expect(formatHistoryDayHeader(key)).toBe("Yesterday");
	});
});

describe("getMealDisplayName", () => {
	it("prefers dish name over custom name", () => {
		const meal = createMockMealWithDish({
			customName: "Takeout",
			dish: { name: "Pasta" } as never,
		}) as EatenMeal;
		expect(getMealDisplayName(meal)).toBe("Pasta");
	});

	it("falls back to custom name", () => {
		const meal = createMockMealWithDish({
			dish: null,
			customName: "Takeout",
		}) as EatenMeal;
		expect(getMealDisplayName(meal)).toBe("Takeout");
	});
});
