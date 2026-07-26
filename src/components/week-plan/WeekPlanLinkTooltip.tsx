import { useId, useState } from "react";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import {
	formatMarkdownLink,
	isHttpUrl,
	replaceLinkRaw,
	type TextSegment,
} from "@/lib/linkify";

type LinkSegment = Extract<TextSegment, { type: "link" }>;

interface WeekPlanLinkTooltipProps {
	segment: LinkSegment;
	onChange: (value: string) => void;
	cellValue: string;
	onClose: () => void;
	onKeepOpen: () => void;
	onRequestClose: () => void;
}

/**
 * Hover tooltip for viewing, editing, or unlinking a cell hyperlink.
 */
export function WeekPlanLinkTooltip({
	segment,
	onChange,
	cellValue,
	onClose,
	onKeepOpen,
	onRequestClose,
}: WeekPlanLinkTooltipProps) {
	const urlInputId = useId();
	const [draftUrl, setDraftUrl] = useState(segment.href);
	const canUnlink = segment.raw !== segment.href;

	const saveUrl = () => {
		const nextHref = draftUrl.trim();
		if (!isHttpUrl(nextHref)) {
			onClose();
			return;
		}

		const nextRaw =
			segment.raw === segment.href
				? nextHref
				: formatMarkdownLink({ label: segment.value, href: nextHref });

		onChange(
			replaceLinkRaw({
				text: cellValue,
				start: segment.start,
				raw: segment.raw,
				nextRaw,
			}),
		);
		onClose();
	};

	const unlink = () => {
		onChange(
			replaceLinkRaw({
				text: cellValue,
				start: segment.start,
				raw: segment.raw,
				nextRaw: segment.value,
			}),
		);
		onClose();
	};

	return (
		<div
			role="dialog"
			aria-label="Link options"
			className="absolute z-20 mt-1 w-72 rounded-md border border-border bg-background p-2 shadow-md"
			onMouseEnter={onKeepOpen}
			onMouseLeave={onRequestClose}
		>
			<label
				className="mb-1 block text-xs text-muted-foreground"
				htmlFor={urlInputId}
			>
				URL
			</label>
			<Input
				id={urlInputId}
				value={draftUrl}
				onChange={(event) => setDraftUrl(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						saveUrl();
					}
					if (event.key === "Escape") {
						event.preventDefault();
						onClose();
					}
				}}
				className="mb-2 h-8 text-xs"
			/>
			<div className="flex justify-end gap-2">
				{canUnlink && (
					<Button type="button" variant="outline" size="xs" onClick={unlink}>
						Unlink
					</Button>
				)}
				<Button type="button" size="xs" onClick={saveUrl}>
					Save link
				</Button>
			</div>
		</div>
	);
}
