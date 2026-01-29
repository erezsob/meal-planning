import type { DishTag } from "../../lib/constants";

/** Tag color mappings for visual distinction */
const TAG_COLORS: Record<DishTag, string> = {
	"high-protein": "bg-amber-600/20 text-amber-400 border-amber-600/30",
	"high-fiber": "bg-green-600/20 text-green-400 border-green-600/30",
	"low-carb": "bg-blue-600/20 text-blue-400 border-blue-600/30",
	vegetarian: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
	vegan: "bg-lime-600/20 text-lime-400 border-lime-600/30",
	"gluten-free": "bg-orange-600/20 text-orange-400 border-orange-600/30",
	"dairy-free": "bg-cyan-600/20 text-cyan-400 border-cyan-600/30",
	quick: "bg-purple-600/20 text-purple-400 border-purple-600/30",
	"meal-prep": "bg-pink-600/20 text-pink-400 border-pink-600/30",
};

/** Human-readable tag labels */
const TAG_LABELS: Record<DishTag, string> = {
	"high-protein": "High Protein",
	"high-fiber": "High Fiber",
	"low-carb": "Low Carb",
	vegetarian: "Vegetarian",
	vegan: "Vegan",
	"gluten-free": "Gluten Free",
	"dairy-free": "Dairy Free",
	quick: "Quick",
	"meal-prep": "Meal Prep",
};

interface TagBadgeProps {
	/** The tag identifier */
	tag: DishTag;
	/** Optional size variant */
	size?: "sm" | "md";
}

/**
 * Displays a colored badge for a dish nutrition/dietary tag
 */
function TagBadge({ tag, size = "sm" }: TagBadgeProps) {
	const colorClasses = TAG_COLORS[tag] ?? "bg-gray-600/20 text-gray-400";
	const label = TAG_LABELS[tag] ?? tag;

	const sizeClasses =
		size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

	return (
		<span
			className={`inline-flex items-center rounded-full border font-medium ${colorClasses} ${sizeClasses}`}
		>
			{label}
		</span>
	);
}

interface TagListProps {
	/** Array of tags to display */
	tags: string[];
	/** Maximum number of tags to show before truncating */
	maxVisible?: number;
	/** Size variant for badges */
	size?: "sm" | "md";
}

/**
 * Displays a list of tag badges with optional truncation
 */
export function TagList({ tags, maxVisible = 3, size = "sm" }: TagListProps) {
	const visibleTags = tags.slice(0, maxVisible);
	const remaining = tags.length - maxVisible;

	return (
		<div className="flex flex-wrap gap-1">
			{visibleTags.map((tag) => (
				<TagBadge key={tag} tag={tag as DishTag} size={size} />
			))}
			{remaining > 0 && (
				<span className="text-xs text-gray-500 self-center">
					+{remaining} more
				</span>
			)}
		</div>
	);
}
