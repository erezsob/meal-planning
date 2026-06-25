import type { Id } from "convex/_generated/dataModel";
import type { MealComponentRole, MealType } from "@/lib/constants";

/** Source type for a collected dish */
export type DraftDishType = "library" | "custom" | "leftover";

/** A dish collected during the "Collect" step */
export interface DraftDish {
	/** Client-generated unique identifier */
	id: string;
	/** Where this dish came from */
	type: DraftDishType;
	/** Convex dish ID (library dishes only) */
	dishId?: Id<"dishes">;
	/** Free-text name (custom meals only) */
	customName?: string;
	/** Source meal ID (leftovers only) */
	sourceMealId?: Id<"mealPlans">;
	/** Display name */
	name: string;
	/** Default servings for this dish */
	servings: number;
	/** How many servings to cook (fresh dishes) */
	servingsMade?: number;
	/** Component role (main, side, etc.) */
	role: MealComponentRole;
}

/** An assignment of a collected dish to a specific day/meal slot */
export interface DraftAssignment {
	/** References DraftDish.id */
	draftDishId: string;
	/** Day key (YYYY-MM-DD) */
	day: string;
	/** Meal slot */
	mealType: MealType;
	/** Component role for this assignment */
	role: MealComponentRole;
	/** Servings to use */
	servingsUsed: number;
	/** Servings to cook (fresh dishes) */
	servingsMade?: number;
	/** Whether this is a leftover assignment */
	isLeftover: boolean;
}

/** Full draft state for a plan period */
export interface PlanDraft {
	/** Start date key (YYYY-MM-DD) */
	startDate: string;
	/** Number of days in this plan */
	numDays: number;
	/** Collected dishes */
	dishes: readonly DraftDish[];
	/** Day/meal assignments */
	assignments: readonly DraftAssignment[];
}

/** Default plan length in days */
export const DEFAULT_NUM_DAYS = 7;

/** Steps in the plan wizard */
export const PLAN_STEPS = ["collect", "assign", "review"] as const;

/** A single wizard step */
export type PlanStep = (typeof PLAN_STEPS)[number];

/** Step metadata for display */
export const PLAN_STEP_LABELS: Record<PlanStep, string> = {
	collect: "Collect",
	assign: "Assign",
	review: "Review",
} as const;
