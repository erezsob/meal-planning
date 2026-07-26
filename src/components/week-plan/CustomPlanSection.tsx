import { useId, useMemo } from "react";
import type { CustomPlanField } from "@/lib/weekPlan";
import type { CustomPlanRow } from "@/lib/weekPlanTypes";
import { CustomPlanCardList } from "./CustomPlanCardList";
import { buildCustomPlanRows, CustomPlanTable } from "./CustomPlanTable";
import { CustomPlanToolbar } from "./CustomPlanToolbar";

interface CustomPlanSectionProps {
	rows: CustomPlanRow[];
	onCellChange: (args: {
		index: number;
		field: CustomPlanField;
		value: string;
	}) => void;
	onRemoveRow: (index: number) => void;
	onAddRow: () => void;
	onClear: () => void;
}

/**
 * Custom plan scratch pad — named rows with dish and grocery columns
 */
export function CustomPlanSection({
	rows,
	onCellChange,
	onRemoveRow,
	onAddRow,
	onClear,
}: CustomPlanSectionProps) {
	const headingId = useId();
	const rowDescriptors = useMemo(() => buildCustomPlanRows(rows), [rows]);

	return (
		<section className="space-y-4" aria-labelledby={headingId}>
			<h2 id={headingId} className="text-xl font-bold text-foreground">
				Custom plan
			</h2>

			<CustomPlanToolbar onClear={onClear} />

			<div className="hidden md:block">
				<CustomPlanTable
					rows={rowDescriptors}
					onCellChange={onCellChange}
					onRemoveRow={onRemoveRow}
					onAddRow={onAddRow}
				/>
			</div>

			<div className="md:hidden">
				<CustomPlanCardList
					rows={rowDescriptors}
					onCellChange={onCellChange}
					onRemoveRow={onRemoveRow}
					onAddRow={onAddRow}
				/>
			</div>
		</section>
	);
}
