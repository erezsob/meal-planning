import { useCallback, useEffect, useRef, useState } from "react";
import { PLAN_SECTION_SAVE_ERROR } from "@/lib/constants";
import { tryCatchAsyncWithMessage } from "@/lib/fp";

function applyStateUpdater<TContent extends object>(
	base: TContent,
	updater: TContent | ((prev: TContent) => TContent),
): TContent {
	if (typeof updater === "function") {
		return updater(base);
	}
	return updater;
}

type DebouncedSectionSaveConfig<TContent> = {
	debounceMs: number;
	onSave: (content: TContent) => Promise<void>;
	onSaveSuccess?: () => void;
	onSaveError: (message: string) => void;
};

type DebouncedKeyedSectionSaveConfig<TContent, TKey extends string> = {
	debounceMs: number;
	onSave: (args: { key: TKey; content: TContent }) => Promise<void>;
	onSaveSuccess?: () => void;
	onSaveError: (message: string) => void;
};

/**
 * Debounced pending overlay + save for a single plan section row.
 *
 * @param config.debounceMs - Delay before persisting edits
 * @param config.onSave - Async save invoked after debounce or flush
 * @param config.onSaveSuccess - Called after a successful save
 * @param config.onSaveError - Called when save fails
 * @returns Pending content, update/flush/reset helpers
 */
export function useDebouncedSectionSave<TContent extends object>({
	debounceMs,
	onSave,
	onSaveSuccess,
	onSaveError,
}: DebouncedSectionSaveConfig<TContent>) {
	const [pending, setPending] = useState<TContent | null>(null);
	const generationRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const commit = useCallback(
		async (next: TContent, generationAtSaveStart: number) => {
			const result = await tryCatchAsyncWithMessage(
				() => onSave(next),
				PLAN_SECTION_SAVE_ERROR,
			);
			if (result.ok) {
				onSaveSuccess?.();
				if (generationRef.current === generationAtSaveStart) {
					setPending(null);
				}
			} else {
				onSaveError(result.error);
			}
		},
		[onSave, onSaveSuccess, onSaveError],
	);

	const schedulePersist = useCallback(
		(next: TContent) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
			timerRef.current = setTimeout(() => {
				void commit(next, generationRef.current);
			}, debounceMs);
		},
		[commit, debounceMs],
	);

	const update = useCallback(
		(
			getBase: () => TContent,
			updater: TContent | ((prev: TContent) => TContent),
		) => {
			generationRef.current += 1;
			setPending((prevPending) => {
				const base = prevPending ?? getBase();
				const next = applyStateUpdater(base, updater);
				schedulePersist(next);
				return next;
			});
		},
		[schedulePersist],
	);

	const flush = useCallback(
		async (next: TContent) => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			generationRef.current += 1;
			const generationAtSaveStart = generationRef.current;
			setPending(next);
			await commit(next, generationAtSaveStart);
		},
		[commit],
	);

	const reset = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		generationRef.current += 1;
		setPending(null);
	}, []);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return { pending, update, flush, reset };
}

/**
 * Debounced pending overlay + save keyed by section id (stacked main grids).
 *
 * @param config.debounceMs - Delay before persisting edits
 * @param config.onSave - Async save invoked with section key and content
 * @param config.onSaveSuccess - Called after a successful save
 * @param config.onSaveError - Called when save fails
 * @returns Pending map, per-key update/flush helpers, flushAll, and reset
 */
export function useDebouncedKeyedSectionSave<
	TContent extends object,
	TKey extends string = string,
>({
	debounceMs,
	onSave,
	onSaveSuccess,
	onSaveError,
}: DebouncedKeyedSectionSaveConfig<TContent, TKey>) {
	const [pendingByKey, setPendingByKey] = useState<Map<TKey, TContent>>(
		() => new Map(),
	);
	const pendingByKeyRef = useRef(pendingByKey);
	const generationByKeyRef = useRef<Map<TKey, number>>(new Map());
	const timersByKeyRef = useRef<Map<TKey, ReturnType<typeof setTimeout>>>(
		new Map(),
	);

	pendingByKeyRef.current = pendingByKey;

	const commit = useCallback(
		async ({
			key,
			next,
			generationAtSaveStart,
		}: {
			key: TKey;
			next: TContent;
			generationAtSaveStart: number;
		}) => {
			const result = await tryCatchAsyncWithMessage(
				() => onSave({ key, content: next }),
				PLAN_SECTION_SAVE_ERROR,
			);
			if (result.ok) {
				onSaveSuccess?.();
				if (generationByKeyRef.current.get(key) === generationAtSaveStart) {
					setPendingByKey((prev) => {
						if (!prev.has(key)) {
							return prev;
						}
						const nextPending = new Map(prev);
						nextPending.delete(key);
						return nextPending;
					});
				}
			} else {
				onSaveError(result.error);
			}
		},
		[onSave, onSaveSuccess, onSaveError],
	);

	const schedulePersist = useCallback(
		(key: TKey, next: TContent) => {
			const existingTimer = timersByKeyRef.current.get(key);
			if (existingTimer) {
				clearTimeout(existingTimer);
			}

			const timer = setTimeout(() => {
				const generation = generationByKeyRef.current.get(key) ?? 0;
				void commit({ key, next, generationAtSaveStart: generation });
			}, debounceMs);

			timersByKeyRef.current.set(key, timer);
		},
		[commit, debounceMs],
	);

	const updateForKey = useCallback(
		({
			key,
			getBase,
			updater,
		}: {
			key: TKey;
			getBase: () => TContent;
			updater: TContent | ((prev: TContent) => TContent);
		}) => {
			const nextGeneration = (generationByKeyRef.current.get(key) ?? 0) + 1;
			generationByKeyRef.current.set(key, nextGeneration);
			setPendingByKey((prevPending) => {
				const base = prevPending.get(key) ?? getBase();
				const next = applyStateUpdater(base, updater);
				schedulePersist(key, next);
				return new Map(prevPending).set(key, next);
			});
		},
		[schedulePersist],
	);

	const flushForKey = useCallback(
		async (key: TKey, next: TContent) => {
			const existingTimer = timersByKeyRef.current.get(key);
			if (existingTimer) {
				clearTimeout(existingTimer);
				timersByKeyRef.current.delete(key);
			}

			const nextGeneration = (generationByKeyRef.current.get(key) ?? 0) + 1;
			generationByKeyRef.current.set(key, nextGeneration);
			setPendingByKey((prev) => new Map(prev).set(key, next));
			await commit({ key, next, generationAtSaveStart: nextGeneration });
		},
		[commit],
	);

	const flushAll = useCallback(async () => {
		for (const timer of timersByKeyRef.current.values()) {
			clearTimeout(timer);
		}
		timersByKeyRef.current.clear();

		await Promise.all(
			[...pendingByKeyRef.current.entries()].map(async ([key, content]) => {
				const nextGeneration = (generationByKeyRef.current.get(key) ?? 0) + 1;
				generationByKeyRef.current.set(key, nextGeneration);
				await commit({
					key,
					next: content,
					generationAtSaveStart: nextGeneration,
				});
			}),
		);
	}, [commit]);

	const reset = useCallback(() => {
		for (const timer of timersByKeyRef.current.values()) {
			clearTimeout(timer);
		}
		timersByKeyRef.current.clear();
		generationByKeyRef.current.clear();
		setPendingByKey(new Map());
	}, []);

	const resetForKey = useCallback((key: TKey) => {
		const timer = timersByKeyRef.current.get(key);
		if (timer) {
			clearTimeout(timer);
			timersByKeyRef.current.delete(key);
		}
		generationByKeyRef.current.delete(key);
		setPendingByKey((prev) => {
			if (!prev.has(key)) {
				return prev;
			}
			const next = new Map(prev);
			next.delete(key);
			return next;
		});
	}, []);

	useEffect(() => {
		return () => {
			for (const timer of timersByKeyRef.current.values()) {
				clearTimeout(timer);
			}
		};
	}, []);

	return {
		pendingByKey,
		updateForKey,
		flushForKey,
		flushAll,
		reset,
		resetForKey,
	};
}
