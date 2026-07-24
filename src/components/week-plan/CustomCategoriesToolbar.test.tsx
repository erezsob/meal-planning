import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CustomCategoriesToolbar } from "./CustomCategoriesToolbar";

describe("CustomCategoriesToolbar", () => {
	const onClear = vi.fn();

	it("calls onClear when confirming clear categories", () => {
		render(<CustomCategoriesToolbar onClear={onClear} />);

		fireEvent.click(screen.getByRole("button", { name: /Clear categories/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear categories/i,
			}),
		);

		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it("shows Are you sure confirmation title", () => {
		render(<CustomCategoriesToolbar onClear={onClear} />);

		fireEvent.click(screen.getByRole("button", { name: /Clear categories/i }));

		expect(
			screen.getByRole("heading", { name: /Are you sure\?/i }),
		).toBeInTheDocument();
	});
});
