import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { ArchivedPlanSection } from "convex/planSections";
import { buttonVariants } from "@/lib/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";
import {
	ARCHIVED_PLAN_EMPTY_MESSAGES,
	ARCHIVED_PLAN_LABELS,
	CUSTOM_PLANS_SECTION,
	HOUSEHOLD_ID,
	MAIN_PLAN_SECTION,
} from "@/lib/constants";
import { formatPlanCreatedAt } from "@/lib/planSectionDisplay";
import { cn } from "@/lib/utils";

function ArchivedPlanLink({ plan }: { plan: ArchivedPlanSection }) {
	const label =
		plan.section === MAIN_PLAN_SECTION
			? ARCHIVED_PLAN_LABELS.weeklyPlan
			: ARCHIVED_PLAN_LABELS.customPlan;

	return (
		<li>
			<Link
				to="/plans/archive/$id"
				params={{ id: plan.id }}
				className={cn(
					buttonVariants({ variant: "outline" }),
					"flex h-auto w-full flex-col items-start gap-1 px-4 py-3",
				)}
			>
				<span>{`${label} — ${formatPlanCreatedAt(plan.createdAt)}`}</span>
			</Link>
		</li>
	);
}

function ArchivedPlanList({
	plans,
	emptyMessage,
}: {
	plans: ArchivedPlanSection[];
	emptyMessage: string;
}) {
	if (plans.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
	}

	return (
		<ul className="grid gap-3 sm:grid-cols-2">
			{plans.map((plan) => (
				<ArchivedPlanLink key={plan.id} plan={plan} />
			))}
		</ul>
	);
}

/**
 * Tabbed list of archived weekly and custom plans.
 */
export function ArchivedPlansView() {
	const { data: plans } = useSuspenseQuery(
		convexQuery(api.planSections.listArchived, {
			householdId: HOUSEHOLD_ID,
		}),
	);
	const weeklyPlans = plans.filter(
		(plan) => plan.section === MAIN_PLAN_SECTION,
	);
	const customPlans = plans.filter(
		(plan) => plan.section === CUSTOM_PLANS_SECTION,
	);

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-bold text-foreground">
					{ARCHIVED_PLAN_LABELS.pastPlans}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Browse archived plans without changing them.
				</p>
			</header>

			<Tabs defaultValue={MAIN_PLAN_SECTION}>
				<TabsList aria-label="Archived plan type">
					<TabsTrigger value={MAIN_PLAN_SECTION}>Weekly plans</TabsTrigger>
					<TabsTrigger value={CUSTOM_PLANS_SECTION}>Custom plans</TabsTrigger>
				</TabsList>
				<TabsContent value={MAIN_PLAN_SECTION} className="pt-4">
					<ArchivedPlanList
						plans={weeklyPlans}
						emptyMessage={ARCHIVED_PLAN_EMPTY_MESSAGES.weekly}
					/>
				</TabsContent>
				<TabsContent value={CUSTOM_PLANS_SECTION} className="pt-4">
					<ArchivedPlanList
						plans={customPlans}
						emptyMessage={ARCHIVED_PLAN_EMPTY_MESSAGES.custom}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}

/** Loading placeholder for the archived-plan list route. */
export function ArchivedPlansViewSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-8 w-48 animate-pulse rounded bg-muted" />
			<div className="h-9 w-64 animate-pulse rounded bg-muted" />
			<div className="h-16 w-full animate-pulse rounded bg-muted" />
		</div>
	);
}
