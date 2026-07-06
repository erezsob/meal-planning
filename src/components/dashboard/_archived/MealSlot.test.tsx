import { fireEvent, render, screen } from "@testing-library/react";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MealWithDish } from "./dashboard/types";
import { MealSlot } from "./MealSlot";

// Mock Convex
vi.mock("convex/react", () => ({
	useMutation: vi.fn(() => vi.fn()),
}));

// Mock the api object shape
vi.mock("convex/_generated/api", () => ({
	api: {
		mealPlans: {
			eatSlot: "mealPlans:eatSlot",
			skipSlot: "mealPlans:skipSlot",
		},
	},
}));

import { useMutation } from "convex/react";

/** Base mock dish structure */
type MockDish = NonNullable<MealWithDish["dish"]>;

/**
 * Create mock dish for testing
 */
function createMockDish(overrides: Partial<MockDish> = {}): MockDish {
	return {
		_id: "dish-1" as MockDish["_id"],
		_creationTime: Date.now(),
		name: "Pasta",
		defaultServings: 4,
		ingredients: [],
		householdId: "household-1",
		...overrides,
	};
}

/**
 * Create mock MealWithDish for testing
 */
function createMockMeal(overrides: Partial<MealWithDish> = {}): MealWithDish {
	return {
		_id: "meal-1" as MealWithDish["_id"],
		_creationTime: Date.now(),
		day: "2026-01-29",
		mealType: "dinner",
		componentRole: "main",
		dishId: "dish-1" as MealWithDish["dishId"],
		customName: undefined,
		servingsUsed: 2,
		status: "planned",
		isLeftover: false,
		sourceMealId: undefined,
		householdId: "household-1",
		dish: createMockDish(),
		...overrides,
	};
}

describe("MealSlot", () => {
	const defaultProps = {
		day: "2026-01-29",
		mealType: "dinner" as const,
		meals: [] as MealWithDish[],
		onAdd: vi.fn(),
		onSelectMeal: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("empty slot", () => {
		it("renders add button when no meals", () => {
			render(<MealSlot {...defaultProps} />);

			expect(
				screen.getByRole("button", { name: /add dinner/i }),
			).toBeInTheDocument();
		});

		it("calls onAdd when clicking empty slot", () => {
			const onAdd = vi.fn();
			render(<MealSlot {...defaultProps} onAdd={onAdd} />);

			fireEvent.click(screen.getByRole("button", { name: /add dinner/i }));
			expect(onAdd).toHaveBeenCalledTimes(1);
		});
	});

	describe("with meals", () => {
		it("renders meal components grouped by role", () => {
			const meals = [
				createMockMeal({
					componentRole: "main",
					dish: createMockDish({ name: "Pasta" }),
				}),
				createMockMeal({
					_id: "meal-2" as MealWithDish["_id"],
					componentRole: "side",
					dish: createMockDish({
						_id: "dish-2" as MockDish["_id"],
						name: "Salad",
					}),
				}),
			];

			render(<MealSlot {...defaultProps} meals={meals} />);

			expect(screen.getByText("Pasta")).toBeInTheDocument();
			expect(screen.getByText("Salad")).toBeInTheDocument();
			expect(screen.getByText("Main")).toBeInTheDocument();
			expect(screen.getByText("Side")).toBeInTheDocument();
		});

		it("calls onSelectMeal when clicking a meal component", () => {
			const onSelectMeal = vi.fn();
			const meals = [createMockMeal()];

			render(
				<MealSlot
					{...defaultProps}
					meals={meals}
					onSelectMeal={onSelectMeal}
				/>,
			);

			fireEvent.click(screen.getByText("Pasta"));
			expect(onSelectMeal).toHaveBeenCalledWith(meals[0]);
		});
	});

	describe("slot-level actions", () => {
		it("shows eat/skip all buttons when meals are planned", () => {
			const meals = [createMockMeal({ status: "planned" })];

			render(<MealSlot {...defaultProps} meals={meals} />);

			// aria-label: "Mark all dinner as eaten" / "Skip all dinner"
			expect(
				screen.getByRole("button", { name: /mark all dinner as eaten/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /skip all dinner/i }),
			).toBeInTheDocument();
		});

		it("hides eat/skip all buttons when all meals are eaten", () => {
			const meals = [createMockMeal({ status: "eaten" })];

			render(<MealSlot {...defaultProps} meals={meals} />);

			expect(
				screen.queryByRole("button", { name: /mark all dinner as eaten/i }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: /skip all dinner/i }),
			).not.toBeInTheDocument();
		});

		it("hides eat/skip all buttons when all meals are skipped", () => {
			const meals = [createMockMeal({ status: "skipped" })];

			render(<MealSlot {...defaultProps} meals={meals} />);

			expect(
				screen.queryByRole("button", { name: /mark all dinner as eaten/i }),
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole("button", { name: /skip all dinner/i }),
			).not.toBeInTheDocument();
		});

		it("shows eat/skip all when some meals are planned and some eaten", () => {
			const meals = [
				createMockMeal({ status: "planned" }),
				createMockMeal({
					_id: "meal-2" as MealWithDish["_id"],
					status: "eaten",
				}),
			];

			render(<MealSlot {...defaultProps} meals={meals} />);

			expect(
				screen.getByRole("button", { name: /mark all dinner as eaten/i }),
			).toBeInTheDocument();
		});

		it("calls eatSlot mutation when clicking eat all", () => {
			const mockEatSlot = vi.fn();
			(useMutation as Mock).mockImplementation((apiRef) => {
				if (apiRef === "mealPlans:eatSlot") return mockEatSlot;
				return vi.fn();
			});

			const meals = [createMockMeal({ status: "planned" })];
			render(<MealSlot {...defaultProps} meals={meals} />);

			fireEvent.click(
				screen.getByRole("button", { name: /mark all dinner as eaten/i }),
			);

			expect(mockEatSlot).toHaveBeenCalledWith({
				householdId: "household-1",
				day: "2026-01-29",
				mealType: "dinner",
			});
		});

		it("calls skipSlot mutation when clicking skip all", () => {
			const mockSkipSlot = vi.fn();
			(useMutation as Mock).mockImplementation((apiRef) => {
				if (apiRef === "mealPlans:skipSlot") return mockSkipSlot;
				return vi.fn();
			});

			const meals = [createMockMeal({ status: "planned" })];
			render(<MealSlot {...defaultProps} meals={meals} />);

			fireEvent.click(screen.getByRole("button", { name: /skip all dinner/i }));

			expect(mockSkipSlot).toHaveBeenCalledWith({
				householdId: "household-1",
				day: "2026-01-29",
				mealType: "dinner",
			});
		});
	});

	describe("add button in filled slot", () => {
		it("shows add button even when slot has meals", () => {
			const meals = [createMockMeal()];

			render(<MealSlot {...defaultProps} meals={meals} />);

			expect(
				screen.getByRole("button", { name: /add another/i }),
			).toBeInTheDocument();
		});

		it("calls onAdd when clicking add in filled slot", () => {
			const onAdd = vi.fn();
			const meals = [createMockMeal()];

			render(<MealSlot {...defaultProps} meals={meals} onAdd={onAdd} />);

			fireEvent.click(screen.getByRole("button", { name: /add another/i }));
			expect(onAdd).toHaveBeenCalledTimes(1);
		});
	});
});
