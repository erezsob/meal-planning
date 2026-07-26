import {
	act,
	createEvent,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LINK_TOOLTIP_DELAY_MS } from "@/lib/constants";
import { WeekPlanCellEditor } from "./WeekPlanCellEditor";

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

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

	it("renders markdown labeled links as the label text", () => {
		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Try [Pasta](https://example.com/recipe)"
				onChange={vi.fn()}
			/>,
		);

		const link = screen.getByRole("link", { name: "Pasta" });
		expect(link).toHaveAttribute("href", "https://example.com/recipe");
		expect(
			screen.queryByText("[Pasta](https://example.com/recipe)"),
		).not.toBeInTheDocument();
	});

	it("renders links in embedded table cells", () => {
		render(
			<WeekPlanCellEditor
				embedded
				label="Monday dish"
				value="[Pasta](https://example.com/recipe)"
				onChange={vi.fn()}
			/>,
		);

		const link = screen.getByRole("link", { name: "Pasta" });
		expect(link).toHaveAttribute("href", "https://example.com/recipe");

		fireEvent.click(link);
		expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
	});

	it("wraps selected text as a markdown link when pasting a URL", () => {
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Pasta"
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monday dish" }));
		const textarea = screen.getByLabelText(
			"Monday dish",
		) as HTMLTextAreaElement;
		textarea.setSelectionRange(0, 5);

		fireEvent.paste(textarea, {
			clipboardData: {
				getData: () => "https://example.com/recipe",
			},
		});

		expect(onChange).toHaveBeenCalledWith(
			"[Pasta](https://example.com/recipe)",
		);
	});

	it("pastes normally when nothing is selected", () => {
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Pasta"
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monday dish" }));
		const textarea = screen.getByLabelText(
			"Monday dish",
		) as HTMLTextAreaElement;
		textarea.setSelectionRange(5, 5);

		const pasteEvent = createEvent.paste(textarea, {
			clipboardData: {
				getData: () => "https://example.com/recipe",
			},
		});
		fireEvent(textarea, pasteEvent);

		expect(pasteEvent.defaultPrevented).toBe(false);
		expect(onChange).not.toHaveBeenCalled();
	});

	it("wraps selected text as a markdown link on Cmd/Ctrl+K", () => {
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Pasta"
				onChange={onChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Monday dish" }));
		const textarea = screen.getByLabelText(
			"Monday dish",
		) as HTMLTextAreaElement;
		textarea.setSelectionRange(0, 5);

		fireEvent.keyDown(textarea, { key: "k", metaKey: true });

		fireEvent.change(screen.getByLabelText("Link URL"), {
			target: { value: "https://example.com/recipe" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Add link" }));

		expect(onChange).toHaveBeenCalledWith(
			"[Pasta](https://example.com/recipe)",
		);
	});

	it("edits a link URL from the hover tooltip", () => {
		vi.useFakeTimers();
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Try [Pasta](https://example.com/recipe)"
				onChange={onChange}
			/>,
		);

		fireEvent.mouseEnter(screen.getByRole("link", { name: "Pasta" }));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(LINK_TOOLTIP_DELAY_MS);
		});

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(
			screen.getByDisplayValue("https://example.com/recipe"),
		).toBeInTheDocument();

		fireEvent.change(screen.getByDisplayValue("https://example.com/recipe"), {
			target: { value: "https://example.com/new" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save link" }));

		expect(onChange).toHaveBeenCalledWith(
			"Try [Pasta](https://example.com/new)",
		);
	});

	it("unlinks from the hover tooltip while keeping the label", () => {
		vi.useFakeTimers();
		const onChange = vi.fn();

		render(
			<WeekPlanCellEditor
				label="Monday dish"
				value="Try [Pasta](https://example.com/recipe)"
				onChange={onChange}
			/>,
		);

		fireEvent.mouseEnter(screen.getByRole("link", { name: "Pasta" }));
		act(() => {
			vi.advanceTimersByTime(LINK_TOOLTIP_DELAY_MS);
		});

		fireEvent.click(screen.getByRole("button", { name: "Unlink" }));

		expect(onChange).toHaveBeenCalledWith("Try Pasta");
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
