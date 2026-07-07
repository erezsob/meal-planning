import { describe, expect, it } from "vitest";
import { createDefaultWeekPlan } from "./weekPlanTypes";
import { isWeekPlan } from "./weekPlanValidator";

describe("weekPlanValidator", () => {
	it("isWeekPlan accepts a valid default plan", () => {
		expect(isWeekPlan(createDefaultWeekPlan())).toBe(true);
	});

	it("isWeekPlan rejects invalid structures", () => {
		expect(isWeekPlan(null)).toBe(false);
		expect(isWeekPlan({})).toBe(false);
		expect(isWeekPlan({ version: 1, plan: createDefaultWeekPlan() })).toBe(
			false,
		);
	});
});
