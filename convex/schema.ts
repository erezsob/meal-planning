import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	customPlansContentValidator,
	mainGridContentValidator,
} from "../lib/weekPlanValidator";

export default defineSchema({
	dishes: defineTable({
		name: v.string(),
		description: v.optional(v.string()),
		ingredients: v.array(
			v.object({
				name: v.string(),
				quantity: v.number(),
				unit: v.optional(v.string()),
				category: v.optional(v.string()),
			}),
		),
		tags: v.optional(v.array(v.string())),
		defaultServings: v.optional(v.number()),
		sourceUrl: v.optional(v.string()),
		householdId: v.optional(v.string()),
	}).index("by_householdId", ["householdId"]),

	mealPlans: defineTable({
		day: v.string(),
		mealType: v.union(
			v.literal("breakfast"),
			v.literal("lunch"),
			v.literal("dinner"),
		),
		componentRole: v.optional(
			v.union(
				v.literal("main"),
				v.literal("side"),
				v.literal("dessert"),
				v.literal("drink"),
				v.literal("other"),
			),
		),
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
		servingsUsed: v.number(),
		servingsMade: v.optional(v.number()),
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

	planSections: defineTable({
		householdId: v.string(),
		section: v.union(v.literal("main"), v.literal("custom-plans")),
		content: v.union(mainGridContentValidator, customPlansContentValidator),
		status: v.union(v.literal("active"), v.literal("archived")),
		stackRank: v.optional(v.union(v.literal(0), v.literal(1))),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_household_section_status", ["householdId", "section", "status"])
		.index("by_household_section_stackRank", [
			"householdId",
			"section",
			"stackRank",
		]),
});
