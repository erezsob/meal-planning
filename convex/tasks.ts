import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {}, 
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const create = mutation({
  args: { text: v.string(), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", { text: args.text, isCompleted: args.isCompleted });
  },
});

export const update = mutation({
  args: { id: v.id("tasks"), text: v.string(), isCompleted: v.boolean() },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, { text: args.text, isCompleted: args.isCompleted });
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});