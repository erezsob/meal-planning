import { v } from "convex/values";
import {
	WEEKDAY_KEYS,
	type WeekPlan,
	type WeekPlanCell,
} from "./weekPlanTypes";

const weekPlanCellValidator = v.object({
	dish: v.string(),
	grocery: v.string(),
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
});

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

	return value.backlog.every(isWeekPlanCell);
}
