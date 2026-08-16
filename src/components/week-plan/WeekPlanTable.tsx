import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";
import type { WeekPlanCellLocation } from "@/lib/weekPlan";
import {
	WEEKDAY_KEYS,
	WEEKDAY_LABELS,
	type WeekdayKey,
	type WeekPlan,
} from "@/lib/weekPlanTypes";
import {
	PLAN_TABLE_CELL_BORDER,
	PLAN_TABLE_CELL_PADDING,
	PLAN_TABLE_CLASS_NAME,
	PLAN_TABLE_HEADER_ROW_CLASS_NAME,
} from "./planTableStyles";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";

export interface WeekPlanRowDescriptor {
	id: string;
	label: string;
	location: WeekPlanCellLocation;
	dish: string;
	grocery: string;
	removable?: boolean;
	/** Set when location is backlog — for remove handler */
	backlogIndex?: number;
}

/** Build ordered row descriptors for rendering */
export function buildWeekPlanRows(plan: WeekPlan): WeekPlanRowDescriptor[] {
	const weekdayRows = WEEKDAY_KEYS.map((key: WeekdayKey) => ({
		id: `weekday-${key}`,
		label: WEEKDAY_LABELS[key],
		location: { type: "weekday" as const, key },
		dish: plan.weekdays[key].dish,
		grocery: plan.weekdays[key].grocery,
	}));

	const backlogRows = plan.backlog.map((cell, index) => ({
		id: `backlog-${index}`,
		label: "",
		location: { type: "backlog" as const, index },
		dish: cell.dish,
		grocery: cell.grocery,
		removable: true,
		backlogIndex: index,
	}));

	return [
		...weekdayRows,
		{
			id: "weekly-lunch",
			label: "Weekly lunch",
			location: { type: "weekly", key: "lunch" },
			dish: plan.weeklyLunch.dish,
			grocery: plan.weeklyLunch.grocery,
		},
		{
			id: "weekly-breakfast",
			label: "Weekly breakfast",
			location: { type: "weekly", key: "breakfast" },
			dish: plan.weeklyBreakfast.dish,
			grocery: plan.weeklyBreakfast.grocery,
		},
		...backlogRows,
	];
}

interface WeekPlanTableProps {
	rows: WeekPlanRowDescriptor[];
	onCellChange: (args: {
		location: WeekPlanCellLocation;
		field: "dish" | "grocery";
		value: string;
	}) => void;
	onRemoveBacklog: (index: number) => void;
	onAddBacklog: () => void;
}

/**
 * Desktop week plan table — Date | Dish | Grocery List
 */
export function WeekPlanTable({
	rows,
	onCellChange,
	onRemoveBacklog,
	onAddBacklog,
}: WeekPlanTableProps) {
	return (
		<div className="space-y-3">
			<div className="overflow-x-auto">
				<table className={PLAN_TABLE_CLASS_NAME}>
					<thead>
						<tr className={PLAN_TABLE_HEADER_ROW_CLASS_NAME}>
							<th
								className={cn(
									"w-36 text-left font-semibold",
									PLAN_TABLE_CELL_BORDER,
									PLAN_TABLE_CELL_PADDING,
								)}
							>
								Date
							</th>
							<th
								className={cn(
									"w-2/5 max-w-0 text-left font-semibold",
									PLAN_TABLE_CELL_BORDER,
									PLAN_TABLE_CELL_PADDING,
								)}
							>
								Dish
							</th>
							<th
								className={cn(
									"w-2/5 max-w-0 text-left font-semibold",
									PLAN_TABLE_CELL_BORDER,
									PLAN_TABLE_CELL_PADDING,
								)}
							>
								Grocery List
							</th>
							<th
								className={cn(
									"w-10",
									PLAN_TABLE_CELL_BORDER,
									PLAN_TABLE_CELL_PADDING,
								)}
							>
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr key={row.id}>
								<td
									className={cn(
										"align-middle font-medium text-foreground whitespace-nowrap",
										PLAN_TABLE_CELL_BORDER,
										PLAN_TABLE_CELL_PADDING,
									)}
								>
									{row.label || (
										<span className="text-muted-foreground" aria-hidden="true">
											&nbsp;
										</span>
									)}
								</td>
								<td
									className={cn(
										"max-w-0 align-top p-0",
										PLAN_TABLE_CELL_BORDER,
									)}
								>
									<WeekPlanCellEditor
										embedded
										label={`${row.label || "Backlog"} dish`}
										value={row.dish}
										onChange={(value) =>
											onCellChange({
												location: row.location,
												field: "dish",
												value,
											})
										}
									/>
								</td>
								<td
									className={cn(
										"max-w-0 align-top p-0",
										PLAN_TABLE_CELL_BORDER,
									)}
								>
									<WeekPlanCellEditor
										embedded
										label={`${row.label || "Backlog"} grocery list`}
										value={row.grocery}
										onChange={(value) =>
											onCellChange({
												location: row.location,
												field: "grocery",
												value,
											})
										}
									/>
								</td>
								<td
									className={cn(
										"align-top",
										PLAN_TABLE_CELL_BORDER,
										PLAN_TABLE_CELL_PADDING,
									)}
								>
									{row.removable && row.backlogIndex !== undefined ? (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											aria-label="Remove backlog idea"
											onClick={() => onRemoveBacklog(row.backlogIndex ?? 0)}
										>
											<Trash2 size={16} />
										</Button>
									) : null}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<Button type="button" variant="outline" size="sm" onClick={onAddBacklog}>
				<Plus size={16} />
				Add row
			</Button>
		</div>
	);
}
