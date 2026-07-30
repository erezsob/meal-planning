import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomPlanToolbar } from "./CustomPlanToolbar";

describe("CustomPlanToolbar", () => {
	const onClear = vi.fn();
	const onNewCustomPlan = vi.fn();

	it("calls onClear when confirming clear custom plan", () => {
		render(
			<CustomPlanToolbar onClear={onClear} onNewCustomPlan={onNewCustomPlan} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /Clear custom plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear custom plan/i,
			}),
		);

		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it("calls onNewCustomPlan when confirming new custom plan", () => {
		render(
			<CustomPlanToolbar onClear={onClear} onNewCustomPlan={onNewCustomPlan} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /New custom plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /New custom plan/i,
			}),
		);

		expect(onNewCustomPlan).toHaveBeenCalledTimes(1);
	});

	it("shows Are you sure confirmation title", () => {
		render(
			<CustomPlanToolbar onClear={onClear} onNewCustomPlan={onNewCustomPlan} />,
		);

		fireEvent.click(screen.getByRole("button", { name: /Clear custom plan/i }));

		expect(
			screen.getByRole("heading", { name: /Are you sure\?/i }),
		).toBeInTheDocument();
	});
});
