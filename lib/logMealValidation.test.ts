import { describe, expect, it } from "vitest";
import { assertLogMealInput, validateLogMealInput } from "./logMealValidation";

describe("validateLogMealInput", () => {
	const today = new Date().toISOString().split("T")[0];

	it("accepts dishId only", () => {
		expect(
			validateLogMealInput({
				day: today,
				dishId: "dish-1",
			}).ok,
		).toBe(true);
	});

	it("accepts customName only", () => {
		expect(validateLogMealInput({ day: today, customName: "Takeout" }).ok).toBe(
			true,
		);
	});

	it("rejects when both dishId and customName are provided", () => {
		const result = validateLogMealInput({
			day: today,
			dishId: "dish-1",
			customName: "Takeout",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe("Provide either dishId or customName");
		}
		expect.assertions(2);
	});

	it("rejects when neither dishId nor customName is provided", () => {
		const result = validateLogMealInput({ day: today });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe("Provide either dishId or customName");
		}
		expect.assertions(2);
	});

	it("rejects empty customName", () => {
		const result = validateLogMealInput({ day: today, customName: "   " });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe("Provide either dishId or customName");
		}
		expect.assertions(2);
	});

	it("rejects future dates", () => {
		const result = validateLogMealInput({
			day: "2099-01-01",
			customName: "Lunch",
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.message).toBe("Cannot log meals for future dates");
		}
		expect.assertions(2);
	});
});

describe("assertLogMealInput", () => {
	const today = new Date().toISOString().split("T")[0];

	it("throws validation errors at boundaries", () => {
		expect(() => assertLogMealInput({ day: today })).toThrow(
			"Provide either dishId or customName",
		);
	});
});
