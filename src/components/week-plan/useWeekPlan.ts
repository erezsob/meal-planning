import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HOUSEHOLD_ID } from "@/lib/constants";
import {
	addBacklogRow,
	addCustomPlanRow,
	type CustomPlanField,
	normalizeWeekPlan,
	removeBacklogRow,
	removeCustomPlanRow,
	clearCustomPlan as resetCustomPlanRows,
	updateCustomPlanCell,
	updateWeekPlanCell,
	type WeekPlanCellLocation,
} from "@/lib/weekPlan";
import {
	createDefaultWeekPlan,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
	type WeekPlan,
} from "@/lib/weekPlanTypes";

function planFromRemote(remotePlan: WeekPlan | null): WeekPlan {
	return normalizeWeekPlan(remotePlan);
}

/**
 * Manage week plan state with debounced Convex persistence.
 *
 * Local edits overlay the remote plan until saved; when not editing, remote
 * subscription updates apply automatically without a sync effect.
 *
 * @returns Plan state, cell/backlog/custom plan actions, and save error message (if any).
 */
export function useWeekPlan() {
	const { data: remotePlan } = useSuspenseQuery(
		convexQuery(api.weekPlans.get, { householdId: HOUSEHOLD_ID }),
	);

	const saveWeekPlanMutation = useMutation(api.weekPlans.save);
	const [pendingPlan, setPendingPlan] = useState<WeekPlan | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const editGenerationRef = useRef(0);
	const remotePlanRef = useRef(remotePlan);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	remotePlanRef.current = remotePlan;

	const plan = pendingPlan ?? planFromRemote(remotePlan);

	useEffect(() => {
		return () => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
		};
	}, []);

	const getBasePlan = useCallback(
		() => planFromRemote(remotePlanRef.current),
		[],
	);

	const commitSave = useCallback(
		async (next: WeekPlan, generationAtSaveStart: number) => {
			try {
				await saveWeekPlanMutation({
					householdId: HOUSEHOLD_ID,
					plan: next,
				});
				setSaveError(null);
				if (editGenerationRef.current === generationAtSaveStart) {
					setPendingPlan(null);
				}
			} catch (error) {
				setSaveError(
					error instanceof Error ? error.message : "Could not save plan",
				);
			}
		},
		[saveWeekPlanMutation],
	);

	const persist = useCallback(
		(next: WeekPlan) => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
			saveTimerRef.current = setTimeout(() => {
				const generation = editGenerationRef.current;
				void commitSave(next, generation);
			}, WEEK_PLAN_SAVE_DEBOUNCE_MS);
		},
		[commitSave],
	);

	const setPlan = useCallback(
		(updater: WeekPlan | ((prev: WeekPlan) => WeekPlan)) => {
			editGenerationRef.current += 1;
			setSaveError(null);
			setPendingPlan((prevPending) => {
				const base = prevPending ?? getBasePlan();
				const next = typeof updater === "function" ? updater(base) : updater;
				persist(next);
				return next;
			});
		},
		[persist, getBasePlan],
	);

	const updateCell = useCallback(
		({
			location,
			field,
			value,
		}: {
			location: WeekPlanCellLocation;
			field: "dish" | "grocery";
			value: string;
		}) => {
			setPlan((prev) =>
				updateWeekPlanCell({ plan: prev, location, field, value }),
			);
		},
		[setPlan],
	);

	const clearPlan = useCallback(async () => {
		const empty = createDefaultWeekPlan();
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}
		editGenerationRef.current += 1;
		const generationAtSaveStart = editGenerationRef.current;
		setSaveError(null);
		setPendingPlan(empty);
		await commitSave(empty, generationAtSaveStart);
	}, [commitSave]);

	const addBacklog = useCallback(() => {
		setPlan((prev) => addBacklogRow(prev));
	}, [setPlan]);

	const removeBacklog = useCallback(
		(index: number) => {
			setPlan((prev) => removeBacklogRow(prev, index));
		},
		[setPlan],
	);

	const updateCustomPlan = useCallback(
		({
			index,
			field,
			value,
		}: {
			index: number;
			field: CustomPlanField;
			value: string;
		}) => {
			setPlan((prev) =>
				updateCustomPlanCell({ plan: prev, index, field, value }),
			);
		},
		[setPlan],
	);

	const addCustomPlan = useCallback(() => {
		setPlan((prev) => addCustomPlanRow(prev));
	}, [setPlan]);

	const removeCustomPlan = useCallback(
		(index: number) => {
			setPlan((prev) => removeCustomPlanRow(prev, index));
		},
		[setPlan],
	);

	const clearCustomPlan = useCallback(async () => {
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}
		editGenerationRef.current += 1;
		const generationAtSaveStart = editGenerationRef.current;
		setSaveError(null);
		setPendingPlan((prevPending) => {
			const base = prevPending ?? getBasePlan();
			const next = resetCustomPlanRows(base);
			void commitSave(next, generationAtSaveStart);
			return next;
		});
	}, [commitSave, getBasePlan]);

	return {
		plan,
		saveError,
		updateCell,
		clearPlan,
		addBacklog,
		removeBacklog,
		updateCustomPlan,
		addCustomPlan,
		removeCustomPlan,
		clearCustomPlan,
	};
}
