import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { MEAL_TYPE_ORDER } from "@/lib/constants";

export type EatenMeal = FunctionReturnType<
	typeof api.mealPlans.getEatenHistory
>[number];

export interface HistoryDayGroup {
	day: string;
	meals: EatenMeal[];
}

/**
 * Group eaten meals by day (newest days first; meals sorted breakfast → dinner).
 */
export function groupMealsByDay(meals: EatenMeal[]): HistoryDayGroup[] {
	const byDay = new Map<string, EatenMeal[]>();

	for (const meal of meals) {
		const list = byDay.get(meal.day) ?? [];
		list.push(meal);
		byDay.set(meal.day, list);
	}

	return [...byDay.entries()]
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([day, dayMeals]) => ({
			day,
			meals: [...dayMeals].sort(
				(a, b) => MEAL_TYPE_ORDER[a.mealType] - MEAL_TYPE_ORDER[b.mealType],
			),
		}));
}

/**
 * Format a YYYY-MM-DD key as a readable day header.
 */
export function formatHistoryDayHeader(day: string): string {
	const [y, m, d] = day.split("-").map(Number);
	const date = new Date(y, m - 1, d);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const target = new Date(y, m - 1, d);
	target.setHours(0, 0, 0, 0);

	const diffDays = Math.round(
		(today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";

	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

export function getMealDisplayName(meal: EatenMeal): string {
	return meal.dish?.name ?? meal.customName ?? "Unknown";
}
