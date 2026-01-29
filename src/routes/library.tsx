import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { LibraryView, LibraryViewSkeleton } from "../components/library";

export const Route = createFileRoute("/library")({
	component: LibraryPage,
});

/**
 * Dishes library page
 */
function LibraryPage() {
	return (
		<Suspense fallback={<LibraryViewSkeleton />}>
			<LibraryView />
		</Suspense>
	);
}
