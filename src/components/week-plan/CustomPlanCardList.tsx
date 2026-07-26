import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import type { CustomPlanField } from "@/lib/weekPlan";
import type { CustomPlanRowDescriptor } from "./CustomPlanTable";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";

interface CustomPlanCardListProps {
	rows: CustomPlanRowDescriptor[];
	onCellChange: (args: {
		index: number;
		field: CustomPlanField;
		value: string;
	}) => void;
	onRemoveRow: (index: number) => void;
	onAddRow: () => void;
}

function rowLabel(row: CustomPlanRowDescriptor): string {
	return row.category.trim() || "Custom plan";
}

/**
 * Mobile custom plan — stacked card per row
 */
export function CustomPlanCardList({
	rows,
	onCellChange,
	onRemoveRow,
	onAddRow,
}: CustomPlanCardListProps) {
	return (
		<div className="space-y-3">
			{rows.map((row) => (
				<article
					key={row.id}
					className="rounded-lg border border-border bg-card p-4 space-y-3"
				>
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1 font-semibold text-foreground [&_[data-week-plan-cell]]:min-h-0 [&_[data-week-plan-cell]]:px-0 [&_[data-week-plan-cell]]:py-0 [&_textarea]:font-semibold">
							<WeekPlanCellEditor
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
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Remove custom plan row"
							onClick={() => onRemoveRow(row.index)}
						>
							<Trash2 size={16} />
						</Button>
					</div>

					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Dish
						</p>
						<WeekPlanCellEditor
							label={`${rowLabel(row)} dish`}
							value={row.dish}
							onChange={(value) =>
								onCellChange({ index: row.index, field: "dish", value })
							}
						/>
					</div>

					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Grocery List
						</p>
						<WeekPlanCellEditor
							label={`${rowLabel(row)} grocery list`}
							value={row.grocery}
							onChange={(value) =>
								onCellChange({ index: row.index, field: "grocery", value })
							}
						/>
					</div>
				</article>
			))}

			<Button
				type="button"
				variant="outline"
				className="w-full"
				onClick={onAddRow}
			>
				<Plus size={16} />
				Add row
			</Button>
		</div>
	);
}
