import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { HistoryView, HistoryViewSkeleton } from "../components/history";

export const Route = createFileRoute("/history")({
	component: HistoryPage,
});

function HistoryPage() {
	return (
		<Suspense fallback={<HistoryViewSkeleton />}>
			<HistoryView />
		</Suspense>
	);
}
