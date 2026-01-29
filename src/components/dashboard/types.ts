import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { MealType } from "../../../lib/constants";

/** Meal plan with joined dish data - inferred from getWeek query return type */
export type MealWithDish = FunctionReturnType<
	typeof api.mealPlans.getWeek
>[number];

/** Leftover source - inferred from getLeftoverSources query return type */
export type LeftoverSource = FunctionReturnType<
	typeof api.mealPlans.getLeftoverSources
>[number];

/** Selected meal slot for adding/editing */
export interface SelectedSlot {
	/** Day in YYYY-MM-DD format */
	day: string;
	/** Type of meal */
	mealType: MealType;
}

/** Selected meal for action menu */
export interface SelectedMeal extends Pick<MealWithDish, "day" | "mealType"> {
	/** The meal plan with dish data */
	meal: MealWithDish;
}
