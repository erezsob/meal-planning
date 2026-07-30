import { render, screen } from "@testing-library/react";
import type { ArchivedPlanSection } from "convex/planSections";
import { describe, expect, it, vi } from "vitest";
import { createDefaultMainGridContent } from "@/lib/weekPlanTypes";
import { ArchivedPlanDetailView } from "./ArchivedPlanDetailView";

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

describe("ArchivedPlanDetailView", () => {
	it("renders an archived weekly plan without editable controls", () => {
		const content = createDefaultMainGridContent();
		content.weekdays.saturday = { dish: "Old ribs", grocery: "Paprika" };

		const plan: ArchivedPlanSection = {
			id: "main-1" as ArchivedPlanSection["id"],
			section: "main",
			content,
			createdAt: 1_735_689_600_000,
			updatedAt: 1_735_776_000_000,
		};

		render(<ArchivedPlanDetailView plan={plan} />);

		expect(
			screen.getByRole("heading", {
				name: "Weekly plan — Jan 2, 2025",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Old ribs")).toBeInTheDocument();
		expect(screen.getByText("Paprika")).toBeInTheDocument();
		expect(screen.queryAllByRole("textbox")).toHaveLength(0);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
		expect(
			screen.getByRole("link", { name: "Back to past plans" }),
		).toBeInTheDocument();
	});
});
