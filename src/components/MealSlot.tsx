import { Plus } from "lucide-react";
import {
	COMPONENT_ROLE_LABELS,
	MEAL_COMPONENT_ROLES,
	type MealComponentRole,
	type MealType,
} from "../../lib/constants";
import type { MealWithDish } from "./dashboard/types";
import { LeftoverBadge } from "./LeftoverBadge";
import { StatusBadge } from "./StatusBadge";

/** Max width for component name truncation in slot chip. */
const COMPONENT_NAME_MAX_WIDTH = "120px";

/** Meal type display configuration */
const MEAL_TYPE_CONFIG: Record<MealType, { label: string; emoji: string }> = {
	breakfast: { label: "Breakfast", emoji: "🌅" },
	lunch: { label: "Lunch", emoji: "☀️" },
	dinner: { label: "Dinner", emoji: "🌙" },
};

/** Display name for a meal (dish or custom). */
function getMealDisplayName(meal: MealWithDish): string {
	return meal.dish?.name ?? meal.customName ?? "Unknown";
}

/** Group meals by role in display order (main → side → dessert → drink → other). */
function groupMealsByRole(
	meals: MealWithDish[],
): Map<MealComponentRole, MealWithDish[]> {
	const map = new Map<MealComponentRole, MealWithDish[]>();
	for (const meal of meals) {
		const role = (meal.componentRole ?? "main") as MealComponentRole;
		const list = map.get(role) ?? [];
		list.push(meal);
		map.set(role, list);
	}
	return map;
}

interface MealSlotProps {
	/** The day (YYYY-MM-DD) */
	day: string;
	/** The meal type */
	mealType: MealType;
	/** All components in this slot (0..n) */
	meals: MealWithDish[];
	/** Called when clicking an empty slot */
	onAdd: () => void;
	/** Called when clicking a component */
	onSelectMeal: (meal: MealWithDish) => void;
}

/**
 * A single meal slot in the weekly calendar.
 * Shows empty state with add button, or components grouped by role (main, side, etc.).
 */
export function MealSlot({
	mealType,
	meals,
	onAdd,
	onSelectMeal,
}: MealSlotProps) {
	const config = MEAL_TYPE_CONFIG[mealType];

	if (meals.length === 0) {
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

	const byRole = groupMealsByRole(meals);

	return (
		<div className="w-full min-h-[80px] flex flex-col gap-2 p-3 rounded-lg bg-gray-800 border border-gray-700">
			<div className="flex items-center justify-end gap-1 shrink-0">
				<span className="text-base leading-none opacity-90" aria-hidden>
					{config.emoji}
				</span>
			</div>
			<div className="flex flex-col gap-2 min-w-0">
				{MEAL_COMPONENT_ROLES.map((role) => {
					const roleMeals = byRole.get(role);
					if (!roleMeals?.length) return null;

					const label = COMPONENT_ROLE_LABELS[role];
					return (
						<div key={role} className="min-w-0">
							<div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
								{label}
							</div>
							<div className="flex flex-wrap gap-1">
								{roleMeals.map((meal) => (
									<button
										key={meal._id}
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											onSelectMeal(meal);
										}}
										className="inline-flex flex-wrap items-center gap-1.5 px-2 py-1 rounded-md bg-gray-700/80 hover:bg-gray-600 border border-gray-600 hover:border-gray-500 text-left transition-colors"
									>
										<span
											className="font-medium text-xs text-gray-100 truncate"
											style={{ maxWidth: COMPONENT_NAME_MAX_WIDTH }}
										>
											{getMealDisplayName(meal)}
										</span>
										<StatusBadge status={meal.status} />
										{meal.isLeftover && <LeftoverBadge size="sm" />}
										<span className="text-[10px] text-gray-500">
											{meal.servingsUsed}s
										</span>
									</button>
								))}
							</div>
						</div>
					);
				})}
			</div>
			<button
				type="button"
				onClick={onAdd}
				className="mt-1 flex items-center justify-center gap-1 py-1 rounded border border-dashed border-gray-600 text-gray-500 hover:text-gray-400 hover:border-gray-500 text-xs transition-colors"
				aria-label={`Add another to ${config.label}`}
			>
				<Plus size={12} />
				Add
			</button>
		</div>
	);
}

interface MealSlotHeaderProps {
	/** The meal type */
	mealType: MealType;
}

/**
 * Header for a meal type row/column (desktop calendar stub)
 */
export function MealSlotHeader({ mealType }: MealSlotHeaderProps) {
	const config = MEAL_TYPE_CONFIG[mealType];

	return (
		<div className="flex items-center gap-2 w-full justify-between">
			<span className="text-sm font-medium text-gray-300">{config.label}</span>
			<span className="text-base leading-none opacity-90" aria-hidden>
				{config.emoji}
			</span>
		</div>
	);
}
