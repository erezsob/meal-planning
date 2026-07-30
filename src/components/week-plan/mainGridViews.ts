import type { Id } from "convex/_generated/dataModel";
import { formatPlanCreatedAt, MAIN_PLAN_LABELS } from "@/lib/constants";
import type { MainGridContent } from "@/lib/weekPlanTypes";

export type MainGridView = {
	id?: Id<"planSections">;
	label: string;
	createdAtLabel: string;
	content: MainGridContent;
};

/**
 * Build view models for stacked main grids from remote home data and pending edits.
 */
export function buildMainGridViews({
	mainGrids,
	pendingById,
}: {
	mainGrids: Array<{
		id?: Id<"planSections">;
		content: MainGridContent;
		createdAt: number;
	}>;
	pendingById: Record<string, MainGridContent>;
}): MainGridView[] {
	return mainGrids.map((grid, index) => {
		const idKey = grid.id ?? `pending-${index}`;
		const label =
			index === 0 ? MAIN_PLAN_LABELS.THIS_WEEK : MAIN_PLAN_LABELS.PREVIOUS_WEEK;

		return {
			id: grid.id,
			label,
			createdAtLabel: formatPlanCreatedAt(grid.createdAt),
			content: pendingById[idKey] ?? grid.content,
		};
	});
}
