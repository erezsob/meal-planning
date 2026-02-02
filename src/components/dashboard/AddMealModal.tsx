import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useId, useState } from "react";
import {
	COMPONENT_ROLE_LABELS,
	DEFAULT_COMPONENT_ROLE,
	HOUSEHOLD_ID,
	MEAL_COMPONENT_ROLES,
	type MealComponentRole,
	type MealType,
} from "../../../lib/constants";
import { DishSelector } from "../DishSelector";
import type { MealWithDish } from "./types";

interface AddMealModalProps {
	/** Day in YYYY-MM-DD format */
	day: string;
	/** Type of meal to add */
	mealType: MealType;
	/** When set, modal opens in edit mode for this component */
	existingMeal?: MealWithDish;
	/** Called when closing the modal */
	onClose: () => void;
}

/**
 * Modal for adding a meal component or editing an existing one.
 * Add mode: role picker + DishSelector. Edit mode: form with role, servings, isLeftover.
 */
export function AddMealModal({
	day,
	mealType,
	existingMeal,
	onClose,
}: AddMealModalProps) {
	const [selectedRole, setSelectedRole] = useState<MealComponentRole>(
		existingMeal
			? (existingMeal.componentRole ?? DEFAULT_COMPONENT_ROLE)
			: DEFAULT_COMPONENT_ROLE,
	);
	const [servingsUsed, setServingsUsed] = useState(
		existingMeal?.servingsUsed ?? 1,
	);
	const [isLeftover, setIsLeftover] = useState(
		existingMeal?.isLeftover ?? false,
	);
	// Pending fresh dish selection (for servingsMade override step)
	const [pendingDish, setPendingDish] = useState<Doc<"dishes"> | null>(null);
	const [servingsMade, setServingsMade] = useState<number>(1);

	const planMeal = useMutation(api.mealPlans.planMeal);
	const updateMeal = useMutation(api.mealPlans.update);
	const { data: leftoverSources = [] } = useQuery(
		convexQuery(api.mealPlans.getLeftoverSources, {
			householdId: HOUSEHOLD_ID,
		}),
	);

	const handleSelectDish = (dish: Doc<"dishes">) => {
		// Show confirmation step for fresh dish (to set servingsMade)
		setPendingDish(dish);
		setServingsMade(dish.defaultServings ?? 1);
	};

	const handleConfirmFreshDish = () => {
		if (!pendingDish) return;
		planMeal({
			day,
			mealType,
			componentRole: selectedRole,
			dishId: pendingDish._id,
			servingsUsed: servingsMade,
			servingsMade,
			isLeftover: false,
			householdId: HOUSEHOLD_ID,
		});
		onClose();
	};

	const handleSelectCustom = (name: string) => {
		planMeal({
			day,
			mealType,
			componentRole: selectedRole,
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
			componentRole: selectedRole,
			dishId: dish._id,
			servingsUsed: Math.min(available, dish.defaultServings ?? 1),
			isLeftover: true,
			sourceMealId,
			householdId: HOUSEHOLD_ID,
		});
		onClose();
	};

	const roleHeadingId = useId();
	const servingsMadeId = useId();
	const rolePickerContent = (
		<fieldset className="border-0 p-0 m-0" aria-labelledby={roleHeadingId}>
			<legend
				id={roleHeadingId}
				className="block text-sm font-medium text-gray-300 mb-2"
			>
				Component type
			</legend>
			<div className="flex flex-wrap gap-2">
				{MEAL_COMPONENT_ROLES.map((role) => (
					<button
						key={role}
						type="button"
						onClick={() => setSelectedRole(role)}
						className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
							selectedRole === role
								? "bg-emerald-600 text-white"
								: "bg-gray-700 text-gray-300 hover:bg-gray-600"
						}`}
					>
						{COMPONENT_ROLE_LABELS[role]}
					</button>
				))}
			</div>
		</fieldset>
	);

	// Show servingsMade confirmation for fresh dishes
	if (pendingDish) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="absolute inset-0 bg-black/60"
					onClick={() => setPendingDish(null)}
					onKeyDown={(e) => e.key === "Escape" && setPendingDish(null)}
					aria-hidden="true"
				/>
				<div className="relative w-full max-w-sm bg-gray-900 rounded-xl border border-gray-700 shadow-2xl p-4">
					<h2 className="text-lg font-semibold text-gray-100 mb-4">
						Add {pendingDish.name}
					</h2>

					<div className="space-y-4">
						<div>
							<label
								htmlFor={servingsMadeId}
								className="block text-sm font-medium text-gray-300 mb-1"
							>
								Servings made
							</label>
							<input
								id={servingsMadeId}
								type="number"
								min={1}
								step={1}
								value={servingsMade}
								onChange={(e) =>
									setServingsMade(Number.parseInt(e.target.value, 10) || 1)
								}
								className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
							/>
							<p className="mt-1 text-xs text-gray-500">
								How many servings will this batch yield?
							</p>
						</div>
					</div>

					<div className="flex gap-2 mt-6">
						<button
							type="button"
							onClick={() => setPendingDish(null)}
							className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
						>
							Back
						</button>
						<button
							type="button"
							onClick={handleConfirmFreshDish}
							className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors text-white"
						>
							Add
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (existingMeal) {
		return (
			<EditComponentForm
				meal={existingMeal}
				selectedRole={selectedRole}
				setSelectedRole={setSelectedRole}
				servingsUsed={servingsUsed}
				setServingsUsed={setServingsUsed}
				isLeftover={isLeftover}
				setIsLeftover={setIsLeftover}
				onSave={() => {
					updateMeal({
						id: existingMeal._id,
						componentRole: selectedRole,
						dishId: existingMeal.dishId,
						customName: existingMeal.customName,
						servingsUsed,
						isLeftover,
						sourceMealId: existingMeal.sourceMealId,
					});
					onClose();
				}}
				onClose={onClose}
			/>
		);
	}

	return (
		<DishSelector
			isOpen={true}
			onClose={onClose}
			onSelectDish={handleSelectDish}
			onSelectCustom={handleSelectCustom}
			leftoverSources={leftoverSources}
			onSelectLeftover={handleSelectLeftover}
			headerContent={rolePickerContent}
		/>
	);
}

interface EditComponentFormProps {
	meal: MealWithDish;
	selectedRole: MealComponentRole;
	setSelectedRole: (r: MealComponentRole) => void;
	servingsUsed: number;
	setServingsUsed: (n: number) => void;
	isLeftover: boolean;
	setIsLeftover: (b: boolean) => void;
	onSave: () => void;
	onClose: () => void;
}

/**
 * Form for editing an existing meal component (role, servings, isLeftover).
 */
function EditComponentForm({
	meal,
	selectedRole,
	setSelectedRole,
	servingsUsed,
	setServingsUsed,
	isLeftover,
	setIsLeftover,
	onSave,
	onClose,
}: EditComponentFormProps) {
	const displayName = meal.dish?.name ?? meal.customName ?? "Unknown";
	const componentTypeId = useId();
	const servingsId = useId();
	const leftoverId = useId();

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				aria-hidden="true"
			/>
			<div className="relative w-full max-w-sm bg-gray-900 rounded-xl border border-gray-700 shadow-2xl p-4">
				<h2 className="text-lg font-semibold text-gray-100 mb-4">
					Edit component
				</h2>

				<div className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-gray-300 mb-1">
							Dish
						</span>
						<p className="text-gray-100">{displayName}</p>
					</div>

					<div>
						<label
							htmlFor={componentTypeId}
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Component type
						</label>
						<select
							id={componentTypeId}
							value={selectedRole}
							onChange={(e) =>
								setSelectedRole(e.target.value as MealComponentRole)
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
						>
							{MEAL_COMPONENT_ROLES.map((role) => (
								<option key={role} value={role}>
									{COMPONENT_ROLE_LABELS[role]}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor={servingsId}
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Servings
						</label>
						<input
							id={servingsId}
							type="number"
							min={0.25}
							step={0.25}
							value={servingsUsed}
							onChange={(e) =>
								setServingsUsed(Number.parseFloat(e.target.value) || 1)
							}
							className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
						/>
					</div>

					<label
						htmlFor={leftoverId}
						className="flex items-center gap-2 cursor-pointer"
					>
						<input
							id={leftoverId}
							type="checkbox"
							checked={isLeftover}
							onChange={(e) => setIsLeftover(e.target.checked)}
							className="rounded border-gray-600 bg-gray-800 text-emerald-600 focus:ring-emerald-500"
						/>
						<span className="text-sm text-gray-300">Leftover</span>
					</label>
				</div>

				<div className="flex gap-2 mt-6">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onSave}
						className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors text-white"
					>
						Save
					</button>
				</div>
			</div>
		</div>
	);
}
