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

/** Type guard for validating DishTag values */
export function isDishTag(value: string): value is DishTag {
	return DISH_TAGS.includes(value as DishTag);
}

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

/**
 * Meal types
 */
export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

/** Display labels for meal types */
export const MEAL_TYPE_LABELS = {
	breakfast: "Breakfast",
	lunch: "Lunch",
	dinner: "Dinner",
} as const satisfies Record<MealType, string>;

/** Sort order for meal types within a day */
export const MEAL_TYPE_ORDER: Record<MealType, number> = {
	breakfast: 0,
	lunch: 1,
	dinner: 2,
};

/** Hour boundaries for inferring meal type from time of day */
export const MEAL_TYPE_INFERENCE = {
	breakfastEndHour: 11,
	lunchEndHour: 16,
} as const;

/**
 * Infer breakfast / lunch / dinner from the current time of day.
 */
export function inferMealType(date: Date = new Date()): MealType {
	const hour = date.getHours();
	if (hour < MEAL_TYPE_INFERENCE.breakfastEndHour) return "breakfast";
	if (hour < MEAL_TYPE_INFERENCE.lunchEndHour) return "lunch";
	return "dinner";
}

/** Preset date ranges for the history view */
export const HISTORY_RANGE_PRESETS = ["7d", "30d", "all"] as const;

export type HistoryRangePreset = (typeof HISTORY_RANGE_PRESETS)[number];

export const HISTORY_RANGE_LABELS: Record<HistoryRangePreset, string> = {
	"7d": "Last 7 days",
	"30d": "Last 30 days",
	all: "All time",
};

/**
 * Resolve a history preset into optional start/end date keys (YYYY-MM-DD).
 */
export function getHistoryDateRange(
	preset: HistoryRangePreset,
	today: Date = new Date(),
): { startDate?: string; endDate: string } {
	const endDate = formatDateKey(today);
	if (preset === "all") return { endDate };

	const start = new Date(today);
	const daysBack = preset === "7d" ? 7 : 30;
	start.setDate(start.getDate() - daysBack);
	return { startDate: formatDateKey(start), endDate };
}

/**
 * Meal component roles (main, side, dessert, drink, other).
 * Multiple components per role per slot allowed (e.g. dinner party).
 */
export const MEAL_COMPONENT_ROLES = [
	"main",
	"side",
	"dessert",
	"drink",
	"other",
] as const;

export type MealComponentRole = (typeof MEAL_COMPONENT_ROLES)[number];

/** Default role when adding a component (e.g. for backfill / new plans). */
export const DEFAULT_COMPONENT_ROLE: MealComponentRole = "main";

/** Display labels for component roles (for UI grouping). */
export const COMPONENT_ROLE_LABELS = {
	main: "Main",
	side: "Side",
	dessert: "Dessert",
	drink: "Drink",
	other: "Other",
} as const satisfies Record<MealComponentRole, string>;

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
