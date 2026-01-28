import { Check, Clock, X } from "lucide-react";
import type { MealStatus } from "../../lib/constants";

/** Status color and icon mappings */
const STATUS_CONFIG: Record<
	MealStatus,
	{ color: string; icon: React.ReactNode; label: string }
> = {
	planned: {
		color: "bg-blue-600/20 text-blue-400 border-blue-600/30",
		icon: <Clock size={12} />,
		label: "Planned",
	},
	eaten: {
		color: "bg-green-600/20 text-green-400 border-green-600/30",
		icon: <Check size={12} />,
		label: "Eaten",
	},
	skipped: {
		color: "bg-gray-600/20 text-gray-400 border-gray-600/30",
		icon: <X size={12} />,
		label: "Skipped",
	},
};

interface StatusBadgeProps {
	/** The meal status */
	status: MealStatus;
}

/**
 * Displays a badge indicating meal plan status
 */
export function StatusBadge({ status }: StatusBadgeProps) {
	const config = STATUS_CONFIG[status];

	return (
		<span
			className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border ${config.color}`}
		>
			{config.icon}
			{config.label}
		</span>
	);
}
