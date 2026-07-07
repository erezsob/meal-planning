import { fireEvent, render, screen, within } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDefaultWeekPlan,
	DEFAULT_BACKLOG_ROW_COUNT,
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
		const addButtons = screen.getAllByRole("button", { name: /Add row/i });
		fireEvent.click(addButtons[0]);

		const backlogEditors = screen.getAllByRole("button", {
			name: /Backlog dish/i,
		});
		expect(backlogEditors.length).toBeGreaterThanOrEqual(
			DEFAULT_BACKLOG_ROW_COUNT + 1,
		);
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
});
