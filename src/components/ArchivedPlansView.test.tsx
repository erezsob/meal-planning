import { fireEvent, render, screen } from "@testing-library/react";
import type { ArchivedPlanSection } from "convex/planSections";
import { describe, expect, it, vi } from "vitest";
import {
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
} from "@/lib/weekPlanTypes";
import { ArchivedPlansView } from "./ArchivedPlansView";

const archivedPlans: ArchivedPlanSection[] = [
	{
		id: "custom-1" as ArchivedPlanSection["id"],
		section: "custom-plans",
		content: createDefaultCustomPlansContent(),
		createdAt: 1_735_689_600_000,
		updatedAt: 1_735_776_000_000,
	},
	{
		id: "main-1" as ArchivedPlanSection["id"],
		section: "main",
		content: createDefaultMainGridContent(),
		createdAt: 1_700_000_000_000,
		updatedAt: 1_700_086_400_000,
	},
];

vi.mock("@tanstack/react-query", () => ({
	useSuspenseQuery: vi.fn(() => ({ data: archivedPlans })),
}));

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		params,
		...props
	}: {
		children: React.ReactNode;
		to?: string;
		params?: Record<string, string>;
		[key: string]: unknown;
	}) => {
		const href = (to ?? "#").replace("$id", params?.id ?? "missing-id");
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	},
}));

vi.mock("convex/_generated/api", () => ({
	api: {
		planSections: {
			listArchived: "planSections:listArchived",
		},
	},
}));

const weeklyLink = () =>
	screen.queryByRole("link", { name: "Weekly plan — Nov 14, 2023" });
const customLink = () =>
	screen.queryByRole("link", { name: "Custom plan — Jan 1, 2025" });

describe("ArchivedPlansView", () => {
	it("shows weekly plans by default and hides custom plans", () => {
		render(<ArchivedPlansView />);

		expect(screen.getByRole("tab", { name: "Weekly plans" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Custom plans" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
		expect(weeklyLink()).toBeInTheDocument();
		expect(customLink()).not.toBeInTheDocument();
	});

	it("switches tabs and shows only the selected list", () => {
		render(<ArchivedPlansView />);

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Custom plans" }));

		expect(screen.getByRole("tab", { name: "Custom plans" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByRole("tab", { name: "Weekly plans" })).toHaveAttribute(
			"aria-selected",
			"false",
		);
		expect(customLink()).toBeInTheDocument();
		expect(weeklyLink()).not.toBeInTheDocument();

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Weekly plans" }));

		expect(weeklyLink()).toBeInTheDocument();
		expect(customLink()).not.toBeInTheDocument();
	});

	it("links each plan to its archive detail route", () => {
		render(<ArchivedPlansView />);

		expect(weeklyLink()).toHaveAttribute("href", "/plans/archive/main-1");

		fireEvent.mouseDown(screen.getByRole("tab", { name: "Custom plans" }));

		expect(customLink()).toHaveAttribute("href", "/plans/archive/custom-1");
	});
});
