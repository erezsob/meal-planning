import { type KeyboardEvent, type MouseEvent, useState } from "react";
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

const displayClassName = (
	embedded: boolean,
	hasValue: boolean,
	className?: string,
) =>
	cn(
		"min-h-[3rem] w-full rounded-md border border-transparent px-3 py-2 text-left text-sm whitespace-pre-wrap break-words",
		"hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		embedded &&
			"min-h-full rounded-none border-0 px-2 py-2 hover:border-0 focus-visible:ring-0",
		!hasValue && "text-muted-foreground",
		className,
	);

const startEditingOnKeyDown = (
	event: KeyboardEvent,
	startEditing: () => void,
) => {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		startEditing();
	}
};

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
	const ariaLabel = `${label}${value ? "" : " (empty)"}`;
	const hasLinks = segments.some((segment) => segment.type === "link");

	const startEditing = () => setIsEditing(true);

	if (!hasLinks) {
		return (
			<button
				type="button"
				aria-label={ariaLabel}
				onClick={startEditing}
				className={displayClassName(embedded, Boolean(value), className)}
			>
				{segments.length === 0 ? (
					<span className="text-muted-foreground"> </span>
				) : (
					segments.map((segment, index) => (
						<span key={`text-${segment.value}-${index}`}>{segment.value}</span>
					))
				)}
			</button>
		);
	}

	const handleTextClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		startEditing();
	};

	return (
		<div className={displayClassName(embedded, Boolean(value), className)}>
			{segments.map((segment, index) =>
				segment.type === "link" ? (
					<a
						key={`link-${segment.value}-${index}`}
						href={segment.value}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline underline-offset-2"
					>
						{segment.value}
					</a>
				) : (
					<button
						key={`text-${segment.value}-${index}`}
						type="button"
						className="inline border-0 bg-transparent p-0 text-left text-sm whitespace-pre-wrap break-words"
						onClick={handleTextClick}
						onKeyDown={(event) => startEditingOnKeyDown(event, startEditing)}
					>
						{segment.value}
					</button>
				),
			)}
			<button type="button" className="sr-only" onClick={startEditing}>
				Edit {label}
			</button>
		</div>
	);
}
