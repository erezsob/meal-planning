import { QueryClient } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ArchivedPlanSection } from "convex/planSections";
import { describe, expect, it, vi } from "vitest";
import {
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
} from "@/lib/weekPlanTypes";
import { routeTree } from "../routeTree.gen";

const GET_ARCHIVED_REF = "planSections:getArchived";

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

vi.mock("@convex-dev/react-query", () => ({
	convexQuery: vi.fn((fnRef: string, args?: unknown) => ({ fnRef, args })),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const original =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...original,
		useSuspenseQuery: vi.fn(
			(options: { fnRef: string; args?: { id: string } }) => ({
				data:
					options.fnRef === GET_ARCHIVED_REF
						? (archivedPlans.find((plan) => plan.id === options.args?.id) ??
							null)
						: archivedPlans,
			}),
		),
	};
});

vi.mock("convex/_generated/api", () => ({
	api: {
		planSections: {
			listArchived: "planSections:listArchived",
			getArchived: "planSections:getArchived",
		},
	},
}));

vi.mock("@tanstack/react-devtools", () => ({
	TanStackDevtools: () => null,
}));

vi.mock("@tanstack/react-router-devtools", () => ({
	TanStackRouterDevtoolsPanel: () => null,
}));

vi.mock("./Header", () => ({
	Header: () => <header />,
}));

function renderArchiveRoute(initialPath: string) {
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: [initialPath] }),
		context: { queryClient: new QueryClient() },
	});
	render(<RouterProvider router={router} />);
	return router;
}

describe("archived plans navigation", () => {
	it("opens the read-only plan grid when clicking an archived plan", async () => {
		renderArchiveRoute("/plans/archive");

		await screen.findByRole("heading", { name: "Past plans" });
		fireEvent.click(
			screen.getByRole("link", { name: "Weekly plan — Nov 14, 2023" }),
		);

		await screen.findByRole("heading", {
			name: "Weekly plan — Nov 14, 2023",
		});
		expect(screen.getByRole("table")).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "Past plans" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Back to past plans" }),
		).toBeInTheDocument();
	});
});
