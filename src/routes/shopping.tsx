import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shopping")({
	component: ShoppingPage,
});

/**
 * Shopping list page - displays aggregated ingredients for the week
 */
function ShoppingPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-100">Shopping List</h1>
			<p className="text-gray-400">Coming in Phase 5...</p>
		</div>
	);
}
