import { useId, useMemo } from "react";
import type { CustomCategoryField } from "@/lib/weekPlan";
import type { CustomCategoryRow } from "@/lib/weekPlanTypes";
import { CustomCategoriesCardList } from "./CustomCategoriesCardList";
import {
	buildCustomCategoryRows,
	CustomCategoriesTable,
} from "./CustomCategoriesTable";
import { CustomCategoriesToolbar } from "./CustomCategoriesToolbar";

interface CustomCategoriesSectionProps {
	rows: CustomCategoryRow[];
	onCellChange: (args: {
		index: number;
		field: CustomCategoryField;
		value: string;
	}) => void;
	onRemoveRow: (index: number) => void;
	onAddRow: () => void;
	onClear: () => void;
}

/**
 * Custom categories scratch pad — named rows with dish and grocery columns
 */
export function CustomCategoriesSection({
	rows,
	onCellChange,
	onRemoveRow,
	onAddRow,
	onClear,
}: CustomCategoriesSectionProps) {
	const headingId = useId();
	const rowDescriptors = useMemo(() => buildCustomCategoryRows(rows), [rows]);

	return (
		<section className="space-y-4" aria-labelledby={headingId}>
			<h2 id={headingId} className="text-xl font-bold text-foreground">
				Categories
			</h2>

			<CustomCategoriesToolbar onClear={onClear} />

			<div className="hidden md:block">
				<CustomCategoriesTable
					rows={rowDescriptors}
					onCellChange={onCellChange}
					onRemoveRow={onRemoveRow}
					onAddRow={onAddRow}
				/>
			</div>

			<div className="md:hidden">
				<CustomCategoriesCardList
					rows={rowDescriptors}
					onCellChange={onCellChange}
					onRemoveRow={onRemoveRow}
					onAddRow={onAddRow}
				/>
			</div>
		</section>
	);
}
