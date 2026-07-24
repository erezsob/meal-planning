import {
	type CustomCategoryRow,
	createDefaultWeekPlan,
	createEmptyCell,
	createEmptyCustomCategoryRow,
	DEFAULT_CUSTOM_CATEGORY_ROW_COUNT,
	type WEEKDAY_KEYS,
	type WeekPlan,
	type WeekPlanCell,
} from "./weekPlanTypes";

/**
 * Update a single cell field immutably.
 *
 * @param params.plan - Current week plan
 * @param params.location - Which cell to update (weekday, weekly row, or backlog index)
 * @param params.field - Cell field to change (`dish` or `grocery`)
 * @param params.value - New field value
 * @returns New week plan with the cell updated
 */
export function updateWeekPlanCell({
	plan,
	location,
	field,
	value,
}: {
	plan: WeekPlan;
	location: WeekPlanCellLocation;
	field: keyof WeekPlanCell;
	value: string;
}): WeekPlan {
	if (location.type === "weekday") {
		return {
			...plan,
			weekdays: {
				...plan.weekdays,
				[location.key]: {
					...plan.weekdays[location.key],
					[field]: value,
				},
			},
		};
	}

	if (location.type === "weekly") {
		const weeklyKey =
			location.key === "lunch" ? "weeklyLunch" : "weeklyBreakfast";
		return {
			...plan,
			[weeklyKey]: {
				...plan[weeklyKey],
				[field]: value,
			},
		};
	}

	return {
		...plan,
		backlog: plan.backlog.map((cell, index) =>
			index === location.index ? { ...cell, [field]: value } : cell,
		),
	};
}

export type WeekPlanCellLocation =
	| { type: "weekday"; key: (typeof WEEKDAY_KEYS)[number] }
	| { type: "weekly"; key: "lunch" | "breakfast" }
	| { type: "backlog"; index: number };

/**
 * Add an empty backlog row.
 *
 * @param plan - Current week plan
 * @returns New week plan with one additional empty backlog row
 */
export function addBacklogRow(plan: WeekPlan): WeekPlan {
	return {
		...plan,
		backlog: [...plan.backlog, createEmptyCell()],
	};
}

/**
 * Remove a backlog row by index.
 *
 * @param plan - Current week plan
 * @param index - Backlog row index to remove
 * @returns New week plan without the row at index
 */
export function removeBacklogRow(plan: WeekPlan, index: number): WeekPlan {
	return {
		...plan,
		backlog: plan.backlog.filter((_, i) => i !== index),
	};
}

export type CustomCategoryField = keyof CustomCategoryRow;

/**
 * Normalize a week plan from remote storage — fills missing custom categories.
 *
 * @param plan - Remote plan or null
 * @returns Plan with guaranteed customCategories array
 */
export function normalizeWeekPlan(plan: WeekPlan | null): WeekPlan {
	if (!plan) {
		return createDefaultWeekPlan();
	}

	const customCategories =
		plan.customCategories?.length > 0
			? plan.customCategories
			: Array.from({ length: DEFAULT_CUSTOM_CATEGORY_ROW_COUNT }, () =>
					createEmptyCustomCategoryRow(),
				);

	return { ...plan, customCategories };
}

/**
 * Update a single custom category cell field immutably.
 *
 * @param params.plan - Current week plan
 * @param params.index - Row index to update
 * @param params.field - Row field to change
 * @param params.value - New field value
 * @returns New week plan with the row updated
 */
export function updateCustomCategoryCell({
	plan,
	index,
	field,
	value,
}: {
	plan: WeekPlan;
	index: number;
	field: CustomCategoryField;
	value: string;
}): WeekPlan {
	return {
		...plan,
		customCategories: plan.customCategories.map((row, i) =>
			i === index ? { ...row, [field]: value } : row,
		),
	};
}

/**
 * Add an empty custom category row.
 *
 * @param plan - Current week plan
 * @returns New week plan with one additional empty custom category row
 */
export function addCustomCategoryRow(plan: WeekPlan): WeekPlan {
	return {
		...plan,
		customCategories: [
			...plan.customCategories,
			createEmptyCustomCategoryRow(),
		],
	};
}

/**
 * Remove a custom category row by index.
 *
 * @param plan - Current week plan
 * @param index - Custom category row index to remove
 * @returns New week plan without the row at index
 */
export function removeCustomCategoryRow(
	plan: WeekPlan,
	index: number,
): WeekPlan {
	return {
		...plan,
		customCategories: plan.customCategories.filter((_, i) => i !== index),
	};
}

/**
 * Reset custom categories to the default empty row count.
 *
 * @param plan - Current week plan
 * @returns New week plan with custom categories cleared
 */
export function clearCustomCategories(plan: WeekPlan): WeekPlan {
	return {
		...plan,
		customCategories: Array.from(
			{ length: DEFAULT_CUSTOM_CATEGORY_ROW_COUNT },
			() => createEmptyCustomCategoryRow(),
		),
	};
}
