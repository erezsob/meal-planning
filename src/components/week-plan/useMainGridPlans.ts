import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { HomePlanSections } from "convex/planSections";
import { useMutation } from "convex/react";
import { useCallback, useMemo, useRef } from "react";
import {
	CLEAR_MAIN_PLAN_ERROR,
	HOUSEHOLD_ID,
	NEW_WEEKLY_PLAN_ERROR,
} from "@/lib/constants";
import {
	addBacklogRow,
	joinWeekPlan,
	normalizeMainGridContent,
	removeBacklogRow,
	splitWeekPlan,
	updateWeekPlanCell,
	type WeekPlanCellLocation,
} from "@/lib/weekPlan";
import {
	createDefaultCustomPlansContent,
	type MainGridContent,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
} from "@/lib/weekPlanTypes";
import { buildMainGridViews, type MainGridView } from "./mainGridViews";
import { useDebouncedKeyedSectionSave } from "./useDebouncedSectionSave";

const EMPTY_CUSTOM_PLANS = createDefaultCustomPlansContent();

type UseMainGridPlansArgs = {
	remoteHome: HomePlanSections | null | undefined;
	onSaveError: (message: string) => void;
	onSaveSuccess: () => void;
	onClearError: () => void;
};

/**
 * Stacked main-grid state, debounced saves, and grid edit/lifecycle actions.
 *
 * @param args.remoteHome - Active home plan sections from Convex
 * @param args.onSaveError - Reports save failures to the parent hook
 * @param args.onSaveSuccess - Clears save errors after successful persistence
 * @param args.onClearError - Clears save errors when the user resumes editing
 * @returns Main grid views, cell/backlog actions, and new/clear weekly plan handlers
 */
export function useMainGridPlans({
	remoteHome,
	onSaveError,
	onSaveSuccess,
	onClearError,
}: UseMainGridPlansArgs) {
	const saveMainMutation = useMutation(api.planSections.saveMain);
	const clearMainTopMutation = useMutation(api.planSections.clearMainTop);
	const archiveAndCreateNewMainMutation = useMutation(
		api.planSections.archiveAndCreateNewMain,
	);

	const remoteHomeRef = useRef(remoteHome);
	remoteHomeRef.current = remoteHome;

	const saveMain = useCallback(
		async ({
			key,
			content,
		}: {
			key: Id<"planSections">;
			content: MainGridContent;
		}) => {
			await saveMainMutation({
				id: key,
				content: normalizeMainGridContent(content),
			});
		},
		[saveMainMutation],
	);

	const {
		pendingByKey,
		updateForKey,
		flushAll,
		reset: resetPending,
		resetForKey,
	} = useDebouncedKeyedSectionSave<MainGridContent, Id<"planSections">>({
		debounceMs: WEEK_PLAN_SAVE_DEBOUNCE_MS,
		onSave: saveMain,
		onSaveSuccess,
		onSaveError,
	});

	const mainGrids: MainGridView[] = useMemo(() => {
		if (!remoteHome) {
			return [];
		}

		return buildMainGridViews({
			mainGrids: remoteHome.mainGrids.map((grid) => ({
				id: grid.id,
				content: normalizeMainGridContent(grid.content),
				createdAt: grid.createdAt,
			})),
			pendingById: Object.fromEntries(pendingByKey),
		});
	}, [remoteHome, pendingByKey]);

	const getBaseMainForId = useCallback(
		(gridId: Id<"planSections">) => {
			const pending = pendingByKey.get(gridId);
			if (pending) {
				return normalizeMainGridContent(pending);
			}

			const remoteGrid = remoteHomeRef.current?.mainGrids.find(
				(grid) => grid.id === gridId,
			);
			return normalizeMainGridContent(remoteGrid?.content ?? null);
		},
		[pendingByKey],
	);

	const setMainForGrid = useCallback(
		(
			gridId: Id<"planSections">,
			updater: MainGridContent | ((prev: MainGridContent) => MainGridContent),
		) => {
			onClearError();
			updateForKey({
				key: gridId,
				getBase: () => getBaseMainForId(gridId),
				updater,
			});
		},
		[updateForKey, getBaseMainForId, onClearError],
	);

	const updateCell = useCallback(
		({
			gridId,
			location,
			field,
			value,
		}: {
			gridId: Id<"planSections">;
			location: WeekPlanCellLocation;
			field: "dish" | "grocery";
			value: string;
		}) => {
			setMainForGrid(gridId, (prevMain) => {
				const asPlan = joinWeekPlan(prevMain, EMPTY_CUSTOM_PLANS);
				const nextPlan = updateWeekPlanCell({
					plan: asPlan,
					location,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).main;
			});
		},
		[setMainForGrid],
	);

	const clearMainTop = useCallback(async () => {
		onClearError();
		const topGridId = remoteHomeRef.current?.mainGrids[0]?.id;
		if (topGridId) {
			resetForKey(topGridId);
		}

		try {
			await clearMainTopMutation({ householdId: HOUSEHOLD_ID });
			onSaveSuccess();
		} catch (error) {
			onSaveError(
				error instanceof Error ? error.message : CLEAR_MAIN_PLAN_ERROR,
			);
		}
	}, [
		clearMainTopMutation,
		onClearError,
		onSaveError,
		onSaveSuccess,
		resetForKey,
	]);

	const addBacklog = useCallback(
		({ gridId }: { gridId: Id<"planSections"> }) => {
			setMainForGrid(gridId, (prevMain) => {
				const asPlan = joinWeekPlan(prevMain, EMPTY_CUSTOM_PLANS);
				return splitWeekPlan(addBacklogRow(asPlan)).main;
			});
		},
		[setMainForGrid],
	);

	const removeBacklog = useCallback(
		({ gridId, index }: { gridId: Id<"planSections">; index: number }) => {
			setMainForGrid(gridId, (prevMain) => {
				const asPlan = joinWeekPlan(prevMain, EMPTY_CUSTOM_PLANS);
				return splitWeekPlan(removeBacklogRow(asPlan, index)).main;
			});
		},
		[setMainForGrid],
	);

	const newWeeklyPlan = useCallback(async () => {
		await flushAll();
		resetPending();

		try {
			await archiveAndCreateNewMainMutation({ householdId: HOUSEHOLD_ID });
			onSaveSuccess();
		} catch (error) {
			onSaveError(
				error instanceof Error ? error.message : NEW_WEEKLY_PLAN_ERROR,
			);
		}
	}, [
		flushAll,
		resetPending,
		archiveAndCreateNewMainMutation,
		onSaveSuccess,
		onSaveError,
	]);

	return {
		mainGrids,
		updateCell,
		clearMainTop,
		addBacklog,
		removeBacklog,
		newWeeklyPlan,
	};
}
