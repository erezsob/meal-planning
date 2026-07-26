import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";
import type { CustomPlanField } from "@/lib/weekPlan";
import type { CustomPlanRow } from "@/lib/weekPlanTypes";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";

export interface CustomPlanRowDescriptor {
	id: string;
	index: number;
	category: string;
	dish: string;
	grocery: string;
}

/** Build row descriptors for custom plan rendering */
export function buildCustomPlanRows(
	rows: CustomPlanRow[],
): CustomPlanRowDescriptor[] {
	return rows.map((row, index) => ({
		id: `custom-plan-${index}`,
		index,
		category: row.category,
		dish: row.dish,
		grocery: row.grocery,
	}));
}

interface CustomPlanTableProps {
	rows: CustomPlanRowDescriptor[];
	onCellChange: (args: {
		index: number;
		field: CustomPlanField;
		value: string;
	}) => void;
	onRemoveRow: (index: number) => void;
	onAddRow: () => void;
}

const cellBorder = "border border-border";
const cellPadding = "px-3 py-2";

function rowLabel(row: CustomPlanRowDescriptor): string {
	return row.category.trim() || "Custom plan";
}

/**
 * Desktop custom plan table — Name | Dish | Grocery List
 */
export function CustomPlanTable({
	rows,
	onCellChange,
	onRemoveRow,
	onAddRow,
}: CustomPlanTableProps) {
	return (
		<div className="space-y-3">
			<div className="overflow-x-auto">
				<table className="w-full min-w-[640px] table-fixed border-collapse border border-border text-sm">
					<thead>
						<tr className="bg-muted/40">
							<th
								className={cn(
									"w-36 text-left font-semibold",
									cellBorder,
									cellPadding,
								)}
							>
								Name
							</th>
							<th
								className={cn(
									"w-2/5 max-w-0 text-left font-semibold",
									cellBorder,
									cellPadding,
								)}
							>
								Dish
							</th>
							<th
								className={cn(
									"w-2/5 max-w-0 text-left font-semibold",
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
								<td className={cn("max-w-0 align-top p-0", cellBorder)}>
									<WeekPlanCellEditor
										embedded
										minRows={1}
										label={`${rowLabel(row)} name`}
										value={row.category}
										onChange={(value) =>
											onCellChange({
												index: row.index,
												field: "category",
												value,
											})
										}
									/>
								</td>
								<td className={cn("max-w-0 align-top p-0", cellBorder)}>
									<WeekPlanCellEditor
										embedded
										label={`${rowLabel(row)} dish`}
										value={row.dish}
										onChange={(value) =>
											onCellChange({ index: row.index, field: "dish", value })
										}
									/>
								</td>
								<td className={cn("max-w-0 align-top p-0", cellBorder)}>
									<WeekPlanCellEditor
										embedded
										label={`${rowLabel(row)} grocery list`}
										value={row.grocery}
										onChange={(value) =>
											onCellChange({
												index: row.index,
												field: "grocery",
												value,
											})
										}
									/>
								</td>
								<td className={cn("align-top", cellBorder, cellPadding)}>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label="Remove custom plan row"
										onClick={() => onRemoveRow(row.index)}
									>
										<Trash2 size={16} />
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<Button type="button" variant="outline" size="sm" onClick={onAddRow}>
				<Plus size={16} />
				Add row
			</Button>
		</div>
	);
}
