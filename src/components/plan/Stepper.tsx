import { Check, CircleDot, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_STEP_LABELS, PLAN_STEPS, type PlanStep } from "./types";

const STEP_ICONS: Record<PlanStep, React.ElementType> = {
	collect: Lightbulb,
	assign: CircleDot,
	review: Check,
};

/** Stable connector keys for rendering step connectors */
const CONNECTOR_KEYS = PLAN_STEPS.slice(1).map(
	(_, i) => `connector-${i}` as const,
);

interface StepperProps {
	/** Currently active step */
	activeStep: PlanStep;
}

/** Derive step status relative to the active step */
const getStepStatus = (
	step: PlanStep,
	activeStep: PlanStep,
): "done" | "active" | "upcoming" => {
	const activeIdx = PLAN_STEPS.indexOf(activeStep);
	const stepIdx = PLAN_STEPS.indexOf(step);
	if (stepIdx < activeIdx) return "done";
	if (stepIdx === activeIdx) return "active";
	return "upcoming";
};

/**
 * Horizontal step indicator showing progress through the wizard
 */
export function Stepper({ activeStep }: StepperProps) {
	return (
		<ol className="flex items-center justify-center gap-0 list-none m-0 p-0">
			{PLAN_STEPS.map((step, i) => {
				const status = getStepStatus(step, activeStep);
				const Icon = STEP_ICONS[step];

				return (
					<li key={step} className="flex items-center">
						{i > 0 && (
							<div
								key={CONNECTOR_KEYS[i - 1]}
								className={cn(
									"w-12 sm:w-16 h-px mx-1 sm:mx-2",
									status === "upcoming" ? "bg-gray-700" : "bg-emerald-500",
								)}
							/>
						)}
						<div className="flex items-center gap-2">
							<div
								className={cn(
									"w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
									status === "active" &&
										"bg-emerald-600 border-emerald-500 text-white",
									status === "done" &&
										"bg-emerald-600/20 border-emerald-600 text-emerald-400",
									status === "upcoming" &&
										"bg-gray-800 border-gray-700 text-gray-500",
								)}
							>
								<Icon size={14} />
							</div>
							<span
								className={cn(
									"text-sm font-medium hidden sm:inline",
									status === "active" && "text-emerald-400",
									status === "done" && "text-emerald-500/60",
									status === "upcoming" && "text-gray-500",
								)}
							>
								{PLAN_STEP_LABELS[step]}
							</span>
						</div>
					</li>
				);
			})}
		</ol>
	);
}
