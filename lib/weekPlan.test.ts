import { describe, expect, it } from "vitest";
import {
	addBacklogRow,
	removeBacklogRow,
	updateWeekPlanCell,
} from "./weekPlan";
import {
	createDefaultWeekPlan,
	DEFAULT_BACKLOG_ROW_COUNT,
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
});
