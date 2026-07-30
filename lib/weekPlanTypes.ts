/** Empty backlog rows on first load */
export const DEFAULT_BACKLOG_ROW_COUNT = 1;

/** Empty custom plan rows on first load and after clear */
export const DEFAULT_CUSTOM_PLAN_ROW_COUNT = 1;

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

export interface CustomPlanRow {
	category: string;
	dish: string;
	grocery: string;
}

/** Main grid scratch pad — weekdays, weekly rows, backlog (no custom plan rows) */
export interface MainGridContent {
	weekdays: Record<WeekdayKey, WeekPlanCell>;
	weeklyLunch: WeekPlanCell;
	weeklyBreakfast: WeekPlanCell;
	backlog: WeekPlanCell[];
}

/** Custom plans section — named category rows */
export interface CustomPlansContent {
	rows: CustomPlanRow[];
}

export interface WeekPlan extends MainGridContent {
	customPlan: CustomPlanRow[];
}

/** Week plan as stored in Convex before custom plan rows were added */
export type StoredWeekPlan = Omit<WeekPlan, "customPlan"> & {
	customPlan?: CustomPlanRow[];
};

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

/** Creates an empty custom plan row */
export function createEmptyCustomPlanRow(): CustomPlanRow {
	return { category: "", dish: "", grocery: "" };
}

function isCompleteWeekdays(
	value: Partial<Record<WeekdayKey, WeekPlanCell>>,
): value is Record<WeekdayKey, WeekPlanCell> {
	return WEEKDAY_KEYS.every((key) => value[key] !== undefined);
}

function createEmptyWeekdays(): Record<WeekdayKey, WeekPlanCell> {
	const weekdays: Partial<Record<WeekdayKey, WeekPlanCell>> = {};
	for (const key of WEEKDAY_KEYS) {
		weekdays[key] = createEmptyCell();
	}
	if (!isCompleteWeekdays(weekdays)) {
		throw new Error("Failed to initialize weekdays");
	}
	return weekdays;
}

/** Creates empty main grid content with default backlog rows */
export function createDefaultMainGridContent(): MainGridContent {
	const weekdays = createEmptyWeekdays();

	return {
		weekdays,
		weeklyLunch: createEmptyCell(),
		weeklyBreakfast: createEmptyCell(),
		backlog: Array.from({ length: DEFAULT_BACKLOG_ROW_COUNT }, () =>
			createEmptyCell(),
		),
	};
}

/** Creates empty custom plans content with default row count */
export function createDefaultCustomPlansContent(): CustomPlansContent {
	return {
		rows: Array.from({ length: DEFAULT_CUSTOM_PLAN_ROW_COUNT }, () =>
			createEmptyCustomPlanRow(),
		),
	};
}

/** Creates a week plan with empty weekdays, weekly rows, and default backlog */
export function createDefaultWeekPlan(): WeekPlan {
	return {
		...createDefaultMainGridContent(),
		customPlan: createDefaultCustomPlansContent().rows,
	};
}
