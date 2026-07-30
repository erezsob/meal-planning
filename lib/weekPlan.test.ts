import { describe, expect, it } from "vitest";
import {
	addBacklogRow,
	addCustomPlanRow,
	clearCustomPlan,
	clearCustomPlansContent,
	isCustomPlansContent,
	isMainGridContent,
	joinWeekPlan,
	normalizeCustomPlansContent,
	normalizeMainGridContent,
	normalizeWeekPlan,
	removeBacklogRow,
	removeCustomPlanRow,
	splitWeekPlan,
	updateCustomPlanCell,
	updateWeekPlanCell,
} from "./weekPlan";
import {
	createDefaultCustomPlansContent,
	createDefaultWeekPlan,
	DEFAULT_BACKLOG_ROW_COUNT,
	DEFAULT_CUSTOM_PLAN_ROW_COUNT,
} from "./weekPlanTypes";

describe("weekPlan", () => {
	it("splitWeekPlan and joinWeekPlan round-trip a full plan", () => {
		const plan = createDefaultWeekPlan();
		plan.weekdays.saturday.dish = "Ribs";
		plan.customPlan[0].dish = "Sourdough";

		const { main, customPlans } = splitWeekPlan(plan);
		const restored = joinWeekPlan(main, customPlans);

		expect(restored).toEqual(plan);
		expect(main).not.toHaveProperty("customPlan");
		expect(customPlans.rows).toEqual(plan.customPlan);
	});

	it("normalizeMainGridContent and normalizeCustomPlansContent fill defaults", () => {
		expect(normalizeMainGridContent(null).backlog).toHaveLength(
			DEFAULT_BACKLOG_ROW_COUNT,
		);
		expect(normalizeCustomPlansContent(null).rows).toHaveLength(
			DEFAULT_CUSTOM_PLAN_ROW_COUNT,
		);
		expect(normalizeCustomPlansContent({ rows: [] }).rows).toHaveLength(
			DEFAULT_CUSTOM_PLAN_ROW_COUNT,
		);
	});

	it("normalizeMainGridContent rejects unknown values", () => {
		expect(isMainGridContent(null)).toBe(false);
		expect(isMainGridContent({ invalid: true })).toBe(false);
		expect(normalizeMainGridContent({ invalid: true }).backlog).toHaveLength(
			DEFAULT_BACKLOG_ROW_COUNT,
		);
	});

	it("normalizeCustomPlansContent rejects unknown values", () => {
		expect(isCustomPlansContent(null)).toBe(false);
		expect(isCustomPlansContent({ invalid: true })).toBe(false);
		expect(normalizeCustomPlansContent({ invalid: true }).rows).toHaveLength(
			DEFAULT_CUSTOM_PLAN_ROW_COUNT,
		);
	});

	it("clearCustomPlansContent resets rows", () => {
		const content = createDefaultCustomPlansContent();
		content.rows[0].dish = "Sourdough";

		expect(clearCustomPlansContent(content)).toEqual(
			createDefaultCustomPlansContent(),
		);
	});

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

		const normalized = normalizeWeekPlan(withoutCustomPlan);

		expect(normalized.customPlan).toHaveLength(DEFAULT_CUSTOM_PLAN_ROW_COUNT);
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
