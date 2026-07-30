import { useId, useState } from "react";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import { isHttpUrl } from "@/lib/linkify";

interface WeekPlanLinkDialogProps {
	onSubmit: (url: string) => void;
	onCancel: () => void;
}

/**
 * Inline dialog for Cmd/Ctrl+K link creation while editing a cell.
 */
export function WeekPlanLinkDialog({
	onSubmit,
	onCancel,
}: WeekPlanLinkDialogProps) {
	const urlInputId = useId();
	const [draftUrl, setDraftUrl] = useState("");

	const submit = () => {
		const url = draftUrl.trim();
		if (!isHttpUrl(url)) return;
		onSubmit(url);
	};

	return (
		<div
			role="dialog"
			aria-label="Insert link"
			className="absolute inset-x-1 top-1 z-20 rounded-md border border-border bg-background p-2 shadow-md"
		>
			<label
				className="mb-1 block text-xs text-muted-foreground"
				htmlFor={urlInputId}
			>
				Link URL
			</label>
			<Input
				id={urlInputId}
				value={draftUrl}
				autoFocus
				placeholder="https://"
				onChange={(event) => setDraftUrl(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.preventDefault();
						event.stopPropagation();
						submit();
					}
					if (event.key === "Escape") {
						event.preventDefault();
						event.stopPropagation();
						onCancel();
					}
				}}
				className="mb-2 h-8 text-xs"
			/>
			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" size="xs" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="button" size="xs" onClick={submit}>
					Add link
				</Button>
			</div>
		</div>
	);
}
