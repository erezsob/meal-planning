import { v } from "convex/values";
import { normalizeWeekPlan } from "../lib/weekPlan";
import { weekPlanValidator } from "../lib/weekPlanValidator";
import { mutation, query } from "./_generated/server";

/**
 * Get the household's current week plan, or null if none saved yet.
 */
export const get = query({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		const row = await ctx.db
			.query("weekPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.first();

		return row?.plan != null ? normalizeWeekPlan(row.plan) : null;
	},
});

/**
 * Upsert the household's week plan.
 */
export const save = mutation({
	args: {
		householdId: v.string(),
		plan: weekPlanValidator,
	},
	handler: async (ctx, args) => {
		const plan = normalizeWeekPlan(args.plan);
		const existing = await ctx.db
			.query("weekPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.first();

		const updatedAt = Date.now();

		if (existing) {
			await ctx.db.patch(existing._id, { plan, updatedAt });
			return existing._id;
		}

		return await ctx.db.insert("weekPlans", {
			householdId: args.householdId,
			plan,
			updatedAt,
		});
	},
});
