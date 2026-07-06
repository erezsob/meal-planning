import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Doc, Id } from "convex/_generated/dataModel";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDish } from "@/test/mocks/convex";
import { TestWrapper } from "@/test/utils";
import { LogMealForm } from "./LogMealForm";

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["dishes", "search"],
		queryFn: async () => [],
	})),
}));

const mockDishes: Doc<"dishes">[] = [
	createMockDish({ _id: "dish-1" as Id<"dishes">, name: "Spaghetti" }),
	createMockDish({ _id: "dish-2" as Id<"dishes">, name: "Salad" }),
];

vi.mock("@tanstack/react-query", async () => {
	const actual = await vi.importActual("@tanstack/react-query");
	return {
		...actual,
		useSuspenseQuery: vi.fn(() => ({
			data: mockDishes,
		})),
	};
});

describe("LogMealForm", () => {
	const defaultProps = {
		onSubmit: vi.fn(),
		onCancel: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const renderForm = (ui: React.ReactElement) =>
		render(
			<TestWrapper>
				<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>
			</TestWrapper>,
		);

	it("disables submit until custom name is entered", () => {
		renderForm(<LogMealForm {...defaultProps} />);
		expect(screen.getByRole("button", { name: /log meal/i })).toBeDisabled();
	});

	it("submits custom meal with trimmed name", () => {
		const onSubmit = vi.fn();
		renderForm(<LogMealForm {...defaultProps} onSubmit={onSubmit} />);

		fireEvent.change(screen.getByLabelText(/what did you eat/i), {
			target: { value: "  Takeout  " },
		});
		fireEvent.click(screen.getByRole("button", { name: /log meal/i }));

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				customName: "Takeout",
				mealType: expect.any(String),
				day: expect.any(String),
			}),
		);
	});

	it("switches to library tab and submits selected dish", async () => {
		const onSubmit = vi.fn();
		renderForm(<LogMealForm {...defaultProps} onSubmit={onSubmit} />);

		fireEvent.click(screen.getByRole("tab", { name: /library/i }));

		await waitFor(() => {
			expect(screen.getByText("Spaghetti")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Spaghetti"));
		fireEvent.click(screen.getByRole("button", { name: /log meal/i }));

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				dishId: "dish-1",
				mealType: expect.any(String),
				day: expect.any(String),
			}),
		);
	});

	it("calls onCancel when cancel is clicked", () => {
		const onCancel = vi.fn();
		renderForm(<LogMealForm {...defaultProps} onCancel={onCancel} />);

		fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onCancel).toHaveBeenCalled();
	});
});
