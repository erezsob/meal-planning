import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useCallback, useState } from "react";
import { HOUSEHOLD_ID } from "@/lib/constants";
import { createDefaultMainGridContent } from "@/lib/weekPlanTypes";
import { useCustomPlansSection } from "./useCustomPlansSection";
import { useMainGridPlans } from "./useMainGridPlans";

/**
 * Manage stacked week plan state with debounced Convex persistence per section.
 *
 * Local edits overlay remote main grids and custom plans until saved; when not
 * editing, remote subscription updates apply automatically without a sync effect.
 *
 * @returns Plan state, per-grid cell/backlog actions, lifecycle actions, and save error.
 */
export function useWeekPlan() {
	const { data: remoteHome } = useSuspenseQuery(
		convexQuery(api.planSections.getHome, { householdId: HOUSEHOLD_ID }),
	);

	const [saveError, setSaveError] = useState<string | null>(null);

	const onSaveSuccess = useCallback(() => {
		setSaveError(null);
	}, []);

	const onSaveError = useCallback((message: string) => {
		setSaveError(message);
	}, []);

	const onClearError = useCallback(() => {
		setSaveError(null);
	}, []);

	const main = useMainGridPlans({
		remoteHome,
		onSaveError,
		onSaveSuccess,
		onClearError,
	});

	const custom = useCustomPlansSection({
		remoteHome,
		getTopMainContent: () =>
			main.mainGrids[0]?.content ?? createDefaultMainGridContent(),
		onSaveError,
		onSaveSuccess,
		onClearError,
	});

	return {
		mainGrids: main.mainGrids,
		customPlanRows: custom.customPlanRows,
		saveError,
		updateCell: main.updateCell,
		clearMainTop: main.clearMainTop,
		addBacklog: main.addBacklog,
		removeBacklog: main.removeBacklog,
		updateCustomPlan: custom.updateCustomPlan,
		addCustomPlan: custom.addCustomPlan,
		removeCustomPlan: custom.removeCustomPlan,
		clearCustomPlan: custom.clearCustomPlan,
		newWeeklyPlan: main.newWeeklyPlan,
		newCustomPlan: custom.newCustomPlan,
	};
}
