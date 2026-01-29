import type { Doc } from "convex/_generated/dataModel";
import { ExternalLink, Users } from "lucide-react";
import { TagList } from "./TagBadge";

interface DishCardProps {
	/** The dish data */
	dish: Doc<"dishes">;
	/** Called when clicking the card */
	onClick?: () => void;
}

/**
 * Card displaying a dish in the recipe library
 */
export function DishCard({ dish, onClick }: DishCardProps) {
	return (
		<article className="flex flex-col rounded-xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden">
			<button
				type="button"
				onClick={onClick}
				className="flex-1 p-4 text-left hover:bg-gray-750 transition-colors"
			>
				<h3 className="font-semibold text-gray-100 mb-1">{dish.name}</h3>

				{dish.description && (
					<p className="text-sm text-gray-400 line-clamp-2 mb-3">
						{dish.description}
					</p>
				)}

				<div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
					<span className="flex items-center gap-1">
						<Users size={14} />
						{dish.defaultServings ?? 1} servings
					</span>
					{dish.ingredients.length > 0 && (
						<span>{dish.ingredients.length} ingredients</span>
					)}
				</div>

				{(dish.tags?.length ?? 0) > 0 && (
					<TagList tags={dish.tags ?? []} maxVisible={3} />
				)}
			</button>

			{dish.sourceUrl && (
				<a
					href={dish.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border-t border-gray-700 hover:bg-gray-750 transition-colors"
				>
					<ExternalLink size={14} />
					View Recipe
				</a>
			)}
		</article>
	);
}

interface DishCardSkeletonProps {
	/** Number of skeleton cards to show */
	count?: number;
}

/**
 * Loading skeleton for dish cards
 */
export function DishCardSkeleton({ count = 1 }: DishCardSkeletonProps) {
	return (
		<>
			{Array.from({ length: count }).map(() => {
				const key = `dish-skeleton-${crypto.randomUUID()}`;
				return (
					<div
						key={key}
						className="flex flex-col rounded-xl bg-gray-800 border border-gray-700 p-4 animate-pulse"
					>
						<div className="h-5 bg-gray-700 rounded w-3/4 mb-2" />
						<div className="h-4 bg-gray-700 rounded w-full mb-1" />
						<div className="h-4 bg-gray-700 rounded w-2/3 mb-3" />
						<div className="flex gap-2">
							<div className="h-4 bg-gray-700 rounded w-16" />
							<div className="h-4 bg-gray-700 rounded w-20" />
						</div>
					</div>
				);
			})}
		</>
	);
}
