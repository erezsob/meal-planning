import { useMemo, useState } from "react";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import {
	ARCHIVE_PREVIOUS_WEEK_DIALOG,
	ARCHIVED_PLAN_LABELS,
} from "@/lib/constants";
import type { WeekPlanCellLocation } from "@/lib/weekPlan";
import type { MainGridView } from "./mainGridViews";
import { WeekPlanCardList } from "./WeekPlanCardList";
import { buildWeekPlanRows, WeekPlanTable } from "./WeekPlanTable";

interface MainGridSectionProps {
	grid: MainGridView;
	onCellChange: (args: {
		gridId: NonNullable<MainGridView["id"]>;
		location: WeekPlanCellLocation;
		field: "dish" | "grocery";
		value: string;
	}) => void;
	onRemoveBacklog: (args: {
		gridId: NonNullable<MainGridView["id"]>;
		index: number;
	}) => void;
	onAddBacklog: (args: { gridId: NonNullable<MainGridView["id"]> }) => void;
	/** When set, shows Archive beside the heading (Previous week only). */
	onArchive?: () => void;
}

/**
 * One stacked main-grid week plan with heading and table/card views.
 */
export function MainGridSection({
	grid,
	onCellChange,
	onRemoveBacklog,
	onAddBacklog,
	onArchive,
}: MainGridSectionProps) {
	const [archiveOpen, setArchiveOpen] = useState(false);
	const rows = useMemo(
		() => buildWeekPlanRows({ ...grid.content, customPlan: [] }),
		[grid.content],
	);

	const gridId = grid.id;
	if (!gridId) {
		return null;
	}

	return (
		<section className="space-y-4" aria-labelledby={`main-grid-${gridId}`}>
			<div className="flex flex-wrap items-start justify-between gap-2">
				<div>
					<h2
						id={`main-grid-${gridId}`}
						className="text-xl font-bold text-foreground"
					>
						{grid.label}
					</h2>
					<p className="text-sm text-muted-foreground">{grid.createdAtLabel}</p>
				</div>
				{onArchive ? (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setArchiveOpen(true)}
					>
						{ARCHIVED_PLAN_LABELS.archive}
					</Button>
				) : null}
			</div>

			<div className="hidden md:block">
				<WeekPlanTable
					rows={rows}
					onCellChange={(args) => onCellChange({ gridId, ...args })}
					onRemoveBacklog={(index) => onRemoveBacklog({ gridId, index })}
					onAddBacklog={() => onAddBacklog({ gridId })}
				/>
			</div>

			<div className="md:hidden">
				<WeekPlanCardList
					rows={rows}
					onCellChange={(args) => onCellChange({ gridId, ...args })}
					onRemoveBacklog={(index) => onRemoveBacklog({ gridId, index })}
					onAddBacklog={() => onAddBacklog({ gridId })}
				/>
			</div>

			{onArchive ? (
				<Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{ARCHIVE_PREVIOUS_WEEK_DIALOG.title}</DialogTitle>
							<DialogDescription>
								{ARCHIVE_PREVIOUS_WEEK_DIALOG.description}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setArchiveOpen(false)}
							>
								{ARCHIVE_PREVIOUS_WEEK_DIALOG.cancel}
							</Button>
							<Button
								type="button"
								onClick={() => {
									onArchive();
									setArchiveOpen(false);
								}}
							>
								{ARCHIVE_PREVIOUS_WEEK_DIALOG.confirm}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			) : null}
		</section>
	);
}
