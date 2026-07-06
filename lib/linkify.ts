export interface TextSegment {
	type: "text" | "link";
	value: string;
}

const URL_PATTERN = /https?:\/\/[^\s]+/g;

/**
 * Split plain text into text and URL segments for display linkification.
 */
export function parseLinkifiedSegments(text: string): TextSegment[] {
	if (!text) return [];

	const segments: TextSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(URL_PATTERN)) {
		const url = match[0];
		const index = match.index ?? 0;

		if (index > lastIndex) {
			segments.push({ type: "text", value: text.slice(lastIndex, index) });
		}

		segments.push({ type: "link", value: url });
		lastIndex = index + url.length;
	}

	if (lastIndex < text.length) {
		segments.push({ type: "text", value: text.slice(lastIndex) });
	}

	return segments.length > 0 ? segments : [{ type: "text", value: text }];
}
