import { err, ok, type Result } from "@/lib/fp";
import {
	createDefaultWeekPlan,
	createEmptyCell,
	WEEK_PLAN_EXPORT_VERSION,
	WEEK_PLAN_STORAGE_KEY,
	WEEKDAY_KEYS,
	type WeekPlan,
	type WeekPlanCell,
	type WeekPlanExport,
} from "@/lib/weekPlanTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWeekPlanCell(value: unknown): value is WeekPlanCell {
	return (
		isRecord(value) &&
		typeof value.dish === "string" &&
		typeof value.grocery === "string"
	);
}

function isWeekPlan(value: unknown): value is WeekPlan {
	if (!isRecord(value)) return false;

	const weekdays = value.weekdays;
	if (!isRecord(weekdays)) return false;

	for (const key of WEEKDAY_KEYS) {
		if (!isWeekPlanCell(weekdays[key])) return false;
	}

	if (!isWeekPlanCell(value.weeklyLunch)) return false;
	if (!isWeekPlanCell(value.weeklyBreakfast)) return false;
	if (!Array.isArray(value.backlog)) return false;

	return value.backlog.every(isWeekPlanCell);
}

/**
 * Load the week plan from localStorage, or return the default empty plan.
 */
export function loadWeekPlan(): WeekPlan {
	if (typeof window === "undefined") {
		return createDefaultWeekPlan();
	}

	try {
		const raw = localStorage.getItem(WEEK_PLAN_STORAGE_KEY);
		if (!raw) return createDefaultWeekPlan();

		const parsed: unknown = JSON.parse(raw);
		return isWeekPlan(parsed) ? parsed : createDefaultWeekPlan();
	} catch {
		return createDefaultWeekPlan();
	}
}

/**
 * Persist the week plan to localStorage.
 */
export function saveWeekPlan(plan: WeekPlan): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(WEEK_PLAN_STORAGE_KEY, JSON.stringify(plan));
}

/**
 * Build export JSON for clipboard copy.
 */
export function serializeWeekPlanExport(plan: WeekPlan): string {
	const payload: WeekPlanExport = {
		version: WEEK_PLAN_EXPORT_VERSION,
		plan,
	};
	return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate imported week plan JSON.
 */
export function parseWeekPlanImport(json: string): Result<WeekPlan, string> {
	let parsed: unknown;

	try {
		parsed = JSON.parse(json);
	} catch {
		return err("Invalid JSON");
	}

	if (!isRecord(parsed)) {
		return err("Expected a JSON object");
	}

	if (parsed.version !== WEEK_PLAN_EXPORT_VERSION) {
		return err(`Unsupported version (expected ${WEEK_PLAN_EXPORT_VERSION})`);
	}

	if (!isWeekPlan(parsed.plan)) {
		return err("Invalid week plan structure");
	}

	return ok(parsed.plan);
}

/**
 * Update a single cell field immutably.
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

/** Add an empty backlog row */
export function addBacklogRow(plan: WeekPlan): WeekPlan {
	return {
		...plan,
		backlog: [...plan.backlog, createEmptyCell()],
	};
}

/** Remove a backlog row by index */
export function removeBacklogRow(plan: WeekPlan, index: number): WeekPlan {
	return {
		...plan,
		backlog: plan.backlog.filter((_, i) => i !== index),
	};
}
