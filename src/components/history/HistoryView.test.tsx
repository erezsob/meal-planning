import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockMealWithDish } from "@/test/mocks/convex";
import { TestWrapper } from "@/test/utils";
import { HistoryView } from "./HistoryView";

const mockMeals = [
	createMockMealWithDish({
		status: "eaten",
		day: "2026-02-03",
		mealType: "lunch",
		dish: { name: "Pasta Bowl" } as never,
	}),
];

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["mealPlans", "getEatenHistory"],
		queryFn: async () => mockMeals,
	})),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: vi.fn(() => ({
			data: mockMeals,
		})),
	};
});

vi.mock("../log", () => ({
	LogMealModal: () => null,
}));

vi.mock("@/components/meal", () => ({
	MealActionModal: ({
		meal,
		onClose,
	}: {
		meal: { dish?: { name: string } | null };
		onClose: () => void;
	}) => (
		<div role="dialog" aria-label="meal actions">
			<span>{meal.dish?.name}</span>
			<button type="button" onClick={onClose}>
				Close
			</button>
		</div>
	),
}));

import { useSuspenseQuery } from "@tanstack/react-query";

describe("HistoryView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: mockMeals } as never);
	});

	it("renders eaten meals grouped by day", () => {
		render(
			<TestWrapper>
				<HistoryView />
			</TestWrapper>,
		);

		expect(
			screen.getByRole("heading", { name: /history/i }),
		).toBeInTheDocument();
		expect(screen.getByText("Pasta Bowl")).toBeInTheDocument();
	});

	it("shows empty state when no meals match", () => {
		vi.mocked(useSuspenseQuery).mockReturnValue({ data: [] } as never);

		render(
			<TestWrapper>
				<HistoryView />
			</TestWrapper>,
		);

		expect(
			screen.getByText(/no meals found for this period/i),
		).toBeInTheDocument();
	});

	it("opens action modal when a meal row is clicked", () => {
		render(
			<TestWrapper>
				<HistoryView />
			</TestWrapper>,
		);

		fireEvent.click(screen.getByRole("button", { name: /pasta bowl/i }));
		expect(
			screen.getByRole("dialog", { name: /meal actions/i }),
		).toBeInTheDocument();
	});
});
