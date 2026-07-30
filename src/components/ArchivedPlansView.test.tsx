import { render, screen } from "@testing-library/react";
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
		...props
	}: {
		children: React.ReactNode;
		to?: string;
		[key: string]: unknown;
	}) => (
		<a href={to ?? "#"} {...props}>
			{children}
		</a>
	),
}));

vi.mock("convex/_generated/api", () => ({
	api: {
		planSections: {
			listArchived: "planSections:listArchived",
		},
	},
}));

describe("ArchivedPlansView", () => {
	it("lists weekly plans and switches to custom plans", async () => {
		render(<ArchivedPlansView />);

		expect(
			screen.getByRole("link", { name: "Weekly plan — Nov 15, 2023" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: "Weekly plans" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: "Custom plans" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: "Custom plan — Jan 2, 2025",
				hidden: true,
			}),
		).toBeInTheDocument();
	});
});
