import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("dishes").collect();
	},
});

export const getOne = query({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		ingredients: v.array(v.object({ name: v.string(), quantity: v.number() })),
		instructions: v.string(),
		url: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("dishes", {
			name: args.name,
			ingredients: args.ingredients,
			instructions: args.instructions,
			url: args.url,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("dishes"),
		name: v.string(),
		ingredients: v.array(v.object({ name: v.string(), quantity: v.number() })),
		instructions: v.string(),
		url: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, {
			name: args.name,
			ingredients: args.ingredients,
			instructions: args.instructions,
			url: args.url,
		});
	},
});

export const remove = mutation({
	args: { id: v.id("dishes") },
	handler: async (ctx, args) => {
		return await ctx.db.delete(args.id);
	},
});
