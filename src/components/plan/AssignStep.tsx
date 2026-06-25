import {
	ArrowLeft,
	ArrowRight,
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Plus,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import { formatDateKey, MEAL_TYPES, type MealType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
	countAssignedDishes,
	findDraftDish,
	getDishAssignments,
	getSlotAssignments,
} from "./draft-transforms";
import type { DraftAssignment, DraftDish, PlanDraft } from "./types";

const MEAL_TYPE_LABELS: Record<MealType, { short: string; emoji: string }> = {
	breakfast: { short: "B", emoji: "🌅" },
	lunch: { short: "L", emoji: "☀️" },
	dinner: { short: "D", emoji: "🌙" },
};

/** Short day name from a Date (e.g. "Mon") */
const shortDayName = (date: Date): string =>
	date.toLocaleDateString("en-US", { weekday: "short" });

interface AssignStepProps {
	/** Current draft */
	draft: PlanDraft;
	/** Plan start date */
	startDate: Date;
	/** Dates for each column in the grid */
	planDates: Date[];
	/** Number of days in the plan */
	numDays: number;
	/** Assign a dish to a slot */
	onAssign: (assignment: DraftAssignment) => void;
	/** Remove an assignment */
	onUnassign: (params: {
		draftDishId: string;
		day: string;
		mealType: MealType;
	}) => void;
	/** Shift start date by N days */
	onShiftStart: (days: number) => void;
	/** Jump to today */
	onToday: () => void;
	/** Change number of plan days */
	onSetNumDays: (n: number) => void;
	/** Go to previous step */
	onBack: () => void;
	/** Go to next step */
	onNext: () => void;
}

/**
 * Step 2: Assign collected dishes to day/meal slots.
 * Click a dish to select it, then click a slot to place it.
 */
export function AssignStep({
	draft,
	startDate,
	planDates,
	numDays,
	onAssign,
	onUnassign,
	onShiftStart,
	onToday,
	onSetNumDays,
	onBack,
	onNext,
}: AssignStepProps) {
	const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

	const todayKey = formatDateKey(new Date());
	const assignedCount = countAssignedDishes(draft);
	const isToday = formatDateKey(startDate) === todayKey;

	const handleSlotClick = useCallback(
		(day: string, mealType: MealType) => {
			if (!selectedDishId) return;
			const dish = findDraftDish(draft, selectedDishId);
			if (!dish) return;

			onAssign({
				draftDishId: dish.id,
				day,
				mealType,
				role: dish.role,
				servingsUsed: dish.servings,
				servingsMade: dish.type === "leftover" ? undefined : dish.servingsMade,
				isLeftover: dish.type === "leftover",
			});
			setSelectedDishId(null);
		},
		[selectedDishId, draft, onAssign],
	);

	const handleDishClick = useCallback((dishId: string) => {
		setSelectedDishId((prev) => (prev === dishId ? null : dishId));
	}, []);

	const formatDateRange = () => {
		const end = planDates[planDates.length - 1];
		if (!end) return "";
		const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
		const startStr = startDate.toLocaleDateString("en-US", opts);
		const endStr = end.toLocaleDateString("en-US", opts);
		const year = startDate.getFullYear();
		return `${startStr} – ${endStr}, ${year}`;
	};

	return (
		<div className="space-y-6">
			{/* Header: instruction + window controls */}
			<div className="flex items-center justify-between flex-wrap gap-3">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold text-foreground">
							Assign to days
						</h2>
						<Badge variant="secondary">
							{assignedCount} / {draft.dishes.length} assigned
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						{selectedDishId
							? "Now click a slot to place the dish"
							: "Click a dish below, then click a slot in the grid"}
					</p>
				</div>

				{/* Date window controls */}
				<div className="flex items-center gap-1.5">
					{!isToday && (
						<Button variant="outline" size="xs" onClick={onToday}>
							Today
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => onShiftStart(-numDays)}
						aria-label={`Back ${numDays} days`}
					>
						<ChevronsLeft size={16} />
					</Button>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => onShiftStart(-1)}
						aria-label="Back 1 day"
					>
						<ChevronLeft size={16} />
					</Button>
					<span className="min-w-[150px] text-center text-sm font-medium text-muted-foreground">
						{formatDateRange()}
					</span>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => onShiftStart(1)}
						aria-label="Forward 1 day"
					>
						<ChevronRight size={16} />
					</Button>
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => onShiftStart(numDays)}
						aria-label={`Forward ${numDays} days`}
					>
						<ChevronsRight size={16} />
					</Button>
					<div className="flex items-center gap-1 ml-2">
						<Input
							type="number"
							min={1}
							max={14}
							value={numDays}
							onChange={(e) => {
								const n = Number.parseInt(e.target.value, 10);
								if (n >= 1 && n <= 14) onSetNumDays(n);
							}}
							className="w-14 h-6 text-xs text-center px-1"
							aria-label="Number of days"
						/>
						<span className="text-xs text-muted-foreground">days</span>
					</div>
				</div>
			</div>

			{/* Dish palette */}
			<Card>
				<CardHeader>
					<CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
						Your Dishes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{draft.dishes.map((dish) => {
							const assignmentCount = getDishAssignments(draft, dish.id).length;
							const isSelected = selectedDishId === dish.id;
							return (
								<DishPaletteItem
									key={dish.id}
									dish={dish}
									assignmentCount={assignmentCount}
									isSelected={isSelected}
									onClick={() => handleDishClick(dish.id)}
								/>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{/* Day grid */}
			<Card className="overflow-hidden py-0">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[700px] border-collapse">
						<thead>
							<tr>
								<th className="w-10 p-2" />
								{planDates.map((date) => {
									const dateKey = formatDateKey(date);
									const isCurrent = dateKey === todayKey;
									return (
										<th
											key={dateKey}
											className={cn(
												"p-2 text-center border-l border-border",
												isCurrent && "bg-emerald-600/10",
											)}
										>
											<div
												className={cn(
													"text-xs font-semibold",
													isCurrent
														? "text-emerald-400"
														: "text-muted-foreground",
												)}
											>
												{shortDayName(date)}
											</div>
											<div
												className={cn(
													"text-[10px]",
													isCurrent
														? "text-emerald-500"
														: "text-muted-foreground/50",
												)}
											>
												{date.getDate()}
											</div>
										</th>
									);
								})}
							</tr>
						</thead>
						<tbody>
							{MEAL_TYPES.map((mt) => (
								<tr key={mt} className="border-t border-border">
									<td className="p-2 align-top">
										<div className="flex flex-col items-center gap-0.5">
											<span className="text-sm">
												{MEAL_TYPE_LABELS[mt].emoji}
											</span>
											<span className="text-[10px] font-semibold text-muted-foreground">
												{MEAL_TYPE_LABELS[mt].short}
											</span>
										</div>
									</td>
									{planDates.map((date) => {
										const dateKey = formatDateKey(date);
										const isCurrent = dateKey === todayKey;
										return (
											<SlotCell
												key={`${mt}-${dateKey}`}
												draft={draft}
												day={dateKey}
												mealType={mt}
												isToday={isCurrent}
												isTargetable={selectedDishId !== null}
												onClick={() => handleSlotClick(dateKey, mt)}
												onRemove={(draftDishId) =>
													onUnassign({
														draftDishId,
														day: dateKey,
														mealType: mt,
													})
												}
											/>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>

			{/* Footer */}
			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					<ArrowLeft size={16} />
					Back
				</Button>
				<Button onClick={onNext} disabled={draft.assignments.length === 0}>
					Next: Review
					<ArrowRight size={16} />
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// Sub-components
// ============================================================================

interface DishPaletteItemProps {
	dish: DraftDish;
	assignmentCount: number;
	isSelected: boolean;
	onClick: () => void;
}

/** A dish chip in the selection palette */
function DishPaletteItem({
	dish,
	assignmentCount,
	isSelected,
	onClick,
}: DishPaletteItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-left",
				isSelected
					? "bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500/50"
					: "bg-popover border-border hover:bg-accent",
			)}
		>
			<div className="min-w-0">
				<span className="text-sm font-medium text-card-foreground truncate block">
					{dish.name}
				</span>
				<span className="text-[10px] text-muted-foreground">
					{dish.servings} srv • {dish.type}
				</span>
			</div>
			{assignmentCount > 0 && (
				<Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
					{assignmentCount}x
				</Badge>
			)}
		</button>
	);
}

interface SlotCellProps {
	draft: PlanDraft;
	day: string;
	mealType: MealType;
	isToday: boolean;
	isTargetable: boolean;
	onClick: () => void;
	onRemove: (draftDishId: string) => void;
}

/** A single cell in the assignment grid */
function SlotCell({
	draft,
	day,
	mealType,
	isToday,
	isTargetable,
	onClick,
	onRemove,
}: SlotCellProps) {
	const assignments = getSlotAssignments(draft, day, mealType);

	return (
		<td
			className={cn(
				"p-1.5 border-l border-border align-top",
				isToday && "bg-emerald-600/5",
			)}
		>
			<div className="min-h-[52px] space-y-1">
				{assignments.map((a) => {
					const dish = findDraftDish(draft, a.draftDishId);
					if (!dish) return null;
					return (
						<div
							key={`${a.draftDishId}-${a.day}-${a.mealType}`}
							className="flex items-center gap-1 px-1.5 py-1 rounded bg-popover border group"
						>
							<span className="text-[11px] font-medium text-card-foreground truncate flex-1">
								{dish.name}
							</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									onRemove(a.draftDishId);
								}}
								className="p-0.5 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
								aria-label={`Remove ${dish.name}`}
							>
								<X size={10} />
							</button>
						</div>
					);
				})}

				{/* Drop target / add button */}
				<button
					type="button"
					onClick={onClick}
					disabled={!isTargetable}
					className={cn(
						"w-full rounded border-2 border-dashed flex items-center justify-center transition-colors",
						assignments.length === 0 ? "h-[52px]" : "h-7",
						isTargetable
							? "border-emerald-600/50 bg-emerald-600/5 hover:bg-emerald-600/10 cursor-pointer"
							: "border-border/30 cursor-default",
					)}
				>
					<Plus
						size={12}
						className={cn(
							isTargetable ? "text-emerald-500" : "text-muted-foreground/30",
						)}
					/>
				</button>
			</div>
		</td>
	);
}
