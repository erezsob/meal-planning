import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	dishes: defineTable({
		ingredients: v.array(v.object({ name: v.string(), quantity: v.float64() })),
		instructions: v.string(),
		name: v.string(),
		url: v.string(),
	}),

	tasks: defineTable({
		isCompleted: v.boolean(),
		text: v.string(),
	}),

	meals: defineTable({
		date: v.union(v.string(), v.number()),
		type: v.union(
			v.literal("breakfast"),
			v.literal("lunch"),
			v.literal("dinner"),
			v.literal("snack"),
		),
		dishes: v.array(v.id("dishes")),
	}),
});
