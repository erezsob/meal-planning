import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateKey, getWeekStart } from "../../../lib/constants";

interface WeekHeaderProps {
	/** Start date of the current week */
	weekStart: Date;
	/** Called when navigating to previous week */
	onPrevious: () => void;
	/** Called when navigating to next week */
	onNext: () => void;
	/** Called when jumping to current week */
	onToday: () => void;
}

/**
 * Week navigation header with prev/next buttons and date range display
 */
export function WeekHeader({
	weekStart,
	onPrevious,
	onNext,
	onToday,
}: WeekHeaderProps) {
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekEnd.getDate() + 6);

	const formatRange = () => {
		const startMonth = weekStart.toLocaleDateString("en-US", {
			month: "short",
		});
		const endMonth = weekEnd.toLocaleDateString("en-US", { month: "short" });
		const startDay = weekStart.getDate();
		const endDay = weekEnd.getDate();
		const year = weekStart.getFullYear();

		if (startMonth === endMonth) {
			return `${startMonth} ${startDay} - ${endDay}, ${year}`;
		}
		return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
	};

	const isCurrentWeek =
		formatDateKey(weekStart) === formatDateKey(getWeekStart(new Date()));

	return (
		<header className="flex flex-col sm:flex-row items-center justify-between gap-4">
			<h1 className="text-2xl font-bold text-gray-100">Weekly Meal Plan</h1>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={onPrevious}
					className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
					aria-label="Previous week"
				>
					<ChevronLeft size={20} />
				</button>

				<span className="min-w-[180px] text-center font-medium text-gray-200">
					{formatRange()}
				</span>

				<button
					type="button"
					onClick={onNext}
					className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
					aria-label="Next week"
				>
					<ChevronRight size={20} />
				</button>

				{!isCurrentWeek && (
					<button
						type="button"
						onClick={onToday}
						className="ml-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
					>
						Today
					</button>
				)}
			</div>
		</header>
	);
}
