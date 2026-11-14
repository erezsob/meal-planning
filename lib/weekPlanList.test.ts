import { describe, expect, it } from "vite-plus/test";
import { applyWeekPlanListKey } from "./weekPlanList";

const enter = (text: string, cursor = text.length) =>
	applyWeekPlanListKey({
		text,
		selectionStart: cursor,
		selectionEnd: cursor,
		key: "Enter",
	});

describe("applyWeekPlanListKey", () => {
	it("continues a hyphen, asterisk, or number and exits on the empty marker", () => {
		expect(enter("- apples")).toEqual({
			text: "- apples\n- ",
			cursor: "- apples\n- ".length,
			replaceStart: "- apples".length,
			replaceEnd: "- apples".length,
			insert: "\n- ",
		});
		expect(enter("- apples\n- ")).toEqual({
			text: "- apples\n",
			cursor: "- apples\n".length,
			replaceStart: "- apples\n".length,
			replaceEnd: "- apples\n- ".length,
			insert: "",
		});
		expect(enter("* apples")).toMatchObject({
			text: "* apples\n* ",
			insert: "\n* ",
		});
		expect(enter("1. apples")).toMatchObject({
			text: "1. apples\n2. ",
			insert: "\n2. ",
		});
		expect(enter("9. apples")).toMatchObject({
			text: "9. apples\n10. ",
			insert: "\n10. ",
		});
	});

	it("splits a list item at the caret", () => {
		expect(enter("- helloworld", "- hello".length)).toEqual({
			text: "- hello\n- world",
			cursor: "- hello\n- ".length,
			replaceStart: "- hello".length,
			replaceEnd: "- hello".length,
			insert: "\n- ",
		});
		expect(enter("1. helloworld", "1. hello".length)).toMatchObject({
			text: "1. hello\n2. world",
			insert: "\n2. ",
		});
	});

	it("removes an empty marker on Backspace", () => {
		const text = "- apples\n- ";
		expect(
			applyWeekPlanListKey({
				text,
				selectionStart: text.length,
				selectionEnd: text.length,
				key: "Backspace",
			}),
		).toEqual({
			text: "- apples\n",
			cursor: "- apples\n".length,
			replaceStart: "- apples\n".length,
			replaceEnd: text.length,
			insert: "",
		});
	});

	it("leaves non-list editing alone", () => {
		expect(enter("Pasta")).toBeNull();
		expect(enter("-item")).toBeNull();
		expect(enter("1.item")).toBeNull();
		expect(enter("- apples", 0)).toBeNull();
		expect(
			applyWeekPlanListKey({
				text: "- apples",
				selectionStart: 0,
				selectionEnd: 2,
				key: "Enter",
			}),
		).toBeNull();
		expect(
			applyWeekPlanListKey({
				text: "- apples",
				selectionStart: "- apples".length,
				selectionEnd: "- apples".length,
				key: "Backspace",
			}),
		).toBeNull();
	});
});
