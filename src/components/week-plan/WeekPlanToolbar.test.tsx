import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeWeekPlanExport } from "@/lib/weekPlanStorage";
import { createDefaultWeekPlan } from "@/lib/weekPlanTypes";
import { WeekPlanToolbar } from "./WeekPlanToolbar";

describe("WeekPlanToolbar", () => {
	const defaultPlan = createDefaultWeekPlan();
	const onClear = vi.fn();
	const onImport = vi.fn();
	const writeText = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		writeText.mockReset();
		Object.assign(navigator, {
			clipboard: { writeText },
		});
	});

	it("shows copy success message after copying plan", async () => {
		writeText.mockResolvedValue(undefined);

		render(
			<WeekPlanToolbar
				plan={defaultPlan}
				onClear={onClear}
				onImport={onImport}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Copy plan/i }));

		expect(writeText).toHaveBeenCalledWith(
			serializeWeekPlanExport(defaultPlan),
		);
		expect(await screen.findByText("Copied to clipboard")).toBeInTheDocument();
	});

	it("shows error when clipboard copy fails", async () => {
		writeText.mockRejectedValue(new Error("denied"));

		render(
			<WeekPlanToolbar
				plan={defaultPlan}
				onClear={onClear}
				onImport={onImport}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Copy plan/i }));

		expect(
			await screen.findByText("Could not copy to clipboard"),
		).toBeInTheDocument();
	});

	it("shows import error for invalid JSON", () => {
		render(
			<WeekPlanToolbar
				plan={defaultPlan}
				onClear={onClear}
				onImport={onImport}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Import plan/i }));
		fireEvent.change(screen.getByLabelText("Import plan JSON"), {
			target: { value: "not json" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /Replace current plan/i }),
		);

		expect(screen.getByRole("alert")).toHaveTextContent("Invalid JSON");
		expect(onImport).not.toHaveBeenCalled();
	});

	it("imports a valid plan and closes the dialog", () => {
		const importedPlan = createDefaultWeekPlan();
		importedPlan.weekdays.monday = { dish: "Tacos", grocery: "tortillas" };
		const json = serializeWeekPlanExport(importedPlan);

		render(
			<WeekPlanToolbar
				plan={defaultPlan}
				onClear={onClear}
				onImport={onImport}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Import plan/i }));
		fireEvent.change(screen.getByLabelText("Import plan JSON"), {
			target: { value: json },
		});
		fireEvent.click(
			screen.getByRole("button", { name: /Replace current plan/i }),
		);

		expect(onImport).toHaveBeenCalledWith(importedPlan);
		expect(
			screen.queryByRole("heading", { name: /Import plan/i }),
		).not.toBeInTheDocument();
	});

	it("calls onClear when confirming clear plan", () => {
		render(
			<WeekPlanToolbar
				plan={defaultPlan}
				onClear={onClear}
				onImport={onImport}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Clear plan/i }));
		fireEvent.click(
			within(screen.getByRole("dialog")).getByRole("button", {
				name: /Clear plan/i,
			}),
		);

		expect(onClear).toHaveBeenCalledTimes(1);
	});
});
