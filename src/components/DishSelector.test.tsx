import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Doc, Id } from "convex/_generated/dataModel";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDish, createMockLeftoverSource } from "@/test/mocks/convex";
import { TestWrapper } from "@/test/utils";
import { DishSelector } from "./DishSelector";

// Mock Convex query
vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(() => ({
		queryKey: ["dishes", "search"],
		queryFn: async () => [],
	})),
}));

// Mock useSuspenseQuery to return mock dishes
const mockDishes: Doc<"dishes">[] = [
	createMockDish({ _id: "dish-1" as Id<"dishes">, name: "Spaghetti" }),
	createMockDish({
		_id: "dish-2" as Id<"dishes">,
		name: "Tacos",
		tags: ["quick"],
	}),
	createMockDish({ _id: "dish-3" as Id<"dishes">, name: "Salad" }),
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

describe("DishSelector", () => {
	const defaultProps = {
		isOpen: true,
		onClose: vi.fn(),
		onSelectDish: vi.fn(),
		onSelectCustom: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	const renderWithSuspense = (ui: React.ReactElement) => {
		return render(
			<TestWrapper>
				<Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>
			</TestWrapper>,
		);
	};

	it("returns null when isOpen is false", () => {
		const { container } = render(
			<DishSelector {...defaultProps} isOpen={false} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows 'Add Meal' title when open", () => {
		renderWithSuspense(<DishSelector {...defaultProps} />);
		expect(screen.getByText("Add Meal")).toBeInTheDocument();
	});

	it("shows 'From Library' tab active by default", () => {
		renderWithSuspense(<DishSelector {...defaultProps} />);
		const libraryTab = screen.getByRole("button", { name: /from library/i });
		expect(libraryTab).toHaveClass("text-primary");
	});

	it("shows 'Custom Meal' tab", () => {
		renderWithSuspense(<DishSelector {...defaultProps} />);
		expect(
			screen.getByRole("button", { name: /custom meal/i }),
		).toBeInTheDocument();
	});

	it("does not show 'Leftovers' tab when no leftoverSources", () => {
		renderWithSuspense(<DishSelector {...defaultProps} />);
		expect(
			screen.queryByRole("button", { name: /leftovers/i }),
		).not.toBeInTheDocument();
	});

	it("shows 'Leftovers' tab when leftoverSources provided", () => {
		const leftoverSources = [
			createMockLeftoverSource({
				dish: { name: "Leftover Pasta" },
				available: 3,
			}),
		];
		renderWithSuspense(
			<DishSelector {...defaultProps} leftoverSources={leftoverSources} />,
		);
		expect(
			screen.getByRole("button", { name: /leftovers \(1\)/i }),
		).toBeInTheDocument();
	});

	it("shows search input on dishes tab", () => {
		renderWithSuspense(<DishSelector {...defaultProps} />);
		expect(screen.getByPlaceholderText(/search dishes/i)).toBeInTheDocument();
	});

	it("shows dish list from library", async () => {
		renderWithSuspense(<DishSelector {...defaultProps} />);
		await waitFor(() => {
			expect(screen.getByText("Spaghetti")).toBeInTheDocument();
			expect(screen.getByText("Tacos")).toBeInTheDocument();
		});
	});

	it("calls onSelectDish when clicking a dish", async () => {
		const onSelectDish = vi.fn();
		renderWithSuspense(
			<DishSelector {...defaultProps} onSelectDish={onSelectDish} />,
		);

		await waitFor(() => {
			expect(screen.getByText("Spaghetti")).toBeInTheDocument();
		});

		fireEvent.click(screen.getByText("Spaghetti"));
		expect(onSelectDish).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Spaghetti" }),
		);
	});

	describe("Custom Meal tab", () => {
		it("shows custom meal form when tab clicked", () => {
			renderWithSuspense(<DishSelector {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: /custom meal/i }));

			expect(screen.getByLabelText(/meal name/i)).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /add custom meal/i }),
			).toBeInTheDocument();
		});

		it("disables submit button when input is empty", () => {
			renderWithSuspense(<DishSelector {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: /custom meal/i }));

			const submitBtn = screen.getByRole("button", {
				name: /add custom meal/i,
			});
			expect(submitBtn).toBeDisabled();
		});

		it("calls onSelectCustom with trimmed name on submit", () => {
			const onSelectCustom = vi.fn();
			renderWithSuspense(
				<DishSelector {...defaultProps} onSelectCustom={onSelectCustom} />,
			);

			fireEvent.click(screen.getByRole("button", { name: /custom meal/i }));

			const input = screen.getByLabelText(/meal name/i);
			fireEvent.change(input, { target: { value: "  Takeout Pizza  " } });

			const submitBtn = screen.getByRole("button", {
				name: /add custom meal/i,
			});
			fireEvent.click(submitBtn);

			expect(onSelectCustom).toHaveBeenCalledWith("Takeout Pizza");
		});
	});

	describe("Leftovers tab", () => {
		it("shows leftover items with available count", () => {
			const leftoverSources = [
				createMockLeftoverSource({
					dish: { name: "Leftover Pasta" },
					available: 3,
				}),
			];
			renderWithSuspense(
				<DishSelector {...defaultProps} leftoverSources={leftoverSources} />,
			);

			fireEvent.click(screen.getByRole("button", { name: /leftovers/i }));

			expect(screen.getByText("Leftover Pasta")).toBeInTheDocument();
			expect(screen.getByText("3 left")).toBeInTheDocument();
		});

		it("calls onSelectLeftover when clicking leftover item", () => {
			const onSelectLeftover = vi.fn();
			const leftoverSources = [
				createMockLeftoverSource({
					meal: { _id: "meal-123" as Id<"mealPlans"> },
					dish: { _id: "dish-456" as Id<"dishes">, name: "Leftover Pasta" },
					available: 3,
				}),
			];

			renderWithSuspense(
				<DishSelector
					{...defaultProps}
					leftoverSources={leftoverSources}
					onSelectLeftover={onSelectLeftover}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: /leftovers/i }));
			fireEvent.click(screen.getByText("Leftover Pasta"));

			expect(onSelectLeftover).toHaveBeenCalledWith(
				"meal-123",
				expect.objectContaining({ name: "Leftover Pasta" }),
				3,
			);
		});
	});

	it("renders headerContent when provided", () => {
		renderWithSuspense(
			<DishSelector
				{...defaultProps}
				headerContent={<div data-testid="custom-header">Custom Header</div>}
			/>,
		);
		expect(screen.getByTestId("custom-header")).toBeInTheDocument();
	});
});
