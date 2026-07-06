import { useState } from "react";
import { parseLinkifiedSegments } from "@/lib/linkify";
import { Textarea } from "@/lib/components/textarea";
import { cn } from "@/lib/utils";

interface WeekPlanCellEditorProps {
	/** Accessible label for the field */
	label: string;
	value: string;
	onChange: (value: string) => void;
	className?: string;
	minRows?: number;
	/** Flush styling for use inside a bordered table */
	embedded?: boolean;
}

/**
 * Editable week plan cell — display mode with linkified URLs, edit mode with textarea.
 */
export function WeekPlanCellEditor({
	label,
	value,
	onChange,
	className,
	minRows = 2,
	embedded = false,
}: WeekPlanCellEditorProps) {
	const [isEditing, setIsEditing] = useState(false);

	if (isEditing) {
		return (
			<Textarea
				aria-label={label}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onBlur={() => setIsEditing(false)}
				autoFocus
				rows={minRows}
				className={cn(
					"min-h-[3rem] resize-y bg-background",
					embedded &&
						"min-h-full rounded-none border-0 shadow-none focus-visible:ring-0",
					className,
				)}
			/>
		);
	}

	const segments = parseLinkifiedSegments(value);

	return (
		<button
			type="button"
			aria-label={`${label}${value ? "" : " (empty)"}`}
			onClick={() => setIsEditing(true)}
			className={cn(
				"min-h-[3rem] w-full rounded-md border border-transparent px-3 py-2 text-left text-sm whitespace-pre-wrap break-words",
				"hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				embedded &&
					"min-h-full rounded-none border-0 px-2 py-2 hover:border-0 focus-visible:ring-0",
				!value && "text-muted-foreground",
				className,
			)}
		>
			{segments.length === 0 ? (
				<span className="text-muted-foreground"> </span>
			) : (
				segments.map((segment, index) =>
					segment.type === "link" ? (
						<a
							key={`link-${segment.value}-${index}`}
							href={segment.value}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline underline-offset-2"
							onClick={(event) => event.stopPropagation()}
						>
							{segment.value}
						</a>
					) : (
						<span key={`text-${segment.value}-${index}`}>{segment.value}</span>
					),
				)
			)}
		</button>
	);
}
