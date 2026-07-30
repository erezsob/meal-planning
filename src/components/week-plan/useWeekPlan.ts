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
	categories: Id<"planSections">;
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
	const saveCategoriesMutation = useMutation(api.planSections.saveCategories);

	const [pendingMain, setPendingMain] = useState<MainGridContent | null>(null);
	const [pendingCategories, setPendingCategories] =
		useState<CustomPlansContent | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const mainGenerationRef = useRef(0);
	const categoriesGenerationRef = useRef(0);
	const remoteHomeRef = useRef(remoteHome);
	const sectionIdsRef = useRef<Partial<SectionIds>>({});
	const mainSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const categoriesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	remoteHomeRef.current = remoteHome;
	sectionIdsRef.current = {
		main: remoteHome?.main.id,
		categories: remoteHome?.categories.id,
	};

	const remoteMain = remoteHome
		? normalizeMainGridContent(remoteHome.main.content)
		: null;
	const remoteCategories = remoteHome
		? normalizeCustomPlansContent(remoteHome.categories.content)
		: null;

	const main = pendingMain ?? remoteMain ?? createDefaultMainGridContent();
	const categories =
		pendingCategories ?? remoteCategories ?? createDefaultCustomPlansContent();
	const plan: WeekPlan = joinWeekPlan(main, categories);

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
			if (categoriesSaveTimerRef.current) {
				clearTimeout(categoriesSaveTimerRef.current);
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

	const getBaseCategories = useCallback(
		() =>
			normalizeCustomPlansContent(
				pendingCategories ??
					(remoteHomeRef.current
						? remoteHomeRef.current.categories.content
						: null),
			),
		[pendingCategories],
	);

	const resolveSectionIds = useCallback(async (): Promise<SectionIds> => {
		const cached = sectionIdsRef.current;
		if (cached.main && cached.categories) {
			return { main: cached.main, categories: cached.categories };
		}

		const home = await ensureHomeMutation({ householdId: HOUSEHOLD_ID });
		const ids = {
			main: home.main.id,
			categories: home.categories.id,
		};

		if (!ids.main || !ids.categories) {
			throw new Error("Plan sections are missing ids");
		}

		sectionIdsRef.current = ids;
		return { main: ids.main, categories: ids.categories };
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

	const commitSaveCategories = useCallback(
		async (next: CustomPlansContent, generationAtSaveStart: number) => {
			try {
				const ids = await resolveSectionIds();
				await saveCategoriesMutation({
					id: ids.categories,
					content: normalizeCustomPlansContent(next),
				});
				setSaveError(null);
				if (categoriesGenerationRef.current === generationAtSaveStart) {
					setPendingCategories(null);
				}
			} catch (error) {
				setSaveError(
					error instanceof Error ? error.message : "Could not save plan",
				);
			}
		},
		[resolveSectionIds, saveCategoriesMutation],
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

	const persistCategories = useCallback(
		(next: CustomPlansContent) => {
			if (categoriesSaveTimerRef.current) {
				clearTimeout(categoriesSaveTimerRef.current);
			}
			categoriesSaveTimerRef.current = setTimeout(() => {
				const generation = categoriesGenerationRef.current;
				void commitSaveCategories(next, generation);
			}, WEEK_PLAN_SAVE_DEBOUNCE_MS);
		},
		[commitSaveCategories],
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

	const setCategories = useCallback(
		(
			updater:
				| CustomPlansContent
				| ((prev: CustomPlansContent) => CustomPlansContent),
		) => {
			categoriesGenerationRef.current += 1;
			setSaveError(null);
			setPendingCategories((prevPending) => {
				const base = prevPending ?? getBaseCategories();
				const next = typeof updater === "function" ? updater(base) : updater;
				persistCategories(next);
				return next;
			});
		},
		[persistCategories, getBaseCategories],
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
				const asPlan = joinWeekPlan(prevMain, getBaseCategories());
				const nextPlan = updateWeekPlanCell({
					plan: asPlan,
					location,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).main;
			});
		},
		[setMain, getBaseCategories],
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
			const asPlan = joinWeekPlan(prevMain, getBaseCategories());
			return splitWeekPlan(addBacklogRow(asPlan)).main;
		});
	}, [setMain, getBaseCategories]);

	const removeBacklog = useCallback(
		(index: number) => {
			setMain((prevMain) => {
				const asPlan = joinWeekPlan(prevMain, getBaseCategories());
				return splitWeekPlan(removeBacklogRow(asPlan, index)).main;
			});
		},
		[setMain, getBaseCategories],
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
			setCategories((prevCategories) => {
				const asPlan = joinWeekPlan(getBaseMain(), prevCategories);
				const nextPlan = updateCustomPlanCell({
					plan: asPlan,
					index,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).categories;
			});
		},
		[setCategories, getBaseMain],
	);

	const addCustomPlan = useCallback(() => {
		setCategories((prevCategories) => {
			const asPlan = joinWeekPlan(getBaseMain(), prevCategories);
			return splitWeekPlan(addCustomPlanRow(asPlan)).categories;
		});
	}, [setCategories, getBaseMain]);

	const removeCustomPlan = useCallback(
		(index: number) => {
			setCategories((prevCategories) => {
				const asPlan = joinWeekPlan(getBaseMain(), prevCategories);
				return splitWeekPlan(removeCustomPlanRow(asPlan, index)).categories;
			});
		},
		[setCategories, getBaseMain],
	);

	const clearCustomPlan = useCallback(async () => {
		const emptyCategories = createDefaultCustomPlansContent();
		if (categoriesSaveTimerRef.current) {
			clearTimeout(categoriesSaveTimerRef.current);
		}
		categoriesGenerationRef.current += 1;
		const generationAtSaveStart = categoriesGenerationRef.current;
		setSaveError(null);
		setPendingCategories(emptyCategories);
		await commitSaveCategories(emptyCategories, generationAtSaveStart);
	}, [commitSaveCategories]);

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
