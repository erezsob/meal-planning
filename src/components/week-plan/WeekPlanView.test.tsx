import { fireEvent, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDefaultWeekPlan,
	DEFAULT_BACKLOG_ROW_COUNT,
	DEFAULT_CUSTOM_PLAN_ROW_COUNT,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
} from "@/lib/weekPlanTypes";
import { TestWrapper } from "@/test/utils";
import { WeekPlanView } from "./WeekPlanView";

const mockSave = vi.fn().mockResolvedValue(undefined);

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["weekPlans", "get"],
		queryFn: async () => null,
	})),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: vi.fn(() => ({
			data: null,
		})),
	};
});

vi.mock("convex/react", () => ({
	useMutation: vi.fn(() => mockSave),
}));

const renderView = () =>
	render(
		<TestWrapper>
			<Suspense fallback={<div>Loading...</div>}>
				<WeekPlanView />
			</Suspense>
		</TestWrapper>,
	);

describe("WeekPlanView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSave.mockResolvedValue(undefined);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders the page heading", () => {
		renderView();

		expect(
			screen.getByRole("heading", { level: 1, name: "Weekly plan" }),
		).toBeInTheDocument();
	});

	it("renders weekday rows and weekly rows", () => {
		renderView();

		expect(screen.getAllByText("Saturday").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Friday").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Weekly lunch").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Weekly breakfast").length).toBeGreaterThan(0);
	});

	it("renders default backlog rows", () => {
		renderView();
		const backlogEditors = screen.getAllByRole("button", {
			name: /Backlog dish/i,
		});
		expect(backlogEditors.length).toBeGreaterThanOrEqual(
			DEFAULT_BACKLOG_ROW_COUNT,
		);
	});

	it("adds a backlog row", () => {
		renderView();
		const addButtons = screen.getAllByRole("button", { name: /^Add row$/i });
		fireEvent.click(addButtons[0]);

		const backlogEditors = screen.getAllByRole("button", {
			name: /Backlog dish/i,
		});
		expect(backlogEditors.length).toBeGreaterThanOrEqual(
			DEFAULT_BACKLOG_ROW_COUNT + 1,
		);
	});

	it("renders custom plan section", () => {
		renderView();

		expect(
			screen.getByRole("heading", { name: /Custom plan/i }),
		).toBeInTheDocument();
		expect(
			screen.getAllByRole("button", { name: /Custom plan name/i }).length,
		).toBeGreaterThanOrEqual(DEFAULT_CUSTOM_PLAN_ROW_COUNT);
	});

	it("adds a custom plan row", () => {
		renderView();
		const addButtons = screen.getAllByRole("button", { name: /^Add row$/i });
		fireEvent.click(addButtons[addButtons.length - 1]);

		expect(
			screen.getAllByRole("button", { name: /Custom plan name/i }).length,
		).toBeGreaterThanOrEqual(DEFAULT_CUSTOM_PLAN_ROW_COUNT + 1);
	});

	it("opens clear custom plan confirmation", () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: /Clear custom plan/i }));

		expect(
			screen.getByRole("heading", { name: /Are you sure\?/i }),
		).toBeInTheDocument();
	});

	it("clears custom plan without clearing main plan", () => {
		renderView();

		const customPlanDishButtons = screen.getAllByRole("button", {
			name: /Custom plan dish/i,
		});
		fireEvent.click(customPlanDishButtons[0]);
		fireEvent.change(screen.getAllByLabelText(/Custom plan dish/i)[0], {
			target: { value: "Sourdough" },
		});

		mockSave.mockClear();

		fireEvent.click(screen.getByRole("button", { name: /Clear custom plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear custom plan/i,
			}),
		);

		expect(mockSave).toHaveBeenCalledWith({
			householdId: "household-1",
			plan: expect.objectContaining({
				customPlan: [{ category: "", dish: "", grocery: "" }],
				weekdays: expect.objectContaining({
					saturday: { dish: "", grocery: "" },
				}),
			}),
		});
	});

	it("opens clear plan confirmation", () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));

		expect(
			screen.getByRole("heading", { name: /Clear plan\?/i }),
		).toBeInTheDocument();
	});

	it("saves cleared plan to Convex", () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		expect(mockSave).toHaveBeenCalledWith({
			householdId: "household-1",
			plan: createDefaultWeekPlan(),
		});
	});

	it("saves cell edit to Convex after debounce", async () => {
		vi.useFakeTimers();
		renderView();

		const dishButtons = screen.getAllByRole("button", {
			name: /Saturday dish/i,
		});
		fireEvent.click(dishButtons[0]);
		fireEvent.change(screen.getAllByLabelText("Saturday dish")[0], {
			target: { value: "Ribs" },
		});

		expect(mockSave).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(WEEK_PLAN_SAVE_DEBOUNCE_MS);

		expect(mockSave).toHaveBeenCalledWith({
			householdId: "household-1",
			plan: expect.objectContaining({
				weekdays: expect.objectContaining({
					saturday: { dish: "Ribs", grocery: "" },
				}),
			}),
		});
	});

	it("shows an error when save fails", async () => {
		mockSave.mockRejectedValue(new Error("Network error"));
		renderView();

		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
	});
});
