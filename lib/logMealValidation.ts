import { invalidDate, invalidLogMealInput, type MealPlanError } from "./errors";
import { err, ok, type Result, unwrapResult } from "./fp";

export interface LogMealInput {
	day: string;
	dishId?: string;
	customName?: string;
}

/**
 * Validate log/edit meal input: exactly one of dishId or customName, no future dates.
 */
export function validateLogMealInput(
	args: LogMealInput,
): Result<void, MealPlanError> {
	const hasDish = args.dishId !== undefined;
	const hasCustom =
		args.customName !== undefined && args.customName.trim() !== "";
	if (hasDish === hasCustom) {
		return err(invalidLogMealInput("Provide either dishId or customName"));
	}

	const today = new Date().toISOString().split("T")[0];
	if (args.day > today) {
		return err(invalidDate("Cannot log meals for future dates"));
	}

	return ok(undefined);
}

/**
 * Validate log/edit meal input at a Convex or UI boundary (throws on failure).
 */
export function assertLogMealInput(args: LogMealInput): void {
	unwrapResult(validateLogMealInput(args));
}
