import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeekPlanToolbar } from "./WeekPlanToolbar";

describe("WeekPlanToolbar", () => {
	const onClear = vi.fn();

	it("calls onClear when confirming clear plan", () => {
		render(<WeekPlanToolbar onClear={onClear} />);

		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		expect(onClear).toHaveBeenCalledTimes(1);
	});
});
