import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { HOUSEHOLD_ID } from "@/lib/constants";
import {
	addBacklogRow,
	removeBacklogRow,
	updateWeekPlanCell,
	type WeekPlanCellLocation,
} from "@/lib/weekPlan";
import {
	createDefaultWeekPlan,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
	type WeekPlan,
} from "@/lib/weekPlanTypes";

function planFromRemote(remotePlan: WeekPlan | null): WeekPlan {
	return remotePlan ?? createDefaultWeekPlan();
}

/**
 * Manage week plan state with debounced Convex persistence.
 */
export function useWeekPlan() {
	const { data: remotePlan } = useSuspenseQuery(
		convexQuery(api.weekPlans.get, { householdId: HOUSEHOLD_ID }),
	);

	const saveWeekPlanMutation = useMutation(api.weekPlans.save);
	const [plan, setPlanState] = useState<WeekPlan>(() =>
		planFromRemote(remotePlan),
	);
	const isDirtyRef = useRef(false);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!isDirtyRef.current) {
			setPlanState(planFromRemote(remotePlan));
		}
	}, [remotePlan]);

	const saveToDb = useCallback(
		async (next: WeekPlan) => {
			isDirtyRef.current = true;
			return saveWeekPlanMutation({
				householdId: HOUSEHOLD_ID,
				plan: next,
			}).finally(() => {
				isDirtyRef.current = false;
			});
		},
		[saveWeekPlanMutation],
	);

	const persist = useCallback(
		(next: WeekPlan) => {
			isDirtyRef.current = true;
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
			saveTimerRef.current = setTimeout(() => {
				void saveToDb(next);
			}, WEEK_PLAN_SAVE_DEBOUNCE_MS);
		},
		[saveToDb],
	);

	const setPlan = useCallback(
		(updater: WeekPlan | ((prev: WeekPlan) => WeekPlan)) => {
			setPlanState((prev) => {
				const next = typeof updater === "function" ? updater(prev) : updater;
				persist(next);
				return next;
			});
		},
		[persist],
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
		setPlanState(empty);
		await saveToDb(empty);
	}, [saveToDb]);

	const addBacklog = useCallback(() => {
		setPlan((prev) => addBacklogRow(prev));
	}, [setPlan]);

	const removeBacklog = useCallback(
		(index: number) => {
			setPlan((prev) => removeBacklogRow(prev, index));
		},
		[setPlan],
	);

	return {
		plan,
		updateCell,
		clearPlan,
		addBacklog,
		removeBacklog,
	};
}
