import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import {
	formatDateKey,
	getHistoryDateRange,
	HISTORY_RANGE_LABELS,
	HISTORY_RANGE_PRESETS,
	type HistoryRangePreset,
	HOUSEHOLD_ID,
	MEAL_TYPE_LABELS,
} from "@/lib/constants";
import { MealActionModal } from "../dashboard/MealActionModal";
import type { MealWithDish } from "../dashboard/types";
import { LogMealModal } from "../log";
import {
	type EatenMeal,
	formatHistoryDayHeader,
	getMealDisplayName,
	groupMealsByDay,
} from "./group-history";

/**
 * History view — browse and filter past eaten meals.
 */
export function HistoryView() {
	const [preset, setPreset] = useState<HistoryRangePreset>("30d");
	const [searchQuery, setSearchQuery] = useState("");
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [useCustomRange, setUseCustomRange] = useState(false);
	const [selectedMeal, setSelectedMeal] = useState<EatenMeal | null>(null);
	const [editingMeal, setEditingMeal] = useState<MealWithDish | null>(null);

	const searchId = useId();
	const startDateId = useId();
	const endDateId = useId();

	const range = useMemo(() => {
		if (useCustomRange && customStart) {
			return {
				startDate: customStart,
				endDate: customEnd || formatDateKey(new Date()),
			};
		}
		return getHistoryDateRange(preset);
	}, [preset, useCustomRange, customStart, customEnd]);

	const { data: meals } = useSuspenseQuery(
		convexQuery(api.mealPlans.getEatenHistory, {
			householdId: HOUSEHOLD_ID,
			startDate: range.startDate,
			endDate: range.endDate,
			searchQuery: searchQuery.trim() || undefined,
		}),
	);

	const dayGroups = useMemo(() => groupMealsByDay(meals), [meals]);
	const today = formatDateKey(new Date());

	const handlePreset = (next: HistoryRangePreset) => {
		setPreset(next);
		setUseCustomRange(false);
		const nextRange = getHistoryDateRange(next);
		setCustomStart(nextRange.startDate ?? "");
		setCustomEnd(nextRange.endDate);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">History</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					What you&apos;ve eaten
				</p>
			</div>

			<div className="space-y-4 rounded-lg border bg-card p-4">
				<div className="flex flex-wrap gap-2">
					{HISTORY_RANGE_PRESETS.map((p) => (
						<Button
							key={p}
							type="button"
							variant={
								!useCustomRange && preset === p ? "default" : "secondary"
							}
							size="sm"
							onClick={() => handlePreset(p)}
						>
							{HISTORY_RANGE_LABELS[p]}
						</Button>
					))}
					<Button
						type="button"
						variant={useCustomRange ? "default" : "secondary"}
						size="sm"
						onClick={() => {
							setUseCustomRange(true);
							if (!customStart) {
								const r = getHistoryDateRange("30d");
								setCustomStart(r.startDate ?? "");
								setCustomEnd(r.endDate);
							}
						}}
					>
						Custom
					</Button>
				</div>

				{useCustomRange && (
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor={startDateId} className="mb-1">
								From
							</Label>
							<Input
								id={startDateId}
								type="date"
								value={customStart}
								max={customEnd || today}
								onChange={(e) => setCustomStart(e.target.value)}
							/>
						</div>
						<div>
							<Label htmlFor={endDateId} className="mb-1">
								To
							</Label>
							<Input
								id={endDateId}
								type="date"
								value={customEnd}
								min={customStart}
								max={today}
								onChange={(e) => setCustomEnd(e.target.value)}
							/>
						</div>
					</div>
				)}

				<div className="relative">
					<Search
						size={18}
						className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						id={searchId}
						type="search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search meals..."
						className="pl-10"
					/>
				</div>
			</div>

			{dayGroups.length === 0 ? (
				<p className="py-12 text-center text-muted-foreground">
					No meals found for this period
				</p>
			) : (
				<div className="space-y-6">
					{dayGroups.map((group) => (
						<section key={group.day}>
							<h2 className="mb-2 text-sm font-medium text-muted-foreground">
								{formatHistoryDayHeader(group.day)}
							</h2>
							<ul className="space-y-2">
								{group.meals.map((meal) => (
									<li key={meal._id}>
										<button
											type="button"
											onClick={() => setSelectedMeal(meal)}
											className="flex w-full items-center justify-between rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
										>
											<span className="font-medium">
												{getMealDisplayName(meal)}
											</span>
											<span className="text-sm text-muted-foreground">
												{MEAL_TYPE_LABELS[meal.mealType]}
											</span>
										</button>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			)}

			{selectedMeal && (
				<MealActionModal
					meal={selectedMeal as MealWithDish}
					eatenOnly
					onClose={() => setSelectedMeal(null)}
					onEdit={() => {
						setEditingMeal(selectedMeal as MealWithDish);
						setSelectedMeal(null);
					}}
				/>
			)}

			{editingMeal && (
				<LogMealModal
					existingMeal={editingMeal}
					onClose={() => setEditingMeal(null)}
				/>
			)}
		</div>
	);
}

export function HistoryViewSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-8 w-32 animate-pulse rounded bg-muted" />
			<div className="h-24 animate-pulse rounded-lg bg-muted" />
			<div className="space-y-2">
				{["h-sk-1", "h-sk-2", "h-sk-3"].map((key) => (
					<div key={key} className="h-12 animate-pulse rounded-lg bg-muted" />
				))}
			</div>
		</div>
	);
}
