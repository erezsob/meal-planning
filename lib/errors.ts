// ============================================================================
// Domain-Specific Error Types
// ============================================================================

/**
 * Database operation errors
 */
export type DbError =
	| { readonly type: "DB_NOT_READY"; readonly message: string }
	| {
			readonly type: "QUERY_FAILED";
			readonly message: string;
			readonly cause?: unknown;
	  }
	| { readonly type: "TIMEOUT"; readonly message: string };

/**
 * Meal planning operation errors
 */
export type MealPlanError =
	| {
			readonly type: "DISH_NOT_FOUND";
			readonly message: string;
			readonly dishId: string;
	  }
	| {
			readonly type: "INSUFFICIENT_SERVINGS";
			readonly message: string;
			readonly available: number;
			readonly requested: number;
	  }
	| {
			readonly type: "MEAL_CONFLICT";
			readonly message: string;
			readonly day: string;
			readonly mealType: string;
	  }
	| { readonly type: "INVALID_DATE"; readonly message: string };

/**
 * Wait/timeout operation errors
 */
export type WaitError =
	| {
			readonly type: "CONDITION_TIMEOUT";
			readonly message: string;
			readonly attempts: number;
	  }
	| {
			readonly type: "MAX_RETRIES_EXCEEDED";
			readonly message: string;
			readonly attempts: number;
			readonly lastError?: unknown;
	  };

// ============================================================================
// Error Constructors
// ============================================================================

/**
 * Creates a DB_NOT_READY error
 */
export const dbNotReady = (message = "Database not initialized"): DbError => ({
	type: "DB_NOT_READY",
	message,
});

/**
 * Creates a QUERY_FAILED error
 */
export const queryFailed = (message: string, cause?: unknown): DbError => ({
	type: "QUERY_FAILED",
	message,
	cause,
});

/**
 * Creates a DB TIMEOUT error
 */
export const dbTimeout = (
	message = "Database operation timed out",
): DbError => ({
	type: "TIMEOUT",
	message,
});

/**
 * Creates a DISH_NOT_FOUND error
 */
export const dishNotFound = (dishId: string): MealPlanError => ({
	type: "DISH_NOT_FOUND",
	message: `Dish not found: ${dishId}`,
	dishId,
});

/**
 * Creates an INSUFFICIENT_SERVINGS error
 */
export const insufficientServings = (
	available: number,
	requested: number,
): MealPlanError => ({
	type: "INSUFFICIENT_SERVINGS",
	message: `Only ${available} servings available, ${requested} requested`,
	available,
	requested,
});

/**
 * Creates a MEAL_CONFLICT error
 */
export const mealConflict = (day: string, mealType: string): MealPlanError => ({
	type: "MEAL_CONFLICT",
	message: `Meal already exists for ${mealType} on ${day}`,
	day,
	mealType,
});

/**
 * Creates an INVALID_DATE error
 */
export const invalidDate = (message: string): MealPlanError => ({
	type: "INVALID_DATE",
	message,
});

/**
 * Creates a CONDITION_TIMEOUT wait error
 */
export const conditionTimeout = (attempts: number): WaitError => ({
	type: "CONDITION_TIMEOUT",
	message: `Condition not met after ${attempts} attempts`,
	attempts,
});

/**
 * Creates a MAX_RETRIES_EXCEEDED error
 */
export const maxRetriesExceeded = (
	attempts: number,
	lastError?: unknown,
): WaitError => ({
	type: "MAX_RETRIES_EXCEEDED",
	message: `Operation failed after ${attempts} retry ${attempts === 1 ? "attempt" : "attempts"}`,
	attempts,
	lastError,
});

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Converts an unknown error to an Error instance
 */
export const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error(String(error));

/**
 * Extracts a user-friendly message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
	if (error === null || error === undefined) {
		return "Unknown error";
	}

	// Handle our domain errors
	if (typeof error === "object" && "type" in error && "message" in error) {
		return (error as { message: string }).message;
	}

	// Handle standard Error
	if (error instanceof Error) {
		return error.message;
	}

	// Handle string errors
	if (typeof error === "string") {
		return error;
	}

	return String(error);
};

/**
 * Type guard for DbError
 */
export const isDbError = (error: unknown): error is DbError =>
	typeof error === "object" &&
	error !== null &&
	"type" in error &&
	"message" in error &&
	typeof error.message === "string" &&
	["DB_NOT_READY", "QUERY_FAILED", "TIMEOUT"].includes(
		(error as { type: string }).type,
	);

/**
 * Type guard for MealPlanError
 */
export const isMealPlanError = (error: unknown): error is MealPlanError =>
	typeof error === "object" &&
	error !== null &&
	"type" in error &&
	"message" in error &&
	typeof error.message === "string" &&
	[
		"DISH_NOT_FOUND",
		"INSUFFICIENT_SERVINGS",
		"MEAL_CONFLICT",
		"INVALID_DATE",
	].includes((error as { type: string }).type);

/**
 * Type guard for WaitError
 */
export const isWaitError = (error: unknown): error is WaitError =>
	typeof error === "object" &&
	error !== null &&
	"type" in error &&
	"message" in error &&
	typeof error.message === "string" &&
	["CONDITION_TIMEOUT", "MAX_RETRIES_EXCEEDED"].includes(
		(error as { type: string }).type,
	);
