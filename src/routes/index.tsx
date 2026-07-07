import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { WeekPlanView, WeekPlanViewSkeleton } from "../components/week-plan";

export const Route = createFileRoute("/")({
	component: WeekPlanPage,
});

function WeekPlanPage() {
	return (
		<Suspense fallback={<WeekPlanViewSkeleton />}>
			<WeekPlanView />
		</Suspense>
	);
}
