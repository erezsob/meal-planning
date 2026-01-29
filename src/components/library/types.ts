import type { Doc, Id } from "convex/_generated/dataModel";

/** Ingredient row for dish form (id used for React key) */
export interface IngredientRow {
	id: string;
	name: string;
	quantity: number;
	unit: string;
	category: string;
}

/** Dish form values for add/edit */
export interface DishFormValues {
	name: string;
	description: string;
	sourceUrl: string;
	defaultServings: number;
	tags: string[];
	ingredients: IngredientRow[];
}

/** Dish being edited (for modal) */
export type EditingDish = Doc<"dishes"> | null;

/** Id for dishes table */
export type DishId = Id<"dishes">;
