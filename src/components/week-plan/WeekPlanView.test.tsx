import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { Suspense } from "react";
import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
	DEFAULT_BACKLOG_ROW_COUNT,
	DEFAULT_CUSTOM_PLAN_ROW_COUNT,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
} from "@/lib/weekPlanTypes";
import { TestWrapper } from "@/test/utils";
import { WeekPlanView } from "./WeekPlanView";

const mockEnsureHome = vi.fn();
const mockSaveMain = vi.fn().mockResolvedValue(undefined);
const mockSaveCategories = vi.fn().mockResolvedValue(undefined);

const mainId = "plan-main-1" as never;
const categoriesId = "plan-categories-1" as never;

const migrationShapedHome = {
	main: {
		id: mainId,
		content: createDefaultMainGridContent(),
		createdAt: 1_700_000_000_000,
		updatedAt: 1_700_000_000_000,
	},
	categories: {
		id: categoriesId,
		content: createDefaultCustomPlansContent(),
		createdAt: 1_700_000_000_000,
		updatedAt: 1_700_000_000_000,
	},
	needsEnsure: false,
};

vi.mock("convex/react", () => ({
	useMutation: vi.fn(),
}));

vi.mock("convex/_generated/api", () => ({
	api: {
		planSections: {
			ensureHome: "planSections:ensureHome",
			saveMain: "planSections:saveMain",
			saveCategories: "planSections:saveCategories",
		},
	},
}));

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["planSections", "getHome"],
		queryFn: async () => migrationShapedHome,
	})),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: vi.fn(() => ({
			data: migrationShapedHome,
		})),
	};
});

import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";

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
		mockEnsureHome.mockResolvedValue(migrationShapedHome);
		mockSaveMain.mockResolvedValue(undefined);
		mockSaveCategories.mockResolvedValue(undefined);
		(useSuspenseQuery as Mock).mockReturnValue({ data: migrationShapedHome });
		(useMutation as Mock).mockImplementation((reference: string) => {
			if (reference === "planSections:ensureHome") {
				return mockEnsureHome;
			}
			if (reference === "planSections:saveMain") {
				return mockSaveMain;
			}
			if (reference === "planSections:saveCategories") {
				return mockSaveCategories;
			}
			return vi.fn();
		});
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

	it("clears custom plan without clearing main plan", async () => {
		renderView();

		const customPlanDishButtons = screen.getAllByRole("button", {
			name: /Custom plan dish/i,
		});
		fireEvent.click(customPlanDishButtons[0]);
		fireEvent.change(screen.getAllByLabelText(/Custom plan dish/i)[0], {
			target: { value: "Sourdough" },
		});

		mockSaveCategories.mockClear();

		fireEvent.click(screen.getByRole("button", { name: /Clear custom plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear custom plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockSaveCategories).toHaveBeenCalledWith({
				id: categoriesId,
				content: createDefaultCustomPlansContent(),
			});
		});
		expect(mockSaveMain).not.toHaveBeenCalled();
	});

	it("opens clear plan confirmation", () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));

		expect(
			screen.getByRole("heading", { name: /Clear plan\?/i }),
		).toBeInTheDocument();
	});

	it("saves cleared main plan to Convex", async () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockSaveMain).toHaveBeenCalledWith({
				id: mainId,
				content: createDefaultMainGridContent(),
			});
		});
		expect(mockSaveCategories).not.toHaveBeenCalled();
	});

	it("calls ensureHome when legacy data needs migration", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({
			data: {
				...migrationShapedHome,
				needsEnsure: true,
				main: { ...migrationShapedHome.main, id: undefined },
				categories: { ...migrationShapedHome.categories, id: undefined },
			},
		});

		renderView();

		await waitFor(() => {
			expect(mockEnsureHome).toHaveBeenCalledWith({
				householdId: "household-1",
			});
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

		expect(mockSaveMain).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(WEEK_PLAN_SAVE_DEBOUNCE_MS);

		expect(mockSaveMain).toHaveBeenCalledWith({
			id: mainId,
			content: expect.objectContaining({
				weekdays: expect.objectContaining({
					saturday: { dish: "Ribs", grocery: "" },
				}),
			}),
		});
		expect(mockSaveCategories).not.toHaveBeenCalled();
	});

	it("shows an error when save fails", async () => {
		mockSaveMain.mockRejectedValue(new Error("Network error"));
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
