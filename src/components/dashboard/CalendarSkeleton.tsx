import { Skeleton } from "../ui/skeleton";

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
 * Mobile skeleton: vertical day cards (matches MobileCalendar)
 */
function MobileCalendarSkeleton() {
	return (
		<div className="md:hidden space-y-4">
			{SKELETON_DAYS.map((dayId) => (
				<div
					key={dayId}
					className="rounded-xl p-4 bg-card border border-border"
				>
					<Skeleton className="h-6 w-24 mb-3" />
					<div className="space-y-2">
						{SKELETON_MEALS.map((mealId) => (
							<Skeleton key={`${dayId}-${mealId}`} className="h-20" />
						))}
					</div>
				</div>
			))}
		</div>
	);
}

/**
 * Tablet skeleton: 7-column grid (matches TabletCalendar)
 */
function TabletCalendarSkeleton() {
	return (
		<div className="hidden md:block lg:hidden">
			<div className="grid grid-cols-7 gap-1">
				{SKELETON_DAYS.map((dayId) => (
					<div key={dayId} className="rounded-lg p-2 bg-card">
						{/* Match TabletCalendar day header */}
						<div className="min-h-[52px] flex flex-col justify-center text-center mb-2 pb-2 border-b border-border">
							<Skeleton className="h-4 w-8 mx-auto mb-1.5" />
							<Skeleton className="h-3 w-6 mx-auto" />
						</div>
						<div className="space-y-1">
							{SKELETON_MEALS.map((mealId) => (
								<Skeleton
									key={`${dayId}-${mealId}`}
									className="min-h-[80px] rounded-lg border-2 border-dashed border-border"
								/>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Desktop skeleton: row headers + 7-day grid (matches DesktopCalendar)
 */
function DesktopCalendarSkeleton() {
	return (
		<div className="hidden lg:block overflow-x-auto">
			<div className="min-w-[920px]">
				<div className="grid grid-cols-[7.5rem_repeat(7,1fr)] gap-2 mb-2">
					<Skeleton className="h-14 rounded-lg" />
					{SKELETON_DAYS.map((dayId) => (
						<Skeleton key={dayId} className="h-14 rounded-lg" />
					))}
				</div>
				{SKELETON_MEALS.map((mealId) => (
					<div
						key={mealId}
						className="grid grid-cols-[7.5rem_repeat(7,1fr)] gap-2 mb-2"
					>
						<Skeleton className="min-h-[80px] rounded-lg" />
						{SKELETON_DAYS.map((dayId) => (
							<Skeleton
								key={`${dayId}-${mealId}`}
								className="min-h-[80px] rounded-lg"
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Loading skeleton for calendar - shown while meal data loads.
 * Renders layout matching current breakpoint (mobile / tablet / desktop).
 */
export function CalendarSkeleton() {
	return (
		<>
			<DesktopCalendarSkeleton />
			<TabletCalendarSkeleton />
			<MobileCalendarSkeleton />
		</>
	);
}
