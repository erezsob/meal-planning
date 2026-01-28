import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	dishes: defineTable({
		name: v.string(),
		description: v.string(),
		ingredients: v.array(
			v.object({
				name: v.string(),
				quantity: v.number(),
				unit: v.string(),
				category: v.string(),
			}),
		),
		tags: v.array(v.string()),
		defaultServings: v.number(),
		sourceUrl: v.optional(v.string()),
		householdId: v.string(),
	}).index("by_householdId", ["householdId"]),

	mealPlans: defineTable({
		day: v.string(),
		mealType: v.union(
			v.literal("breakfast"),
			v.literal("lunch"),
			v.literal("dinner"),
		),
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
		servingsUsed: v.number(),
		status: v.union(
			v.literal("planned"),
			v.literal("eaten"),
			v.literal("skipped"),
		),
		isLeftover: v.boolean(),
		sourceMealId: v.optional(v.id("mealPlans")),
		householdId: v.string(),
	})
		.index("by_householdId", ["householdId"])
		.index("by_day", ["householdId", "day"])
		.index("by_dishId", ["dishId"]),

	tasks: defineTable({
		isCompleted: v.boolean(),
		text: v.string(),
	}),
});
