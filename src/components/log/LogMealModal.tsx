import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { useToast } from "@/lib/components/toast";
import { HOUSEHOLD_ID, MEAL_TYPE_LABELS, type MealType } from "@/lib/constants";
import type { MealWithDish } from "../dashboard/types";
import { LogMealForm, type LogMealFormValues } from "./LogMealForm";

interface LogMealModalProps {
	onClose: () => void;
	/** When set, modal opens in edit mode */
	existingMeal?: MealWithDish;
}

/**
 * Modal for logging a meal or editing an existing eaten record.
 */
export function LogMealModal({ onClose, existingMeal }: LogMealModalProps) {
	const logMeal = useMutation(api.mealPlans.logMeal);
	const updateLog = useMutation(api.mealPlans.updateLog);
	const { showToast } = useToast();
	const isEdit = existingMeal !== undefined;

	const handleSubmit = async (values: LogMealFormValues) => {
		if (isEdit) {
			await updateLog({
				id: existingMeal._id,
				day: values.day,
				mealType: values.mealType,
				dishId: values.dishId,
				customName: values.customName,
			});
			showToast("Meal updated");
		} else {
			await logMeal({
				householdId: HOUSEHOLD_ID,
				day: values.day,
				mealType: values.mealType,
				dishId: values.dishId,
				customName: values.customName,
			});
			showToast(`Logged ${MEAL_TYPE_LABELS[values.mealType].toLowerCase()}`);
		}
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Edit meal" : "Log meal"}</DialogTitle>
					<DialogDescription className="sr-only">
						{isEdit
							? "Edit what you ate, date, and meal type"
							: "Record what you ate"}
					</DialogDescription>
				</DialogHeader>

				<LogMealForm
					initialValues={
						existingMeal
							? {
									day: existingMeal.day,
									mealType: existingMeal.mealType as MealType,
									dishId: existingMeal.dishId as Id<"dishes"> | undefined,
									customName: existingMeal.customName,
									dish: existingMeal.dish,
								}
							: undefined
					}
					submitLabel={isEdit ? "Save" : "Log meal"}
					onSubmit={handleSubmit}
					onCancel={onClose}
				/>
			</DialogContent>
		</Dialog>
	);
}
