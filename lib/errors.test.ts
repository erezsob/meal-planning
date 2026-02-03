import { describe, expect, it } from "vitest";
import {
	conditionTimeout,
	dbNotReady,
	dbTimeout,
	dishNotFound,
	getErrorMessage,
	insufficientServings,
	invalidDate,
	isDbError,
	isMealPlanError,
	isWaitError,
	maxRetriesExceeded,
	mealConflict,
	queryFailed,
	toError,
} from "./errors";

// ============================================================================
// Error Constructors
// ============================================================================

describe("Error constructors", () => {
	describe("DbError constructors", () => {
		it("dbNotReady creates DB_NOT_READY error with default message", () => {
			const error = dbNotReady();
			expect(error).toEqual({
				type: "DB_NOT_READY",
				message: "Database not initialized",
			});
		});

		it("dbNotReady accepts custom message", () => {
			const error = dbNotReady("Custom not ready");
			expect(error.message).toBe("Custom not ready");
		});

		it("queryFailed creates QUERY_FAILED error", () => {
			const error = queryFailed("Select failed");
			expect(error).toEqual({
				type: "QUERY_FAILED",
				message: "Select failed",
				cause: undefined,
			});
		});

		it("queryFailed includes cause when provided", () => {
			const cause = new Error("underlying");
			const error = queryFailed("Query error", cause);
			expect(error.type).toBe("QUERY_FAILED");
			if (error.type === "QUERY_FAILED") {
				expect(error.cause).toBe(cause);
			}
		});

		it("dbTimeout creates TIMEOUT error", () => {
			const error = dbTimeout();
			expect(error).toEqual({
				type: "TIMEOUT",
				message: "Database operation timed out",
			});
		});
	});

	describe("MealPlanError constructors", () => {
		it("dishNotFound creates DISH_NOT_FOUND error", () => {
			const error = dishNotFound("dish-123");
			expect(error).toEqual({
				type: "DISH_NOT_FOUND",
				message: "Dish not found: dish-123",
				dishId: "dish-123",
			});
		});

		it("insufficientServings creates INSUFFICIENT_SERVINGS error", () => {
			const error = insufficientServings(2, 5);
			expect(error).toEqual({
				type: "INSUFFICIENT_SERVINGS",
				message: "Only 2 servings available, 5 requested",
				available: 2,
				requested: 5,
			});
		});

		it("mealConflict creates MEAL_CONFLICT error", () => {
			const error = mealConflict("2026-01-29", "dinner");
			expect(error).toEqual({
				type: "MEAL_CONFLICT",
				message: "Meal already exists for dinner on 2026-01-29",
				day: "2026-01-29",
				mealType: "dinner",
			});
		});

		it("invalidDate creates INVALID_DATE error", () => {
			const error = invalidDate("Invalid format");
			expect(error).toEqual({
				type: "INVALID_DATE",
				message: "Invalid format",
			});
		});
	});

	describe("WaitError constructors", () => {
		it("conditionTimeout creates CONDITION_TIMEOUT error", () => {
			const error = conditionTimeout(5);
			expect(error).toEqual({
				type: "CONDITION_TIMEOUT",
				message: "Condition not met after 5 attempts",
				attempts: 5,
			});
		});

		it("maxRetriesExceeded creates MAX_RETRIES_EXCEEDED error - singular", () => {
			const error = maxRetriesExceeded(1);
			expect(error.message).toBe("Operation failed after 1 retry attempt");
		});

		it("maxRetriesExceeded creates MAX_RETRIES_EXCEEDED error - plural", () => {
			const error = maxRetriesExceeded(3);
			expect(error.message).toBe("Operation failed after 3 retry attempts");
		});

		it("maxRetriesExceeded includes lastError when provided", () => {
			const lastError = new Error("last");
			const error = maxRetriesExceeded(2, lastError);
			expect(error.type).toBe("MAX_RETRIES_EXCEEDED");
			if (error.type === "MAX_RETRIES_EXCEEDED") {
				expect(error.lastError).toBe(lastError);
			}
		});
	});
});

// ============================================================================
// Error Utilities
// ============================================================================

describe("Error utilities", () => {
	describe("toError", () => {
		it("returns Error instance unchanged", () => {
			const original = new Error("test");
			expect(toError(original)).toBe(original);
		});

		it("wraps string in Error", () => {
			const result = toError("string error");
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("string error");
		});

		it("wraps number in Error", () => {
			const result = toError(42);
			expect(result.message).toBe("42");
		});

		it("wraps object in Error", () => {
			const result = toError({ foo: "bar" });
			expect(result.message).toBe("[object Object]");
		});
	});

	describe("getErrorMessage", () => {
		it("returns message from domain error", () => {
			const error = dishNotFound("dish-1");
			expect(getErrorMessage(error)).toBe("Dish not found: dish-1");
		});

		it("returns message from standard Error", () => {
			const error = new Error("standard error");
			expect(getErrorMessage(error)).toBe("standard error");
		});

		it("returns string error directly", () => {
			expect(getErrorMessage("string error")).toBe("string error");
		});

		it("returns 'Unknown error' for null", () => {
			expect(getErrorMessage(null)).toBe("Unknown error");
		});

		it("returns 'Unknown error' for undefined", () => {
			expect(getErrorMessage(undefined)).toBe("Unknown error");
		});

		it("converts other types to string", () => {
			expect(getErrorMessage(42)).toBe("42");
		});
	});

	describe("isDbError", () => {
		it("returns true for DB_NOT_READY", () => {
			expect(isDbError(dbNotReady())).toBe(true);
		});

		it("returns true for QUERY_FAILED", () => {
			expect(isDbError(queryFailed("test"))).toBe(true);
		});

		it("returns true for TIMEOUT", () => {
			expect(isDbError(dbTimeout())).toBe(true);
		});

		it("returns false for MealPlanError", () => {
			expect(isDbError(dishNotFound("id"))).toBe(false);
		});

		it("returns false for non-error objects", () => {
			expect(isDbError({ type: "UNKNOWN", message: "test" })).toBe(false);
		});

		it("returns false for null", () => {
			expect(isDbError(null)).toBe(false);
		});
	});

	describe("isMealPlanError", () => {
		it("returns true for DISH_NOT_FOUND", () => {
			expect(isMealPlanError(dishNotFound("id"))).toBe(true);
		});

		it("returns true for INSUFFICIENT_SERVINGS", () => {
			expect(isMealPlanError(insufficientServings(1, 2))).toBe(true);
		});

		it("returns true for MEAL_CONFLICT", () => {
			expect(isMealPlanError(mealConflict("2026-01-01", "lunch"))).toBe(true);
		});

		it("returns true for INVALID_DATE", () => {
			expect(isMealPlanError(invalidDate("bad"))).toBe(true);
		});

		it("returns false for DbError", () => {
			expect(isMealPlanError(dbNotReady())).toBe(false);
		});
	});

	describe("isWaitError", () => {
		it("returns true for CONDITION_TIMEOUT", () => {
			expect(isWaitError(conditionTimeout(3))).toBe(true);
		});

		it("returns true for MAX_RETRIES_EXCEEDED", () => {
			expect(isWaitError(maxRetriesExceeded(5))).toBe(true);
		});

		it("returns false for DbError", () => {
			expect(isWaitError(dbTimeout())).toBe(false);
		});
	});
});
