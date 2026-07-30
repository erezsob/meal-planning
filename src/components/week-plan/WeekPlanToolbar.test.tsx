import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeekPlanToolbar } from "./WeekPlanToolbar";

describe("WeekPlanToolbar", () => {
	const onClear = vi.fn();
	const onNewWeeklyPlan = vi.fn();

	it("calls onClear when confirming clear plan", () => {
		render(
			<WeekPlanToolbar onClear={onClear} onNewWeeklyPlan={onNewWeeklyPlan} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it("calls onNewWeeklyPlan when confirming new weekly plan", () => {
		render(
			<WeekPlanToolbar onClear={onClear} onNewWeeklyPlan={onNewWeeklyPlan} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /New weekly plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /New weekly plan/i,
			}),
		);

		expect(onNewWeeklyPlan).toHaveBeenCalledTimes(1);
	});
});
