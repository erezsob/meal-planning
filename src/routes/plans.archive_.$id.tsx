import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Suspense } from "react";
import {
	ArchivedPlanDetailView,
	ArchivedPlanDetailViewSkeleton,
} from "../components/ArchivedPlanDetailView";

// File-based routing: the trailing `_` in `archive_` escapes nesting so this
// route is a root-level sibling of `/plans/archive`, not a child of it. The
// list route (`plans.archive.tsx`) renders the tabbed view with no <Outlet/>,
// so a nested child would match navigation but never mount. The `_` is stripped
// from the URL — the public path is still `/plans/archive/$id` as the spec
// requires; only the internal route tree shape changes.
export const Route = createFileRoute("/plans/archive_/$id")({
	component: ArchivedPlanDetailPage,
});

function ArchivedPlanDetailPage() {
	const { id } = useParams({ from: "/plans/archive_/$id" });

	return (
		<Suspense fallback={<ArchivedPlanDetailViewSkeleton />}>
			<ArchivedPlanDetailContent id={id as Id<"planSections">} />
		</Suspense>
	);
}

function ArchivedPlanDetailContent({ id }: { id: Id<"planSections"> }) {
	const { data: plan } = useSuspenseQuery(
		convexQuery(api.planSections.getArchived, { id }),
	);

	if (!plan) {
		return (
			<div className="space-y-2">
				<h1 className="text-2xl font-bold text-foreground">
					Archived plan not found
				</h1>
				<p className="text-muted-foreground">
					This plan may no longer be available.
				</p>
			</div>
		);
	}

	return <ArchivedPlanDetailView plan={plan} />;
}
