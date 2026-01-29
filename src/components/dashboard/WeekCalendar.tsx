import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import {
	formatDateKey,
	HOUSEHOLD_ID,
	MEAL_TYPES,
	type MealType,
	WEEKDAYS,
} from "../../../lib/constants";
import { MealSlot, MealSlotHeader } from "../MealSlot";
import type { MealWithDish } from "./types";

interface WeekCalendarProps {
	/** Start date key (YYYY-MM-DD) for the week */
	startDateKey: string;
	/** Array of 7 dates for the week */
	weekDates: Date[];
	/** Called when clicking empty slot to add meal */
	onAddMeal: (day: string, mealType: MealType) => void;
	/** Called when clicking existing meal */
	onSelectMeal: (meal: MealWithDish, day: string, mealType: MealType) => void;
}

/**
 * Weekly calendar grid - responsive layout for desktop, tablet, and mobile
 */
export function WeekCalendar({
	startDateKey,
	weekDates,
	onAddMeal,
	onSelectMeal,
}: WeekCalendarProps) {
	const { data: meals } = useSuspenseQuery(
		convexQuery(api.mealPlans.getWeek, {
			householdId: HOUSEHOLD_ID,
			startDate: startDateKey,
		}),
	);

	const getMeal = (day: string, mealType: MealType): MealWithDish | undefined =>
		meals.find((m) => m.day === day && m.mealType === mealType);

	const today = formatDateKey(new Date());

	return (
		<>
			<DesktopCalendar
				weekDates={weekDates}
				today={today}
				getMeal={getMeal}
				onAddMeal={onAddMeal}
				onSelectMeal={onSelectMeal}
			/>
			<TabletCalendar
				weekDates={weekDates}
				today={today}
				getMeal={getMeal}
				onAddMeal={onAddMeal}
				onSelectMeal={onSelectMeal}
			/>
			<MobileCalendar
				weekDates={weekDates}
				today={today}
				getMeal={getMeal}
				onAddMeal={onAddMeal}
				onSelectMeal={onSelectMeal}
			/>
		</>
	);
}

interface CalendarViewProps {
	weekDates: Date[];
	today: string;
	getMeal: (day: string, mealType: MealType) => MealWithDish | undefined;
	onAddMeal: (day: string, mealType: MealType) => void;
	onSelectMeal: (meal: MealWithDish, day: string, mealType: MealType) => void;
}

/**
 * Desktop view: 7-column grid with row headers
 */
function DesktopCalendar({
	weekDates,
	today,
	getMeal,
	onAddMeal,
	onSelectMeal,
}: CalendarViewProps) {
	return (
		<div className="hidden lg:block overflow-x-auto">
			<div className="min-w-[900px]">
				{/* Day headers */}
				<div className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2">
					<div /> {/* Empty corner cell */}
					{weekDates.map((date, i) => {
						const dateKey = formatDateKey(date);
						const isToday = dateKey === today;
						return (
							<div
								key={dateKey}
								className={`text-center py-2 rounded-lg ${
									isToday ? "bg-emerald-600/20 border border-emerald-600" : ""
								}`}
							>
								<div className="font-medium text-gray-300">
									{WEEKDAYS[i].slice(0, 3)}
								</div>
								<div
									className={`text-sm ${isToday ? "text-emerald-400" : "text-gray-500"}`}
								>
									{date.getDate()}
								</div>
							</div>
						);
					})}
				</div>

				{/* Meal rows */}
				{MEAL_TYPES.map((mealType) => (
					<div
						key={mealType}
						className="grid grid-cols-[80px_repeat(7,1fr)] gap-2 mb-2"
					>
						<div className="flex items-center">
							<MealSlotHeader mealType={mealType} />
						</div>
						{weekDates.map((date) => {
							const dateKey = formatDateKey(date);
							const meal = getMeal(dateKey, mealType);
							return (
								<MealSlot
									key={`${dateKey}-${mealType}`}
									day={dateKey}
									mealType={mealType}
									meal={meal}
									onAdd={() => onAddMeal(dateKey, mealType)}
									onSelect={() => meal && onSelectMeal(meal, dateKey, mealType)}
								/>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Tablet view: condensed 7-column grid
 */
function TabletCalendar({
	weekDates,
	today,
	getMeal,
	onAddMeal,
	onSelectMeal,
}: CalendarViewProps) {
	return (
		<div className="hidden md:block lg:hidden">
			<div className="grid grid-cols-7 gap-1">
				{weekDates.map((date, i) => {
					const dateKey = formatDateKey(date);
					const isToday = dateKey === today;
					return (
						<div
							key={dateKey}
							className={`rounded-lg p-2 ${
								isToday
									? "bg-emerald-600/10 border border-emerald-600/50"
									: "bg-gray-900"
							}`}
						>
							<div
								className={`text-center mb-2 pb-2 border-b border-gray-700 ${
									isToday ? "border-emerald-600/50" : ""
								}`}
							>
								<div className="font-medium text-gray-300 text-sm">
									{WEEKDAYS[i].slice(0, 3)}
								</div>
								<div
									className={`text-xs ${isToday ? "text-emerald-400" : "text-gray-500"}`}
								>
									{date.getDate()}
								</div>
							</div>
							<div className="space-y-1">
								{MEAL_TYPES.map((mealType) => {
									const meal = getMeal(dateKey, mealType);
									return (
										<MealSlot
											key={`${dateKey}-${mealType}`}
											day={dateKey}
											mealType={mealType}
											meal={meal}
											onAdd={() => onAddMeal(dateKey, mealType)}
											onSelect={() =>
												meal && onSelectMeal(meal, dateKey, mealType)
											}
										/>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

/**
 * Mobile view: vertical day stack with cards
 */
function MobileCalendar({
	weekDates,
	today,
	getMeal,
	onAddMeal,
	onSelectMeal,
}: CalendarViewProps) {
	return (
		<div className="md:hidden space-y-4">
			{weekDates.map((date, i) => {
				const dateKey = formatDateKey(date);
				const isToday = dateKey === today;
				return (
					<div
						key={dateKey}
						className={`rounded-xl p-4 ${
							isToday
								? "bg-emerald-600/10 border border-emerald-600/50"
								: "bg-gray-900 border border-gray-800"
						}`}
					>
						<div
							className={`flex items-center justify-between mb-3 pb-2 border-b ${
								isToday ? "border-emerald-600/50" : "border-gray-700"
							}`}
						>
							<span className="font-semibold text-gray-100">{WEEKDAYS[i]}</span>
							<span
								className={`text-sm ${isToday ? "text-emerald-400 font-medium" : "text-gray-500"}`}
							>
								{date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
								{isToday && " • Today"}
							</span>
						</div>
						<div className="space-y-2">
							{MEAL_TYPES.map((mealType) => {
								const meal = getMeal(dateKey, mealType);
								return (
									<MealSlot
										key={`${dateKey}-${mealType}`}
										day={dateKey}
										mealType={mealType}
										meal={meal}
										onAdd={() => onAddMeal(dateKey, mealType)}
										onSelect={() =>
											meal && onSelectMeal(meal, dateKey, mealType)
										}
									/>
								);
							})}
						</div>
					</div>
				);
			})}
		</div>
	);
}
