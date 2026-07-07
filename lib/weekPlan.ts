import {
	createEmptyCell,
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
