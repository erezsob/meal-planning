import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";

describe("WeekPlanCellEditor", () => {
	it("renders a focusable cell button in embedded table mode", () => {
		render(
			<WeekPlanCellEditor
				embedded
				label="Monday dish"
				value="Pasta"
				onChange={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Monday dish" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	});

	it("opens edit mode when an embedded cell receives focus", () => {
		render(
			<WeekPlanCellEditor
				embedded
				label="Monday dish"
				value="Pasta"
				onChange={vi.fn()}
			/>,
		);

		fireEvent.focus(screen.getByRole("button", { name: "Monday dish" }));

		expect(screen.getByLabelText("Monday dish")).toBeInTheDocument();
	});

	it("tabs to the next embedded table cell", () => {
		render(
			<table>
				<tbody>
					<tr>
						<td>
							<WeekPlanCellEditor
								embedded
								label="Monday dish"
								value="Pasta"
								onChange={vi.fn()}
							/>
						</td>
						<td>
							<WeekPlanCellEditor
								embedded
								label="Monday grocery list"
								value="noodles"
								onChange={vi.fn()}
							/>
						</td>
					</tr>
				</tbody>
			</table>,
		);

		fireEvent.focus(screen.getByRole("button", { name: "Monday dish" }));
		const dishInput = screen.getByLabelText("Monday dish");
		fireEvent.keyDown(dishInput, { key: "Tab" });

		expect(screen.getByLabelText("Monday grocery list")).toBeInTheDocument();
	});

	it("enters edit mode when clicking display area", () => {
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Pasta"
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monday dish" }));

		expect(screen.getByLabelText("Monday dish")).toBeInTheDocument();
	});

	it("enters edit mode when clicking text beside a link", () => {
		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="See https://example.com/recipe"
				onChange={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "See" }));

		expect(screen.getByLabelText("Monday dish")).toBeInTheDocument();
	});

	it("renders URLs as links without entering edit mode", () => {
		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="See https://example.com/recipe"
				onChange={vi.fn()}
			/>,
		);

		const link = screen.getByRole("link", {
			name: "https://example.com/recipe",
		});
		expect(link).toHaveAttribute("href", "https://example.com/recipe");

		fireEvent.click(link);
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
		expect(screen.getByText("See")).toBeInTheDocument();
	});

	it("calls onChange while editing", () => {
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Pasta"
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monday dish" }));
		fireEvent.change(screen.getByLabelText("Monday dish"), {
			target: { value: "Risotto" },
		});

		expect(onChange).toHaveBeenCalledWith("Risotto");
	});

	it("exits edit mode on blur", () => {
		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Pasta"
				onChange={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monday dish" }));
		fireEvent.blur(screen.getByLabelText("Monday dish"));

		expect(
			screen.getByRole("button", { name: "Monday dish" }),
		).toBeInTheDocument();
	});
});
