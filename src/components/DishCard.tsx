import type { Doc } from "convex/_generated/dataModel";
import { ExternalLink, Users } from "lucide-react";
import { Button } from "@/lib/components/button";
import { Card, CardFooter } from "@/lib/components/card";
import { Skeleton } from "@/lib/components/skeleton";
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
		<Card className="gap-0 py-0 overflow-hidden hover:border-gray-600 transition-colors">
			<button
				type="button"
				onClick={onClick}
				className="flex-1 p-4 text-left hover:bg-accent/50 transition-colors"
			>
				<h3 className="font-semibold text-card-foreground mb-1">{dish.name}</h3>

				{dish.description && (
					<p className="text-sm text-muted-foreground line-clamp-2 mb-3">
						{dish.description}
					</p>
				)}

				<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
				<CardFooter className="border-t px-0 py-0">
					<Button
						variant="ghost"
						asChild
						className="w-full rounded-none h-auto py-2"
					>
						<a href={dish.sourceUrl} target="_blank" rel="noopener noreferrer">
							<ExternalLink size={14} />
							View Recipe
						</a>
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}

interface DishCardSkeletonProps {
	/** Number of skeleton cards to show */
	count?: number;
}

/**
 * Loading skeleton for dish cards
 */
/** Stable keys for skeleton cards */
const DISH_SKELETON_KEYS = [
	"sk-1",
	"sk-2",
	"sk-3",
	"sk-4",
	"sk-5",
	"sk-6",
] as const;

export function DishCardSkeleton({ count = 1 }: DishCardSkeletonProps) {
	return (
		<div role="presentation" aria-label="Dish card skeleton">
			{DISH_SKELETON_KEYS.slice(0, count).map((key) => (
				<Card key={key} className="gap-0 p-4 py-4">
					<Skeleton className="h-5 w-3/4 mb-2" />
					<Skeleton className="h-4 w-full mb-1" />
					<Skeleton className="h-4 w-2/3 mb-3" />
					<div className="flex gap-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-20" />
					</div>
				</Card>
			))}
		</div>
	);
}
