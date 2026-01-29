import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

export interface ShoppingItem {
	name: string;
	quantity: number;
	unit: string;
	category: string;
}

export interface GroupedShoppingList {
	[category: string]: ShoppingItem[];
}

/**
 * Get aggregated shopping list for a week
 * Groups ingredients by category, no unit conversion
 */
export const getWeekShoppingList = query({
	args: { householdId: v.string(), startDate: v.string() },
	handler: async (ctx, args) => {
		const start = new Date(args.startDate);
		const dates: string[] = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() + i);
			dates.push(d.toISOString().split("T")[0]);
		}

		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		const weekMeals = meals.filter(
			(m) => dates.includes(m.day) && m.status !== "skipped" && m.dishId,
		);

		const dishIds = [
			...new Set(weekMeals.map((m) => m.dishId)),
		] as Id<"dishes">[];

		const dishes = await Promise.all(dishIds.map((id) => ctx.db.get(id)));
		const dishMap = new Map(
			dishes
				.filter((d): d is NonNullable<typeof d> => d !== null)
				.map((d) => [d._id, d]),
		);

		const ingredientMap = new Map<string, ShoppingItem>();

		for (const meal of weekMeals) {
			if (!meal.dishId) continue;
			const dish = dishMap.get(meal.dishId);
			if (!dish) continue;

			const defaultServings = dish.defaultServings ?? 1;
			const servingRatio = meal.servingsUsed / defaultServings;

			for (const ing of dish.ingredients) {
				const key = `${ing.name}|${ing.unit ?? ""}|${ing.category ?? ""}`;
				const existing = ingredientMap.get(key);

				if (existing) {
					existing.quantity += ing.quantity * servingRatio;
				} else {
					ingredientMap.set(key, {
						name: ing.name,
						quantity: ing.quantity * servingRatio,
						unit: ing.unit ?? "",
						category: ing.category ?? "",
					});
				}
			}
		}

		const grouped: GroupedShoppingList = {};

		for (const item of ingredientMap.values()) {
			if (!grouped[item.category]) {
				grouped[item.category] = [];
			}
			grouped[item.category].push({
				...item,
				quantity: Math.round(item.quantity * 100) / 100,
			});
		}

		for (const category of Object.keys(grouped)) {
			grouped[category].sort((a, b) => a.name.localeCompare(b.name));
		}

		return grouped;
	},
});
