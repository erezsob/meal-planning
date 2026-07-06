import { fireEvent, render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockMealWithDish } from "@/test/mocks/convex";
import { MealActionModal } from "./MealActionModal";

// Mock Convex
vi.mock("convex/react", () => ({
	useMutation: vi.fn(() => vi.fn()),
}));

// Mock the api object
vi.mock("convex/_generated/api", () => ({
	api: {
		mealPlans: {
			eatMeal: "mealPlans:eatMeal",
			skipMeal: "mealPlans:skipMeal",
			remove: "mealPlans:remove",
		},
	},
}));

import { useMutation } from "convex/react";

describe("MealActionModal", () => {
	const createDefaultMeal = () => {
		const meal = createMockMealWithDish({
			componentRole: "main",
			status: "planned",
		});
		if (meal.dish) {
			meal.dish = { ...meal.dish, name: "Pasta Primavera" };
		}
		return meal;
	};

	const defaultProps = {
		meal: createDefaultMeal(),
		onClose: vi.fn(),
		onEdit: vi.fn(),
		onAddAnother: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows title with role and dish name", () => {
		render(<MealActionModal {...defaultProps} />);
		expect(screen.getByText("Main: Pasta Primavera")).toBeInTheDocument();
	});

	it("shows custom name when no dish", () => {
		const meal = createMockMealWithDish({
			dish: undefined,
			customName: "Takeout Pizza",
			componentRole: "main",
		});
		render(<MealActionModal {...defaultProps} meal={meal} />);
		expect(screen.getByText("Main: Takeout Pizza")).toBeInTheDocument();
	});

	describe("planned status", () => {
		it("shows 'Ate it' and 'Skipped' buttons", () => {
			render(<MealActionModal {...defaultProps} />);
			expect(
				screen.getByRole("button", { name: /ate it/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /skipped/i }),
			).toBeInTheDocument();
		});

		it("calls eatMeal mutation on 'Ate it' click", () => {
			const mockEatMeal = vi.fn();
			(useMutation as Mock).mockImplementation((apiRef) => {
				if (apiRef === "mealPlans:eatMeal") return mockEatMeal;
				return vi.fn();
			});

			render(<MealActionModal {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: /ate it/i }));

			expect(mockEatMeal).toHaveBeenCalledWith({ id: defaultProps.meal._id });
			expect(defaultProps.onClose).toHaveBeenCalled();
		});

		it("calls skipMeal mutation on 'Skipped' click", () => {
			const mockSkipMeal = vi.fn();
			(useMutation as Mock).mockImplementation((apiRef) => {
				if (apiRef === "mealPlans:skipMeal") return mockSkipMeal;
				return vi.fn();
			});

			render(<MealActionModal {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: /skipped/i }));

			expect(mockSkipMeal).toHaveBeenCalledWith({ id: defaultProps.meal._id });
			expect(defaultProps.onClose).toHaveBeenCalled();
		});
	});

	describe("eaten status", () => {
		it("shows 'Already eaten' message", () => {
			const meal = createMockMealWithDish({ status: "eaten" });
			render(<MealActionModal {...defaultProps} meal={meal} />);
			expect(screen.getByText(/already eaten/i)).toBeInTheDocument();
		});

		it("hides action buttons", () => {
			const meal = createMockMealWithDish({ status: "eaten" });
			render(<MealActionModal {...defaultProps} meal={meal} />);
			expect(
				screen.queryByRole("button", { name: /ate it/i }),
			).not.toBeInTheDocument();
		});
	});

	describe("eatenOnly mode", () => {
		it("shows only edit and delete with meal name title", () => {
			const meal = createMockMealWithDish({ status: "eaten" });
			render(
				<MealActionModal
					meal={meal}
					eatenOnly
					onClose={vi.fn()}
					onEdit={vi.fn()}
				/>,
			);
			expect(screen.getByText("Test Dish")).toBeInTheDocument();
			expect(screen.queryByText(/already eaten/i)).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: /add another component/i }),
			).not.toBeInTheDocument();
			expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /delete/i }),
			).toBeInTheDocument();
		});
	});

	describe("skipped status", () => {
		it("shows 'Already skipped' message", () => {
			const meal = createMockMealWithDish({ status: "skipped" });
			render(<MealActionModal {...defaultProps} meal={meal} />);
			expect(screen.getByText(/already skipped/i)).toBeInTheDocument();
		});
	});

	describe("common actions", () => {
		it("calls removeMeal mutation on Delete click", () => {
			const mockRemove = vi.fn();
			(useMutation as Mock).mockImplementation((apiRef) => {
				if (apiRef === "mealPlans:remove") return mockRemove;
				return vi.fn();
			});

			render(<MealActionModal {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: /delete/i }));

			expect(mockRemove).toHaveBeenCalledWith({ id: defaultProps.meal._id });
			expect(defaultProps.onClose).toHaveBeenCalled();
		});

		it("calls onEdit when clicking Edit button", () => {
			render(<MealActionModal {...defaultProps} />);
			fireEvent.click(screen.getByRole("button", { name: /edit/i }));
			expect(defaultProps.onEdit).toHaveBeenCalled();
		});

		it("calls onAddAnother when clicking 'Add another component'", () => {
			render(<MealActionModal {...defaultProps} />);
			fireEvent.click(
				screen.getByRole("button", { name: /add another component/i }),
			);
			expect(defaultProps.onAddAnother).toHaveBeenCalled();
		});
	});
});
