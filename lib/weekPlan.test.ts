import { describe, expect, it } from "vitest";
import {
	addBacklogRow,
	addCustomPlanRow,
	clearCustomPlan,
	normalizeWeekPlan,
	removeBacklogRow,
	removeCustomPlanRow,
	updateCustomPlanCell,
	updateWeekPlanCell,
} from "./weekPlan";
import {
	createDefaultWeekPlan,
	DEFAULT_BACKLOG_ROW_COUNT,
	DEFAULT_CUSTOM_PLAN_ROW_COUNT,
} from "./weekPlanTypes";

describe("weekPlan", () => {
	it("updateWeekPlanCell updates weekday immutably", () => {
		const plan = createDefaultWeekPlan();
		const next = updateWeekPlanCell({
			plan,
			location: { type: "weekday", key: "sunday" },
			field: "dish",
			value: "Ribs",
		});

		expect(next.weekdays.sunday.dish).toBe("Ribs");
		expect(plan.weekdays.sunday.dish).toBe("");
	});

	it("addBacklogRow and removeBacklogRow", () => {
		const plan = createDefaultWeekPlan();
		const withRow = addBacklogRow(plan);
		expect(withRow.backlog).toHaveLength(DEFAULT_BACKLOG_ROW_COUNT + 1);

		const withoutRow = removeBacklogRow(withRow, 0);
		expect(withoutRow.backlog).toHaveLength(DEFAULT_BACKLOG_ROW_COUNT);
	});

	it("normalizeWeekPlan fills missing customPlan", () => {
		const plan = createDefaultWeekPlan();
		const { customPlan: _, ...withoutCustomPlan } = plan;

		const normalized = normalizeWeekPlan(withoutCustomPlan as typeof plan);

		expect(normalized.customPlan).toHaveLength(DEFAULT_CUSTOM_PLAN_ROW_COUNT);
	});

	it("normalizeWeekPlan migrates legacy customCategories field", () => {
		const legacy = {
			...createDefaultWeekPlan(),
			customCategories: [
				{ category: "Baking", dish: "Sourdough", grocery: "Flour" },
			],
		};
		delete (legacy as { customPlan?: unknown }).customPlan;

		const normalized = normalizeWeekPlan(legacy);

		expect(normalized.customPlan).toEqual([
			{ category: "Baking", dish: "Sourdough", grocery: "Flour" },
		]);
		expect(
			(normalized as { customCategories?: unknown }).customCategories,
		).toBeUndefined();
	});

	it("updateCustomPlanCell updates immutably", () => {
		const plan = createDefaultWeekPlan();
		const next = updateCustomPlanCell({
			plan,
			index: 0,
			field: "category",
			value: "Baking projects",
		});

		expect(next.customPlan[0].category).toBe("Baking projects");
		expect(plan.customPlan[0].category).toBe("");
	});

	it("addCustomPlanRow, removeCustomPlanRow, and clearCustomPlan", () => {
		const plan = createDefaultWeekPlan();
		const withRow = addCustomPlanRow(plan);
		expect(withRow.customPlan).toHaveLength(DEFAULT_CUSTOM_PLAN_ROW_COUNT + 1);

		const withoutRow = removeCustomPlanRow(withRow, 0);
		expect(withoutRow.customPlan).toHaveLength(DEFAULT_CUSTOM_PLAN_ROW_COUNT);

		const cleared = clearCustomPlan(
			updateCustomPlanCell({
				plan: createDefaultWeekPlan(),
				index: 0,
				field: "dish",
				value: "Sourdough",
			}),
		);
		expect(cleared.customPlan).toEqual([
			{ category: "", dish: "", grocery: "" },
		]);
	});
});
