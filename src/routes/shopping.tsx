import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { ShoppingView, ShoppingViewSkeleton } from "../components/shopping";

export const Route = createFileRoute("/shopping")({
	component: ShoppingPage,
});

/**
 * Shopping list page - week ingredients grouped by category, checkboxes persisted per week
 */
function ShoppingPage() {
	return (
		<Suspense fallback={<ShoppingViewSkeleton />}>
			<ShoppingView />
		</Suspense>
	);
}
