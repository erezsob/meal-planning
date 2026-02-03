import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AlertCircle, Calendar, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Skeleton } from "@/lib/components/skeleton";
import {
	formatDateKey,
	getWeekDates,
	getWeekStart,
	HOUSEHOLD_ID,
	MEAL_TYPES,
	type MealType,
} from "@/lib/constants";

/** Leftover source from getLeftoverSources query */
type LeftoverSource = FunctionReturnType<
	typeof api.mealPlans.getLeftoverSources
>[number];

/** Default servings when scheduling leftover */
const DEFAULT_LEFTOVER_SERVINGS = 2;

/**
 * Panel showing available leftovers with remaining servings.
 * Tap card to schedule, void button to discard.
 */
export function LeftoverTracker() {
	const { data: leftovers = [], isLoading } = useQuery(
		convexQuery(api.mealPlans.getLeftoverSources, {
			householdId: HOUSEHOLD_ID,
		}),
	);

	const [selectedLeftover, setSelectedLeftover] =
		useState<LeftoverSource | null>(null);

	if (isLoading) {
		return <LeftoverTrackerSkeleton />;
	}

	if (leftovers.length === 0) {
		return (
			<div className="p-4 bg-card/50 rounded-xl border border-border">
				<p className="text-sm text-muted-foreground text-center">
					No leftovers available
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 bg-card/50 rounded-xl border border-border">
				<h3 className="text-sm font-medium text-muted-foreground mb-3">
					Leftovers
				</h3>
				<div className="flex gap-3 overflow-x-auto pb-1">
					{leftovers.map((leftover) => (
						<LeftoverCard
							key={leftover.meal._id}
							leftover={leftover}
							onSchedule={() => setSelectedLeftover(leftover)}
						/>
					))}
				</div>
			</div>

			{selectedLeftover && (
				<ScheduleLeftoverModal
					leftover={selectedLeftover}
					onClose={() => setSelectedLeftover(null)}
				/>
			)}
		</>
	);
}

interface LeftoverCardProps {
	leftover: LeftoverSource;
	onSchedule: () => void;
}

/**
 * Card displaying a leftover with remaining servings.
 * Shows warning badge if unscheduled. Void button to discard.
 */
function LeftoverCard({ leftover, onSchedule }: LeftoverCardProps) {
	const { meal, dish, available, isUnscheduled } = leftover;
	const voidLeftovers = useMutation(api.mealPlans.voidLeftovers);

	const handleVoid = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (window.confirm(`Void ${available} servings of ${dish.name}?`)) {
			voidLeftovers({ sourceMealId: meal._id as Id<"mealPlans"> });
		}
	};

	return (
		<button
			type="button"
			onClick={onSchedule}
			className="flex-shrink-0 w-40 p-3 bg-card hover:bg-accent border rounded-lg text-left transition-colors group"
		>
			<div className="flex items-start justify-between mb-1">
				<span className="font-medium text-foreground text-sm line-clamp-1 flex-1">
					{dish.name}
				</span>
				{isUnscheduled && (
					<AlertCircle
						size={14}
						className="text-amber-400 flex-shrink-0 ml-1"
						aria-label="Not scheduled"
					/>
				)}
			</div>
			<p className="text-xs text-teal-400 mb-2">{available} left</p>
			<div className="flex justify-end">
				<Button
					variant="ghost"
					size="icon-xs"
					onClick={handleVoid}
					className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
					aria-label="Void leftovers"
				>
					<Trash2 size={14} />
				</Button>
			</div>
		</button>
	);
}

interface ScheduleLeftoverModalProps {
	leftover: LeftoverSource;
	onClose: () => void;
}

/**
 * Modal for scheduling leftover to a meal slot.
 * Day picker (next 7 days), meal type, and servings input.
 */
function ScheduleLeftoverModal({
	leftover,
	onClose,
}: ScheduleLeftoverModalProps) {
	const { meal, dish, available } = leftover;
	const planMeal = useMutation(api.mealPlans.planMeal);

	// Next 7 days starting from today
	const today = new Date();
	const weekDates = getWeekDates(getWeekStart(today)).filter(
		(d) => formatDateKey(d) >= formatDateKey(today),
	);
	// Pad to 7 days if needed
	while (weekDates.length < 7) {
		const last = weekDates[weekDates.length - 1];
		const next = new Date(last);
		next.setDate(next.getDate() + 1);
		weekDates.push(next);
	}

	const [selectedDay, setSelectedDay] = useState(formatDateKey(today));
	const [selectedMealType, setSelectedMealType] = useState<MealType>("dinner");
	const [servings, setServings] = useState(
		Math.min(DEFAULT_LEFTOVER_SERVINGS, available),
	);

	const dayId = useId();
	const mealTypeId = useId();
	const servingsId = useId();

	const handleSchedule = () => {
		planMeal({
			day: selectedDay,
			mealType: selectedMealType,
			dishId: dish._id,
			servingsUsed: servings,
			isLeftover: true,
			sourceMealId: meal._id as Id<"mealPlans">,
			householdId: HOUSEHOLD_ID,
		});
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Calendar size={20} className="text-teal-400" />
						Schedule {dish.name}
					</DialogTitle>
					<DialogDescription>{available} servings left</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Day picker */}
					<div>
						<Label htmlFor={dayId} className="mb-2">
							Day
						</Label>
						<div className="grid grid-cols-7 gap-1">
							{weekDates.map((date) => {
								const key = formatDateKey(date);
								const isSelected = selectedDay === key;
								const dayName = date.toLocaleDateString("en-US", {
									weekday: "short",
								});
								const dayNum = date.getDate();
								return (
									<Button
										key={key}
										type="button"
										variant={isSelected ? "default" : "secondary"}
										size="sm"
										onClick={() => setSelectedDay(key)}
										className="flex flex-col h-auto py-1"
									>
										<span className="block text-xs">{dayName}</span>
										<span className="block text-sm font-medium">{dayNum}</span>
									</Button>
								);
							})}
						</div>
					</div>

					{/* Meal type */}
					<div>
						<Label htmlFor={mealTypeId} className="mb-2">
							Meal
						</Label>
						<div className="flex gap-2">
							{MEAL_TYPES.map((type) => (
								<Button
									key={type}
									type="button"
									variant={selectedMealType === type ? "default" : "secondary"}
									onClick={() => setSelectedMealType(type)}
									className="flex-1 capitalize"
								>
									{type}
								</Button>
							))}
						</div>
					</div>

					{/* Servings */}
					<div>
						<Label htmlFor={servingsId} className="mb-1">
							Servings
						</Label>
						<Input
							id={servingsId}
							type="number"
							min={1}
							max={available}
							step={1}
							value={servings}
							onChange={(e) =>
								setServings(
									Math.min(
										available,
										Math.max(1, Number.parseInt(e.target.value, 10) || 1),
									),
								)
							}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={handleSchedule}>Schedule</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Stable keys for leftover skeleton */
const LEFTOVER_SKELETON_KEYS = ["lo-sk-1", "lo-sk-2", "lo-sk-3"] as const;

/**
 * Loading skeleton for LeftoverTracker
 */
function LeftoverTrackerSkeleton() {
	return (
		<div className="p-4 bg-card/50 rounded-xl border border-border">
			<Skeleton className="h-4 w-16 mb-3" />
			<div className="flex gap-3">
				{LEFTOVER_SKELETON_KEYS.map((key) => (
					<Skeleton key={key} className="flex-shrink-0 w-40 h-20 rounded-lg" />
				))}
			</div>
		</div>
	);
}
