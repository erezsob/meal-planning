import {
	type ClipboardEvent,
	type KeyboardEvent,
	type MouseEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import { Textarea } from "@/lib/components/textarea";
import { LINK_TOOLTIP_DELAY_MS } from "@/lib/constants";
import {
	parseLinkifiedSegments,
	type TextSegment,
	wrapSelectionAsMarkdownLink,
} from "@/lib/linkify";
import { cn } from "@/lib/utils";
import { WeekPlanLinkDialog } from "./WeekPlanLinkDialog";
import { WeekPlanLinkTooltip } from "./WeekPlanLinkTooltip";

const WEEK_PLAN_CELL_SELECTOR = "[data-week-plan-cell]";

type LinkSegment = Extract<TextSegment, { type: "link" }>;

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
		"min-h-[3rem] w-full min-w-0 rounded-md border border-transparent px-3 py-2 text-left text-sm whitespace-pre-wrap break-words",
		"hover:border-border hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
		embedded &&
			"min-h-full max-w-full rounded-none border-0 px-2 py-2 hover:border-0 focus-visible:ring-0",
		!hasValue && "text-muted-foreground",
		className,
	);

const textareaClassName = (embedded: boolean, className?: string) =>
	cn(
		"min-h-[3rem] bg-background",
		embedded ? "resize-none" : "resize-y",
		embedded &&
			"field-sizing-fixed min-h-full max-w-full min-w-0 rounded-none border-0 shadow-none focus-visible:ring-0",
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

const applyLinkWrap = ({
	text,
	selectionStart,
	selectionEnd,
	url,
	onChange,
	textarea,
}: {
	text: string;
	selectionStart: number;
	selectionEnd: number;
	url: string;
	onChange: (value: string) => void;
	textarea: HTMLTextAreaElement | null;
}) => {
	const result = wrapSelectionAsMarkdownLink({
		text,
		selectionStart,
		selectionEnd,
		url,
	});
	if (!result) return false;

	onChange(result.text);
	if (textarea) {
		requestAnimationFrame(() => {
			textarea.setSelectionRange(result.cursor, result.cursor);
		});
	}
	return true;
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
	const [activeLinkStart, setActiveLinkStart] = useState<number | null>(null);
	const [linkSelection, setLinkSelection] = useState<{
		start: number;
		end: number;
	} | null>(null);
	const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const startEditing = () => {
		setActiveLinkStart(null);
		setIsEditing(true);
	};
	const stopEditing = () => {
		setLinkSelection(null);
		setIsEditing(false);
	};

	useEffect(() => {
		return () => {
			if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
		};
	}, []);

	const clearHoverTimer = () => {
		if (hoverTimerRef.current) {
			clearTimeout(hoverTimerRef.current);
			hoverTimerRef.current = null;
		}
	};

	const scheduleTooltip = (segment: LinkSegment) => {
		clearHoverTimer();
		hoverTimerRef.current = setTimeout(() => {
			setActiveLinkStart(segment.start);
		}, LINK_TOOLTIP_DELAY_MS);
	};

	const hideTooltipSoon = () => {
		clearHoverTimer();
		hoverTimerRef.current = setTimeout(() => {
			setActiveLinkStart(null);
		}, LINK_TOOLTIP_DELAY_MS);
	};

	const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
		const pasted = event.clipboardData.getData("text");
		const applied = applyLinkWrap({
			text: value,
			selectionStart: event.currentTarget.selectionStart,
			selectionEnd: event.currentTarget.selectionEnd,
			url: pasted,
			onChange,
			textarea: event.currentTarget,
		});
		if (applied) event.preventDefault();
	};

	const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			const { selectionStart, selectionEnd } = event.currentTarget;
			if (selectionStart === selectionEnd) return;
			setLinkSelection({ start: selectionStart, end: selectionEnd });
			return;
		}

		if (event.key === "Tab" && embedded && !linkSelection) {
			focusNextTableCell({ event, onClose: stopEditing });
		}
	};

	const handleLinkDialogSubmit = (url: string) => {
		if (!linkSelection) return;
		applyLinkWrap({
			text: value,
			selectionStart: linkSelection.start,
			selectionEnd: linkSelection.end,
			url,
			onChange,
			textarea: textareaRef.current,
		});
		setLinkSelection(null);
	};

	if (isEditing) {
		return (
			<div className="relative">
				<Textarea
					ref={(node) => {
						textareaRef.current = node;
					}}
					data-week-plan-cell
					aria-label={label}
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onBlur={() => {
						if (linkSelection) return;
						stopEditing();
					}}
					onPaste={handlePaste}
					onKeyDown={handleTextareaKeyDown}
					autoFocus
					rows={minRows}
					className={textareaClassName(embedded, className)}
				/>
				{linkSelection && (
					<WeekPlanLinkDialog
						onSubmit={handleLinkDialogSubmit}
						onCancel={() => setLinkSelection(null)}
					/>
				)}
			</div>
		);
	}

	const segments = parseLinkifiedSegments(value);
	const ariaLabel = `${label}${value ? "" : " (empty)"}`;
	const hasLinks = segments.some((segment) => segment.type === "link");

	if (!hasLinks) {
		return (
			<button
				type="button"
				data-week-plan-cell
				aria-label={ariaLabel}
				onClick={startEditing}
				onFocus={embedded ? startEditing : undefined}
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

	const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
		event.stopPropagation();
	};

	return (
		<div
			className={cn(
				displayClassName(embedded, Boolean(value), className),
				"relative",
			)}
		>
			{segments.map((segment, index) =>
				segment.type === "link" ? (
					<span
						key={`link-${segment.start}-${segment.raw}-${index}`}
						className="relative inline"
					>
						<a
							href={segment.href}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary underline underline-offset-2"
							onClick={handleLinkClick}
							onMouseEnter={() => scheduleTooltip(segment)}
							onMouseLeave={hideTooltipSoon}
						>
							{segment.value}
						</a>
						{activeLinkStart === segment.start && (
							<WeekPlanLinkTooltip
								segment={segment}
								cellValue={value}
								onChange={onChange}
								onClose={() => setActiveLinkStart(null)}
								onKeepOpen={clearHoverTimer}
								onRequestClose={hideTooltipSoon}
							/>
						)}
					</span>
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
			<button
				type="button"
				data-week-plan-cell
				className="sr-only"
				onClick={startEditing}
				onFocus={embedded ? startEditing : undefined}
			>
				Edit {label}
			</button>
		</div>
	);
}
