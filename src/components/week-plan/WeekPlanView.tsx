import { useMemo } from "react";
import { useWeekPlan } from "./useWeekPlan";
import { WeekPlanCardList } from "./WeekPlanCardList";
import { buildWeekPlanRows, WeekPlanTable } from "./WeekPlanTable";
import { WeekPlanToolbar } from "./WeekPlanToolbar";

/**
 * Week plan grid — simple free-text scratch pad for meal planning
 */
export function WeekPlanView() {
	const {
		plan,
		updateCell,
		clearPlan,
		replacePlan,
		addBacklog,
		removeBacklog,
	} = useWeekPlan();

	const rows = useMemo(() => buildWeekPlanRows(plan), [plan]);

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-bold text-foreground">Week plan</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Plan what to cook and what to buy — free text, no rules.
				</p>
			</header>

			<WeekPlanToolbar plan={plan} onClear={clearPlan} onImport={replacePlan} />

			<div className="hidden md:block">
				<WeekPlanTable
					rows={rows}
					onCellChange={updateCell}
					onRemoveBacklog={removeBacklog}
					onAddBacklog={addBacklog}
				/>
			</div>

			<div className="md:hidden">
				<WeekPlanCardList
					rows={rows}
					onCellChange={updateCell}
					onRemoveBacklog={removeBacklog}
					onAddBacklog={addBacklog}
				/>
			</div>
		</div>
	);
}
