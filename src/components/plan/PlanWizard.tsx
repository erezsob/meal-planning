import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { formatDateKey, getDateRange } from "@/lib/constants";
import { AssignStep } from "./AssignStep";
import { CollectStep } from "./CollectStep";
import { ReviewStep } from "./ReviewStep";
import { Stepper } from "./Stepper";
import { DEFAULT_NUM_DAYS, PLAN_STEPS, type PlanStep } from "./types";
import { hasDraftForRange, usePlanDraft } from "./use-plan-draft";

/** Navigate to the next wizard step (clamped) */
const nextStep = (current: PlanStep): PlanStep => {
	const idx = PLAN_STEPS.indexOf(current);
	return PLAN_STEPS[Math.min(idx + 1, PLAN_STEPS.length - 1)];
};

/** Navigate to the previous wizard step (clamped) */
const prevStep = (current: PlanStep): PlanStep => {
	const idx = PLAN_STEPS.indexOf(current);
	return PLAN_STEPS[Math.max(idx - 1, 0)];
};

/** Get today with time zeroed out */
const today = (): Date => {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
};

/**
 * Plan Mode wizard container.
 * Manages date range, step state, and renders the active step.
 */
export function PlanWizard() {
	const [startDate, setStartDate] = useState(today);
	const [numDays, setNumDays] = useState(DEFAULT_NUM_DAYS);
	const [step, setStep] = useState<PlanStep>("collect");

	const startDateKey = formatDateKey(startDate);
	const planDates = getDateRange(startDate, numDays);

	const draftHook = usePlanDraft(startDateKey, numDays);

	const shiftStart = useCallback((days: number) => {
		setStartDate((prev) => {
			const next = new Date(prev);
			next.setDate(next.getDate() + days);
			return next;
		});
	}, []);

	const jumpToToday = useCallback(() => {
		const t = today();
		const key = formatDateKey(t);
		setStartDate(t);
		setStep(hasDraftForRange(key, numDays) ? "assign" : "collect");
	}, [numDays]);

	const goNext = useCallback(() => setStep(nextStep), []);
	const goBack = useCallback(() => setStep(prevStep), []);

	const handleCommitSuccess = useCallback(() => {
		setStep("collect");
	}, []);

	const hasDraft =
		draftHook.draft.dishes.length > 0 || draftHook.draft.assignments.length > 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4 flex-wrap">
				<h1 className="text-2xl font-bold text-foreground">Plan Mode</h1>
				{hasDraft && (
					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className="text-amber-400 border-amber-600/40"
						>
							Draft
						</Badge>
						<Button
							variant="ghost"
							size="xs"
							onClick={() => {
								draftHook.discardDraft();
								setStep("collect");
							}}
							className="text-muted-foreground hover:text-destructive"
						>
							<Trash2 size={14} />
							Clear
						</Button>
					</div>
				)}
			</div>

			<Stepper activeStep={step} />

			{step === "collect" && (
				<CollectStep
					draft={draftHook.draft}
					startDateKey={startDateKey}
					numDays={numDays}
					onCollect={draftHook.collectDish}
					onUncollect={draftHook.uncollectDish}
					onLoadDraft={draftHook.loadEntireDraft}
					onNext={goNext}
				/>
			)}

			{step === "assign" && (
				<AssignStep
					draft={draftHook.draft}
					startDate={startDate}
					planDates={planDates}
					numDays={numDays}
					onAssign={draftHook.assignDish}
					onUnassign={draftHook.unassignDish}
					onShiftStart={shiftStart}
					onToday={jumpToToday}
					onSetNumDays={setNumDays}
					onBack={goBack}
					onNext={goNext}
				/>
			)}

			{step === "review" && (
				<ReviewStep
					draft={draftHook.draft}
					planDates={planDates}
					onBack={goBack}
					onCommit={draftHook.commitPlan}
					onDiscard={draftHook.discardDraft}
					onCommitSuccess={handleCommitSuccess}
				/>
			)}
		</div>
	);
}
