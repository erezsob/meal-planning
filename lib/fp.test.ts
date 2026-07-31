import { describe, expect, it } from "vitest";
import {
	compose,
	constant,
	err,
	flatMapOption,
	flatMapResult,
	fromNullable,
	getOrElse,
	getOrElseResult,
	identity,
	isNone,
	isSome,
	mapOption,
	mapResult,
	matchOption,
	matchResult,
	none,
	ok,
	pipe,
	pipeAsync,
	some,
	tryCatch,
	tryCatchAsync,
	tryCatchAsyncWithMessage,
	unwrapResult,
} from "./fp";

// ============================================================================
// Result Type Tests
// ============================================================================

describe("Result type", () => {
	describe("ok", () => {
		it("creates a successful result", () => {
			const result = ok(42);
			expect(result).toEqual({ ok: true, value: 42 });
		});

		it("works with different types", () => {
			expect(ok("hello")).toEqual({ ok: true, value: "hello" });
			expect(ok({ a: 1 })).toEqual({ ok: true, value: { a: 1 } });
			expect(ok(null)).toEqual({ ok: true, value: null });
		});
	});

	describe("err", () => {
		it("creates a failed result", () => {
			const error = new Error("failed");
			const result = err(error);
			expect(result).toEqual({ ok: false, error });
		});

		it("works with string errors", () => {
			const result = err("something went wrong");
			expect(result).toEqual({ ok: false, error: "something went wrong" });
		});
	});

	describe("mapResult", () => {
		it("transforms success value", () => {
			const result = mapResult(ok(5), (x) => x * 2);
			expect(result).toEqual({ ok: true, value: 10 });
		});

		it("passes through error unchanged", () => {
			const error = new Error("oops");
			const result = mapResult(err(error), (x: number) => x * 2);
			expect(result).toEqual({ ok: false, error });
		});
	});

	describe("flatMapResult", () => {
		it("chains successful operations", () => {
			const double = (x: number) => ok(x * 2);
			const result = flatMapResult(ok(5), double);
			expect(result).toEqual({ ok: true, value: 10 });
		});

		it("short-circuits on error", () => {
			const error = new Error("first failed");
			const result = flatMapResult(err(error), (x: number) => ok(x * 2));
			expect(result).toEqual({ ok: false, error });
		});

		it("propagates error from chained operation", () => {
			const fail = () => err("chained error");
			const result = flatMapResult(ok(5), fail);
			expect(result).toEqual({ ok: false, error: "chained error" });
		});
	});

	describe("matchResult", () => {
		it("calls ok handler for success", () => {
			const result = matchResult(ok(10), {
				ok: (v) => `success: ${v}`,
				err: (e) => `error: ${e}`,
			});
			expect(result).toBe("success: 10");
		});

		it("calls err handler for failure", () => {
			const result = matchResult(err("failed"), {
				ok: (v) => `success: ${v}`,
				err: (e) => `error: ${e}`,
			});
			expect(result).toBe("error: failed");
		});
	});

	describe("unwrapResult", () => {
		it("extracts value from success", () => {
			expect(unwrapResult(ok(42))).toBe(42);
		});

		it("throws error from failure", () => {
			const error = new Error("boom");
			expect(() => unwrapResult(err(error))).toThrow(error);
		});

		it("throws non-Error values", () => {
			expect(() => unwrapResult(err("string error"))).toThrow("string error");
		});
	});

	describe("getOrElseResult", () => {
		it("returns value from success", () => {
			expect(getOrElseResult(ok(42), 0)).toBe(42);
		});

		it("returns default from failure", () => {
			expect(getOrElseResult(err("failed"), 0)).toBe(0);
		});
	});

	describe("tryCatch", () => {
		it("returns ok for successful function", () => {
			const result = tryCatch(
				() => JSON.parse('{"a": 1}'),
				(e) => String(e),
			);
			expect(result).toEqual({ ok: true, value: { a: 1 } });
		});

		it("returns err for throwing function", () => {
			const result = tryCatch(
				() => JSON.parse("invalid json"),
				(e) => `Parse error: ${e}`,
			);
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain("Parse error:");
			}
		});
	});

	describe("tryCatchAsync", () => {
		it("returns ok for successful async function", async () => {
			const result = await tryCatchAsync(
				async () => Promise.resolve(42),
				(e) => String(e),
			);
			expect(result).toEqual({ ok: true, value: 42 });
		});

		it("returns err for rejecting async function", async () => {
			const result = await tryCatchAsync(
				async () => Promise.reject(new Error("async fail")),
				(e) => `Async error: ${e}`,
			);
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error).toContain("Async error:");
			}
		});
	});

	describe("tryCatchAsyncWithMessage", () => {
		it("returns ok for successful async function", async () => {
			const result = await tryCatchAsyncWithMessage(
				async () => Promise.resolve(42),
				"fallback",
			);
			expect(result).toEqual({ ok: true, value: 42 });
		});

		it("uses Error message when rejection is an Error", async () => {
			const result = await tryCatchAsyncWithMessage(
				async () => Promise.reject(new Error("mutation failed")),
				"fallback",
			);
			expect(result).toEqual({ ok: false, error: "mutation failed" });
		});

		it("uses fallback when rejection is not an Error", async () => {
			const result = await tryCatchAsyncWithMessage(
				async () => Promise.reject("network"),
				"fallback",
			);
			expect(result).toEqual({ ok: false, error: "fallback" });
		});
	});
});

// ============================================================================
// Option Type Tests
// ============================================================================

describe("Option type", () => {
	describe("some", () => {
		it("creates an option with value", () => {
			expect(some(42)).toEqual({ some: true, value: 42 });
		});

		it("works with falsy values", () => {
			expect(some(0)).toEqual({ some: true, value: 0 });
			expect(some("")).toEqual({ some: true, value: "" });
			expect(some(false)).toEqual({ some: true, value: false });
		});
	});

	describe("none", () => {
		it("represents absence of value", () => {
			expect(none).toEqual({ some: false });
		});
	});

	describe("fromNullable", () => {
		it("returns none for null", () => {
			expect(fromNullable(null)).toEqual(none);
		});

		it("returns none for undefined", () => {
			expect(fromNullable(undefined)).toEqual(none);
		});

		it("returns some for value", () => {
			expect(fromNullable(42)).toEqual(some(42));
		});

		it("returns some for empty string", () => {
			expect(fromNullable("")).toEqual(some(""));
		});

		it("returns some for zero", () => {
			expect(fromNullable(0)).toEqual(some(0));
		});
	});

	describe("mapOption", () => {
		it("transforms value when present", () => {
			expect(mapOption(some(5), (x) => x * 2)).toEqual(some(10));
		});

		it("returns none when absent", () => {
			expect(mapOption(none, (x: number) => x * 2)).toEqual(none);
		});
	});

	describe("flatMapOption", () => {
		it("chains when value present", () => {
			const safeDivide = (x: number) => (x === 0 ? none : some(10 / x));
			expect(flatMapOption(some(2), safeDivide)).toEqual(some(5));
		});

		it("returns none from chained operation", () => {
			const safeDivide = (x: number) => (x === 0 ? none : some(10 / x));
			expect(flatMapOption(some(0), safeDivide)).toEqual(none);
		});

		it("short-circuits on none", () => {
			expect(flatMapOption(none, () => some(42))).toEqual(none);
		});
	});

	describe("matchOption", () => {
		it("calls some handler when present", () => {
			const result = matchOption(some(10), {
				some: (v) => `got: ${v}`,
				none: () => "nothing",
			});
			expect(result).toBe("got: 10");
		});

		it("calls none handler when absent", () => {
			const result = matchOption(none, {
				some: (v) => `got: ${v}`,
				none: () => "nothing",
			});
			expect(result).toBe("nothing");
		});
	});

	describe("getOrElse", () => {
		it("returns value when present", () => {
			expect(getOrElse(some(42), 0)).toBe(42);
		});

		it("returns default when absent", () => {
			expect(getOrElse(none, 0)).toBe(0);
		});
	});

	describe("isSome", () => {
		it("returns true for some", () => {
			expect(isSome(some(42))).toBe(true);
		});

		it("returns false for none", () => {
			expect(isSome(none)).toBe(false);
		});
	});

	describe("isNone", () => {
		it("returns true for none", () => {
			expect(isNone(none)).toBe(true);
		});

		it("returns false for some", () => {
			expect(isNone(some(42))).toBe(false);
		});
	});
});

// ============================================================================
// Function Composition Tests
// ============================================================================

describe("Function composition", () => {
	describe("pipe", () => {
		it("returns value unchanged with no functions", () => {
			expect(pipe(42)).toBe(42);
		});

		it("applies single function", () => {
			expect(pipe(5, (x) => x * 2)).toBe(10);
		});

		it("chains multiple functions left-to-right", () => {
			const result = pipe(
				" hello world ",
				(s) => s.trim(),
				(s) => s.toUpperCase(),
				(s) => s.split(" "),
			);
			expect(result).toEqual(["HELLO", "WORLD"]);
		});
	});

	describe("pipeAsync", () => {
		it("handles async functions", async () => {
			const result = await pipeAsync(
				5,
				async (x) => x * 2,
				(x) => x + 1,
			);
			expect(result).toBe(11);
		});

		it("awaits each step", async () => {
			const result = await pipeAsync(
				1,
				async (x) => Promise.resolve(x + 1),
				async (x) => Promise.resolve(x * 2),
			);
			expect(result).toBe(4);
		});
	});

	describe("compose", () => {
		it("creates reusable composed function", () => {
			const processName = compose(
				(s: string) => s.trim(),
				(s) => s.toLowerCase(),
				(s) => s.replace(/\s+/g, "-"),
			);

			expect(processName(" Hello World ")).toBe("hello-world");
			expect(processName("  FOO  BAR  ")).toBe("foo-bar");
		});
	});

	describe("identity", () => {
		it("returns input unchanged", () => {
			expect(identity(42)).toBe(42);
			expect(identity("hello")).toBe("hello");
			const obj = { a: 1 };
			expect(identity(obj)).toBe(obj);
		});
	});

	describe("constant", () => {
		it("creates function returning fixed value", () => {
			const always42 = constant(42);
			expect(always42()).toBe(42);
			expect(always42()).toBe(42);
		});

		it("can be used in map", () => {
			const result = [1, 2, 3].map(constant("x"));
			expect(result).toEqual(["x", "x", "x"]);
		});
	});
});
