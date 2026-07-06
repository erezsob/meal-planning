import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { COMPONENT_ROLE_LABELS, DEFAULT_COMPONENT_ROLE } from "@/lib/constants";
import type { MealWithDish } from "@/lib/mealPlanTypes";

interface MealActionModalProps {
	/** The meal (component) to show actions for */
	meal: MealWithDish;
	/** Trimmed actions for eaten meals (edit + delete only) */
	eatenOnly?: boolean;
	/** Called when closing the modal */
	onClose: () => void;
	/** Called when edit action is triggered */
	onEdit: () => void;
	/** Called when "Add another component" is clicked (same slot) */
	onAddAnother?: () => void;
}

/**
 * Action modal for existing meal - mark eaten, skipped, edit, delete
 */
export function MealActionModal({
	meal,
	eatenOnly = false,
	onClose,
	onEdit,
	onAddAnother,
}: MealActionModalProps) {
	const eatMeal = useMutation(api.mealPlans.eatMeal);
	const skipMeal = useMutation(api.mealPlans.skipMeal);
	const removeMeal = useMutation(api.mealPlans.remove);

	const roleLabel =
		COMPONENT_ROLE_LABELS[meal.componentRole ?? DEFAULT_COMPONENT_ROLE];
	const displayName = meal.dish?.name ?? meal.customName ?? "Unknown";
	const title = eatenOnly ? displayName : `${roleLabel}: ${displayName}`;

	const handleEat = () => {
		eatMeal({ id: meal._id });
		onClose();
	};

	const handleSkip = () => {
		skipMeal({ id: meal._id });
		onClose();
	};

	const handleDelete = () => {
		removeMeal({ id: meal._id });
		onClose();
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="truncate pr-6">{title}</DialogTitle>
					<DialogDescription className="sr-only">
						Actions for this meal component
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					{!eatenOnly && meal.status === "planned" && (
						<>
							<Button onClick={handleEat} className="w-full" size="lg">
								✓ Ate it
							</Button>
							<Button
								onClick={handleSkip}
								className="w-full bg-amber-600 hover:bg-amber-700"
								size="lg"
							>
								↺ Skipped
							</Button>
						</>
					)}

					{!eatenOnly && meal.status === "eaten" && (
						<div className="text-center py-2 text-primary font-medium">
							✓ Already eaten
						</div>
					)}

					{!eatenOnly && meal.status === "skipped" && (
						<div className="text-center py-2 text-amber-400 font-medium">
							↺ Already skipped
						</div>
					)}

					<div className={eatenOnly ? "space-y-2" : "pt-2 border-t space-y-2"}>
						{!eatenOnly && onAddAnother && (
							<Button
								variant="secondary"
								onClick={onAddAnother}
								className="w-full"
							>
								<Plus size={16} />
								Add another component
							</Button>
						)}
						<div className="flex gap-2">
							<Button variant="secondary" onClick={onEdit} className="flex-1">
								<Edit size={16} />
								Edit
							</Button>
							<Button
								variant="destructive"
								onClick={handleDelete}
								className="flex-1"
							>
								<Trash2 size={16} />
								Delete
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
