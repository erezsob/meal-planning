import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import {
	DISH_TAGS,
	type DishTag,
	HOUSEHOLD_ID,
	INGREDIENT_CATEGORIES,
	INGREDIENT_UNITS,
	type IngredientCategory,
} from "../../../lib/constants";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
				<DialogHeader className="p-4 pb-0">
					<DialogTitle>{isEdit ? "Edit dish" : "Add dish"}</DialogTitle>
				</DialogHeader>

				<form
					onSubmit={handleSubmit}
					className="flex-1 overflow-y-auto p-4 space-y-4"
				>
					<div>
						<Label htmlFor={nameId} className="mb-1">
							Name *
						</Label>
						<Input
							ref={nameInputRef}
							id={nameId}
							type="text"
							value={values.name}
							onChange={(e) => update("name", e.target.value)}
							placeholder="e.g. Chicken stir-fry"
							required
						/>
					</div>

					<div>
						<Label htmlFor={descId} className="mb-1">
							Description
						</Label>
						<Textarea
							id={descId}
							value={values.description}
							onChange={(e) => update("description", e.target.value)}
							placeholder="Short description (optional)"
							rows={2}
							className="resize-none"
						/>
					</div>

					<div>
						<Label htmlFor={urlId} className="mb-1">
							Recipe URL
						</Label>
						<Input
							id={urlId}
							type="url"
							value={values.sourceUrl}
							onChange={(e) => update("sourceUrl", e.target.value)}
							placeholder="https://..."
						/>
					</div>

					<div>
						<Label htmlFor={servingsId} className="mb-1">
							Default servings *
						</Label>
						<Input
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
							className="w-24"
						/>
					</div>

					<div>
						<span className="block text-sm font-medium text-muted-foreground mb-2">
							Tags
						</span>
						<div className="flex flex-wrap gap-2">
							{(DISH_TAGS as readonly string[]).map((tag) => (
								<Button
									key={tag}
									type="button"
									variant={values.tags.includes(tag) ? "default" : "outline"}
									size="sm"
									onClick={() => toggleTag(tag as DishTag)}
									className={
										values.tags.includes(tag)
											? "bg-primary/30 text-primary border-primary"
											: ""
									}
								>
									{tag
										.replace(/-/g, " ")
										.replace(/\b\w/g, (c) => c.toUpperCase())}
								</Button>
							))}
						</div>
					</div>

					<div>
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-muted-foreground">
								Ingredients *
							</span>
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={addIngredient}
								className="text-primary"
							>
								<Plus size={14} />
								Add row
							</Button>
						</div>
						<div className="space-y-2">
							{values.ingredients.map((row, index) => (
								<div
									key={row.id}
									className="grid grid-cols-[1fr_80px_100px_100px_auto] gap-2 items-center"
								>
									<Input
										type="text"
										value={row.name}
										onChange={(e) =>
											setIngredient(index, { name: e.target.value })
										}
										placeholder="Ingredient"
										className="text-sm"
									/>
									<Input
										type="number"
										min={0}
										step="any"
										value={row.quantity}
										onChange={(e) =>
											setIngredient(index, {
												quantity: Number(e.target.value) || 0,
											})
										}
										className="text-sm"
									/>
									<select
										value={row.unit}
										onChange={(e) =>
											setIngredient(index, { unit: e.target.value })
										}
										className="h-9 px-3 py-2 bg-input/30 border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
										className="h-9 px-3 py-2 bg-input/30 border border-input rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
									>
										{(INGREDIENT_CATEGORIES as readonly string[]).map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										onClick={() => removeIngredient(index)}
										disabled={values.ingredients.length <= 1}
										className="text-muted-foreground hover:text-destructive"
										aria-label="Remove ingredient"
									>
										<Trash2 size={16} />
									</Button>
								</div>
							))}
						</div>
					</div>

					<DialogFooter className="flex-row justify-between pt-4 border-t">
						<div>
							{isEdit && (
								<Button
									type="button"
									variant="link"
									onClick={handleDelete}
									className="text-destructive hover:text-destructive/80 px-0"
								>
									Delete dish
								</Button>
							)}
						</div>
						<div className="flex gap-2">
							<Button type="button" variant="ghost" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={!canSubmit}>
								{isEdit ? "Save" : "Add dish"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
