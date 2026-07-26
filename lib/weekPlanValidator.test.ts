import { describe, expect, it } from "vitest";
import { createDefaultWeekPlan } from "./weekPlanTypes";
import { isWeekPlan } from "./weekPlanValidator";

describe("weekPlanValidator", () => {
	it("isWeekPlan accepts a valid default plan", () => {
		expect(isWeekPlan(createDefaultWeekPlan())).toBe(true);
	});

	it("isWeekPlan accepts legacy plans without customPlan", () => {
		const { customPlan: _, ...legacyPlan } = createDefaultWeekPlan();
		expect(isWeekPlan(legacyPlan)).toBe(true);
	});

	it("isWeekPlan accepts legacy plans with customCategories field", () => {
		const { customPlan: _, ...rest } = createDefaultWeekPlan();
		const legacyPlan = {
			...rest,
			customCategories: [{ category: "Baking", dish: "", grocery: "" }],
		};
		expect(isWeekPlan(legacyPlan)).toBe(true);
	});

	it("isWeekPlan rejects invalid structures", () => {
		expect(isWeekPlan(null)).toBe(false);
		expect(isWeekPlan({})).toBe(false);
		expect(isWeekPlan({ version: 1, plan: createDefaultWeekPlan() })).toBe(
			false,
		);
	});
});
