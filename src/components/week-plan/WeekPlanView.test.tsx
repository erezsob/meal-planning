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
	ARCHIVE_PREVIOUS_WEEK_DIALOG,
	CUSTOM_PLANS_SECTION_HEADING,
} from "@/lib/constants";
import {
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
	DEFAULT_BACKLOG_ROW_COUNT,
	DEFAULT_CUSTOM_PLAN_ROW_COUNT,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
} from "@/lib/weekPlanTypes";
import { mockPlanSectionId } from "@/test/mocks/convex";
import { TestWrapper } from "@/test/utils";
import { WeekPlanView } from "./WeekPlanView";

const mockEnsureHome = vi.fn();
const mockSaveMain = vi.fn().mockResolvedValue(undefined);
const mockClearMainTop = vi.fn().mockResolvedValue(undefined);
const mockSaveCustomPlans = vi.fn().mockResolvedValue(undefined);
const mockArchiveAndCreateNewMain = vi.fn();
const mockArchiveAndCreateNewCustomPlans = vi.fn();
const mockArchivePreviousWeekMain = vi.fn();

const mainId = mockPlanSectionId("plan-main-1");
const previousMainId = mockPlanSectionId("plan-main-2");
const customPlansId = mockPlanSectionId("plan-custom-plans-1");

const singleGridHome = {
	mainGrids: [
		{
			id: mainId,
			content: createDefaultMainGridContent(),
			createdAt: 1_700_000_000_000,
			updatedAt: 1_700_000_000_000,
		},
	],
	customPlans: {
		id: customPlansId,
		content: createDefaultCustomPlansContent(),
		createdAt: 1_700_000_000_000,
		updatedAt: 1_700_000_000_000,
	},
};

const stackedGridHome = {
	mainGrids: [
		{
			id: mainId,
			content: createDefaultMainGridContent(),
			createdAt: 1_735_689_600_000,
			updatedAt: 1_735_689_600_000,
		},
		{
			id: previousMainId,
			content: {
				...createDefaultMainGridContent(),
				weekdays: {
					...createDefaultMainGridContent().weekdays,
					saturday: { dish: "Old ribs", grocery: "" },
				},
			},
			createdAt: 1_700_000_000_000,
			updatedAt: 1_700_000_000_000,
		},
	],
	customPlans: singleGridHome.customPlans,
};

vi.mock("convex/react", () => ({
	useMutation: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		...props
	}: {
		children: React.ReactNode;
		[key: string]: unknown;
	}) => <a {...props}>{children}</a>,
}));

vi.mock("convex/_generated/api", () => ({
	api: {
		planSections: {
			ensureHome: "planSections:ensureHome",
			saveMain: "planSections:saveMain",
			clearMainTop: "planSections:clearMainTop",
			saveCustomPlans: "planSections:saveCustomPlans",
			archiveAndCreateNewMain: "planSections:archiveAndCreateNewMain",
			archiveAndCreateNewCustomPlans:
				"planSections:archiveAndCreateNewCustomPlans",
			archivePreviousWeekMain: "planSections:archivePreviousWeekMain",
		},
	},
}));

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["planSections", "getHome"],
		queryFn: async () => singleGridHome,
	})),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: vi.fn(() => ({
			data: singleGridHome,
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
		mockEnsureHome.mockResolvedValue(singleGridHome);
		mockSaveMain.mockResolvedValue(undefined);
		mockSaveCustomPlans.mockResolvedValue(undefined);
		mockArchiveAndCreateNewMain.mockResolvedValue(stackedGridHome);
		mockArchiveAndCreateNewCustomPlans.mockResolvedValue({
			...singleGridHome,
			customPlans: {
				id: mockPlanSectionId("plan-custom-plans-2"),
				content: createDefaultCustomPlansContent(),
				createdAt: 1_735_689_600_000,
				updatedAt: 1_735_689_600_000,
			},
		});
		mockArchivePreviousWeekMain.mockResolvedValue(singleGridHome);
		(useSuspenseQuery as Mock).mockReturnValue({ data: singleGridHome });
		(useMutation as Mock).mockImplementation((reference: string) => {
			if (reference === "planSections:ensureHome") {
				return mockEnsureHome;
			}
			if (reference === "planSections:saveMain") {
				return mockSaveMain;
			}
			if (reference === "planSections:clearMainTop") {
				return mockClearMainTop;
			}
			if (reference === "planSections:saveCustomPlans") {
				return mockSaveCustomPlans;
			}
			if (reference === "planSections:archiveAndCreateNewMain") {
				return mockArchiveAndCreateNewMain;
			}
			if (reference === "planSections:archiveAndCreateNewCustomPlans") {
				return mockArchiveAndCreateNewCustomPlans;
			}
			if (reference === "planSections:archivePreviousWeekMain") {
				return mockArchivePreviousWeekMain;
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
			screen.getByRole("heading", { name: CUSTOM_PLANS_SECTION_HEADING }),
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

		mockSaveCustomPlans.mockClear();

		fireEvent.click(screen.getByRole("button", { name: /Clear custom plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear custom plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockSaveCustomPlans).toHaveBeenCalledWith({
				id: customPlansId,
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

	it("saves cleared top main plan to Convex", async () => {
		renderView();
		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockClearMainTop).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});
		expect(mockSaveCustomPlans).not.toHaveBeenCalled();
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
		expect(mockSaveCustomPlans).not.toHaveBeenCalled();
	});

	it("shows an error when save fails", async () => {
		mockClearMainTop.mockRejectedValue(new Error("Network error"));
		renderView();

		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		expect(await screen.findByRole("alert")).toHaveTextContent("Network error");
	});

	it("renders two stacked main grids with headings and dates", () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		expect(
			screen.getByRole("heading", { name: "This week" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "Previous week" }),
		).toBeInTheDocument();
		expect(screen.getByText("Jan 1, 2025")).toBeInTheDocument();
		expect(screen.getByText("Nov 14, 2023")).toBeInTheDocument();
	});

	it("hides Archive when Previous week is absent", () => {
		renderView();

		expect(
			screen.queryByRole("button", { name: /^Archive$/i }),
		).not.toBeInTheDocument();
	});

	it("shows Archive on Previous week when two grids are stacked", () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section") as HTMLElement;

		expect(
			within(previousWeekSection).getByRole("button", { name: /^Archive$/i }),
		).toBeInTheDocument();
		expect(
			within(
				screen
					.getByRole("heading", { name: "This week" })
					.closest("section") as HTMLElement,
			).queryByRole("button", { name: /^Archive$/i }),
		).not.toBeInTheDocument();
	});

	it("does not archive when Archive confirm is cancelled", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section") as HTMLElement;

		fireEvent.click(
			within(previousWeekSection).getByRole("button", { name: /^Archive$/i }),
		);

		const dialog = screen.getByRole("dialog");
		expect(
			within(dialog).getByRole("heading", {
				name: ARCHIVE_PREVIOUS_WEEK_DIALOG.title,
			}),
		).toBeInTheDocument();
		expect(
			within(dialog).getByText(ARCHIVE_PREVIOUS_WEEK_DIALOG.description),
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("button", {
				name: ARCHIVE_PREVIOUS_WEEK_DIALOG.confirm,
			}).className,
		).toMatch(/bg-primary/);
		expect(
			within(dialog).getByRole("button", {
				name: ARCHIVE_PREVIOUS_WEEK_DIALOG.confirm,
			}).className,
		).not.toMatch(/\bbg-destructive\b/);

		fireEvent.click(
			within(dialog).getByRole("button", {
				name: ARCHIVE_PREVIOUS_WEEK_DIALOG.cancel,
			}),
		);

		expect(mockArchivePreviousWeekMain).not.toHaveBeenCalled();
		expect(
			screen.getByRole("heading", { name: "Previous week" }),
		).toBeInTheDocument();
	});

	it("flushes pending Previous week edits before archiving", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section") as HTMLElement;

		fireEvent.click(
			within(previousWeekSection).getAllByRole("button", {
				name: /Saturday dish/i,
			})[0],
		);
		fireEvent.change(
			within(previousWeekSection).getAllByLabelText("Saturday dish")[0],
			{ target: { value: "Flushed ribs" } },
		);

		fireEvent.click(
			within(previousWeekSection).getByRole("button", { name: /^Archive$/i }),
		);
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /^Archive$/i,
			}),
		);

		await waitFor(() => {
			expect(mockSaveMain).toHaveBeenCalledWith({
				id: previousMainId,
				content: expect.objectContaining({
					weekdays: expect.objectContaining({
						saturday: { dish: "Flushed ribs", grocery: "" },
					}),
				}),
			});
			expect(mockArchivePreviousWeekMain).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});
		expect(mockSaveMain.mock.invocationCallOrder[0]).toBeLessThan(
			mockArchivePreviousWeekMain.mock.invocationCallOrder[0],
		);
	});

	it("archives Previous week when Archive is confirmed", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		const { unmount } = renderView();

		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section") as HTMLElement;

		fireEvent.click(
			within(previousWeekSection).getByRole("button", { name: /^Archive$/i }),
		);
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /^Archive$/i,
			}),
		);

		await waitFor(() => {
			expect(mockArchivePreviousWeekMain).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});

		unmount();
		(useSuspenseQuery as Mock).mockReturnValue({ data: singleGridHome });
		renderView();

		expect(
			screen.getByRole("heading", { name: "This week" }),
		).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Previous week" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /^Archive$/i }),
		).not.toBeInTheDocument();
	});

	it("runs New weekly plan after confirming Archive on stacked grids", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		const { unmount } = renderView();

		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section") as HTMLElement;

		fireEvent.click(
			within(previousWeekSection).getByRole("button", { name: /^Archive$/i }),
		);
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /^Archive$/i,
			}),
		);

		await waitFor(() => {
			expect(mockArchivePreviousWeekMain).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});

		unmount();
		mockArchiveAndCreateNewMain.mockClear();
		(useSuspenseQuery as Mock).mockReturnValue({ data: singleGridHome });
		renderView();

		fireEvent.click(screen.getByRole("button", { name: /^New weekly plan$/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /New weekly plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockArchiveAndCreateNewMain).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});
	});

	it("clears only the upper grid when two grids are stacked", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockClearMainTop).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});
		expect(mockSaveMain).not.toHaveBeenCalled();
		expect(
			within(
				screen
					.getByRole("heading", { name: "Previous week" })
					.closest("section") as HTMLElement,
			).getAllByText("Old ribs").length,
		).toBeGreaterThan(0);
	});

	it("calls archiveAndCreateNewMain when confirming new weekly plan", async () => {
		renderView();

		fireEvent.click(screen.getByRole("button", { name: /^New weekly plan$/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /New weekly plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockArchiveAndCreateNewMain).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});
	});

	it("calls archiveAndCreateNewCustomPlans when confirming new custom plan", async () => {
		renderView();

		const newCustomPlanButtons = screen.getAllByRole("button", {
			name: /^New custom plan$/i,
		});
		fireEvent.click(newCustomPlanButtons[newCustomPlanButtons.length - 1]);
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /New custom plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockArchiveAndCreateNewCustomPlans).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});
	});

	it("adds backlog rows independently in stacked grids", () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section");

		const addButtons = within(previousWeekSection as HTMLElement).getAllByRole(
			"button",
			{ name: /^Add row$/i },
		);
		fireEvent.click(addButtons[0]);

		const backlogEditors = within(
			previousWeekSection as HTMLElement,
		).getAllByRole("button", { name: /Backlog dish/i });
		expect(backlogEditors.length).toBeGreaterThanOrEqual(
			DEFAULT_BACKLOG_ROW_COUNT + 1,
		);
	});

	it("saves edits to stacked grids independently", async () => {
		vi.useFakeTimers();
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		renderView();

		const thisWeekSection = screen
			.getByRole("heading", { name: "This week" })
			.closest("section");
		const previousWeekSection = screen
			.getByRole("heading", { name: "Previous week" })
			.closest("section");

		expect(thisWeekSection).not.toBeNull();
		expect(previousWeekSection).not.toBeNull();

		const topSaturdayButton = within(
			thisWeekSection as HTMLElement,
		).getAllByRole("button", { name: /Saturday dish/i })[0];
		fireEvent.click(topSaturdayButton);
		fireEvent.change(
			within(thisWeekSection as HTMLElement).getAllByLabelText(
				"Saturday dish",
			)[0],
			{ target: { value: "New ribs" } },
		);

		await vi.advanceTimersByTimeAsync(WEEK_PLAN_SAVE_DEBOUNCE_MS);

		expect(mockSaveMain).toHaveBeenCalledWith({
			id: mainId,
			content: expect.objectContaining({
				weekdays: expect.objectContaining({
					saturday: { dish: "New ribs", grocery: "" },
				}),
			}),
		});

		mockSaveMain.mockClear();

		const previousSaturdayButton = within(
			previousWeekSection as HTMLElement,
		).getAllByRole("button", { name: /Saturday dish/i })[0];
		fireEvent.click(previousSaturdayButton);
		fireEvent.change(
			within(previousWeekSection as HTMLElement).getAllByLabelText(
				"Saturday dish",
			)[0],
			{ target: { value: "Updated old ribs" } },
		);

		await vi.advanceTimersByTimeAsync(WEEK_PLAN_SAVE_DEBOUNCE_MS);

		expect(mockSaveMain).toHaveBeenCalledWith({
			id: previousMainId,
			content: expect.objectContaining({
				weekdays: expect.objectContaining({
					saturday: { dish: "Updated old ribs", grocery: "" },
				}),
			}),
		});
	});

	it("archives oldest grid on third new weekly plan", async () => {
		(useSuspenseQuery as Mock).mockReturnValue({ data: stackedGridHome });
		const { unmount } = renderView();

		fireEvent.click(screen.getByRole("button", { name: /^New weekly plan$/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /New weekly plan/i,
			}),
		);

		await waitFor(() => {
			expect(mockArchiveAndCreateNewMain).toHaveBeenCalledWith({
				householdId: "household-1",
			});
		});

		unmount();

		(useSuspenseQuery as Mock).mockReturnValue({
			data: {
				mainGrids: [
					{
						id: mockPlanSectionId("plan-main-3"),
						content: createDefaultMainGridContent(),
						createdAt: 1_740_000_000_000,
						updatedAt: 1_740_000_000_000,
					},
					{
						id: mainId,
						content: createDefaultMainGridContent(),
						createdAt: 1_735_689_600_000,
						updatedAt: 1_735_689_600_000,
					},
				],
				customPlans: singleGridHome.customPlans,
			},
		});

		renderView();

		expect(screen.getAllByRole("heading", { name: "This week" })).toHaveLength(
			1,
		);
		expect(
			screen.getAllByRole("heading", { name: "Previous week" }),
		).toHaveLength(1);
		expect(screen.queryByText("Old ribs")).not.toBeInTheDocument();
	});
});
