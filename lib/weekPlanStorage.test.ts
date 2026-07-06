import { describe, expect, it, beforeEach } from "vitest";
import {
	DEFAULT_BACKLOG_ROW_COUNT,
	WEEK_PLAN_STORAGE_KEY,
	createDefaultWeekPlan,
} from "./weekPlanTypes";
import {
	loadWeekPlan,
	parseWeekPlanImport,
	saveWeekPlan,
	serializeWeekPlanExport,
	updateWeekPlanCell,
	addBacklogRow,
	removeBacklogRow,
} from "./weekPlanStorage";

describe("weekPlanStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("loadWeekPlan returns default when storage is empty", () => {
		const plan = loadWeekPlan();
		expect(plan.backlog).toHaveLength(DEFAULT_BACKLOG_ROW_COUNT);
		expect(plan.weekdays.monday).toEqual({ dish: "", grocery: "" });
	});

	it("saveWeekPlan and loadWeekPlan roundtrip", () => {
		const plan = createDefaultWeekPlan();
		plan.weekdays.wednesday = { dish: "Meatball subs", grocery: "buns" };
		saveWeekPlan(plan);

		expect(localStorage.getItem(WEEK_PLAN_STORAGE_KEY)).toBeTruthy();
		expect(loadWeekPlan().weekdays.wednesday).toEqual({
			dish: "Meatball subs",
			grocery: "buns",
		});
	});

	it("serializeWeekPlanExport and parseWeekPlanImport roundtrip", () => {
		const plan = createDefaultWeekPlan();
		plan.weekdays.friday = { dish: "Pizza", grocery: "dough" };

		const json = serializeWeekPlanExport(plan);
		const result = parseWeekPlanImport(json);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.weekdays.friday).toEqual({
				dish: "Pizza",
				grocery: "dough",
			});
		}
	});

	it("parseWeekPlanImport rejects invalid JSON", () => {
		const result = parseWeekPlanImport("not json");
		expect(result.ok).toBe(false);
	});

	it("parseWeekPlanImport rejects wrong version", () => {
		const result = parseWeekPlanImport(
			JSON.stringify({ version: 99, plan: createDefaultWeekPlan() }),
		);
		expect(result.ok).toBe(false);
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
});
