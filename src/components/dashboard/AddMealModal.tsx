import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useId, useState } from "react";
import { Button } from "@/lib/components/button";
import { Checkbox } from "@/lib/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import {
	COMPONENT_ROLE_LABELS,
	DEFAULT_COMPONENT_ROLE,
	HOUSEHOLD_ID,
	MEAL_COMPONENT_ROLES,
	type MealComponentRole,
	type MealType,
} from "@/lib/constants";
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
				className="block text-sm font-medium text-muted-foreground mb-2"
			>
				Component type
			</legend>
			<div className="flex flex-wrap gap-2">
				{MEAL_COMPONENT_ROLES.map((role) => (
					<Button
						key={role}
						type="button"
						variant={selectedRole === role ? "default" : "secondary"}
						size="sm"
						onClick={() => setSelectedRole(role)}
					>
						{COMPONENT_ROLE_LABELS[role]}
					</Button>
				))}
			</div>
		</fieldset>
	);

	// Show servingsMade confirmation for fresh dishes
	if (pendingDish) {
		return (
			<Dialog open onOpenChange={(open) => !open && setPendingDish(null)}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Add {pendingDish.name}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor={servingsMadeId} className="mb-1">
								Servings made
							</Label>
							<Input
								id={servingsMadeId}
								type="number"
								min={1}
								step={1}
								value={servingsMade}
								onChange={(e) =>
									setServingsMade(Number.parseInt(e.target.value, 10) || 1)
								}
							/>
							<p className="mt-1 text-xs text-muted-foreground">
								How many servings will this batch yield?
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button variant="secondary" onClick={() => setPendingDish(null)}>
							Back
						</Button>
						<Button onClick={handleConfirmFreshDish}>Add</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Edit component</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<span className="block text-sm font-medium text-muted-foreground mb-1">
							Dish
						</span>
						<p className="text-foreground">{displayName}</p>
					</div>

					<div>
						<Label htmlFor={componentTypeId} className="mb-2">
							Component type
						</Label>
						<select
							id={componentTypeId}
							value={selectedRole}
							onChange={(e) =>
								setSelectedRole(e.target.value as MealComponentRole)
							}
							className="w-full h-9 px-3 py-2 bg-input/30 border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							{MEAL_COMPONENT_ROLES.map((role) => (
								<option key={role} value={role}>
									{COMPONENT_ROLE_LABELS[role]}
								</option>
							))}
						</select>
					</div>

					<div>
						<Label htmlFor={servingsId} className="mb-1">
							Servings
						</Label>
						<Input
							id={servingsId}
							type="number"
							min={0.25}
							step={0.25}
							value={servingsUsed}
							onChange={(e) =>
								setServingsUsed(Number.parseFloat(e.target.value) || 1)
							}
						/>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							id={leftoverId}
							checked={isLeftover}
							onCheckedChange={(checked) => setIsLeftover(checked === true)}
						/>
						<Label htmlFor={leftoverId} className="cursor-pointer">
							Leftover
						</Label>
					</div>
				</div>

				<DialogFooter>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button onClick={onSave}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
