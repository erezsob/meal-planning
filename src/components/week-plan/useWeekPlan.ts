import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HOUSEHOLD_ID } from "@/lib/constants";
import {
	addBacklogRow,
	addCustomPlanRow,
	type CustomPlanField,
	joinWeekPlan,
	normalizeCustomPlansContent,
	normalizeMainGridContent,
	removeBacklogRow,
	removeCustomPlanRow,
	splitWeekPlan,
	updateCustomPlanCell,
	updateWeekPlanCell,
	type WeekPlanCellLocation,
} from "@/lib/weekPlan";
import {
	type CustomPlansContent,
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
	type MainGridContent,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
} from "@/lib/weekPlanTypes";
import { buildMainGridViews, type MainGridView } from "./mainGridViews";

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

	const ensureHomeMutation = useMutation(api.planSections.ensureHome);
	const saveMainMutation = useMutation(api.planSections.saveMain);
	const saveCustomPlansMutation = useMutation(api.planSections.saveCustomPlans);
	const archiveAndCreateNewMainMutation = useMutation(
		api.planSections.archiveAndCreateNewMain,
	);
	const archiveAndCreateNewCustomPlansMutation = useMutation(
		api.planSections.archiveAndCreateNewCustomPlans,
	);

	const [pendingMainById, setPendingMainById] = useState<
		Record<string, MainGridContent>
	>({});
	const [pendingCustomPlans, setPendingCustomPlans] =
		useState<CustomPlansContent | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const mainGenerationByIdRef = useRef<Map<string, number>>(new Map());
	const customPlansGenerationRef = useRef(0);
	const remoteHomeRef = useRef(remoteHome);
	const customPlansIdRef = useRef<Id<"planSections"> | undefined>(undefined);
	const mainSaveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map(),
	);
	const customPlansSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	remoteHomeRef.current = remoteHome;
	customPlansIdRef.current = remoteHome?.customPlans.id;

	const remoteCustomPlans = remoteHome
		? normalizeCustomPlansContent(remoteHome.customPlans.content)
		: null;

	const customPlans =
		pendingCustomPlans ??
		remoteCustomPlans ??
		createDefaultCustomPlansContent();

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
			pendingById: pendingMainById,
		});
	}, [remoteHome, pendingMainById]);

	const customPlanRows = customPlans.rows;

	useEffect(() => {
		if (remoteHome?.needsEnsure) {
			void ensureHomeMutation({ householdId: HOUSEHOLD_ID });
		}
	}, [remoteHome?.needsEnsure, ensureHomeMutation]);

	useEffect(() => {
		return () => {
			for (const timer of mainSaveTimersRef.current.values()) {
				clearTimeout(timer);
			}
			if (customPlansSaveTimerRef.current) {
				clearTimeout(customPlansSaveTimerRef.current);
			}
		};
	}, []);

	const getBaseMainForId = useCallback(
		(gridId: Id<"planSections">) => {
			const pending = pendingMainById[gridId];
			if (pending) {
				return normalizeMainGridContent(pending);
			}

			const remoteGrid = remoteHomeRef.current?.mainGrids.find(
				(grid) => grid.id === gridId,
			);
			return normalizeMainGridContent(remoteGrid?.content ?? null);
		},
		[pendingMainById],
	);

	const getBaseCustomPlans = useCallback(
		() =>
			normalizeCustomPlansContent(
				pendingCustomPlans ??
					(remoteHomeRef.current
						? remoteHomeRef.current.customPlans.content
						: null),
			),
		[pendingCustomPlans],
	);

	const resolveCustomPlansId = useCallback(async (): Promise<
		Id<"planSections">
	> => {
		const cached = customPlansIdRef.current;
		if (cached) {
			return cached;
		}

		const home = await ensureHomeMutation({ householdId: HOUSEHOLD_ID });
		const id = home.customPlans.id;
		if (!id) {
			throw new Error("Custom plans section is missing id");
		}

		customPlansIdRef.current = id;
		return id;
	}, [ensureHomeMutation]);

	const commitSaveMain = useCallback(
		async ({
			gridId,
			next,
			generationAtSaveStart,
		}: {
			gridId: Id<"planSections">;
			next: MainGridContent;
			generationAtSaveStart: number;
		}) => {
			try {
				await saveMainMutation({
					id: gridId,
					content: normalizeMainGridContent(next),
				});
				setSaveError(null);
				if (
					mainGenerationByIdRef.current.get(gridId) === generationAtSaveStart
				) {
					setPendingMainById((prev) => {
						if (!(gridId in prev)) {
							return prev;
						}
						const { [gridId]: _removed, ...rest } = prev;
						return rest;
					});
				}
			} catch (error) {
				setSaveError(
					error instanceof Error ? error.message : "Could not save plan",
				);
			}
		},
		[saveMainMutation],
	);

	const commitSaveCustomPlans = useCallback(
		async (next: CustomPlansContent, generationAtSaveStart: number) => {
			try {
				const id = await resolveCustomPlansId();
				await saveCustomPlansMutation({
					id,
					content: normalizeCustomPlansContent(next),
				});
				setSaveError(null);
				if (customPlansGenerationRef.current === generationAtSaveStart) {
					setPendingCustomPlans(null);
				}
			} catch (error) {
				setSaveError(
					error instanceof Error ? error.message : "Could not save plan",
				);
			}
		},
		[resolveCustomPlansId, saveCustomPlansMutation],
	);

	const persistMain = useCallback(
		(gridId: Id<"planSections">, next: MainGridContent) => {
			const existingTimer = mainSaveTimersRef.current.get(gridId);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}

			const timer = setTimeout(() => {
				const generation = mainGenerationByIdRef.current.get(gridId) ?? 0;
				void commitSaveMain({
					gridId,
					next,
					generationAtSaveStart: generation,
				});
			}, WEEK_PLAN_SAVE_DEBOUNCE_MS);

			mainSaveTimersRef.current.set(gridId, timer);
		},
		[commitSaveMain],
	);

	const persistCustomPlans = useCallback(
		(next: CustomPlansContent) => {
			if (customPlansSaveTimerRef.current) {
				clearTimeout(customPlansSaveTimerRef.current);
			}
			customPlansSaveTimerRef.current = setTimeout(() => {
				const generation = customPlansGenerationRef.current;
				void commitSaveCustomPlans(next, generation);
			}, WEEK_PLAN_SAVE_DEBOUNCE_MS);
		},
		[commitSaveCustomPlans],
	);

	const setMainForGrid = useCallback(
		(
			gridId: Id<"planSections">,
			updater: MainGridContent | ((prev: MainGridContent) => MainGridContent),
		) => {
			const nextGeneration =
				(mainGenerationByIdRef.current.get(gridId) ?? 0) + 1;
			mainGenerationByIdRef.current.set(gridId, nextGeneration);
			setSaveError(null);
			setPendingMainById((prevPending) => {
				const base = prevPending[gridId] ?? getBaseMainForId(gridId);
				const next = typeof updater === "function" ? updater(base) : updater;
				persistMain(gridId, next);
				return { ...prevPending, [gridId]: next };
			});
		},
		[persistMain, getBaseMainForId],
	);

	const setCustomPlans = useCallback(
		(
			updater:
				| CustomPlansContent
				| ((prev: CustomPlansContent) => CustomPlansContent),
		) => {
			customPlansGenerationRef.current += 1;
			setSaveError(null);
			setPendingCustomPlans((prevPending) => {
				const base = prevPending ?? getBaseCustomPlans();
				const next = typeof updater === "function" ? updater(base) : updater;
				persistCustomPlans(next);
				return next;
			});
		},
		[persistCustomPlans, getBaseCustomPlans],
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
				const asPlan = joinWeekPlan(prevMain, getBaseCustomPlans());
				const nextPlan = updateWeekPlanCell({
					plan: asPlan,
					location,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).main;
			});
		},
		[setMainForGrid, getBaseCustomPlans],
	);

	const clearTopPlan = useCallback(async () => {
		const topGrid = remoteHomeRef.current?.mainGrids[0];
		const topId = topGrid?.id;
		if (!topId) {
			return;
		}

		const emptyMain = createDefaultMainGridContent();
		const existingTimer = mainSaveTimersRef.current.get(topId);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const nextGeneration = (mainGenerationByIdRef.current.get(topId) ?? 0) + 1;
		mainGenerationByIdRef.current.set(topId, nextGeneration);
		setSaveError(null);
		setPendingMainById((prev) => ({ ...prev, [topId]: emptyMain }));
		await commitSaveMain({
			gridId: topId,
			next: emptyMain,
			generationAtSaveStart: nextGeneration,
		});
	}, [commitSaveMain]);

	const addBacklog = useCallback(
		({ gridId }: { gridId: Id<"planSections"> }) => {
			setMainForGrid(gridId, (prevMain) => {
				const asPlan = joinWeekPlan(prevMain, getBaseCustomPlans());
				return splitWeekPlan(addBacklogRow(asPlan)).main;
			});
		},
		[setMainForGrid, getBaseCustomPlans],
	);

	const removeBacklog = useCallback(
		({ gridId, index }: { gridId: Id<"planSections">; index: number }) => {
			setMainForGrid(gridId, (prevMain) => {
				const asPlan = joinWeekPlan(prevMain, getBaseCustomPlans());
				return splitWeekPlan(removeBacklogRow(asPlan, index)).main;
			});
		},
		[setMainForGrid, getBaseCustomPlans],
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
			setCustomPlans((prevCustomPlans) => {
				const topMain = mainGrids[0]?.content ?? createDefaultMainGridContent();
				const asPlan = joinWeekPlan(topMain, prevCustomPlans);
				const nextPlan = updateCustomPlanCell({
					plan: asPlan,
					index,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).customPlans;
			});
		},
		[setCustomPlans, mainGrids],
	);

	const addCustomPlan = useCallback(() => {
		setCustomPlans((prevCustomPlans) => {
			const topMain = mainGrids[0]?.content ?? createDefaultMainGridContent();
			const asPlan = joinWeekPlan(topMain, prevCustomPlans);
			return splitWeekPlan(addCustomPlanRow(asPlan)).customPlans;
		});
	}, [setCustomPlans, mainGrids]);

	const removeCustomPlan = useCallback(
		(index: number) => {
			setCustomPlans((prevCustomPlans) => {
				const topMain = mainGrids[0]?.content ?? createDefaultMainGridContent();
				const asPlan = joinWeekPlan(topMain, prevCustomPlans);
				return splitWeekPlan(removeCustomPlanRow(asPlan, index)).customPlans;
			});
		},
		[setCustomPlans, mainGrids],
	);

	const clearCustomPlan = useCallback(async () => {
		const emptyCustomPlans = createDefaultCustomPlansContent();
		if (customPlansSaveTimerRef.current) {
			clearTimeout(customPlansSaveTimerRef.current);
		}
		customPlansGenerationRef.current += 1;
		const generationAtSaveStart = customPlansGenerationRef.current;
		setSaveError(null);
		setPendingCustomPlans(emptyCustomPlans);
		await commitSaveCustomPlans(emptyCustomPlans, generationAtSaveStart);
	}, [commitSaveCustomPlans]);

	const newWeeklyPlan = useCallback(async () => {
		setPendingMainById({});
		mainGenerationByIdRef.current.clear();
		for (const timer of mainSaveTimersRef.current.values()) {
			clearTimeout(timer);
		}
		mainSaveTimersRef.current.clear();

		try {
			await archiveAndCreateNewMainMutation({ householdId: HOUSEHOLD_ID });
			setSaveError(null);
		} catch (error) {
			setSaveError(
				error instanceof Error ? error.message : "Could not create weekly plan",
			);
		}
	}, [archiveAndCreateNewMainMutation]);

	const newCustomPlan = useCallback(async () => {
		if (customPlansSaveTimerRef.current) {
			clearTimeout(customPlansSaveTimerRef.current);
		}
		customPlansGenerationRef.current += 1;
		setPendingCustomPlans(null);

		try {
			const home = await archiveAndCreateNewCustomPlansMutation({
				householdId: HOUSEHOLD_ID,
			});
			customPlansIdRef.current = home.customPlans.id;
			setSaveError(null);
		} catch (error) {
			setSaveError(
				error instanceof Error ? error.message : "Could not create custom plan",
			);
		}
	}, [archiveAndCreateNewCustomPlansMutation]);

	return {
		mainGrids,
		customPlanRows,
		saveError,
		updateCell,
		clearTopPlan,
		addBacklog,
		removeBacklog,
		updateCustomPlan,
		addCustomPlan,
		removeCustomPlan,
		clearCustomPlan,
		newWeeklyPlan,
		newCustomPlan,
	};
}
