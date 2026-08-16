import { Link } from "@tanstack/react-router";
import type { ArchivedPlanSection } from "convex/planSections";
import { buttonVariants } from "@/lib/components/button";
import type { CUSTOM_PLANS_SECTION } from "@/lib/constants";
import { ARCHIVED_PLAN_LABELS, MAIN_PLAN_SECTION } from "@/lib/constants";
import { formatPlanCreatedAt } from "@/lib/planSectionDisplay";
import { cn } from "@/lib/utils";
import {
	PlanTable,
	PlanTableBody,
	PlanTableCell,
	PlanTableHead,
	PlanTableHeadCell,
} from "./week-plan/PlanTable";
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
		<PlanTable>
			<PlanTableHead>
				<PlanTableHeadCell className="w-36">Date</PlanTableHeadCell>
				<PlanTableHeadCell className="w-2/5">Dish</PlanTableHeadCell>
				<PlanTableHeadCell className="w-2/5">Grocery List</PlanTableHeadCell>
			</PlanTableHead>
			<PlanTableBody>
				{rows.map((row) => (
					<tr key={row.id}>
						<PlanTableCell className="font-medium">{row.label}</PlanTableCell>
						<PlanTableCell>{row.dish || "—"}</PlanTableCell>
						<PlanTableCell>{row.grocery || "—"}</PlanTableCell>
					</tr>
				))}
			</PlanTableBody>
		</PlanTable>
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
		<PlanTable>
			<PlanTableHead>
				<PlanTableHeadCell className="w-1/3">Name</PlanTableHeadCell>
				<PlanTableHeadCell className="w-1/3">Dish</PlanTableHeadCell>
				<PlanTableHeadCell className="w-1/3">Grocery List</PlanTableHeadCell>
			</PlanTableHead>
			<PlanTableBody>
				{content.rows.map((row, index) => (
					<tr key={`${row.category}-${index}`}>
						<PlanTableCell className="font-medium">
							{row.category || "—"}
						</PlanTableCell>
						<PlanTableCell>{row.dish || "—"}</PlanTableCell>
						<PlanTableCell>{row.grocery || "—"}</PlanTableCell>
					</tr>
				))}
			</PlanTableBody>
		</PlanTable>
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
