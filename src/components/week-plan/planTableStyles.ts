import { cn } from "@/lib/utils";

/** Shared layout and contrast tokens for editable and read-only plan tables. */
export const PLAN_TABLE_CLASS_NAME =
	"w-full min-w-[640px] table-fixed border-collapse border border-table-border text-sm";

/** Header row background — stronger than body cells without changing page background. */
export const PLAN_TABLE_HEADER_ROW_CLASS_NAME = "bg-table-header";

export const PLAN_TABLE_CELL_BORDER = "border border-table-border";

export const PLAN_TABLE_CELL_PADDING = "px-3 py-2";

export const planTableHeaderCellClassName = (widthClass: string) =>
	cn(
		widthClass,
		PLAN_TABLE_CELL_BORDER,
		PLAN_TABLE_CELL_PADDING,
		"text-left font-semibold",
	);

export const planTableBodyCellClassName = (extra?: string) =>
	cn(PLAN_TABLE_CELL_BORDER, PLAN_TABLE_CELL_PADDING, extra);
