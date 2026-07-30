import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
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
	type WeekPlan,
} from "@/lib/weekPlanTypes";

type SectionIds = {
	main: Id<"planSections">;
	customPlans: Id<"planSections">;
};

/**
 * Manage week plan state with debounced Convex persistence per section.
 *
 * Local edits overlay remote main grid and custom plans until saved; when not
 * editing, remote subscription updates apply automatically without a sync effect.
 *
 * @returns Plan state, cell/backlog/custom plan actions, and save error message (if any).
 */
export function useWeekPlan() {
	const { data: remoteHome } = useSuspenseQuery(
		convexQuery(api.planSections.getHome, { householdId: HOUSEHOLD_ID }),
	);

	const ensureHomeMutation = useMutation(api.planSections.ensureHome);
	const saveMainMutation = useMutation(api.planSections.saveMain);
	const saveCustomPlansMutation = useMutation(api.planSections.saveCustomPlans);

	const [pendingMain, setPendingMain] = useState<MainGridContent | null>(null);
	const [pendingCustomPlans, setPendingCustomPlans] =
		useState<CustomPlansContent | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const mainGenerationRef = useRef(0);
	const customPlansGenerationRef = useRef(0);
	const remoteHomeRef = useRef(remoteHome);
	const sectionIdsRef = useRef<Partial<SectionIds>>({});
	const mainSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const customPlansSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	remoteHomeRef.current = remoteHome;
	sectionIdsRef.current = {
		main: remoteHome?.main.id,
		customPlans: remoteHome?.customPlans.id,
	};

	const remoteMain = remoteHome
		? normalizeMainGridContent(remoteHome.main.content)
		: null;
	const remoteCustomPlans = remoteHome
		? normalizeCustomPlansContent(remoteHome.customPlans.content)
		: null;

	const main = pendingMain ?? remoteMain ?? createDefaultMainGridContent();
	const customPlans =
		pendingCustomPlans ??
		remoteCustomPlans ??
		createDefaultCustomPlansContent();
	const plan: WeekPlan = joinWeekPlan(main, customPlans);

	useEffect(() => {
		if (remoteHome?.needsEnsure) {
			void ensureHomeMutation({ householdId: HOUSEHOLD_ID });
		}
	}, [remoteHome?.needsEnsure, ensureHomeMutation]);

	useEffect(() => {
		return () => {
			if (mainSaveTimerRef.current) {
				clearTimeout(mainSaveTimerRef.current);
			}
			if (customPlansSaveTimerRef.current) {
				clearTimeout(customPlansSaveTimerRef.current);
			}
		};
	}, []);

	const getBaseMain = useCallback(
		() =>
			normalizeMainGridContent(
				pendingMain ??
					(remoteHomeRef.current ? remoteHomeRef.current.main.content : null),
			),
		[pendingMain],
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

	const resolveSectionIds = useCallback(async (): Promise<SectionIds> => {
		const cached = sectionIdsRef.current;
		if (cached.main && cached.customPlans) {
			return { main: cached.main, customPlans: cached.customPlans };
		}

		const home = await ensureHomeMutation({ householdId: HOUSEHOLD_ID });
		const ids = {
			main: home.main.id,
			customPlans: home.customPlans.id,
		};

		if (!ids.main || !ids.customPlans) {
			throw new Error("Plan sections are missing ids");
		}

		sectionIdsRef.current = ids;
		return { main: ids.main, customPlans: ids.customPlans };
	}, [ensureHomeMutation]);

	const commitSaveMain = useCallback(
		async (next: MainGridContent, generationAtSaveStart: number) => {
			try {
				const ids = await resolveSectionIds();
				await saveMainMutation({
					id: ids.main,
					content: normalizeMainGridContent(next),
				});
				setSaveError(null);
				if (mainGenerationRef.current === generationAtSaveStart) {
					setPendingMain(null);
				}
			} catch (error) {
				setSaveError(
					error instanceof Error ? error.message : "Could not save plan",
				);
			}
		},
		[resolveSectionIds, saveMainMutation],
	);

	const commitSaveCustomPlans = useCallback(
		async (next: CustomPlansContent, generationAtSaveStart: number) => {
			try {
				const ids = await resolveSectionIds();
				await saveCustomPlansMutation({
					id: ids.customPlans,
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
		[resolveSectionIds, saveCustomPlansMutation],
	);

	const persistMain = useCallback(
		(next: MainGridContent) => {
			if (mainSaveTimerRef.current) {
				clearTimeout(mainSaveTimerRef.current);
			}
			mainSaveTimerRef.current = setTimeout(() => {
				const generation = mainGenerationRef.current;
				void commitSaveMain(next, generation);
			}, WEEK_PLAN_SAVE_DEBOUNCE_MS);
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

	const setMain = useCallback(
		(
			updater: MainGridContent | ((prev: MainGridContent) => MainGridContent),
		) => {
			mainGenerationRef.current += 1;
			setSaveError(null);
			setPendingMain((prevPending) => {
				const base = prevPending ?? getBaseMain();
				const next = typeof updater === "function" ? updater(base) : updater;
				persistMain(next);
				return next;
			});
		},
		[persistMain, getBaseMain],
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
			location,
			field,
			value,
		}: {
			location: WeekPlanCellLocation;
			field: "dish" | "grocery";
			value: string;
		}) => {
			setMain((prevMain) => {
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
		[setMain, getBaseCustomPlans],
	);

	const clearPlan = useCallback(async () => {
		const emptyMain = createDefaultMainGridContent();
		if (mainSaveTimerRef.current) {
			clearTimeout(mainSaveTimerRef.current);
		}
		mainGenerationRef.current += 1;
		const generationAtSaveStart = mainGenerationRef.current;
		setSaveError(null);
		setPendingMain(emptyMain);
		await commitSaveMain(emptyMain, generationAtSaveStart);
	}, [commitSaveMain]);

	const addBacklog = useCallback(() => {
		setMain((prevMain) => {
			const asPlan = joinWeekPlan(prevMain, getBaseCustomPlans());
			return splitWeekPlan(addBacklogRow(asPlan)).main;
		});
	}, [setMain, getBaseCustomPlans]);

	const removeBacklog = useCallback(
		(index: number) => {
			setMain((prevMain) => {
				const asPlan = joinWeekPlan(prevMain, getBaseCustomPlans());
				return splitWeekPlan(removeBacklogRow(asPlan, index)).main;
			});
		},
		[setMain, getBaseCustomPlans],
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
				const asPlan = joinWeekPlan(getBaseMain(), prevCustomPlans);
				const nextPlan = updateCustomPlanCell({
					plan: asPlan,
					index,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).customPlans;
			});
		},
		[setCustomPlans, getBaseMain],
	);

	const addCustomPlan = useCallback(() => {
		setCustomPlans((prevCustomPlans) => {
			const asPlan = joinWeekPlan(getBaseMain(), prevCustomPlans);
			return splitWeekPlan(addCustomPlanRow(asPlan)).customPlans;
		});
	}, [setCustomPlans, getBaseMain]);

	const removeCustomPlan = useCallback(
		(index: number) => {
			setCustomPlans((prevCustomPlans) => {
				const asPlan = joinWeekPlan(getBaseMain(), prevCustomPlans);
				return splitWeekPlan(removeCustomPlanRow(asPlan, index)).customPlans;
			});
		},
		[setCustomPlans, getBaseMain],
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
