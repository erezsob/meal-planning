import { Suspense, useState } from "react";
import {
	formatDateKey,
	getWeekDates,
	getWeekStart,
} from "../../../lib/constants";
import { AddMealModal } from "./AddMealModal";
import { CalendarSkeleton } from "./CalendarSkeleton";
import { MealActionModal } from "./MealActionModal";
import type { SelectedMeal, SelectedSlot } from "./types";
import { WeekCalendar } from "./WeekCalendar";
import { WeekHeader } from "./WeekHeader";

/**
 * Dashboard - Weekly meal calendar view
 * Main planning interface with 7-day grid
 */
export function Dashboard() {
	const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
	const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
	const [selectedMeal, setSelectedMeal] = useState<SelectedMeal | null>(null);

	const weekDates = getWeekDates(weekStart);
	const startDateKey = formatDateKey(weekStart);

	const navigateWeek = (direction: -1 | 1) => {
		setWeekStart((prev) => {
			const next = new Date(prev);
			next.setDate(next.getDate() + direction * 7);
			return next;
		});
	};

	return (
		<div className="space-y-6">
			<WeekHeader
				weekStart={weekStart}
				onPrevious={() => navigateWeek(-1)}
				onNext={() => navigateWeek(1)}
				onToday={() => setWeekStart(getWeekStart(new Date()))}
			/>

			<Suspense fallback={<CalendarSkeleton />}>
				<WeekCalendar
					startDateKey={startDateKey}
					weekDates={weekDates}
					onAddMeal={(day, mealType) => setSelectedSlot({ day, mealType })}
					onSelectMeal={(meal, day, mealType) =>
						setSelectedMeal({ meal, day, mealType })
					}
				/>
			</Suspense>

			{selectedSlot && (
				<AddMealModal
					day={selectedSlot.day}
					mealType={selectedSlot.mealType}
					onClose={() => setSelectedSlot(null)}
				/>
			)}

			{selectedMeal && (
				<MealActionModal
					meal={selectedMeal.meal}
					onClose={() => setSelectedMeal(null)}
					onEdit={() => {
						setSelectedSlot({
							day: selectedMeal.day,
							mealType: selectedMeal.mealType,
						});
						setSelectedMeal(null);
					}}
				/>
			)}
		</div>
	);
}
