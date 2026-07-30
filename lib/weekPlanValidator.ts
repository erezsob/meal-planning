import { v } from "convex/values";
import { isRecord } from "./typeGuards";
import {
	type CustomPlanRow,
	WEEKDAY_KEYS,
	type WeekPlan,
	type WeekPlanCell,
} from "./weekPlanTypes";

const weekPlanCellValidator = v.object({
	dish: v.string(),
	grocery: v.string(),
});

const customPlanRowValidator = v.object({
	category: v.string(),
	dish: v.string(),
	grocery: v.string(),
});

/** Convex validator for main grid content (no custom plan rows) */
export const mainGridContentValidator = v.object({
	weekdays: v.object({
		saturday: weekPlanCellValidator,
		sunday: weekPlanCellValidator,
		monday: weekPlanCellValidator,
		tuesday: weekPlanCellValidator,
		wednesday: weekPlanCellValidator,
		thursday: weekPlanCellValidator,
		friday: weekPlanCellValidator,
	}),
	weeklyLunch: weekPlanCellValidator,
	weeklyBreakfast: weekPlanCellValidator,
	backlog: v.array(weekPlanCellValidator),
});

/** Convex validator for custom plans section content */
export const customPlansContentValidator = v.object({
	rows: v.array(customPlanRowValidator),
});

/** Convex validator for the full week plan document shape */
export const weekPlanValidator = v.object({
	weekdays: v.object({
		saturday: weekPlanCellValidator,
		sunday: weekPlanCellValidator,
		monday: weekPlanCellValidator,
		tuesday: weekPlanCellValidator,
		wednesday: weekPlanCellValidator,
		thursday: weekPlanCellValidator,
		friday: weekPlanCellValidator,
	}),
	weeklyLunch: weekPlanCellValidator,
	weeklyBreakfast: weekPlanCellValidator,
	backlog: v.array(weekPlanCellValidator),
	customPlan: v.optional(v.array(customPlanRowValidator)),
});

function isWeekPlanCell(value: unknown): value is WeekPlanCell {
	return (
		isRecord(value) &&
		typeof value.dish === "string" &&
		typeof value.grocery === "string"
	);
}

function isCustomPlanRow(value: unknown): value is CustomPlanRow {
	return (
		isRecord(value) &&
		typeof value.category === "string" &&
		typeof value.dish === "string" &&
		typeof value.grocery === "string"
	);
}

/**
 * Runtime type guard for untrusted week plan payloads (e.g. import).
 *
 * @param value - Value to validate
 * @returns Whether value is a valid WeekPlan
 */
export function isWeekPlan(value: unknown): value is WeekPlan {
	if (!isRecord(value)) return false;

	const weekdays = value.weekdays;
	if (!isRecord(weekdays)) return false;

	for (const key of WEEKDAY_KEYS) {
		if (!isWeekPlanCell(weekdays[key])) return false;
	}

	if (!isWeekPlanCell(value.weeklyLunch)) return false;
	if (!isWeekPlanCell(value.weeklyBreakfast)) return false;
	if (!Array.isArray(value.backlog)) return false;
	if (!value.backlog.every(isWeekPlanCell)) return false;

	if (value.customPlan !== undefined) {
		if (!Array.isArray(value.customPlan)) return false;
		if (!value.customPlan.every(isCustomPlanRow)) return false;
	}

	return true;
}
