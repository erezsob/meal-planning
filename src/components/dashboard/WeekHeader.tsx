import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateKey, getWeekStart } from "../../../lib/constants";
import { Button } from "../ui/button";

interface WeekHeaderProps {
	/** Start date of the current week */
	weekStart: Date;
	/** Called when navigating to previous week */
	onPrevious: () => void;
	/** Called when navigating to next week */
	onNext: () => void;
	/** Called when jumping to current week */
	onToday: () => void;
	/** Optional page title (default: "Weekly Meal Plan") */
	title?: string;
}

/**
 * Week navigation header with prev/next buttons and date range display
 */
export function WeekHeader({
	weekStart,
	onPrevious,
	onNext,
	onToday,
	title = "Weekly Meal Plan",
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
			<h1 className="text-2xl font-bold text-gray-100">{title}</h1>

			<div className="flex items-center gap-2">
				{!isCurrentWeek && (
					<Button onClick={onToday} size="sm" className="ml-2">
						Today
					</Button>
				)}

				<Button
					variant="ghost"
					size="icon"
					onClick={onPrevious}
					aria-label="Previous week"
				>
					<ChevronLeft size={20} />
				</Button>

				<span className="min-w-[180px] text-center font-medium text-gray-200">
					{formatRange()}
				</span>

				<Button
					variant="ghost"
					size="icon"
					onClick={onNext}
					aria-label="Next week"
				>
					<ChevronRight size={20} />
				</Button>
			</div>
		</header>
	);
}
