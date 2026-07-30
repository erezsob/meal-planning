import type { Id } from "convex/_generated/dataModel";
import { MAIN_PLAN_LABELS } from "@/lib/constants";
import { formatPlanCreatedAt } from "@/lib/planSectionDisplay";
import type { MainGridContent } from "@/lib/weekPlanTypes";

export type MainGridView = {
	id?: Id<"planSections">;
	label: string;
	createdAtLabel: string;
	content: MainGridContent;
};

/**
 * Build view models for stacked main grids from remote home data and pending edits.
 *
 * @param args.mainGrids - Remote main grid sections ordered by stack rank
 * @param args.pendingById - Local pending edits keyed by section id
 * @returns View models with labels, formatted dates, and merged content
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
