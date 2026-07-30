import { Eraser, FilePlus } from "lucide-react";
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

interface CustomPlanToolbarProps {
	onClear: () => void;
	onNewCustomPlan: () => void;
}

/**
 * Custom plan actions — new custom plan and clear with confirmation
 */
export function CustomPlanToolbar({
	onClear,
	onNewCustomPlan,
}: CustomPlanToolbarProps) {
	const [clearOpen, setClearOpen] = useState(false);
	const [newPlanOpen, setNewPlanOpen] = useState(false);

	return (
		<>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setNewPlanOpen(true)}
				>
					<FilePlus size={16} />
					New custom plan
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setClearOpen(true)}
				>
					<Eraser size={16} />
					Clear custom plan
				</Button>
			</div>

			<Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Start a new custom plan?</DialogTitle>
						<DialogDescription>
							This archives your current custom plan rows and starts a fresh
							section. Your previous custom plans are kept in history — nothing
							is deleted.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setNewPlanOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => {
								onNewCustomPlan();
								setNewPlanOpen(false);
							}}
						>
							New custom plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={clearOpen} onOpenChange={setClearOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							This will remove all custom plan rows and reset to one empty row.
							This cannot be undone.
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
							Clear custom plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
