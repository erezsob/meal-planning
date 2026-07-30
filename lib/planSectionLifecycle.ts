import type { Id } from "../convex/_generated/dataModel";
import { MAIN_STACK_RANK_PREVIOUS_WEEK } from "./constants";

export type PlanSectionId = Id<"planSections">;

export type MainStackCascadeStep =
	| { type: "insert-rank-0" }
	| {
			type: "demote-to-rank-1";
			sectionId: PlanSectionId;
			stackRank: typeof MAIN_STACK_RANK_PREVIOUS_WEEK;
	  }
	| { type: "archive"; sectionId: PlanSectionId };

export type CustomPlansArchiveStep =
	| { type: "archive"; sectionId: PlanSectionId }
	| { type: "insert-active" };

/**
 * Plan ordered stack cascade steps for "New weekly plan".
 * Order: insert rank-0 → demote former rank-0 → archive former rank-1.
 */
export function planMainStackCascade({
	rank0Id,
	rank1Id,
}: {
	rank0Id?: PlanSectionId;
	rank1Id?: PlanSectionId;
}): MainStackCascadeStep[] {
	const steps: MainStackCascadeStep[] = [{ type: "insert-rank-0" }];

	if (rank0Id) {
		steps.push({
			type: "demote-to-rank-1",
			sectionId: rank0Id,
			stackRank: MAIN_STACK_RANK_PREVIOUS_WEEK,
		});
	}

	if (rank1Id) {
		steps.push({ type: "archive", sectionId: rank1Id });
	}

	return steps;
}

/**
 * Plan archive-and-insert steps for "New custom plan".
 *
 * @param activeId - Id of the active custom-plans section to archive, if any
 * @returns Ordered mutation steps
 */
export function planCustomPlansArchive(
	activeId?: PlanSectionId,
): CustomPlansArchiveStep[] {
	const steps: CustomPlansArchiveStep[] = [];

	if (activeId) {
		steps.push({ type: "archive", sectionId: activeId });
	}

	steps.push({ type: "insert-active" });
	return steps;
}
