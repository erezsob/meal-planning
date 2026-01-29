/** Skeleton day IDs for stable keys */
const SKELETON_DAYS = [
	"skeleton-mon",
	"skeleton-tue",
	"skeleton-wed",
	"skeleton-thu",
	"skeleton-fri",
	"skeleton-sat",
	"skeleton-sun",
] as const;

/** Skeleton meal slot IDs for stable keys */
const SKELETON_MEALS = [
	"skeleton-breakfast",
	"skeleton-lunch",
	"skeleton-dinner",
] as const;

/**
 * Loading skeleton for calendar - shown while meal data loads
 */
export function CalendarSkeleton() {
	return (
		<div className="space-y-4">
			{SKELETON_DAYS.map((dayId) => (
				<div
					key={dayId}
					className="rounded-xl p-4 bg-gray-900 border border-gray-800 animate-pulse"
				>
					<div className="h-6 bg-gray-800 rounded w-24 mb-3" />
					<div className="space-y-2">
						{SKELETON_MEALS.map((mealId) => (
							<div
								key={`${dayId}-${mealId}`}
								className="h-20 bg-gray-800 rounded"
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
