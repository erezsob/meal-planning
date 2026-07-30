import { CustomPlanSection } from "./CustomPlanSection";
import { MainGridSection } from "./MainGridSection";
import { useWeekPlan } from "./useWeekPlan";
import { WeekPlanToolbar } from "./WeekPlanToolbar";

/**
 * Week plan grid — simple free-text scratch pad for meal planning
 */
export function WeekPlanView() {
	const {
		mainGrids,
		customPlanRows,
		saveError,
		updateCell,
		clearMainTop,
		addBacklog,
		removeBacklog,
		updateCustomPlan,
		addCustomPlan,
		removeCustomPlan,
		clearCustomPlan,
		newWeeklyPlan,
		newCustomPlan,
	} = useWeekPlan();

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-bold text-foreground">Weekly plan</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Plan what to cook and what to buy — free text, no rules.
				</p>
			</header>

			{saveError && (
				<p className="text-sm text-destructive" role="alert">
					{saveError}
				</p>
			)}

			<WeekPlanToolbar
				onClear={() => void clearMainTop()}
				onNewWeeklyPlan={() => void newWeeklyPlan()}
			/>

			{mainGrids.map((grid) => (
				<MainGridSection
					key={grid.id ?? grid.label}
					grid={grid}
					onCellChange={updateCell}
					onRemoveBacklog={removeBacklog}
					onAddBacklog={addBacklog}
				/>
			))}

			<CustomPlanSection
				rows={customPlanRows}
				onCellChange={updateCustomPlan}
				onRemoveRow={removeCustomPlan}
				onAddRow={addCustomPlan}
				onClear={() => void clearCustomPlan()}
				onNewCustomPlan={() => void newCustomPlan()}
			/>
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
