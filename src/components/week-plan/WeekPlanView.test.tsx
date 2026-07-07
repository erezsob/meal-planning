import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_BACKLOG_ROW_COUNT } from "@/lib/weekPlanTypes";
import { WeekPlanView } from "./WeekPlanView";

describe("WeekPlanView", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	it("renders weekday rows and weekly rows", () => {
		render(<WeekPlanView />);

		expect(screen.getAllByText("Saturday").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Friday").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Weekly lunch").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Weekly breakfast").length).toBeGreaterThan(0);
	});

	it("renders default backlog rows", () => {
		render(<WeekPlanView />);
		const backlogLabels = screen.getAllByLabelText(/Backlog dish/);
		expect(backlogLabels.length).toBeGreaterThanOrEqual(
			DEFAULT_BACKLOG_ROW_COUNT,
		);
	});

	it("adds a backlog row", () => {
		render(<WeekPlanView />);
		const addButtons = screen.getAllByRole("button", { name: /Add row/i });
		fireEvent.click(addButtons[0]);

		const backlogLabels = screen.getAllByLabelText(/Backlog dish/);
		expect(backlogLabels.length).toBeGreaterThanOrEqual(
			DEFAULT_BACKLOG_ROW_COUNT + 1,
		);
	});

	it("opens clear plan confirmation", () => {
		render(<WeekPlanView />);
		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));

		expect(
			screen.getByRole("heading", { name: /Clear plan\?/i }),
		).toBeInTheDocument();
	});
});
