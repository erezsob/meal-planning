import { describe, expect, it } from "vitest";
import { mockPlanSectionId } from "@/test/mocks/convex";
import { MAIN_STACK_RANK_PREVIOUS_WEEK } from "./constants";
import {
	planCustomPlansArchive,
	planMainStackCascade,
	planPreviousWeekArchive,
} from "./planSectionLifecycle";

describe("planSectionLifecycle", () => {
	it("planPreviousWeekArchive is empty when Previous week is absent", () => {
		expect(planPreviousWeekArchive()).toEqual([]);
	});

	it("planPreviousWeekArchive archives only the Previous week section", () => {
		const rank1Id = mockPlanSectionId("main-1");
		expect(planPreviousWeekArchive({ rank1Id })).toEqual([
			{ type: "archive", sectionId: rank1Id },
		]);
	});

	it("planMainStackCascade inserts only when home is empty", () => {
		expect(planMainStackCascade({})).toEqual([{ type: "insert-rank-0" }]);
	});

	it("planMainStackCascade demotes rank-0 when one grid exists", () => {
		const rank0Id = mockPlanSectionId("main-0");
		expect(planMainStackCascade({ rank0Id })).toEqual([
			{ type: "insert-rank-0" },
			{
				type: "demote-to-rank-1",
				sectionId: rank0Id,
				stackRank: MAIN_STACK_RANK_PREVIOUS_WEEK,
			},
		]);
	});

	it("planMainStackCascade archives rank-1 on third new weekly plan", () => {
		const rank0Id = mockPlanSectionId("main-0");
		const rank1Id = mockPlanSectionId("main-1");
		expect(planMainStackCascade({ rank0Id, rank1Id })).toEqual([
			{ type: "insert-rank-0" },
			{
				type: "demote-to-rank-1",
				sectionId: rank0Id,
				stackRank: MAIN_STACK_RANK_PREVIOUS_WEEK,
			},
			{ type: "archive", sectionId: rank1Id },
		]);
	});

	it("planCustomPlansArchive inserts when no active row exists", () => {
		expect(planCustomPlansArchive()).toEqual([{ type: "insert-active" }]);
	});

	it("planCustomPlansArchive archives active row before insert", () => {
		const activeId = mockPlanSectionId("custom-1");
		expect(planCustomPlansArchive(activeId)).toEqual([
			{ type: "archive", sectionId: activeId },
			{ type: "insert-active" },
		]);
	});
});
