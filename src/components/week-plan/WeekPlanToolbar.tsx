import { Eraser } from "lucide-react";
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
}

/**
 * Week plan actions — clear
 */
export function WeekPlanToolbar({ onClear }: WeekPlanToolbarProps) {
	const [clearOpen, setClearOpen] = useState(false);

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
			</div>

			<Dialog open={clearOpen} onOpenChange={setClearOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Clear plan?</DialogTitle>
						<DialogDescription>
							This will remove all dishes and grocery lists. This cannot be
							undone.
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
