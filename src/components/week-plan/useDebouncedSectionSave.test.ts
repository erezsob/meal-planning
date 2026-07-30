import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAN_SECTION_SAVE_ERROR } from "@/lib/constants";
import {
	useDebouncedKeyedSectionSave,
	useDebouncedSectionSave,
} from "./useDebouncedSectionSave";

type TestContent = { value: string };

const baseContent = (): TestContent => ({ value: "remote" });

describe("useDebouncedSectionSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("debounces save until the delay elapses", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const onSaveError = vi.fn();

		const { result } = renderHook(() =>
			useDebouncedSectionSave<TestContent>({
				debounceMs: 300,
				onSave,
				onSaveError,
			}),
		);

		act(() => {
			result.current.update(baseContent, { value: "edited" });
		});

		expect(result.current.pending).toEqual({ value: "edited" });
		expect(onSave).not.toHaveBeenCalled();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(onSave).toHaveBeenCalledWith({ value: "edited" });
		expect(result.current.pending).toBeNull();
	});

	it("flush saves immediately", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const onSaveError = vi.fn();

		const { result } = renderHook(() =>
			useDebouncedSectionSave<TestContent>({
				debounceMs: 300,
				onSave,
				onSaveError,
			}),
		);

		await act(async () => {
			await result.current.flush({ value: "flushed" });
		});

		expect(onSave).toHaveBeenCalledWith({ value: "flushed" });
	});

	it("reports the default error message when save fails without Error", async () => {
		const onSave = vi.fn().mockRejectedValue("network");
		const onSaveError = vi.fn();

		const { result } = renderHook(() =>
			useDebouncedSectionSave<TestContent>({
				debounceMs: 300,
				onSave,
				onSaveError,
			}),
		);

		await act(async () => {
			await result.current.flush({ value: "fail" });
		});

		expect(onSaveError).toHaveBeenCalledWith(PLAN_SECTION_SAVE_ERROR);
	});
});

describe("useDebouncedKeyedSectionSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("debounces per-key saves independently", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const onSaveError = vi.fn();

		const { result } = renderHook(() =>
			useDebouncedKeyedSectionSave<TestContent, "a" | "b">({
				debounceMs: 300,
				onSave,
				onSaveError,
			}),
		);

		act(() => {
			result.current.updateForKey({
				key: "a",
				getBase: baseContent,
				updater: { value: "a-edited" },
			});
			result.current.updateForKey({
				key: "b",
				getBase: baseContent,
				updater: { value: "b-edited" },
			});
		});

		expect(result.current.pendingByKey.get("a")).toEqual({ value: "a-edited" });
		expect(result.current.pendingByKey.get("b")).toEqual({ value: "b-edited" });

		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});

		expect(onSave).toHaveBeenCalledWith({
			key: "a",
			content: { value: "a-edited" },
		});
		expect(onSave).toHaveBeenCalledWith({
			key: "b",
			content: { value: "b-edited" },
		});
	});

	it("flushAll persists every pending key", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const onSaveError = vi.fn();

		const { result } = renderHook(() =>
			useDebouncedKeyedSectionSave<TestContent, "a">({
				debounceMs: 300,
				onSave,
				onSaveError,
			}),
		);

		act(() => {
			result.current.updateForKey({
				key: "a",
				getBase: baseContent,
				updater: { value: "pending" },
			});
		});

		await act(async () => {
			await result.current.flushAll();
		});

		expect(onSave).toHaveBeenCalledWith({
			key: "a",
			content: { value: "pending" },
		});
	});
});
