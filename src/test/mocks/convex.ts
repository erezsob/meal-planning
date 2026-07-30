import type { Doc, Id } from "convex/_generated/dataModel";
import type { MealWithDish } from "@/lib/mealPlanTypes";

/**
 * Mock factory for planSections document ids in tests.
 */
export function mockPlanSectionId(
	id: string = "plan-section-1",
): Id<"planSections"> {
	return id as Id<"planSections">;
}

/**
 * Mock factory for Dish documents
 */
export function createMockDish(
	overrides: Partial<Doc<"dishes">> = {},
): Doc<"dishes"> {
	return {
		_id: "dish-1" as Id<"dishes">,
		_creationTime: Date.now(),
		name: "Test Dish",
		defaultServings: 4,
		ingredients: [],
		householdId: "household-1",
		...overrides,
	};
}

/**
 * Mock factory for MealPlan documents
 */
function createMockMealPlan(
	overrides: Partial<Doc<"mealPlans">> = {},
): Doc<"mealPlans"> {
	return {
		_id: "meal-1" as Id<"mealPlans">,
		_creationTime: Date.now(),
		day: "2026-02-03",
		mealType: "dinner",
		componentRole: "main",
		dishId: "dish-1" as Id<"dishes">,
		customName: undefined,
		servingsUsed: 2,
		servingsMade: 4,
		status: "planned",
		isLeftover: false,
		sourceMealId: undefined,
		householdId: "household-1",
		...overrides,
	};
}

/**
 * Mock factory for MealWithDish (meal plan joined with dish)
 */
export function createMockMealWithDish(
	overrides: Partial<MealWithDish> = {},
): MealWithDish {
	const dish =
		overrides.dish === undefined
			? createMockDish()
			: overrides.dish === null
				? undefined
				: createMockDish(overrides.dish);
	return {
		...createMockMealPlan(),
		dish,
		...overrides,
	} as MealWithDish;
}

/**
 * Mock factory for leftover sources returned by getLeftoverSources
 */
export function createMockLeftoverSource(
	overrides: {
		meal?: Partial<Doc<"mealPlans">>;
		dish?: Partial<Doc<"dishes">>;
		available?: number;
		scheduledCount?: number;
		isUnscheduled?: boolean;
	} = {},
) {
	return {
		meal: createMockMealPlan(overrides.meal),
		dish: createMockDish(overrides.dish),
		available: overrides.available ?? 2,
		scheduledCount: overrides.scheduledCount ?? 0,
		isUnscheduled: overrides.isUnscheduled ?? true,
	};
}
