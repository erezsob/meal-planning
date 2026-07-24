import { describe, expect, it } from "vitest";
import {
	addBacklogRow,
	addCustomCategoryRow,
	clearCustomCategories,
	normalizeWeekPlan,
	removeBacklogRow,
	removeCustomCategoryRow,
	updateCustomCategoryCell,
	updateWeekPlanCell,
} from "./weekPlan";
import {
	createDefaultWeekPlan,
	DEFAULT_BACKLOG_ROW_COUNT,
	DEFAULT_CUSTOM_CATEGORY_ROW_COUNT,
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

	it("normalizeWeekPlan fills missing customCategories", () => {
		const plan = createDefaultWeekPlan();
		const { customCategories: _, ...withoutCategories } = plan;

		const normalized = normalizeWeekPlan(withoutCategories as typeof plan);

		expect(normalized.customCategories).toHaveLength(
			DEFAULT_CUSTOM_CATEGORY_ROW_COUNT,
		);
	});

	it("updateCustomCategoryCell updates immutably", () => {
		const plan = createDefaultWeekPlan();
		const next = updateCustomCategoryCell({
			plan,
			index: 0,
			field: "category",
			value: "Baking projects",
		});

		expect(next.customCategories[0].category).toBe("Baking projects");
		expect(plan.customCategories[0].category).toBe("");
	});

	it("addCustomCategoryRow, removeCustomCategoryRow, and clearCustomCategories", () => {
		const plan = createDefaultWeekPlan();
		const withRow = addCustomCategoryRow(plan);
		expect(withRow.customCategories).toHaveLength(
			DEFAULT_CUSTOM_CATEGORY_ROW_COUNT + 1,
		);

		const withoutRow = removeCustomCategoryRow(withRow, 0);
		expect(withoutRow.customCategories).toHaveLength(
			DEFAULT_CUSTOM_CATEGORY_ROW_COUNT,
		);

		const cleared = clearCustomCategories(
			updateCustomCategoryCell({
				plan: createDefaultWeekPlan(),
				index: 0,
				field: "dish",
				value: "Sourdough",
			}),
		);
		expect(cleared.customCategories).toEqual([
			{ category: "", dish: "", grocery: "" },
		]);
	});
});
