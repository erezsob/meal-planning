const LIST_MARKER = /^(?<marker>- |\* |(?<number>\d+)\. )/;

export type WeekPlanListEdit = {
	text: string;
	cursor: number;
	/** Selection the editor replaces so the browser can undo the key */
	replaceStart: number;
	replaceEnd: number;
	insert: string;
};

const lineAt = (text: string, index: number) => {
	const start = text.lastIndexOf("\n", index - 1) + 1;
	const breakAt = text.indexOf("\n", index);
	const end = breakAt === -1 ? text.length : breakAt;
	return { start, end, line: text.slice(start, end) };
};

const withoutMarker = ({
	text,
	start,
	end,
}: {
	text: string;
	start: number;
	end: number;
}): WeekPlanListEdit => ({
	text: `${text.slice(0, start)}${text.slice(end)}`,
	cursor: start,
	replaceStart: start,
	replaceEnd: end,
	insert: "",
});

/**
 * Continue or end a `- `, `* `, or `N. ` list line.
 * Returns null when the key should fall through to the textarea.
 */
export function applyWeekPlanListKey({
	text,
	selectionStart,
	selectionEnd,
	key,
}: {
	text: string;
	selectionStart: number;
	selectionEnd: number;
	key: "Enter" | "Backspace";
}): WeekPlanListEdit | null {
	if (selectionStart !== selectionEnd) return null;

	const { start, end, line } = lineAt(text, selectionStart);
	const match = LIST_MARKER.exec(line);
	const marker = match?.groups?.marker;
	if (!marker) return null;

	const markerEnd = start + marker.length;
	if (selectionStart < markerEnd) return null;

	const empty = line === marker && selectionStart === end;
	if (key === "Backspace") {
		return empty ? withoutMarker({ text, start, end }) : null;
	}
	if (empty) return withoutMarker({ text, start, end });

	const number = match?.groups?.number;
	const continued = number === undefined ? marker : `${Number(number) + 1}. `;
	const insert = `\n${continued}`;
	return {
		text: `${text.slice(0, selectionStart)}${insert}${text.slice(selectionStart)}`,
		cursor: selectionStart + insert.length,
		replaceStart: selectionStart,
		replaceEnd: selectionStart,
		insert,
	};
}
