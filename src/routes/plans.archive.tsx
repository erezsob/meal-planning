import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import {
	ArchivedPlansView,
	ArchivedPlansViewSkeleton,
} from "../components/ArchivedPlansView";

export const Route = createFileRoute("/plans/archive")({
	component: ArchivedPlansPage,
});

function ArchivedPlansPage() {
	return (
		<Suspense fallback={<ArchivedPlansViewSkeleton />}>
			<ArchivedPlansView />
		</Suspense>
	);
}
