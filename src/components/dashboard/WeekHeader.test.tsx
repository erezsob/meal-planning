import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeekHeader } from "./WeekHeader";

describe("WeekHeader", () => {
	const defaultProps = {
		weekStart: new Date("2026-02-02"), // Monday
		onPrevious: vi.fn(),
		onNext: vi.fn(),
		onToday: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Mock current date to a different week so "Today" button shows
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-02-16")); // Two weeks later
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("displays default title 'Weekly Meal Plan'", () => {
		render(<WeekHeader {...defaultProps} />);
		expect(screen.getByText("Weekly Meal Plan")).toBeInTheDocument();
	});

	it("displays custom title when provided", () => {
		render(<WeekHeader {...defaultProps} title="Shopping List" />);
		expect(screen.getByText("Shopping List")).toBeInTheDocument();
	});

	it("formats date range within same month", () => {
		render(<WeekHeader {...defaultProps} weekStart={new Date("2026-02-02")} />);
		// Feb 2 - 8, 2026
		expect(screen.getByText("Feb 2 - 8, 2026")).toBeInTheDocument();
	});

	it("formats date range across months", () => {
		render(<WeekHeader {...defaultProps} weekStart={new Date("2026-01-26")} />);
		// Jan 26 - Feb 1, 2026
		expect(screen.getByText("Jan 26 - Feb 1, 2026")).toBeInTheDocument();
	});

	it("calls onPrevious when clicking previous button", () => {
		const onPrevious = vi.fn();
		render(<WeekHeader {...defaultProps} onPrevious={onPrevious} />);

		fireEvent.click(screen.getByRole("button", { name: /previous week/i }));
		expect(onPrevious).toHaveBeenCalledTimes(1);
	});

	it("calls onNext when clicking next button", () => {
		const onNext = vi.fn();
		render(<WeekHeader {...defaultProps} onNext={onNext} />);

		fireEvent.click(screen.getByRole("button", { name: /next week/i }));
		expect(onNext).toHaveBeenCalledTimes(1);
	});

	it("shows 'Today' button when not on current week", () => {
		// System time is Feb 16, weekStart is Feb 2 - different weeks
		render(<WeekHeader {...defaultProps} weekStart={new Date("2026-02-02")} />);
		expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
	});

	it("hides 'Today' button when on current week", () => {
		// Set weekStart to current week (Feb 16 is a Monday)
		render(<WeekHeader {...defaultProps} weekStart={new Date("2026-02-16")} />);
		expect(
			screen.queryByRole("button", { name: "Today" }),
		).not.toBeInTheDocument();
	});

	it("calls onToday when clicking Today button", () => {
		const onToday = vi.fn();
		render(<WeekHeader {...defaultProps} onToday={onToday} />);

		fireEvent.click(screen.getByRole("button", { name: "Today" }));
		expect(onToday).toHaveBeenCalledTimes(1);
	});
});
