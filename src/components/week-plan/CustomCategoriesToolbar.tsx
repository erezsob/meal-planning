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

interface CustomCategoriesToolbarProps {
	onClear: () => void;
}

/**
 * Custom categories actions — clear with confirmation
 */
export function CustomCategoriesToolbar({
	onClear,
}: CustomCategoriesToolbarProps) {
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
					Clear categories
				</Button>
			</div>

			<Dialog open={clearOpen} onOpenChange={setClearOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							This will remove all category rows and reset to one empty row.
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
							Clear categories
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
