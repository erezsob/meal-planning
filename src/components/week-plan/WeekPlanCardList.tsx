import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import type { WeekPlanCellLocation } from "@/lib/weekPlanStorage";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";
import type { WeekPlanRowDescriptor } from "./WeekPlanTable";

interface WeekPlanCardListProps {
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
 * Mobile week plan — stacked card per row
 */
export function WeekPlanCardList({
	rows,
	onCellChange,
	onRemoveBacklog,
	onAddBacklog,
}: WeekPlanCardListProps) {
	return (
		<div className="space-y-3">
			{rows.map((row) => (
				<article
					key={row.id}
					className="rounded-lg border border-border bg-card p-4 space-y-3"
				>
					<div className="flex items-center justify-between gap-2">
						{row.label ? (
							<h2 className="font-semibold text-foreground">{row.label}</h2>
						) : (
							<h2 className="font-medium text-muted-foreground">Idea</h2>
						)}
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
					</div>

					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Dish
						</p>
						<WeekPlanCellEditor
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
					</div>

					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
							Grocery List
						</p>
						<WeekPlanCellEditor
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
					</div>
				</article>
			))}

			<Button
				type="button"
				variant="outline"
				className="w-full"
				onClick={onAddBacklog}
			>
				<Plus size={16} />
				Add row
			</Button>
		</div>
	);
}
