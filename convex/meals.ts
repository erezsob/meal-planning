import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("meals").collect();
	},
});

export const getOne = query({
	args: { id: v.id("meals") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const create = mutation({
	args: {
		date: v.union(v.string(), v.number()),
		type: v.union(
			v.literal("breakfast"),
			v.literal("lunch"),
			v.literal("dinner"),
			v.literal("snack"),
		),
		dishes: v.array(v.id("dishes")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("meals", {
			date: args.date,
			type: args.type,
			dishes: args.dishes,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("meals"),
		date: v.union(v.string(), v.number()),
		type: v.union(
			v.literal("breakfast"),
			v.literal("lunch"),
			v.literal("dinner"),
			v.literal("snack"),
		),
		dishes: v.array(v.id("dishes")),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, {
			date: args.date,
			type: args.type,
			dishes: args.dishes,
		});
	},
});

export const remove = mutation({
	args: { id: v.id("meals") },
	handler: async (ctx, args) => {
		return await ctx.db.delete(args.id);
	},
});

export const getMealsByDishId = query({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("meals")
			.filter((q) => q.eq(q.field("dishes"), [args.id]))
			.collect();
	},
});
