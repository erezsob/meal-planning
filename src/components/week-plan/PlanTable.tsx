import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PlanTableProps {
	children: ReactNode;
	className?: string;
}

/** Scrollable wrapper and base table styling for week/custom/archived plan grids. */
export function PlanTable({ children, className }: PlanTableProps) {
	return (
		<div className="overflow-x-auto">
			<table
				className={cn(
					"w-full min-w-[640px] table-fixed border-collapse border border-table-border text-sm",
					className,
				)}
			>
				{children}
			</table>
		</div>
	);
}

interface PlanTableHeadProps {
	children: ReactNode;
}

/** Table header section with elevated contrast row background. */
export function PlanTableHead({ children }: PlanTableHeadProps) {
	return (
		<thead>
			<tr className="bg-table-header">{children}</tr>
		</thead>
	);
}

interface PlanTableHeadCellProps {
	children: ReactNode;
	className?: string;
}

export function PlanTableHeadCell({
	children,
	className,
}: PlanTableHeadCellProps) {
	return (
		<th
			className={cn(
				"border border-table-border px-3 py-2 text-left font-semibold",
				className,
			)}
		>
			{children}
		</th>
	);
}

interface PlanTableBodyProps {
	children: ReactNode;
}

export function PlanTableBody({ children }: PlanTableBodyProps) {
	return <tbody>{children}</tbody>;
}

interface PlanTableCellProps {
	children: ReactNode;
	className?: string;
}

export function PlanTableCell({ children, className }: PlanTableCellProps) {
	return (
		<td className={cn("border border-table-border px-3 py-2", className)}>
			{children}
		</td>
	);
}
