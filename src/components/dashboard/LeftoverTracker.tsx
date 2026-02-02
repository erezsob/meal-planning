import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { AlertCircle, Calendar, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import {
	formatDateKey,
	getWeekDates,
	getWeekStart,
	HOUSEHOLD_ID,
	MEAL_TYPES,
	type MealType,
} from "../../../lib/constants";

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
			<div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
				<p className="text-sm text-gray-500 text-center">
					No leftovers available
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
				<h3 className="text-sm font-medium text-gray-400 mb-3">Leftovers</h3>
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
			className="flex-shrink-0 w-40 p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-left transition-colors group"
		>
			<div className="flex items-start justify-between mb-1">
				<span className="font-medium text-gray-100 text-sm line-clamp-1 flex-1">
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
				<button
					type="button"
					onClick={handleVoid}
					className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
					aria-label="Void leftovers"
				>
					<Trash2 size={14} />
				</button>
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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				aria-hidden="true"
			/>
			<div className="relative w-full max-w-sm bg-gray-900 rounded-xl border border-gray-700 shadow-2xl p-4">
				<div className="flex items-center gap-2 mb-4">
					<Calendar size={20} className="text-teal-400" />
					<h2 className="text-lg font-semibold text-gray-100">
						Schedule {dish.name}
					</h2>
				</div>

				<p className="text-sm text-gray-400 mb-4">{available} servings left</p>

				<div className="space-y-4">
					{/* Day picker */}
					<div>
						<label
							htmlFor={dayId}
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Day
						</label>
						<div className="grid grid-cols-7 gap-1">
							{weekDates.map((date) => {
								const key = formatDateKey(date);
								const isSelected = selectedDay === key;
								const dayName = date.toLocaleDateString("en-US", {
									weekday: "short",
								});
								const dayNum = date.getDate();
								return (
									<button
										key={key}
										type="button"
										onClick={() => setSelectedDay(key)}
										className={`p-2 rounded-lg text-center transition-colors ${
											isSelected
												? "bg-emerald-600 text-white"
												: "bg-gray-800 text-gray-300 hover:bg-gray-700"
										}`}
									>
										<span className="block text-xs">{dayName}</span>
										<span className="block text-sm font-medium">{dayNum}</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Meal type */}
					<div>
						<label
							htmlFor={mealTypeId}
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Meal
						</label>
						<div className="flex gap-2">
							{MEAL_TYPES.map((type) => (
								<button
									key={type}
									type="button"
									onClick={() => setSelectedMealType(type)}
									className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
										selectedMealType === type
											? "bg-emerald-600 text-white"
											: "bg-gray-800 text-gray-300 hover:bg-gray-700"
									}`}
								>
									{type}
								</button>
							))}
						</div>
					</div>

					{/* Servings */}
					<div>
						<label
							htmlFor={servingsId}
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Servings
						</label>
						<input
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
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
						/>
					</div>
				</div>

				<div className="flex gap-2 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSchedule}
						className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors text-white"
					>
						Schedule
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * Loading skeleton for LeftoverTracker
 */
function LeftoverTrackerSkeleton() {
	return (
		<div className="p-4 bg-gray-900/50 rounded-xl border border-gray-800">
			<div className="h-4 w-16 bg-gray-700 rounded mb-3 animate-pulse" />
			<div className="flex gap-3">
				{Array.from({ length: 3 }).map(() => (
					<div
						key={crypto.randomUUID()}
						className="flex-shrink-0 w-40 h-20 bg-gray-800 border border-gray-700 rounded-lg animate-pulse"
					/>
				))}
			</div>
		</div>
	);
}
