import { type KeyboardEvent, type MouseEvent, useState } from "react";
import { Textarea } from "@/lib/components/textarea";
import { parseLinkifiedSegments } from "@/lib/linkify";
import { cn } from "@/lib/utils";

const WEEK_PLAN_CELL_SELECTOR = "[data-week-plan-cell]";

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

const textareaClassName = (embedded: boolean, className?: string) =>
	cn(
		"min-h-[3rem] bg-background",
		embedded ? "resize-none" : "resize-y",
		embedded &&
			"min-h-full rounded-none border-0 shadow-none focus-visible:ring-0",
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

const focusNextTableCell = ({
	event,
	onClose,
}: {
	event: KeyboardEvent<HTMLTextAreaElement>;
	onClose: () => void;
}) => {
	const table = event.currentTarget.closest("table");
	if (!table) return;

	const cells = [
		...table.querySelectorAll<HTMLElement>(WEEK_PLAN_CELL_SELECTOR),
	];
	const current = event.currentTarget.closest<HTMLElement>(
		WEEK_PLAN_CELL_SELECTOR,
	);
	if (!current) return;

	const index = cells.indexOf(current);
	const next = cells[index + (event.shiftKey ? -1 : 1)];
	if (!next) return;

	event.preventDefault();
	onClose();
	next.focus();
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

	const startEditing = () => setIsEditing(true);
	const stopEditing = () => setIsEditing(false);

	const handleBlur = () => {
		stopEditing();
	};

	const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Tab" && embedded) {
			focusNextTableCell({ event, onClose: stopEditing });
		}
	};

	if (isEditing) {
		return (
			<Textarea
				data-week-plan-cell
				aria-label={label}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onBlur={handleBlur}
				onKeyDown={handleTextareaKeyDown}
				autoFocus
				rows={minRows}
				className={textareaClassName(embedded, className)}
			/>
		);
	}

	const segments = parseLinkifiedSegments(value);
	const ariaLabel = `${label}${value ? "" : " (empty)"}`;
	const hasLinks =
		!embedded && segments.some((segment) => segment.type === "link");

	const focusDisplayProps = embedded ? { onFocus: startEditing } : undefined;

	if (!hasLinks) {
		return (
			<button
				type="button"
				data-week-plan-cell
				aria-label={ariaLabel}
				onClick={startEditing}
				{...focusDisplayProps}
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
