/** localStorage key for the single active week plan */
export const WEEK_PLAN_STORAGE_KEY = "meal-planner-week-plan-v1";

/** Export JSON format version */
export const WEEK_PLAN_EXPORT_VERSION = 1;

/** Empty backlog rows on first load */
export const DEFAULT_BACKLOG_ROW_COUNT = 1;

/** Debounced auto-save delay (ms) */
export const WEEK_PLAN_SAVE_DEBOUNCE_MS = 300;

export const WEEKDAY_KEYS = [
	"saturday",
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export interface WeekPlanCell {
	dish: string;
	grocery: string;
}

export interface WeekPlan {
	weekdays: Record<WeekdayKey, WeekPlanCell>;
	weeklyLunch: WeekPlanCell;
	weeklyBreakfast: WeekPlanCell;
	backlog: WeekPlanCell[];
}

export interface WeekPlanExport {
	version: typeof WEEK_PLAN_EXPORT_VERSION;
	plan: WeekPlan;
}

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
	saturday: "Saturday",
	sunday: "Sunday",
	monday: "Monday",
	tuesday: "Tuesday",
	wednesday: "Wednesday",
	thursday: "Thursday",
	friday: "Friday",
};

/** Creates an empty dish/grocery cell */
export function createEmptyCell(): WeekPlanCell {
	return { dish: "", grocery: "" };
}

/** Creates a week plan with empty weekdays, weekly rows, and default backlog */
export function createDefaultWeekPlan(): WeekPlan {
	const weekdays = Object.fromEntries(
		WEEKDAY_KEYS.map((key) => [key, createEmptyCell()]),
	) as Record<WeekdayKey, WeekPlanCell>;

	return {
		weekdays,
		weeklyLunch: createEmptyCell(),
		weeklyBreakfast: createEmptyCell(),
		backlog: Array.from({ length: DEFAULT_BACKLOG_ROW_COUNT }, () =>
			createEmptyCell(),
		),
	};
}
