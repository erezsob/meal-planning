import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import {
	AlertTriangle,
	ArrowLeft,
	Info,
	Loader2,
	Send,
	Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import {
	formatDateKey,
	HOUSEHOLD_ID,
	MEAL_TYPES,
	type MealType,
} from "@/lib/constants";
import type { Result } from "@/lib/fp";
import { cn } from "@/lib/utils";
import {
	findDraftDish,
	getSlotAssignments,
	getUnassignedDishes,
} from "./draft-transforms";
import type { PlanDraft } from "./types";

const MEAL_TYPE_EMOJIS: Record<MealType, string> = {
	breakfast: "🌅",
	lunch: "☀️",
	dinner: "🌙",
};

/** Short day name from a Date (e.g. "Mon") */
const shortDayName = (date: Date): string =>
	date.toLocaleDateString("en-US", { weekday: "short" });

interface ReviewStepProps {
	/** Current draft */
	draft: PlanDraft;
	/** Dates for each column */
	planDates: Date[];
	/** Go to previous step */
	onBack: () => void;
	/** Commit the plan */
	onCommit: () => Promise<Result<number, string>>;
	/** Discard the draft */
	onDiscard: () => void;
	/** Called after successful commit */
	onCommitSuccess: () => void;
}

/**
 * Step 3: Review the full plan and commit.
 * Shows a plan overview, warns about unassigned dishes, and handles commit.
 */
export function ReviewStep({
	draft,
	planDates,
	onBack,
	onCommit,
	onDiscard,
	onCommitSuccess,
}: ReviewStepProps) {
	const [isCommitting, setIsCommitting] = useState(false);
	const [commitError, setCommitError] = useState<string | null>(null);
	const [commitSuccess, setCommitSuccess] = useState(false);

	const unassigned = getUnassignedDishes(draft);
	const today = formatDateKey(new Date());

	const { data: existingMeals } = useQuery(
		convexQuery(api.mealPlans.getWeek, {
			householdId: HOUSEHOLD_ID,
			startDate: draft.startDate,
		}),
	);
	const existingPlannedCount =
		existingMeals?.filter((m) => m.status === "planned").length ?? 0;

	const handleCommit = useCallback(async () => {
		setIsCommitting(true);
		setCommitError(null);

		const result = await onCommit();

		setIsCommitting(false);

		if (result.ok) {
			setCommitSuccess(true);
			setTimeout(onCommitSuccess, 1500);
		} else {
			setCommitError(result.error);
		}
	}, [onCommit, onCommitSuccess]);

	if (commitSuccess) {
		return (
			<Card className="border-emerald-600/50">
				<CardContent className="py-6 text-center space-y-3">
					<div className="text-4xl">🎉</div>
					<h2 className="text-xl font-semibold text-emerald-400">
						Plan committed!
					</h2>
					<p className="text-sm text-muted-foreground">
						{draft.assignments.length} meals added to your calendar.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Review your plan</CardTitle>
					<CardDescription>
						{draft.assignments.length} meals across{" "}
						{countDaysWithMeals(draft, planDates)} days
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Unassigned warning */}
			{unassigned.length > 0 && (
				<div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/20 border border-amber-600/30">
					<AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-sm font-medium text-amber-300">
							{unassigned.length} unassigned{" "}
							{unassigned.length === 1 ? "dish" : "dishes"}
						</p>
						<p className="text-xs text-amber-400/70 mt-0.5">
							{unassigned.map((d) => d.name).join(", ")}
						</p>
					</div>
				</div>
			)}

			{/* Existing meals warning */}
			{existingPlannedCount > 0 && (
				<div className="flex items-start gap-3 p-4 rounded-xl bg-blue-950/20 border border-blue-600/30">
					<Info size={18} className="text-blue-400 mt-0.5 shrink-0" />
					<div>
						<p className="text-sm font-medium text-blue-300">
							This period already has {existingPlannedCount} planned{" "}
							{existingPlannedCount === 1 ? "meal" : "meals"}
						</p>
						<p className="text-xs text-blue-400/70 mt-0.5">
							Committing will add new meals alongside existing ones.
						</p>
					</div>
				</div>
			)}

			{/* Week overview grid */}
			<Card className="overflow-hidden py-0">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[600px] border-collapse">
						<thead>
							<tr>
								<th className="w-10 p-2" />
								{planDates.map((date) => {
									const dateKey = formatDateKey(date);
									const isToday = dateKey === today;
									return (
										<th
											key={dateKey}
											className={cn(
												"p-2 text-center border-l border-border",
												isToday && "bg-emerald-600/10",
											)}
										>
											<div
												className={cn(
													"text-xs font-semibold",
													isToday
														? "text-emerald-400"
														: "text-muted-foreground",
												)}
											>
												{shortDayName(date)}
											</div>
											<div
												className={cn(
													"text-[10px]",
													isToday
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
									<td className="p-2 align-top text-center">
										<span className="text-sm">{MEAL_TYPE_EMOJIS[mt]}</span>
									</td>
									{planDates.map((date) => {
										const dateKey = formatDateKey(date);
										const isToday = dateKey === today;
										const slotAssignments = getSlotAssignments(
											draft,
											dateKey,
											mt,
										);
										return (
											<td
												key={`${mt}-${dateKey}`}
												className={cn(
													"p-1.5 border-l border-border align-top",
													isToday && "bg-emerald-600/5",
												)}
											>
												<div className="min-h-[40px] space-y-1">
													{slotAssignments.map((a) => {
														const dish = findDraftDish(draft, a.draftDishId);
														return (
															<div
																key={`${a.draftDishId}-${a.day}-${a.mealType}`}
																className="px-1.5 py-1 rounded bg-popover border"
															>
																<div className="text-[11px] font-medium text-card-foreground truncate">
																	{dish?.name ?? "Unknown"}
																</div>
																<div className="text-[9px] text-muted-foreground">
																	{a.servingsUsed} srv
																</div>
															</div>
														);
													})}
												</div>
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Card>

			{/* Error display */}
			{commitError && (
				<div className="p-3 rounded-lg bg-red-950/30 border border-red-600/30 text-sm text-red-400">
					{commitError}
				</div>
			)}

			{/* Footer actions */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={onBack} disabled={isCommitting}>
						<ArrowLeft size={16} />
						Back
					</Button>
					<Button
						variant="ghost"
						onClick={onDiscard}
						disabled={isCommitting}
						className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
					>
						<Trash2 size={16} />
						Discard
					</Button>
				</div>
				<Button
					onClick={handleCommit}
					disabled={isCommitting || draft.assignments.length === 0}
				>
					{isCommitting ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<Send size={16} />
					)}
					{isCommitting ? "Committing..." : "Commit Plan"}
				</Button>
			</div>
		</div>
	);
}

/** Count unique days that have at least one assignment */
const countDaysWithMeals = (draft: PlanDraft, planDates: Date[]): number =>
	planDates.filter((date) =>
		draft.assignments.some((a) => a.day === formatDateKey(date)),
	).length;
