import { useMemo } from "react";
import { useWeekPlan } from "./useWeekPlan";
import { WeekPlanCardList } from "./WeekPlanCardList";
import { buildWeekPlanRows, WeekPlanTable } from "./WeekPlanTable";
import { WeekPlanToolbar } from "./WeekPlanToolbar";

/**
 * Week plan grid — simple free-text scratch pad for meal planning
 */
export function WeekPlanView() {
	const { plan, saveError, updateCell, clearPlan, addBacklog, removeBacklog } =
		useWeekPlan();

	const rows = useMemo(() => buildWeekPlanRows(plan), [plan]);

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-bold text-foreground">Week plan</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Plan what to cook and what to buy — free text, no rules.
				</p>
			</header>

			{saveError && (
				<p className="text-sm text-destructive" role="alert">
					{saveError}
				</p>
			)}

			<WeekPlanToolbar onClear={() => void clearPlan()} />

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

/** Loading placeholder for the week plan route */
export function WeekPlanViewSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<div className="h-8 w-32 animate-pulse rounded bg-muted" />
				<div className="h-4 w-64 animate-pulse rounded bg-muted" />
			</div>
			<div className="h-9 w-28 animate-pulse rounded bg-muted" />
			<div className="space-y-2">
				{["wp-sk-1", "wp-sk-2", "wp-sk-3", "wp-sk-4", "wp-sk-5"].map((key) => (
					<div key={key} className="h-12 animate-pulse rounded-lg bg-muted" />
				))}
			</div>
		</div>
	);
}
