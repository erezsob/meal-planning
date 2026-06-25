import type { Id } from "convex/_generated/dataModel";
import type { MealComponentRole, MealType } from "@/lib/constants";
import {
	DEFAULT_NUM_DAYS,
	type DraftAssignment,
	type DraftDish,
	type PlanDraft,
} from "./types";

// ============================================================================
// Pure transformation functions for PlanDraft state
// Each returns a new PlanDraft (immutable updates)
// ============================================================================

/** Create an empty draft for a given date range */
export const createEmptyDraft = (
	startDate: string,
	numDays = DEFAULT_NUM_DAYS,
): PlanDraft => ({
	startDate,
	numDays,
	dishes: [],
	assignments: [],
});

/** Add a dish to the collection */
export const addDish =
	(dish: DraftDish) =>
	(draft: PlanDraft): PlanDraft => ({
		...draft,
		dishes: [...draft.dishes, dish],
	});

/** Remove a dish and all its assignments from the draft */
export const removeDish =
	(dishId: string) =>
	(draft: PlanDraft): PlanDraft => ({
		...draft,
		dishes: draft.dishes.filter((d) => d.id !== dishId),
		assignments: draft.assignments.filter((a) => a.draftDishId !== dishId),
	});

/** Add an assignment to the draft */
export const addAssignment =
	(assignment: DraftAssignment) =>
	(draft: PlanDraft): PlanDraft => ({
		...draft,
		assignments: [...draft.assignments, assignment],
	});

/** Remove a specific assignment by dish id + day + mealType */
export const removeAssignment =
	({
		draftDishId,
		day,
		mealType,
	}: Pick<DraftAssignment, "draftDishId" | "day" | "mealType">) =>
	(draft: PlanDraft): PlanDraft => ({
		...draft,
		assignments: draft.assignments.filter(
			(a) =>
				!(
					a.draftDishId === draftDishId &&
					a.day === day &&
					a.mealType === mealType
				),
		),
	});

// ============================================================================
// Derived data helpers (pure selectors)
// ============================================================================

/** Get assignments for a specific day and meal type */
export const getSlotAssignments = (
	draft: PlanDraft,
	day: string,
	mealType: string,
): readonly DraftAssignment[] =>
	draft.assignments.filter((a) => a.day === day && a.mealType === mealType);

/** Get all assignments for a specific dish */
export const getDishAssignments = (
	draft: PlanDraft,
	draftDishId: string,
): readonly DraftAssignment[] =>
	draft.assignments.filter((a) => a.draftDishId === draftDishId);

/** Get dishes with zero assignments */
export const getUnassignedDishes = (draft: PlanDraft): readonly DraftDish[] => {
	const assignedIds = new Set(draft.assignments.map((a) => a.draftDishId));
	return draft.dishes.filter((d) => !assignedIds.has(d.id));
};

/** Count of dishes that have at least one assignment */
export const countAssignedDishes = (draft: PlanDraft): number => {
	const assignedIds = new Set(draft.assignments.map((a) => a.draftDishId));
	return assignedIds.size;
};

/** Find a draft dish by its id */
export const findDraftDish = (
	draft: PlanDraft,
	dishId: string,
): DraftDish | undefined => draft.dishes.find((d) => d.id === dishId);

/** Check if a dish is already collected (by Convex dishId) */
export const isDishCollected = (
	draft: PlanDraft,
	convexDishId: string,
): boolean => draft.dishes.some((d) => d.dishId === convexDishId);

// ============================================================================
// Copy previous week transform
// ============================================================================

interface MealLike {
	readonly day: string;
	readonly mealType: MealType;
	readonly componentRole?: MealComponentRole;
	readonly dishId?: Id<"dishes">;
	readonly customName?: string;
	readonly servingsUsed: number;
	readonly servingsMade?: number;
	readonly isLeftover: boolean;
	readonly dish?: {
		readonly name: string;
		readonly defaultServings?: number;
	} | null;
}

/**
 * Convert a period's meals into draft dishes + assignments for a new period.
 * Maps day offsets from the source start to the target start.
 */
export const mealsToDraft = ({
	meals,
	sourceStart: sourceStartKey,
	targetStart: targetStartKey,
	numDays = DEFAULT_NUM_DAYS,
}: {
	meals: readonly MealLike[];
	sourceStart: string;
	targetStart: string;
	numDays?: number;
}): PlanDraft => {
	const sourceStart = new Date(sourceStartKey);
	const targetStart = new Date(targetStartKey);

	const uid = () => crypto.randomUUID();

	const dishIdMap = new Map<string, string>();

	const dishes: DraftDish[] = meals
		.filter((m) => !m.isLeftover)
		.map((m) => {
			const id = uid();
			const key = m.dishId ?? m.customName ?? id;
			if (!dishIdMap.has(key)) dishIdMap.set(key, id);

			return {
				id: dishIdMap.get(key) ?? id,
				type: m.dishId ? "library" : "custom",
				dishId: m.dishId,
				customName: m.customName,
				name: m.dish?.name ?? m.customName ?? "Unknown",
				servings: m.dish?.defaultServings ?? m.servingsUsed,
				servingsMade: m.servingsMade,
				role: m.componentRole ?? "main",
			};
		});

	const uniqueDishes = [...new Map(dishes.map((d) => [d.id, d])).values()];

	const assignments: DraftAssignment[] = meals
		.filter((m) => !m.isLeftover)
		.map((m) => {
			const sourceDate = new Date(m.day);
			const dayOffset = Math.round(
				(sourceDate.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24),
			);
			const targetDate = new Date(targetStart);
			targetDate.setDate(targetDate.getDate() + dayOffset);
			const targetDay = targetDate.toISOString().split("T")[0];

			const key = m.dishId ?? m.customName ?? "";
			return {
				draftDishId: dishIdMap.get(key) ?? "",
				day: targetDay,
				mealType: m.mealType,
				role: m.componentRole ?? "main",
				servingsUsed: m.servingsUsed,
				servingsMade: m.servingsMade,
				isLeftover: false,
			};
		})
		.filter((a) => a.draftDishId !== "");

	return {
		startDate: targetStartKey,
		numDays,
		dishes: uniqueDishes,
		assignments,
	};
};
