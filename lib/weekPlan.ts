import {
	type CustomPlanRow,
	type CustomPlansContent,
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
	createDefaultWeekPlan,
	createEmptyCell,
	createEmptyCustomPlanRow,
	DEFAULT_CUSTOM_PLAN_ROW_COUNT,
	type MainGridContent,
	type StoredWeekPlan,
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
 * Split a combined week plan into main grid and custom plans content.
 *
 * @param plan - Full week plan
 * @returns Main grid and custom plans content stored separately
 */
export function splitWeekPlan(plan: WeekPlan): {
	main: MainGridContent;
	customPlans: CustomPlansContent;
} {
	const { customPlan, ...main } = plan;
	return {
		main,
		customPlans: { rows: customPlan },
	};
}

/**
 * Combine main grid and custom plans content into a full week plan.
 *
 * @param main - Main grid content
 * @param customPlans - Custom plans content
 * @returns Combined week plan for UI and legacy callers
 */
export function joinWeekPlan(
	main: MainGridContent,
	customPlans: CustomPlansContent,
): WeekPlan {
	return {
		...main,
		customPlan: customPlans.rows,
	};
}

/**
 * Normalize main grid content from remote storage.
 *
 * @param content - Remote main grid or null
 * @returns Main grid with guaranteed backlog rows
 */
export function normalizeMainGridContent(
	content: MainGridContent | null,
): MainGridContent {
	if (!content) {
		return createDefaultMainGridContent();
	}
	return content;
}

/**
 * Normalize custom plans content from remote storage.
 *
 * @param content - Remote custom plans or null
 * @returns Custom plans with guaranteed row count
 */
export function normalizeCustomPlansContent(
	content: CustomPlansContent | null,
): CustomPlansContent {
	if (!content) {
		return createDefaultCustomPlansContent();
	}

	const rows =
		content.rows.length > 0
			? content.rows
			: Array.from({ length: DEFAULT_CUSTOM_PLAN_ROW_COUNT }, () =>
					createEmptyCustomPlanRow(),
				);

	return { rows };
}

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

export type CustomPlanField = keyof CustomPlanRow;

/**
 * Normalize a week plan from remote storage — fills missing custom plan rows.
 *
 * @param plan - Remote plan or null
 * @returns Plan with guaranteed customPlan array
 */
export function normalizeWeekPlan(plan: StoredWeekPlan | null): WeekPlan {
	if (!plan) {
		return createDefaultWeekPlan();
	}

	const customPlan =
		plan.customPlan !== undefined && plan.customPlan.length > 0
			? plan.customPlan
			: Array.from({ length: DEFAULT_CUSTOM_PLAN_ROW_COUNT }, () =>
					createEmptyCustomPlanRow(),
				);

	return { ...plan, customPlan };
}

/**
 * Update a single custom plan cell field immutably.
 *
 * @param params.plan - Current week plan
 * @param params.index - Row index to update
 * @param params.field - Row field to change
 * @param params.value - New field value
 * @returns New week plan with the row updated
 */
export function updateCustomPlanCell({
	plan,
	index,
	field,
	value,
}: {
	plan: WeekPlan;
	index: number;
	field: CustomPlanField;
	value: string;
}): WeekPlan {
	return {
		...plan,
		customPlan: plan.customPlan.map((row, i) =>
			i === index ? { ...row, [field]: value } : row,
		),
	};
}

/**
 * Add an empty custom plan row.
 *
 * @param plan - Current week plan
 * @returns New week plan with one additional empty custom plan row
 */
export function addCustomPlanRow(plan: WeekPlan): WeekPlan {
	return {
		...plan,
		customPlan: [...plan.customPlan, createEmptyCustomPlanRow()],
	};
}

/**
 * Remove a custom plan row by index.
 *
 * @param plan - Current week plan
 * @param index - Custom plan row index to remove
 * @returns New week plan without the row at index
 */
export function removeCustomPlanRow(plan: WeekPlan, index: number): WeekPlan {
	return {
		...plan,
		customPlan: plan.customPlan.filter((_, i) => i !== index),
	};
}

/**
 * Reset custom plan rows to the default empty row count.
 *
 * @param plan - Current week plan
 * @returns New week plan with custom plan rows cleared
 */
export function clearCustomPlan(plan: WeekPlan): WeekPlan {
	return joinWeekPlan(plan, createDefaultCustomPlansContent());
}

/**
 * Reset custom plans content to the default empty row count.
 *
 * @param content - Current custom plans content
 * @returns Cleared custom plans content
 */
export function clearCustomPlansContent(
	_content: CustomPlansContent,
): CustomPlansContent {
	return createDefaultCustomPlansContent();
}
