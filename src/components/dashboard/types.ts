import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import type { MealType } from "@/lib/constants";

/** Meal plan with joined dish data — shared by calendar and history queries */
export type MealPlanWithDish = FunctionReturnType<
	typeof api.mealPlans.getWeek
>[number];

/** @alias MealPlanWithDish */
export type MealWithDish = MealPlanWithDish;

/** Selected meal slot for adding or editing a component */
export interface SelectedSlot {
	/** Day in YYYY-MM-DD format */
	day: string;
	/** Type of meal */
	mealType: MealType;
	/** When set, modal opens in edit mode for this component */
	existingMeal?: MealWithDish;
}

/** Selected meal for action menu */
export interface SelectedMeal extends Pick<MealWithDish, "day" | "mealType"> {
	/** The meal plan with dish data */
	meal: MealWithDish;
}
