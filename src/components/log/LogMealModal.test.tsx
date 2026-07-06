import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/lib/components/toast";
import { LogMealModal } from "./LogMealModal";

const mockLogMeal = vi.fn();
const mockUpdateLog = vi.fn();

vi.mock("convex/react", () => ({
	useMutation: vi.fn(),
}));

vi.mock("convex/_generated/api", () => ({
	api: {
		mealPlans: {
			logMeal: "mealPlans:logMeal",
			updateLog: "mealPlans:updateLog",
		},
		dishes: {
			search: "dishes:search",
		},
	},
}));

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["dishes", "search"],
		queryFn: async () => [],
	})),
}));

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: vi.fn(() => ({ data: [] })),
	};
});

import { useMutation } from "convex/react";

function renderModal(ui: React.ReactElement) {
	return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("LogMealModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLogMeal.mockResolvedValue(undefined);
		(useMutation as Mock)
			.mockReturnValueOnce(mockLogMeal)
			.mockReturnValueOnce(mockUpdateLog);
	});

	it("shows error toast and stays open when log fails", async () => {
		mockLogMeal.mockRejectedValue(
			new Error("Cannot log meals for future dates"),
		);

		renderModal(<LogMealModal onClose={vi.fn()} />);

		fireEvent.change(screen.getByLabelText(/what did you eat/i), {
			target: { value: "Takeout" },
		});
		fireEvent.click(screen.getByRole("button", { name: /log meal/i }));

		await waitFor(() => {
			expect(
				screen.getByText("Cannot log meals for future dates"),
			).toBeInTheDocument();
		});
		expect(screen.getByRole("dialog")).toBeInTheDocument();
	});
});
