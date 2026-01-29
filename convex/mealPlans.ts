import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const mealTypeValidator = v.union(
	v.literal("breakfast"),
	v.literal("lunch"),
	v.literal("dinner"),
);

/**
 * Get all meal plans for a week (7 days starting from startDate)
 */
export const getWeek = query({
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

		const weekMeals = meals.filter((m) => dates.includes(m.day));

		const dishIds = [
			...new Set(weekMeals.filter((m) => m.dishId).map((m) => m.dishId)),
		] as Id<"dishes">[];

		const dishes = await Promise.all(dishIds.map((id) => ctx.db.get(id)));
		const dishMap = new Map(
			dishes
				.filter((d): d is NonNullable<typeof d> => d !== null)
				.map((d) => [d._id, d]),
		);

		return weekMeals.map((meal) => ({
			...meal,
			dish: meal.dishId ? dishMap.get(meal.dishId) : null,
		}));
	},
});

/**
 * Get a single meal plan by ID
 */
export const getOne = query({
	args: { id: v.id("mealPlans") },
	handler: async (ctx, args) => {
		const meal = await ctx.db.get(args.id);
		if (!meal) return null;

		const dish = meal.dishId ? await ctx.db.get(meal.dishId) : null;
		return { ...meal, dish };
	},
});

/**
 * Calculate available leftover servings for a dish from a specific cook event
 */
export const getAvailableLeftovers = query({
	args: { sourceMealId: v.id("mealPlans") },
	handler: async (ctx, args) => {
		const sourceMeal = await ctx.db.get(args.sourceMealId);
		if (!sourceMeal || !sourceMeal.dishId) return 0;

		const dish = await ctx.db.get(sourceMeal.dishId);
		if (!dish) return 0;

		const allMeals = await ctx.db
			.query("mealPlans")
			.withIndex("by_dishId", (q) => q.eq("dishId", sourceMeal.dishId))
			.collect();

		const relatedMeals = allMeals.filter(
			(m) =>
				m._id === args.sourceMealId || m.sourceMealId === args.sourceMealId,
		);

		const totalUsed = relatedMeals
			.filter((m) => m.status === "eaten")
			.reduce((sum, m) => sum + m.servingsUsed, 0);

		return Math.max(0, (dish.defaultServings ?? 1) - totalUsed);
	},
});

/**
 * Get all available leftover sources for a household
 */
export const getLeftoverSources = query({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		const sourceMeals = meals.filter(
			(m) => m.status === "eaten" && !m.isLeftover && m.dishId,
		);

		const results: Array<{
			meal: Doc<"mealPlans">;
			dish: Doc<"dishes">;
			available: number;
		}> = [];

		for (const meal of sourceMeals) {
			if (!meal.dishId) continue;
			const dish = await ctx.db.get(meal.dishId);
			if (!dish) continue;

			const relatedMeals = meals.filter(
				(m) => m._id === meal._id || m.sourceMealId === meal._id,
			);

			const totalUsed = relatedMeals
				.filter((m) => m.status === "eaten")
				.reduce((sum, m) => sum + m.servingsUsed, 0);

			const available = (dish.defaultServings ?? 1) - totalUsed;
			if (available > 0) {
				results.push({ meal, dish, available });
			}
		}

		return results;
	},
});

/**
 * Plan a new meal (status: planned)
 */
export const planMeal = mutation({
	args: {
		day: v.string(),
		mealType: mealTypeValidator,
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
		servingsUsed: v.number(),
		isLeftover: v.boolean(),
		sourceMealId: v.optional(v.id("mealPlans")),
		householdId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("mealPlans", {
			day: args.day,
			mealType: args.mealType,
			dishId: args.dishId,
			customName: args.customName,
			servingsUsed: args.servingsUsed,
			status: "planned",
			isLeftover: args.isLeftover,
			sourceMealId: args.sourceMealId,
			householdId: args.householdId,
		});
	},
});

/**
 * Mark a meal as eaten
 */
export const eatMeal = mutation({
	args: { id: v.id("mealPlans") },
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, { status: "eaten" });
	},
});

/**
 * Mark a meal as skipped
 */
export const skipMeal = mutation({
	args: { id: v.id("mealPlans") },
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, { status: "skipped" });
	},
});

/**
 * Update meal plan details
 */
export const update = mutation({
	args: {
		id: v.id("mealPlans"),
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
		servingsUsed: v.number(),
		isLeftover: v.boolean(),
		sourceMealId: v.optional(v.id("mealPlans")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, {
			dishId: args.dishId,
			customName: args.customName,
			servingsUsed: args.servingsUsed,
			isLeftover: args.isLeftover,
			sourceMealId: args.sourceMealId,
		});
	},
});

/**
 * Void remaining leftovers from a cook event (food went bad)
 * Creates a "void" entry that consumes remaining servings
 */
export const voidLeftovers = mutation({
	args: { sourceMealId: v.id("mealPlans") },
	handler: async (ctx, args) => {
		const sourceMeal = await ctx.db.get(args.sourceMealId);
		if (!sourceMeal || !sourceMeal.dishId) return null;

		const dish = await ctx.db.get(sourceMeal.dishId);
		if (!dish) return null;

		const allMeals = await ctx.db
			.query("mealPlans")
			.withIndex("by_dishId", (q) => q.eq("dishId", sourceMeal.dishId))
			.collect();

		const relatedMeals = allMeals.filter(
			(m) =>
				m._id === args.sourceMealId || m.sourceMealId === args.sourceMealId,
		);

		const totalUsed = relatedMeals
			.filter((m) => m.status === "eaten")
			.reduce((sum, m) => sum + m.servingsUsed, 0);

		const remaining = (dish.defaultServings ?? 1) - totalUsed;

		if (remaining <= 0) return null;

		return await ctx.db.insert("mealPlans", {
			day: new Date().toISOString().split("T")[0],
			mealType: "dinner",
			dishId: sourceMeal.dishId,
			customName: `${dish.name} (voided)`,
			servingsUsed: remaining,
			status: "eaten",
			isLeftover: true,
			sourceMealId: args.sourceMealId,
			householdId: sourceMeal.householdId,
		});
	},
});

/**
 * Delete a meal plan
 */
export const remove = mutation({
	args: { id: v.id("mealPlans") },
	handler: async (ctx, args) => {
		return await ctx.db.delete(args.id);
	},
});
