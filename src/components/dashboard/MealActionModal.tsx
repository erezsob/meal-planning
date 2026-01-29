import { api } from "convex/_generated/api";
import { useMutation } from "convex/react";
import { Edit, Trash2, X } from "lucide-react";
import type { MealWithDish } from "./types";

interface MealActionModalProps {
	/** The meal to show actions for */
	meal: MealWithDish;
	/** Called when closing the modal */
	onClose: () => void;
	/** Called when edit action is triggered */
	onEdit: () => void;
}

/**
 * Action modal for existing meal - mark eaten, skipped, edit, delete
 */
export function MealActionModal({
	meal,
	onClose,
	onEdit,
}: MealActionModalProps) {
	const eatMeal = useMutation(api.mealPlans.eatMeal);
	const skipMeal = useMutation(api.mealPlans.skipMeal);
	const removeMeal = useMutation(api.mealPlans.remove);

	const displayName = meal.dish?.name ?? meal.customName ?? "Unknown";

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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				aria-hidden="true"
			/>

			{/* Modal */}
			<div className="relative w-full max-w-sm bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-lg font-semibold text-gray-100 truncate pr-2">
						{displayName}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>

				{/* Actions */}
				<div className="p-4 space-y-2">
					{meal.status === "planned" && (
						<>
							<button
								type="button"
								onClick={handleEat}
								className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
							>
								✓ Ate it
							</button>
							<button
								type="button"
								onClick={handleSkip}
								className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
							>
								↺ Skipped
							</button>
						</>
					)}

					{meal.status === "eaten" && (
						<div className="text-center py-2 text-emerald-400 font-medium">
							✓ Already eaten
						</div>
					)}

					{meal.status === "skipped" && (
						<div className="text-center py-2 text-amber-400 font-medium">
							↺ Already skipped
						</div>
					)}

					<div className="pt-2 border-t border-gray-700 flex gap-2">
						<button
							type="button"
							onClick={onEdit}
							className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							<Edit size={16} />
							Edit
						</button>
						<button
							type="button"
							onClick={handleDelete}
							className="flex-1 py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							<Trash2 size={16} />
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
