import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import type { CustomPlanField } from "@/lib/weekPlan";
import type { CustomPlanRow } from "@/lib/weekPlanTypes";
import {
	PlanTable,
	PlanTableBody,
	PlanTableCell,
	PlanTableHead,
	PlanTableHeadCell,
} from "./PlanTable";
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
			<PlanTable>
				<PlanTableHead>
					<PlanTableHeadCell className="w-36">Name</PlanTableHeadCell>
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
							<PlanTableCell className="max-w-0 align-top p-0">
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
							</PlanTableCell>
							<PlanTableCell className="max-w-0 align-top p-0">
								<WeekPlanCellEditor
									embedded
									label={`${rowLabel(row)} dish`}
									value={row.dish}
									onChange={(value) =>
										onCellChange({ index: row.index, field: "dish", value })
									}
								/>
							</PlanTableCell>
							<PlanTableCell className="max-w-0 align-top p-0">
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
							</PlanTableCell>
							<PlanTableCell className="align-top">
								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label="Remove custom plan row"
									onClick={() => onRemoveRow(row.index)}
								>
									<Trash2 size={16} />
								</Button>
							</PlanTableCell>
						</tr>
					))}
				</PlanTableBody>
			</PlanTable>

			<Button type="button" variant="outline" size="sm" onClick={onAddRow}>
				<Plus size={16} />
				Add row
			</Button>
		</div>
	);
}
