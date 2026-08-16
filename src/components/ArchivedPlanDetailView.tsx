import { Link } from "@tanstack/react-router";
import type { ArchivedPlanSection } from "convex/planSections";
import { buttonVariants } from "@/lib/components/button";
import type { CUSTOM_PLANS_SECTION } from "@/lib/constants";
import { ARCHIVED_PLAN_LABELS, MAIN_PLAN_SECTION } from "@/lib/constants";
import { formatPlanCreatedAt } from "@/lib/planSectionDisplay";
import { cn } from "@/lib/utils";
import {
	PLAN_TABLE_CLASS_NAME,
	PLAN_TABLE_HEADER_ROW_CLASS_NAME,
	planTableBodyCellClassName,
	planTableHeaderCellClassName,
} from "./week-plan/planTableStyles";
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
			<table className={PLAN_TABLE_CLASS_NAME}>
				<thead>
					<tr className={PLAN_TABLE_HEADER_ROW_CLASS_NAME}>
						<th className={planTableHeaderCellClassName("w-36")}>Date</th>
						<th className={planTableHeaderCellClassName("w-2/5")}>Dish</th>
						<th className={planTableHeaderCellClassName("w-2/5")}>
							Grocery List
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr key={row.id}>
							<td className={planTableBodyCellClassName("font-medium")}>
								{row.label}
							</td>
							<td className={planTableBodyCellClassName()}>
								{row.dish || "—"}
							</td>
							<td className={planTableBodyCellClassName()}>
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
			<table className={PLAN_TABLE_CLASS_NAME}>
				<thead>
					<tr className={PLAN_TABLE_HEADER_ROW_CLASS_NAME}>
						<th className={planTableHeaderCellClassName("w-1/3")}>Name</th>
						<th className={planTableHeaderCellClassName("w-1/3")}>Dish</th>
						<th className={planTableHeaderCellClassName("w-1/3")}>
							Grocery List
						</th>
					</tr>
				</thead>
				<tbody>
					{content.rows.map((row, index) => (
						<tr key={`${row.category}-${index}`}>
							<td className={planTableBodyCellClassName("font-medium")}>
								{row.category || "—"}
							</td>
							<td className={planTableBodyCellClassName()}>
								{row.dish || "—"}
							</td>
							<td className={planTableBodyCellClassName()}>
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
