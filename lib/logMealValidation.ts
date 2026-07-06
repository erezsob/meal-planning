export interface LogMealInput {
	day: string;
	dishId?: string;
	customName?: string;
}

/**
 * Validate log/edit meal input: exactly one of dishId or customName, no future dates.
 */
export function validateLogMealInput(args: LogMealInput): void {
	const hasDish = args.dishId !== undefined;
	const hasCustom =
		args.customName !== undefined && args.customName.trim() !== "";
	if (hasDish === hasCustom) {
		throw new Error("Provide either dishId or customName");
	}

	const today = new Date().toISOString().split("T")[0];
	if (args.day > today) {
		throw new Error("Cannot log meals for future dates");
	}
}
