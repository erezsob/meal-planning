import { ClipboardCopy, ClipboardPaste, Eraser } from "lucide-react";
import { useState } from "react";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { Textarea } from "@/lib/components/textarea";
import {
	parseWeekPlanImport,
	serializeWeekPlanExport,
} from "@/lib/weekPlanStorage";
import type { WeekPlan } from "@/lib/weekPlanTypes";

interface WeekPlanToolbarProps {
	plan: WeekPlan;
	onClear: () => void;
	onImport: (plan: WeekPlan) => void;
}

/**
 * Week plan actions — clear, export, import
 */
export function WeekPlanToolbar({
	plan,
	onClear,
	onImport,
}: WeekPlanToolbarProps) {
	const [clearOpen, setClearOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [importText, setImportText] = useState("");
	const [importError, setImportError] = useState<string | null>(null);
	const [copyMessage, setCopyMessage] = useState<string | null>(null);

	const handleCopy = async () => {
		const json = serializeWeekPlanExport(plan);
		await navigator.clipboard.writeText(json);
		setCopyMessage("Copied to clipboard");
		setTimeout(() => setCopyMessage(null), 2000);
	};

	const handleImport = () => {
		const result = parseWeekPlanImport(importText);
		if (!result.ok) {
			setImportError(result.error);
			return;
		}
		onImport(result.value);
		setImportOpen(false);
		setImportText("");
		setImportError(null);
	};

	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setClearOpen(true)}
				>
					<Eraser size={16} />
					Clear plan
				</Button>
				<Button type="button" variant="outline" size="sm" onClick={handleCopy}>
					<ClipboardCopy size={16} />
					Copy plan
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => {
						setImportOpen(true);
						setImportError(null);
					}}
				>
					<ClipboardPaste size={16} />
					Import plan
				</Button>
				{copyMessage && (
					<output className="text-sm text-muted-foreground">{copyMessage}</output>
				)}
			</div>

			<Dialog open={clearOpen} onOpenChange={setClearOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Clear plan?</DialogTitle>
						<DialogDescription>
							This will remove all dishes and grocery lists. This cannot be undone
							unless you copied the plan first.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setClearOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={() => {
								onClear();
								setClearOpen(false);
							}}
						>
							Clear plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={importOpen} onOpenChange={setImportOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import plan</DialogTitle>
						<DialogDescription>
							Paste the JSON copied from another device. This will replace your
							current plan.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						aria-label="Import plan JSON"
						value={importText}
						onChange={(event) => {
							setImportText(event.target.value);
							setImportError(null);
						}}
						rows={8}
						placeholder='{"version":1,"plan":{...}}'
						className="font-mono text-xs"
					/>
					{importError && (
						<p className="text-sm text-destructive" role="alert">
							{importError}
						</p>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setImportOpen(false)}
						>
							Cancel
						</Button>
						<Button type="button" onClick={handleImport}>
							Replace current plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
