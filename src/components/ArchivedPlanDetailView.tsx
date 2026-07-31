import { Link } from "@tanstack/react-router";
import type { ArchivedPlanSection } from "convex/planSections";
import { buttonVariants } from "@/lib/components/button";
import type { CUSTOM_PLANS_SECTION } from "@/lib/constants";
import { ARCHIVED_PLAN_LABELS, MAIN_PLAN_SECTION } from "@/lib/constants";
import { formatPlanCreatedAt } from "@/lib/planSectionDisplay";
import { cn } from "@/lib/utils";
import { buildWeekPlanRows } from "./week-plan/WeekPlanTable";

function ReadOnlyMainGrid({
	content,
}: {
	content: Extract<
		ArchivedPlanSection,
		{ section: typeof MAIN_PLAN_SECTION }
	>["content"];
}) {
	const rows = buildWeekPlanRows({ ...content, customPlan: [] });

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[640px] table-fixed border-collapse border border-border text-sm">
				<thead>
					<tr className="bg-muted/40">
						<th className="w-36 border border-border px-3 py-2 text-left font-semibold">
							Date
						</th>
						<th className="w-2/5 border border-border px-3 py-2 text-left font-semibold">
							Dish
						</th>
						<th className="w-2/5 border border-border px-3 py-2 text-left font-semibold">
							Grocery List
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id}>
							<td className="border border-border px-3 py-2 font-medium">
								{row.label}
							</td>
							<td className="border border-border px-3 py-2">
								{row.dish || "—"}
							</td>
							<td className="border border-border px-3 py-2">
								{row.grocery || "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function ReadOnlyCustomPlans({
	content,
}: {
	content: Extract<
		ArchivedPlanSection,
		{ section: typeof CUSTOM_PLANS_SECTION }
	>["content"];
}) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[640px] table-fixed border-collapse border border-border text-sm">
				<thead>
					<tr className="bg-muted/40">
						<th className="w-1/3 border border-border px-3 py-2 text-left font-semibold">
							Name
						</th>
						<th className="w-1/3 border border-border px-3 py-2 text-left font-semibold">
							Dish
						</th>
						<th className="w-1/3 border border-border px-3 py-2 text-left font-semibold">
							Grocery List
						</th>
					</tr>
				</thead>
				<tbody>
					{content.rows.map((row, index) => (
						<tr key={`${row.category}-${index}`}>
							<td className="border border-border px-3 py-2 font-medium">
								{row.category || "—"}
							</td>
							<td className="border border-border px-3 py-2">
								{row.dish || "—"}
							</td>
							<td className="border border-border px-3 py-2">
								{row.grocery || "—"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/**
 * Read-only detail view for one archived plan section.
 */
export function ArchivedPlanDetailView({
	plan,
}: {
	plan: ArchivedPlanSection;
}) {
	const isMainPlan = plan.section === MAIN_PLAN_SECTION;
	const title = isMainPlan
		? ARCHIVED_PLAN_LABELS.weeklyPlan
		: ARCHIVED_PLAN_LABELS.customPlan;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold text-foreground">
						{`${title} — ${formatPlanCreatedAt(plan.createdAt)}`}
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{ARCHIVED_PLAN_LABELS.readOnlyArchive}
					</p>
				</div>
				<Link
					to="/plans/archive"
					className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
				>
					{ARCHIVED_PLAN_LABELS.backToPastPlans}
				</Link>
			</div>

			{isMainPlan ? (
				<ReadOnlyMainGrid content={plan.content} />
			) : (
				<ReadOnlyCustomPlans content={plan.content} />
			)}
		</div>
	);
}

/** Loading placeholder for the archived-plan detail route. */
export function ArchivedPlanDetailViewSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-8 w-72 animate-pulse rounded bg-muted" />
			<div className="h-64 w-full animate-pulse rounded bg-muted" />
		</div>
	);
}
