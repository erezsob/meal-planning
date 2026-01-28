import { RefreshCw } from "lucide-react";

interface LeftoverBadgeProps {
	/** Optional size variant */
	size?: "sm" | "md";
}

/**
 * Badge indicating a meal is from leftovers
 */
export function LeftoverBadge({ size = "sm" }: LeftoverBadgeProps) {
	const sizeClasses =
		size === "sm" ? "px-1.5 py-0.5 text-xs gap-1" : "px-2 py-1 text-sm gap-1.5";
	const iconSize = size === "sm" ? 10 : 14;

	return (
		<span
			className={`inline-flex items-center rounded bg-teal-600/20 text-teal-400 border border-teal-600/30 font-medium ${sizeClasses}`}
		>
			<RefreshCw size={iconSize} />
			Leftover
		</span>
	);
}
