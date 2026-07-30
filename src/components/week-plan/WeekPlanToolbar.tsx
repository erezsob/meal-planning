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

interface WeekPlanToolbarProps {
	onClear: () => void;
	onNewWeeklyPlan: () => void;
}

/**
 * Week plan actions — new weekly plan and clear upper grid
 */
export function WeekPlanToolbar({
	onClear,
	onNewWeeklyPlan,
}: WeekPlanToolbarProps) {
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
					New weekly plan
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setClearOpen(true)}
				>
					<Eraser size={16} />
					Clear plan
				</Button>
			</div>

			<Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Start a new weekly plan?</DialogTitle>
						<DialogDescription>
							This creates a fresh grid at the top as &ldquo;This week&rdquo;
							and moves your current plan to &ldquo;Previous week&rdquo; below.
							Your current content is kept — nothing is deleted.
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
								onNewWeeklyPlan();
								setNewPlanOpen(false);
							}}
						>
							New weekly plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={clearOpen} onOpenChange={setClearOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Clear plan?</DialogTitle>
						<DialogDescription>
							This will remove all dishes and grocery lists from the upper
							&ldquo;This week&rdquo; grid only. The plan below is not affected.
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
							Clear plan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
