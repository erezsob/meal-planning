export type TextSegment =
	| { type: "text"; value: string }
	| {
			type: "link";
			/** Display text (label for markdown links, URL for bare links) */
			value: string;
			/** Target URL */
			href: string;
			/** Exact source substring to replace for edit/unlink */
			raw: string;
			/** Start index of `raw` within the source string */
			start: number;
	  };

const URL_PATTERN = /https?:\/\/[^\s]+/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const HTTP_URL_ONLY = /^https?:\/\/[^\s]+$/;

interface MatchRange {
	start: number;
	end: number;
	segment: TextSegment;
}

/**
 * True when the string is a bare http(s) URL with no surrounding whitespace.
 */
export function isHttpUrl(value: string): boolean {
	return HTTP_URL_ONLY.test(value.trim());
}

/**
 * Format a markdown-style labeled link.
 */
export function formatMarkdownLink({
	label,
	href,
}: {
	label: string;
	href: string;
}): string {
	return `[${label}](${href})`;
}

/**
 * Replace a link's raw source at a known start index with `nextRaw`.
 */
export function replaceLinkRaw({
	text,
	start,
	raw,
	nextRaw,
}: {
	text: string;
	start: number;
	raw: string;
	nextRaw: string;
}): string {
	if (text.slice(start, start + raw.length) !== raw) return text;
	return `${text.slice(0, start)}${nextRaw}${text.slice(start + raw.length)}`;
}

/**
 * Wrap the current selection as `[selected](url)` when a URL is provided.
 * Returns null when there is no selection or the URL is invalid.
 */
export function wrapSelectionAsMarkdownLink({
	text,
	selectionStart,
	selectionEnd,
	url,
}: {
	text: string;
	selectionStart: number;
	selectionEnd: number;
	url: string;
}): { text: string; cursor: number } | null {
	const trimmedUrl = url.trim();
	if (selectionStart === selectionEnd || !isHttpUrl(trimmedUrl)) {
		return null;
	}

	const selected = text.slice(selectionStart, selectionEnd);
	const markdown = formatMarkdownLink({ label: selected, href: trimmedUrl });
	const nextText = `${text.slice(0, selectionStart)}${markdown}${text.slice(selectionEnd)}`;

	return {
		text: nextText,
		cursor: selectionStart + markdown.length,
	};
}

const collectMarkdownMatches = (text: string): MatchRange[] => {
	const matches: MatchRange[] = [];
	for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) {
		const raw = match[0];
		const label = match[1] ?? "";
		const href = match[2] ?? "";
		const start = match.index ?? 0;
		matches.push({
			start,
			end: start + raw.length,
			segment: { type: "link", value: label, href, raw, start },
		});
	}
	return matches;
};

const collectBareUrlMatches = (
	text: string,
	occupied: MatchRange[],
): MatchRange[] => {
	const matches: MatchRange[] = [];
	for (const match of text.matchAll(URL_PATTERN)) {
		const url = match[0];
		const start = match.index ?? 0;
		const end = start + url.length;
		const overlaps = occupied.some(
			(range) => start < range.end && end > range.start,
		);
		if (overlaps) continue;
		matches.push({
			start,
			end,
			segment: { type: "link", value: url, href: url, raw: url, start },
		});
	}
	return matches;
};

/**
 * Split plain text into text and link segments for display linkification.
 * Supports markdown `[label](url)` links and bare `http(s)://` URLs.
 */
export function parseLinkifiedSegments(text: string): TextSegment[] {
	if (!text) return [];

	const markdownMatches = collectMarkdownMatches(text);
	const bareMatches = collectBareUrlMatches(text, markdownMatches);
	const matches = [...markdownMatches, ...bareMatches].sort(
		(a, b) => a.start - b.start,
	);

	if (matches.length === 0) {
		return [{ type: "text", value: text }];
	}

	const segments: TextSegment[] = [];
	let lastIndex = 0;

	for (const match of matches) {
		if (match.start > lastIndex) {
			segments.push({
				type: "text",
				value: text.slice(lastIndex, match.start),
			});
		}
		segments.push(match.segment);
		lastIndex = match.end;
	}

	if (lastIndex < text.length) {
		segments.push({ type: "text", value: text.slice(lastIndex) });
	}

	return segments;
}
