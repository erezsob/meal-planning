import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus, Trash2, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import {
	DISH_TAGS,
	type DishTag,
	HOUSEHOLD_ID,
	INGREDIENT_CATEGORIES,
	INGREDIENT_UNITS,
	type IngredientCategory,
} from "../../../lib/constants";
import type { DishFormValues, IngredientRow } from "./types";

function newIngredient(overrides: Partial<IngredientRow> = {}): IngredientRow {
	return {
		id: crypto.randomUUID(),
		name: "",
		quantity: 1,
		unit: "g",
		category: "Other",
		...overrides,
	};
}

function dishToFormValues(dish: Doc<"dishes"> | null): DishFormValues {
	if (!dish) {
		return {
			name: "",
			description: "",
			sourceUrl: "",
			defaultServings: 1,
			tags: [],
			ingredients: [newIngredient()],
		};
	}
	return {
		name: dish.name,
		description: dish.description ?? "",
		sourceUrl: dish.sourceUrl ?? "",
		defaultServings: dish.defaultServings ?? 1,
		tags: dish.tags ?? [],
		ingredients:
			dish.ingredients.length > 0
				? dish.ingredients.map((i) =>
						newIngredient({
							name: i.name,
							quantity: i.quantity,
							unit: i.unit ?? "g",
							category: i.category ?? "Other",
						}),
					)
				: [newIngredient()],
	};
}

interface DishFormModalProps {
	/** Dish to edit, or null for add */
	dish: Doc<"dishes"> | null;
	/** Called when modal should close */
	onClose: () => void;
	/** Called after successful create/update (optional) */
	onSuccess?: () => void;
}

/**
 * Modal for adding or editing a dish (name, description, ingredients, tags, servings)
 */
export function DishFormModal({
	dish,
	onClose,
	onSuccess,
}: DishFormModalProps) {
	const isEdit = dish !== null;
	const [values, setValues] = useState<DishFormValues>(() =>
		dishToFormValues(dish),
	);
	const createDish = useMutation(api.dishes.create);
	const updateDish = useMutation(api.dishes.update);
	const removeDish = useMutation(api.dishes.remove);
	const nameInputRef = useRef<HTMLInputElement>(null);
	const titleId = useId();
	const nameId = useId();
	const descId = useId();
	const urlId = useId();
	const servingsId = useId();

	const update = useCallback(
		<K extends keyof DishFormValues>(key: K, value: DishFormValues[K]) => {
			setValues((prev) => ({ ...prev, [key]: value }));
		},
		[],
	);

	const setIngredient = useCallback(
		(index: number, row: Partial<IngredientRow>) => {
			setValues((prev) => ({
				...prev,
				ingredients: prev.ingredients.map((r, i) =>
					i === index ? { ...r, ...row } : r,
				),
			}));
		},
		[],
	);

	const addIngredient = useCallback(() => {
		setValues((prev) => ({
			...prev,
			ingredients: [...prev.ingredients, newIngredient()],
		}));
	}, []);

	const removeIngredient = useCallback((index: number) => {
		setValues((prev) => ({
			...prev,
			ingredients: prev.ingredients.filter((_, i) => i !== index),
		}));
	}, []);

	const toggleTag = useCallback((tag: DishTag) => {
		setValues((prev) => ({
			...prev,
			tags: prev.tags.includes(tag)
				? prev.tags.filter((t) => t !== tag)
				: [...prev.tags, tag],
		}));
	}, []);

	const validIngredients = values.ingredients.filter(
		(i) => i.name.trim() !== "",
	);
	const canSubmit =
		values.name.trim() !== "" &&
		validIngredients.length > 0 &&
		values.defaultServings >= 1;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;
		const payload = {
			name: values.name.trim(),
			description: values.description.trim(),
			sourceUrl: values.sourceUrl.trim() || undefined,
			defaultServings: values.defaultServings,
			tags: values.tags,
			ingredients: validIngredients.map(
				({ name, quantity, unit, category }) => ({
					name: name.trim(),
					quantity,
					unit,
					category,
				}),
			),
		};
		if (isEdit && dish) {
			updateDish({ id: dish._id, ...payload });
		} else {
			createDish({ householdId: HOUSEHOLD_ID, ...payload });
		}
		onSuccess?.();
		onClose();
	};

	const handleDelete = () => {
		if (!isEdit || !dish) return;
		if (window?.confirm?.("Delete this dish?")) {
			removeDish({ id: dish._id });
			onSuccess?.();
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				aria-hidden="true"
			/>
			<div
				className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-gray-900 rounded-xl border border-gray-700 shadow-2xl"
				role="dialog"
				aria-labelledby={titleId}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
					<h2 id={titleId} className="text-lg font-semibold text-gray-100">
						{isEdit ? "Edit dish" : "Add dish"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto p-4 space-y-4"
				>
					<div>
						<label
							htmlFor={nameId}
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Name *
						</label>
						<input
							ref={nameInputRef}
							id={nameId}
							type="text"
							value={values.name}
							onChange={(e) => update("name", e.target.value)}
							placeholder="e.g. Chicken stir-fry"
							className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
							required
						/>
					</div>

					<div>
						<label
							htmlFor={descId}
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Description
						</label>
						<textarea
							id={descId}
							value={values.description}
							onChange={(e) => update("description", e.target.value)}
							placeholder="Short description (optional)"
							rows={2}
							className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
						/>
					</div>

					<div>
						<label
							htmlFor={urlId}
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Recipe URL
						</label>
						<input
							id={urlId}
							type="url"
							value={values.sourceUrl}
							onChange={(e) => update("sourceUrl", e.target.value)}
							placeholder="https://..."
							className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
						/>
					</div>

					<div>
						<label
							htmlFor={servingsId}
							className="block text-sm font-medium text-gray-300 mb-1"
						>
							Default servings *
						</label>
						<input
							id={servingsId}
							type="number"
							min={1}
							value={values.defaultServings}
							onChange={(e) =>
								update(
									"defaultServings",
									Math.max(1, Number(e.target.value) || 1),
								)
							}
							className="w-24 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500"
						/>
					</div>

					<div>
						<span className="block text-sm font-medium text-gray-300 mb-2">
							Tags
						</span>
						<div className="flex flex-wrap gap-2">
							{(DISH_TAGS as readonly string[]).map((tag) => (
								<button
									key={tag}
									type="button"
									onClick={() => toggleTag(tag as DishTag)}
									className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
										values.tags.includes(tag)
											? "bg-emerald-600/30 text-emerald-400 border-emerald-500"
											: "bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-500"
									}`}
								>
									{tag
										.replace(/-/g, " ")
										.replace(/\b\w/g, (c) => c.toUpperCase())}
								</button>
							))}
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-gray-300">
								Ingredients *
							</span>
							<button
								type="button"
								onClick={addIngredient}
								className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
							>
								<Plus size={14} />
								Add row
							</button>
						</div>
						<div className="space-y-2">
							{values.ingredients.map((row, index) => (
								<div
									key={row.id}
									className="grid grid-cols-[1fr_80px_100px_100px_auto] gap-2 items-center"
								>
									<input
										type="text"
										value={row.name}
										onChange={(e) =>
											setIngredient(index, { name: e.target.value })
										}
										placeholder="Ingredient"
										className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-sm"
									/>
									<input
										type="number"
										min={0}
										step="any"
										value={row.quantity}
										onChange={(e) =>
											setIngredient(index, {
												quantity: Number(e.target.value) || 0,
											})
										}
										className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500 text-sm"
									/>
									<select
										value={row.unit}
										onChange={(e) =>
											setIngredient(index, { unit: e.target.value })
										}
										className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500 text-sm"
									>
										{(INGREDIENT_UNITS as readonly string[]).map((u) => (
											<option key={u} value={u}>
												{u}
											</option>
										))}
									</select>
									<select
										value={row.category}
										onChange={(e) =>
											setIngredient(index, {
												category: e.target.value as IngredientCategory,
											})
										}
										className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-emerald-500 text-sm"
									>
										{(INGREDIENT_CATEGORIES as readonly string[]).map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
									<button
										type="button"
										onClick={() => removeIngredient(index)}
										disabled={values.ingredients.length <= 1}
										className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
										aria-label="Remove ingredient"
									>
										<Trash2 size={16} />
									</button>
								</div>
							))}
						</div>
					</div>

					<div className="flex items-center justify-between pt-4 border-t border-gray-700">
						<div>
							{isEdit && (
								<button
									type="button"
									onClick={handleDelete}
									className="text-sm text-red-400 hover:text-red-300"
								>
									Delete dish
								</button>
							)}
						</div>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={!canSubmit}
								className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
							>
								{isEdit ? "Save" : "Add dish"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
