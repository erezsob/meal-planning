import { describe, expect, it } from "vitest";
import { MAIN_PLAN_LABELS } from "@/lib/constants";
import { createDefaultMainGridContent } from "@/lib/weekPlanTypes";
import { mockPlanSectionId } from "@/test/mocks/convex";
import { buildMainGridViews } from "./mainGridViews";

const mainId = mockPlanSectionId("plan-main-1");
const previousMainId = mockPlanSectionId("plan-main-2");

describe("buildMainGridViews", () => {
	it("labels first grid This week and second Previous week", () => {
		const views = buildMainGridViews({
			mainGrids: [
				{
					id: mainId,
					content: createDefaultMainGridContent(),
					createdAt: 1_735_689_600_000,
				},
				{
					id: previousMainId,
					content: createDefaultMainGridContent(),
					createdAt: 1_700_000_000_000,
				},
			],
			pendingById: {},
		});

		expect(views[0].label).toBe(MAIN_PLAN_LABELS.THIS_WEEK);
		expect(views[1].label).toBe(MAIN_PLAN_LABELS.PREVIOUS_WEEK);
	});

	it("overlays pending edits by grid id", () => {
		const pendingMain = {
			...createDefaultMainGridContent(),
			weekdays: {
				...createDefaultMainGridContent().weekdays,
				saturday: { dish: "Pending ribs", grocery: "" },
			},
		};

		const views = buildMainGridViews({
			mainGrids: [
				{
					id: mainId,
					content: createDefaultMainGridContent(),
					createdAt: 1_735_689_600_000,
				},
			],
			pendingById: { [mainId]: pendingMain },
		});

		expect(views[0].content.weekdays.saturday.dish).toBe("Pending ribs");
	});

	it("formats creation date for section headings", () => {
		const views = buildMainGridViews({
			mainGrids: [
				{
					id: mainId,
					content: createDefaultMainGridContent(),
					createdAt: 1_700_000_000_000,
				},
			],
			pendingById: {},
		});

		expect(views[0].createdAtLabel).toBe("Nov 14, 2023");
	});
});
