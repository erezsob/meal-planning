import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { HOUSEHOLD_ID, type MealType } from "../../../lib/constants";
import { DishSelector } from "../DishSelector";

interface AddMealModalProps {
	/** Day in YYYY-MM-DD format */
	day: string;
	/** Type of meal to add */
	mealType: MealType;
	/** Called when closing the modal */
	onClose: () => void;
}

/**
 * Modal for adding a new meal to a slot
 * Wraps DishSelector with mutation handlers
 */
export function AddMealModal({ day, mealType, onClose }: AddMealModalProps) {
	const planMeal = useMutation(api.mealPlans.planMeal);
	const { data: leftoverSources } = useSuspenseQuery(
		convexQuery(api.mealPlans.getLeftoverSources, {
			householdId: HOUSEHOLD_ID,
		}),
	);

	const handleSelectDish = (dish: Doc<"dishes">) => {
		planMeal({
			day,
			mealType,
			dishId: dish._id,
			servingsUsed: dish.defaultServings ?? 1,
			isLeftover: false,
			householdId: HOUSEHOLD_ID,
		});
		onClose();
	};

	const handleSelectCustom = (name: string) => {
		planMeal({
			day,
			mealType,
			customName: name,
			servingsUsed: 1,
			isLeftover: false,
			householdId: HOUSEHOLD_ID,
		});
		onClose();
	};

	const handleSelectLeftover = (
		sourceMealId: Id<"mealPlans">,
		dish: Doc<"dishes">,
		available: number,
	) => {
		planMeal({
			day,
			mealType,
			dishId: dish._id,
			servingsUsed: Math.min(available, dish.defaultServings ?? 1),
			isLeftover: true,
			sourceMealId,
			householdId: HOUSEHOLD_ID,
		});
		onClose();
	};

	return (
		<DishSelector
			isOpen={true}
			onClose={onClose}
			onSelectDish={handleSelectDish}
			onSelectCustom={handleSelectCustom}
			leftoverSources={leftoverSources}
			onSelectLeftover={handleSelectLeftover}
		/>
	);
}
