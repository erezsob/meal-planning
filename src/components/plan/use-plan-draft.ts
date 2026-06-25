import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { HOUSEHOLD_ID, type MealType } from "@/lib/constants";
import { err, ok, type Result, tryCatch } from "@/lib/fp";
import {
	addAssignment,
	addDish,
	createEmptyDraft,
	removeAssignment,
	removeDish,
} from "./draft-transforms";
import type { DraftAssignment, DraftDish, PlanDraft } from "./types";

/** localStorage key prefix for plan drafts */
const PLAN_DRAFT_KEY_PREFIX = "plan-draft";

/** Build the storage key for a date range */
const storageKey = (startDate: string, numDays: number): string =>
	`${PLAN_DRAFT_KEY_PREFIX}-${startDate}-${numDays}`;

// ============================================================================
// localStorage helpers (pure, side-effect-isolated)
// ============================================================================

/** Read a draft from localStorage */
const readDraft = (key: string): Result<PlanDraft | null, string> =>
	tryCatch(
		() => {
			const raw = localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as PlanDraft) : null;
		},
		() => "Failed to read plan draft from storage",
	);

/** Write a draft to localStorage */
const writeDraft = (key: string, draft: PlanDraft): void => {
	try {
		localStorage.setItem(key, JSON.stringify(draft));
	} catch {
		// Silently fail on storage quota errors
	}
};

/** Remove a draft from localStorage */
const clearDraftStorage = (key: string): void => {
	localStorage.removeItem(key);
};

/** Check if a non-empty draft exists for a given date range (no state change) */
export const hasDraftForRange = (
	startDate: string,
	numDays: number,
): boolean => {
	const result = readDraft(storageKey(startDate, numDays));
	if (!result.ok || result.value === null) return false;
	const d = result.value;
	return d.dishes.length > 0 || d.assignments.length > 0;
};

/** Load or create a draft for a given date range */
const loadOrCreate = (startDate: string, numDays: number): PlanDraft => {
	const result = readDraft(storageKey(startDate, numDays));
	return result.ok && result.value !== null
		? result.value
		: createEmptyDraft(startDate, numDays);
};

// ============================================================================
// Hook
// ============================================================================

/** Return type for the plan draft hook */
export interface UsePlanDraftReturn {
	/** Current draft state */
	readonly draft: PlanDraft;
	/** Add a dish to the collection */
	readonly collectDish: (dish: DraftDish) => void;
	/** Remove a dish (and its assignments) from the draft */
	readonly uncollectDish: (dishId: string) => void;
	/** Assign a dish to a day/meal slot */
	readonly assignDish: (assignment: DraftAssignment) => void;
	/** Remove an assignment */
	readonly unassignDish: (params: {
		draftDishId: string;
		day: string;
		mealType: MealType;
	}) => void;
	/** Commit the draft to Convex and clear storage */
	readonly commitPlan: () => Promise<Result<number, string>>;
	/** Discard the draft entirely */
	readonly discardDraft: () => void;
	/** Replace the entire draft (used by Copy Last Week) */
	readonly loadEntireDraft: (draft: PlanDraft) => void;
}

/**
 * Manages a local plan draft with localStorage persistence.
 * All state updates are immutable via pure transform functions.
 * Persists to localStorage on every mutation (no useEffect).
 */
export function usePlanDraft(
	startDate: string,
	numDays: number,
): UsePlanDraftReturn {
	const key = storageKey(startDate, numDays);

	const [draft, setDraftRaw] = useState<PlanDraft>(() =>
		loadOrCreate(startDate, numDays),
	);

	// Reload from storage when date range changes (no useEffect)
	if (draft.startDate !== startDate || draft.numDays !== numDays) {
		const loaded = loadOrCreate(startDate, numDays);
		setDraftRaw(loaded);
	}

	const updateDraft = useCallback(
		(transform: (prev: PlanDraft) => PlanDraft) => {
			setDraftRaw((prev) => {
				const next = transform(prev);
				writeDraft(key, next);
				return next;
			});
		},
		[key],
	);

	const collectDish = useCallback(
		(dish: DraftDish) => updateDraft(addDish(dish)),
		[updateDraft],
	);

	const uncollectDish = useCallback(
		(dishId: string) => updateDraft(removeDish(dishId)),
		[updateDraft],
	);

	const assignDishAction = useCallback(
		(assignment: DraftAssignment) => updateDraft(addAssignment(assignment)),
		[updateDraft],
	);

	const unassignDish = useCallback(
		(params: { draftDishId: string; day: string; mealType: MealType }) =>
			updateDraft(removeAssignment(params)),
		[updateDraft],
	);

	const planMealBatch = useMutation(api.mealPlans.planMealBatch);
	const createQuickDish = useMutation(api.dishes.createQuick);

	/** Persist custom dishes to the DB and return a map of draftDishId → dishId */
	const persistCustomDishes = useCallback(
		async (
			dishes: readonly DraftDish[],
		): Promise<Map<string, DraftDish["dishId"]>> => {
			const customDishes = dishes.filter((d) => d.type === "custom");
			const entries = await Promise.all(
				customDishes.map(async (d) => {
					const dishId = await createQuickDish({
						name: d.name,
						householdId: HOUSEHOLD_ID,
						defaultServings: d.servings,
					});
					return [d.id, dishId] as const;
				}),
			);
			return new Map(entries);
		},
		[createQuickDish],
	);

	const commitPlan = useCallback(async (): Promise<Result<number, string>> => {
		if (draft.assignments.length === 0) {
			return err("No meals to commit");
		}

		try {
			const customDishIds = await persistCustomDishes(draft.dishes);

			const meals = draft.assignments.map((a) => {
				const dish = draft.dishes.find((d) => d.id === a.draftDishId);
				const resolvedDishId = customDishIds.get(a.draftDishId) ?? dish?.dishId;
				return {
					day: a.day,
					mealType: a.mealType,
					componentRole: a.role,
					dishId: resolvedDishId,
					customName: dish?.customName,
					servingsUsed: a.servingsUsed,
					servingsMade: a.servingsMade,
					isLeftover: a.isLeftover,
					sourceMealId: dish?.sourceMealId,
				};
			});

			const ids = await planMealBatch({ meals, householdId: HOUSEHOLD_ID });
			clearDraftStorage(key);
			setDraftRaw(createEmptyDraft(startDate, numDays));
			return ok(ids.length);
		} catch {
			return err("Failed to commit plan. Please try again.");
		}
	}, [draft, key, startDate, numDays, planMealBatch, persistCustomDishes]);

	const discardDraft = useCallback(() => {
		clearDraftStorage(key);
		setDraftRaw(createEmptyDraft(startDate, numDays));
	}, [key, startDate, numDays]);

	const loadEntireDraft = useCallback(
		(newDraft: PlanDraft) => {
			setDraftRaw(newDraft);
			writeDraft(key, newDraft);
		},
		[key],
	);

	return {
		draft,
		collectDish,
		uncollectDish,
		assignDish: assignDishAction,
		unassignDish,
		commitPlan,
		discardDraft,
		loadEntireDraft,
	};
}
