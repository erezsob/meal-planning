import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ingredientValidator = v.object({
	name: v.string(),
	quantity: v.number(),
	unit: v.string(),
	category: v.string(),
});

/**
 * Get all dishes for a household
 */
export const getAll = query({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("dishes")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();
	},
});

/**
 * Get a single dish by ID
 */
export const getOne = query({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

/**
 * Search dishes by name (case-insensitive partial match)
 */
export const search = query({
	args: { householdId: v.string(), query: v.string() },
	handler: async (ctx, args) => {
		const dishes = await ctx.db
			.query("dishes")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		if (!args.query.trim()) return dishes;

		const lowerQuery = args.query.toLowerCase();
		return dishes.filter((dish) =>
			dish.name.toLowerCase().includes(lowerQuery),
		);
	},
});

/**
 * Filter dishes by tags (returns dishes with ANY of the specified tags)
 */
export const getByTags = query({
	args: { householdId: v.string(), tags: v.array(v.string()) },
	handler: async (ctx, args) => {
		const dishes = await ctx.db
			.query("dishes")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		if (args.tags.length === 0) return dishes;

		return dishes.filter((dish) =>
			args.tags.some((tag) => (dish.tags ?? []).includes(tag)),
		);
	},
});

/**
 * Create a new dish
 */
export const create = mutation({
	args: {
		name: v.string(),
		description: v.string(),
		ingredients: v.array(ingredientValidator),
		tags: v.array(v.string()),
		defaultServings: v.number(),
		sourceUrl: v.optional(v.string()),
		householdId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("dishes", {
			name: args.name,
			description: args.description,
			ingredients: args.ingredients,
			tags: args.tags,
			defaultServings: args.defaultServings,
			sourceUrl: args.sourceUrl,
			householdId: args.householdId,
		});
	},
});

/**
 * Update an existing dish
 */
export const update = mutation({
	args: {
		id: v.id("dishes"),
		name: v.string(),
		description: v.string(),
		ingredients: v.array(ingredientValidator),
		tags: v.array(v.string()),
		defaultServings: v.number(),
		sourceUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, {
			name: args.name,
			description: args.description,
			ingredients: args.ingredients,
			tags: args.tags,
			defaultServings: args.defaultServings,
			sourceUrl: args.sourceUrl,
		});
	},
});

/**
 * Delete a dish
 */
export const remove = mutation({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		return await ctx.db.delete(args.id);
	},
});
