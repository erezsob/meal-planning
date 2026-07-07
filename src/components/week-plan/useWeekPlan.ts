import { useCallback, useEffect, useRef, useState } from "react";
import {
	addBacklogRow,
	loadWeekPlan,
	removeBacklogRow,
	saveWeekPlan,
	updateWeekPlanCell,
	type WeekPlanCellLocation,
} from "@/lib/weekPlanStorage";
import {
	createDefaultWeekPlan,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
	type WeekPlan,
} from "@/lib/weekPlanTypes";

/**
 * Manage week plan state with debounced localStorage persistence.
 */
export function useWeekPlan() {
	const [plan, setPlanState] = useState<WeekPlan>(loadWeekPlan);
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
		};
	}, []);

	const persist = useCallback((next: WeekPlan) => {
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}
		saveTimerRef.current = setTimeout(() => {
			saveWeekPlan(next);
		}, WEEK_PLAN_SAVE_DEBOUNCE_MS);
	}, []);

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

	const clearPlan = useCallback(() => {
		const empty = createDefaultWeekPlan();
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}
		setPlanState(empty);
		saveWeekPlan(empty);
	}, []);

	const replacePlan = useCallback((next: WeekPlan) => {
		if (saveTimerRef.current) {
			clearTimeout(saveTimerRef.current);
		}
		setPlanState(next);
		saveWeekPlan(next);
	}, []);

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
		replacePlan,
		addBacklog,
		removeBacklog,
	};
}
