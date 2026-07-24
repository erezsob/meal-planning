import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";
import type { CustomCategoryField } from "@/lib/weekPlan";
import type { CustomCategoryRow } from "@/lib/weekPlanTypes";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";

export interface CustomCategoryRowDescriptor {
	id: string;
	index: number;
	category: string;
	dish: string;
	grocery: string;
}

/** Build row descriptors for custom category rendering */
export function buildCustomCategoryRows(
	rows: CustomCategoryRow[],
): CustomCategoryRowDescriptor[] {
	return rows.map((row, index) => ({
		id: `custom-category-${index}`,
		index,
		category: row.category,
		dish: row.dish,
		grocery: row.grocery,
	}));
}

interface CustomCategoriesTableProps {
	rows: CustomCategoryRowDescriptor[];
	onCellChange: (args: {
		index: number;
		field: CustomCategoryField;
		value: string;
	}) => void;
	onRemoveRow: (index: number) => void;
	onAddRow: () => void;
}

const cellBorder = "border border-border";
const cellPadding = "px-3 py-2";

function rowLabel(row: CustomCategoryRowDescriptor): string {
	return row.category.trim() || "Category";
}

/**
 * Desktop custom categories table — Category | Dish | Grocery List
 */
export function CustomCategoriesTable({
	rows,
	onCellChange,
	onRemoveRow,
	onAddRow,
}: CustomCategoriesTableProps) {
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
								Category
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
										aria-label="Remove category row"
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
