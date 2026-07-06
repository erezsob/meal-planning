import { describe, expect, it } from "vitest";
import { validateLogMealInput } from "./logMealValidation";

describe("validateLogMealInput", () => {
	const today = new Date().toISOString().split("T")[0];

	it("accepts dishId only", () => {
		expect(() =>
			validateLogMealInput({
				day: today,
				dishId: "dish-1" as never,
			}),
		).not.toThrow();
	});

	it("accepts customName only", () => {
		expect(() =>
			validateLogMealInput({ day: today, customName: "Takeout" }),
		).not.toThrow();
	});

	it("rejects when both dishId and customName are provided", () => {
		expect(() =>
			validateLogMealInput({
				day: today,
				dishId: "dish-1" as never,
				customName: "Takeout",
			}),
		).toThrow("Provide either dishId or customName");
	});

	it("rejects when neither dishId nor customName is provided", () => {
		expect(() => validateLogMealInput({ day: today })).toThrow(
			"Provide either dishId or customName",
		);
	});

	it("rejects empty customName", () => {
		expect(() =>
			validateLogMealInput({ day: today, customName: "   " }),
		).toThrow("Provide either dishId or customName");
	});

	it("rejects future dates", () => {
		expect(() =>
			validateLogMealInput({ day: "2099-01-01", customName: "Lunch" }),
		).toThrow("Cannot log meals for future dates");
	});
});
