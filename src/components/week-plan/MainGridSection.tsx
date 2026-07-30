import { useMemo } from "react";
import type { WeekPlanCellLocation } from "@/lib/weekPlan";
import type { MainGridView } from "./mainGridViews";
import { WeekPlanCardList } from "./WeekPlanCardList";
import { buildWeekPlanRows, WeekPlanTable } from "./WeekPlanTable";

interface MainGridSectionProps {
	grid: MainGridView;
	onCellChange: (args: {
		gridId: NonNullable<MainGridView["id"]>;
		location: WeekPlanCellLocation;
		field: "dish" | "grocery";
		value: string;
	}) => void;
	onRemoveBacklog: (args: {
		gridId: NonNullable<MainGridView["id"]>;
		index: number;
	}) => void;
	onAddBacklog: (args: { gridId: NonNullable<MainGridView["id"]> }) => void;
}

/**
 * One stacked main-grid week plan with heading and table/card views.
 */
export function MainGridSection({
	grid,
	onCellChange,
	onRemoveBacklog,
	onAddBacklog,
}: MainGridSectionProps) {
	const rows = useMemo(
		() => buildWeekPlanRows({ ...grid.content, customPlan: [] }),
		[grid.content],
	);

	const gridId = grid.id;
	if (!gridId) {
		return null;
	}

	return (
		<section className="space-y-4" aria-labelledby={`main-grid-${gridId}`}>
			<div>
				<h2
					id={`main-grid-${gridId}`}
					className="text-xl font-bold text-foreground"
				>
					{grid.label}
				</h2>
				<p className="text-sm text-muted-foreground">{grid.createdAtLabel}</p>
			</div>

			<div className="hidden md:block">
				<WeekPlanTable
					rows={rows}
					onCellChange={(args) => onCellChange({ gridId, ...args })}
					onRemoveBacklog={(index) => onRemoveBacklog({ gridId, index })}
					onAddBacklog={() => onAddBacklog({ gridId })}
				/>
			</div>

			<div className="md:hidden">
				<WeekPlanCardList
					rows={rows}
					onCellChange={(args) => onCellChange({ gridId, ...args })}
					onRemoveBacklog={(index) => onRemoveBacklog({ gridId, index })}
					onAddBacklog={() => onAddBacklog({ gridId })}
				/>
			</div>
		</section>
	);
}
