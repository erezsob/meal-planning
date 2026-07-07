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

const cellBorder = "border border-border";
const cellPadding = "px-3 py-2";

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
				<table className="w-full min-w-[640px] border-collapse border border-border text-sm">
					<thead>
						<tr className="bg-muted/40">
							<th
								className={cn(
									"w-36 text-left font-semibold",
									cellBorder,
									cellPadding,
								)}
							>
								Date
							</th>
							<th
								className={cn(
									"text-left font-semibold",
									cellBorder,
									cellPadding,
								)}
							>
								Dish
							</th>
							<th
								className={cn(
									"text-left font-semibold",
									cellBorder,
									cellPadding,
								)}
							>
								Grocery List
							</th>
							<th className={cn("w-10", cellBorder, cellPadding)}>
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
										cellBorder,
										cellPadding,
									)}
								>
									{row.label || (
										<span className="text-muted-foreground" aria-hidden="true">
											&nbsp;
										</span>
									)}
								</td>
								<td className={cn("align-top p-0", cellBorder)}>
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
								<td className={cn("align-top p-0", cellBorder)}>
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
								<td className={cn("align-top", cellBorder, cellPadding)}>
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
