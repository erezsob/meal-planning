/**
 * Hardcoded household ID for MVP (no auth)
 */
export const HOUSEHOLD_ID = "household-1";

/**
 * Predefined nutrition/dietary tags
 */
export const DISH_TAGS = [
	"high-protein",
	"high-fiber",
	"low-carb",
	"vegetarian",
	"vegan",
	"gluten-free",
	"dairy-free",
	"quick",
	"meal-prep",
] as const;

export type DishTag = (typeof DISH_TAGS)[number];

/**
 * Ingredient categories for shopping list grouping
 */
export const INGREDIENT_CATEGORIES = [
	"Produce",
	"Dairy",
	"Meat",
	"Seafood",
	"Pantry",
	"Frozen",
	"Bakery",
	"Beverages",
	"Other",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

/**
 * Common units for ingredients
 */
export const INGREDIENT_UNITS = [
	"g",
	"kg",
	"oz",
	"lb",
	"ml",
	"L",
	"cup",
	"tbsp",
	"tsp",
	"piece",
	"clove",
	"bunch",
	"can",
	"package",
] as const;

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

/**
 * Meal types
 */
export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

/**
 * Meal plan statuses
 */
export const MEAL_STATUSES = ["planned", "eaten", "skipped"] as const;

export type MealStatus = (typeof MEAL_STATUSES)[number];

/**
 * Days of the week (Monday start)
 */
export const WEEKDAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
] as const;

/**
 * Get the Monday of the week containing the given date
 */
export const getWeekStart = (date: Date): Date => {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

/**
 * Format date as YYYY-MM-DD (local date, not UTC)
 */
export const formatDateKey = (date: Date): string => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

/**
 * Get array of 7 dates starting from the given Monday
 */
export const getWeekDates = (weekStart: Date): Date[] => {
	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(weekStart);
		d.setDate(d.getDate() + i);
		return d;
	});
};

/**
 * localStorage key prefix for shopping list checked state (per week)
 */
export const SHOPPING_CHECKED_KEY_PREFIX = "shopping-checked";

/**
 * Stable key for a shopping list item (for checkbox persistence)
 */
export function getShoppingItemKey(item: {
	name: string;
	unit: string;
	category: string;
}): string {
	return `${item.name}|${item.unit}|${item.category}`;
}
