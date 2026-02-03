import { fireEvent, render, screen } from "@testing-library/react";
import type { Doc } from "convex/_generated/dataModel";
import { describe, expect, it, vi } from "vitest";
import { DishCard, DishCardSkeleton } from "./DishCard";

type Dish = Doc<"dishes">;

/** Create mock dish for testing */
function createMockDish(overrides: Partial<Dish> = {}): Dish {
	return {
		_id: "dish-1" as Dish["_id"],
		_creationTime: Date.now(),
		name: "Test Pasta",
		defaultServings: 4,
		ingredients: [],
		householdId: "household-1",
		...overrides,
	};
}

describe("DishCard", () => {
	it("renders dish name", () => {
		const dish = createMockDish({ name: "Spaghetti Bolognese" });
		render(<DishCard dish={dish} />);
		expect(screen.getByText("Spaghetti Bolognese")).toBeInTheDocument();
	});

	it("renders description when present", () => {
		const dish = createMockDish({ description: "A classic Italian dish" });
		render(<DishCard dish={dish} />);
		expect(screen.getByText("A classic Italian dish")).toBeInTheDocument();
	});

	it("does not render description when absent", () => {
		const dish = createMockDish({ description: undefined });
		render(<DishCard dish={dish} />);
		expect(
			screen.queryByText("A classic Italian dish"),
		).not.toBeInTheDocument();
	});

	it("shows servings count", () => {
		const dish = createMockDish({ defaultServings: 6 });
		render(<DishCard dish={dish} />);
		expect(screen.getByText("6 servings")).toBeInTheDocument();
	});

	it("shows ingredient count when > 0", () => {
		const dish = createMockDish({
			ingredients: [
				{ name: "Pasta", quantity: 500, unit: "g", category: "Pantry" },
				{ name: "Tomato", quantity: 400, unit: "g", category: "Produce" },
				{ name: "Beef", quantity: 300, unit: "g", category: "Meat" },
			],
		});
		render(<DishCard dish={dish} />);
		expect(screen.getByText("3 ingredients")).toBeInTheDocument();
	});

	it("does not show ingredient count when 0", () => {
		const dish = createMockDish({ ingredients: [] });
		render(<DishCard dish={dish} />);
		expect(screen.queryByText(/ingredients/)).not.toBeInTheDocument();
	});

	it("shows tags via TagList", () => {
		const dish = createMockDish({ tags: ["high-protein", "quick"] });
		render(<DishCard dish={dish} />);
		expect(screen.getByText("High Protein")).toBeInTheDocument();
		expect(screen.getByText("Quick")).toBeInTheDocument();
	});

	it("shows 'View Recipe' link when sourceUrl present", () => {
		const dish = createMockDish({ sourceUrl: "https://example.com/recipe" });
		render(<DishCard dish={dish} />);
		const link = screen.getByRole("link", { name: /view recipe/i });
		expect(link).toHaveAttribute("href", "https://example.com/recipe");
		expect(link).toHaveAttribute("target", "_blank");
	});

	it("does not show 'View Recipe' when no sourceUrl", () => {
		const dish = createMockDish({ sourceUrl: undefined });
		render(<DishCard dish={dish} />);
		expect(
			screen.queryByRole("link", { name: /view recipe/i }),
		).not.toBeInTheDocument();
	});

	it("calls onClick when clicking card", () => {
		const onClick = vi.fn();
		const dish = createMockDish();
		render(<DishCard dish={dish} onClick={onClick} />);

		fireEvent.click(screen.getByText("Test Pasta"));
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});

describe("DishCardSkeleton", () => {
	it("renders loading skeleton", () => {
		render(<DishCardSkeleton count={3} />);
		expect(
			screen.getByRole("presentation", { name: "Dish card skeleton" }),
		).toBeInTheDocument();
	});
});
