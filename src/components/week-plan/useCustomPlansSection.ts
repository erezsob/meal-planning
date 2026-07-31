import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { HomePlanSections } from "convex/planSections";
import { useMutation } from "convex/react";
import { useCallback, useRef } from "react";
import { HOUSEHOLD_ID, NEW_CUSTOM_PLAN_ERROR } from "@/lib/constants";
import { tryCatchAsyncWithMessage } from "@/lib/fp";
import {
	addCustomPlanRow,
	type CustomPlanField,
	joinWeekPlan,
	normalizeCustomPlansContent,
	removeCustomPlanRow,
	splitWeekPlan,
	updateCustomPlanCell,
} from "@/lib/weekPlan";
import {
	type CustomPlansContent,
	createDefaultCustomPlansContent,
	type MainGridContent,
	WEEK_PLAN_SAVE_DEBOUNCE_MS,
} from "@/lib/weekPlanTypes";
import { useDebouncedSectionSave } from "./useDebouncedSectionSave";

type UseCustomPlansSectionArgs = {
	remoteHome: HomePlanSections | null | undefined;
	getTopMainContent: () => MainGridContent;
	onSaveError: (message: string) => void;
	onSaveSuccess: () => void;
	onClearError: () => void;
};

/**
 * Custom-plans section state, debounced saves, and row edit/lifecycle actions.
 *
 * @param args.remoteHome - Active home plan sections from Convex
 * @param args.getTopMainContent - Current upper main grid for joinWeekPlan helpers
 * @param args.onSaveError - Reports save failures to the parent hook
 * @param args.onSaveSuccess - Clears save errors after successful persistence
 * @param args.onClearError - Clears save errors when the user resumes editing
 * @returns Custom plan rows, row actions, and new/clear custom plan handlers
 */
export function useCustomPlansSection({
	remoteHome,
	getTopMainContent,
	onSaveError,
	onSaveSuccess,
	onClearError,
}: UseCustomPlansSectionArgs) {
	const ensureHomeMutation = useMutation(api.planSections.ensureHome);
	const saveCustomPlansMutation = useMutation(api.planSections.saveCustomPlans);
	const archiveAndCreateNewCustomPlansMutation = useMutation(
		api.planSections.archiveAndCreateNewCustomPlans,
	);

	const remoteHomeRef = useRef(remoteHome);
	const customPlansIdRef = useRef<Id<"planSections"> | undefined>(undefined);

	remoteHomeRef.current = remoteHome;
	customPlansIdRef.current = remoteHome?.customPlans.id;

	const remoteCustomPlans = remoteHome
		? normalizeCustomPlansContent(remoteHome.customPlans.content)
		: null;

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

	const saveCustomPlans = useCallback(
		async (content: CustomPlansContent) => {
			const id = await resolveCustomPlansId();
			await saveCustomPlansMutation({
				id,
				content: normalizeCustomPlansContent(content),
			});
		},
		[resolveCustomPlansId, saveCustomPlansMutation],
	);

	const { pending, update, flush, reset } =
		useDebouncedSectionSave<CustomPlansContent>({
			debounceMs: WEEK_PLAN_SAVE_DEBOUNCE_MS,
			onSave: saveCustomPlans,
			onSaveSuccess,
			onSaveError,
		});

	const customPlans =
		pending ?? remoteCustomPlans ?? createDefaultCustomPlansContent();
	const customPlanRows = customPlans.rows;

	const getBaseCustomPlans = useCallback(
		() =>
			normalizeCustomPlansContent(
				pending ??
					(remoteHomeRef.current
						? remoteHomeRef.current.customPlans.content
						: null),
			),
		[pending],
	);

	const setCustomPlans = useCallback(
		(
			updater:
				| CustomPlansContent
				| ((prev: CustomPlansContent) => CustomPlansContent),
		) => {
			onClearError();
			update(() => getBaseCustomPlans(), updater);
		},
		[update, getBaseCustomPlans, onClearError],
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
				const asPlan = joinWeekPlan(getTopMainContent(), prevCustomPlans);
				const nextPlan = updateCustomPlanCell({
					plan: asPlan,
					index,
					field,
					value,
				});
				return splitWeekPlan(nextPlan).customPlans;
			});
		},
		[setCustomPlans, getTopMainContent],
	);

	const addCustomPlan = useCallback(() => {
		setCustomPlans((prevCustomPlans) => {
			const asPlan = joinWeekPlan(getTopMainContent(), prevCustomPlans);
			return splitWeekPlan(addCustomPlanRow(asPlan)).customPlans;
		});
	}, [setCustomPlans, getTopMainContent]);

	const removeCustomPlan = useCallback(
		(index: number) => {
			setCustomPlans((prevCustomPlans) => {
				const asPlan = joinWeekPlan(getTopMainContent(), prevCustomPlans);
				return splitWeekPlan(removeCustomPlanRow(asPlan, index)).customPlans;
			});
		},
		[setCustomPlans, getTopMainContent],
	);

	const clearCustomPlan = useCallback(async () => {
		onClearError();
		await flush(createDefaultCustomPlansContent());
	}, [flush, onClearError]);

	const newCustomPlan = useCallback(async () => {
		await flush(customPlans);
		reset();

		const result = await tryCatchAsyncWithMessage(
			() =>
				archiveAndCreateNewCustomPlansMutation({
					householdId: HOUSEHOLD_ID,
				}),
			NEW_CUSTOM_PLAN_ERROR,
		);
		if (result.ok) {
			customPlansIdRef.current = result.value.customPlans.id;
			onSaveSuccess();
		} else {
			onSaveError(result.error);
		}
	}, [
		flush,
		customPlans,
		reset,
		archiveAndCreateNewCustomPlansMutation,
		onSaveSuccess,
		onSaveError,
	]);

	return {
		customPlanRows,
		updateCustomPlan,
		addCustomPlan,
		removeCustomPlan,
		clearCustomPlan,
		newCustomPlan,
	};
}
