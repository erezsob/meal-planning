import type { Doc } from "convex/_generated/dataModel";
import { Plus } from "lucide-react";
import type { MealStatus, MealType } from "../../lib/constants";
import { LeftoverBadge } from "./LeftoverBadge";
import { StatusBadge } from "./StatusBadge";

/** Meal type display configuration */
const MEAL_TYPE_CONFIG: Record<MealType, { label: string; emoji: string }> = {
	breakfast: { label: "Breakfast", emoji: "🌅" },
	lunch: { label: "Lunch", emoji: "☀️" },
	dinner: { label: "Dinner", emoji: "🌙" },
};

interface MealSlotProps {
	/** The day (YYYY-MM-DD) */
	day: string;
	/** The meal type */
	mealType: MealType;
	/** The meal plan entry if exists */
	meal?: {
		_id: string;
		dishId?: string;
		customName?: string;
		servingsUsed: number;
		status: MealStatus;
		isLeftover: boolean;
		dish?: Doc<"dishes"> | null;
	};
	/** Called when clicking an empty slot */
	onAdd: () => void;
	/** Called when clicking an existing meal */
	onSelect: () => void;
}

/**
 * A single meal slot in the weekly calendar
 * Shows either an empty state with add button or the planned meal
 */
export function MealSlot({ mealType, meal, onAdd, onSelect }: MealSlotProps) {
	const config = MEAL_TYPE_CONFIG[mealType];

	if (!meal) {
		return (
			<button
				type="button"
				onClick={onAdd}
				className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 transition-colors group"
				aria-label={`Add ${config.label}`}
			>
				<Plus
					size={20}
					className="text-gray-600 group-hover:text-gray-400 transition-colors"
				/>
				<span className="text-xs text-gray-600 group-hover:text-gray-400">
					{config.label}
				</span>
			</button>
		);
	}

	const displayName = meal.dish?.name ?? meal.customName ?? "Unknown";

	return (
		<button
			type="button"
			onClick={onSelect}
			className="w-full h-full min-h-[80px] flex flex-col items-start justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 transition-colors text-left"
		>
			<div className="flex items-start justify-between w-full gap-2">
				<span className="font-medium text-sm text-gray-100 line-clamp-2">
					{displayName}
				</span>
				<span className="text-lg flex-shrink-0">{config.emoji}</span>
			</div>

			<div className="flex flex-wrap items-center gap-1.5 mt-2">
				<StatusBadge status={meal.status} />
				{meal.isLeftover && <LeftoverBadge size="sm" />}
				<span className="text-xs text-gray-500">
					{meal.servingsUsed} serving{meal.servingsUsed !== 1 ? "s" : ""}
				</span>
			</div>
		</button>
	);
}

interface MealSlotHeaderProps {
	/** The meal type */
	mealType: MealType;
}

/**
 * Header for a meal type row/column
 */
export function MealSlotHeader({ mealType }: MealSlotHeaderProps) {
	const config = MEAL_TYPE_CONFIG[mealType];

	return (
		<div className="flex items-center gap-2 py-2">
			<span className="text-lg">{config.emoji}</span>
			<span className="font-medium text-gray-300">{config.label}</span>
		</div>
	);
}
