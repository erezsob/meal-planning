import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/library")({
	component: LibraryPage,
});

/**
 * Recipe library page - displays searchable dish collection
 */
function LibraryPage() {
	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-100">Recipe Library</h1>
			<p className="text-gray-400">Coming in Phase 4...</p>
		</div>
	);
}
