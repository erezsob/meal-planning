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

interface CustomPlanToolbarProps {
	onClear: () => void;
}

/**
 * Custom plan actions — clear with confirmation
 */
export function CustomPlanToolbar({ onClear }: CustomPlanToolbarProps) {
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
					Clear custom plan
				</Button>
			</div>

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
