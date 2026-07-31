import { pipe } from "./fp";

const WEEK_LENGTH_DAYS = 7;

/**
 * Parse an ISO date string (`YYYY-MM-DD`) into numeric year, month, and day.
 */
function parseIsoDateParts(isoDate: string): [number, number, number] {
	const [year, month, day] = pipe(
		isoDate,
		(s) => s.split("-"),
		(segments) => segments.map(Number),
	);
	return [year, month, day];
}

/**
 * Format a Date as an ISO date string (`YYYY-MM-DD`).
 */
function formatIsoDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Build consecutive ISO date strings for a week starting at `startDate`.
 */
export function buildWeekDates(startDate: string): string[] {
	const [year, month, day] = parseIsoDateParts(startDate);
	const start = new Date(year, month - 1, day);

	return Array.from({ length: WEEK_LENGTH_DAYS }, (_, index) => {
		const date = new Date(start);
		date.setDate(start.getDate() + index);
		return formatIsoDate(date);
	});
}
