import type { api } from "convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

/** Meal plan with joined dish data — shared by history and log */
export type MealPlanWithDish = FunctionReturnType<
	typeof api.mealPlans.getWeek
>[number];

/** @alias MealPlanWithDish */
export type MealWithDish = MealPlanWithDish;
