import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import type { WeekPlanCellLocation } from "@/lib/weekPlan";
import {
	WEEKDAY_KEYS,
	WEEKDAY_LABELS,
	type WeekdayKey,
	type WeekPlan,
} from "@/lib/weekPlanTypes";
import {
	PlanTable,
	PlanTableBody,
	PlanTableCell,
	PlanTableHead,
	PlanTableHeadCell,
} from "./PlanTable";
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
			<PlanTable>
				<PlanTableHead>
					<PlanTableHeadCell className="w-36">Date</PlanTableHeadCell>
					<PlanTableHeadCell className="w-2/5 max-w-0">Dish</PlanTableHeadCell>
					<PlanTableHeadCell className="w-2/5 max-w-0">
						Grocery List
					</PlanTableHeadCell>
					<PlanTableHeadCell className="w-10">
						<span className="sr-only">Actions</span>
					</PlanTableHeadCell>
				</PlanTableHead>
				<PlanTableBody>
					{rows.map((row) => (
						<tr key={row.id}>
							<PlanTableCell className="align-middle font-medium text-foreground whitespace-nowrap">
								{row.label || (
									<span className="text-muted-foreground" aria-hidden="true">
										&nbsp;
									</span>
								)}
							</PlanTableCell>
							<PlanTableCell className="max-w-0 align-top p-0">
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
							</PlanTableCell>
							<PlanTableCell className="max-w-0 align-top p-0">
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
							</PlanTableCell>
							<PlanTableCell className="align-top">
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
							</PlanTableCell>
						</tr>
					))}
				</PlanTableBody>
			</PlanTable>

			<Button type="button" variant="outline" size="sm" onClick={onAddBacklog}>
				<Plus size={16} />
				Add row
			</Button>
		</div>
	);
}
