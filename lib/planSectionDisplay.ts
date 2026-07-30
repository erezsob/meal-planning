/**
 * Format a plan section creation timestamp for display under section headings.
 *
 * @param timestamp - Unix epoch milliseconds from Convex `_creationTime`
 * @returns Locale date string (e.g. "Jan 1, 2025")
 */
export function formatPlanCreatedAt(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}
