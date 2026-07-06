import { v } from "convex/values";
import { DEFAULT_COMPONENT_ROLE } from "../lib/constants";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

const mealTypeValidator = v.union(
	v.literal("breakfast"),
	v.literal("lunch"),
	v.literal("dinner"),
);

const componentRoleValidator = v.union(
	v.literal("main"),
	v.literal("side"),
	v.literal("dessert"),
	v.literal("drink"),
	v.literal("other"),
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
			componentRole: meal.componentRole ?? DEFAULT_COMPONENT_ROLE,
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
		return {
			...meal,
			componentRole: meal.componentRole ?? DEFAULT_COMPONENT_ROLE,
			dish,
		};
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

		// Use servingsMade if set, else fall back to dish.defaultServings
		const totalServings = sourceMeal.servingsMade ?? dish.defaultServings ?? 1;

		return Math.max(0, totalServings - totalUsed);
	},
});

/**
 * Get all available leftover sources for a household
 * Includes both eaten AND planned fresh meals as sources
 */
export const getLeftoverSources = query({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		const today = new Date().toISOString().split("T")[0];

		// Source meals: non-leftover meals that are eaten OR planned (fresh cook events)
		const sourceMeals = meals.filter(
			(m) =>
				!m.isLeftover &&
				m.dishId &&
				(m.status === "eaten" || m.status === "planned"),
		);

		const results: Array<{
			meal: Doc<"mealPlans">;
			dish: Doc<"dishes">;
			available: number;
			scheduledCount: number;
			isUnscheduled: boolean;
		}> = [];

		for (const meal of sourceMeals) {
			if (!meal.dishId) continue;
			const dish = await ctx.db.get(meal.dishId);
			if (!dish) continue;

			// All meals linked to this source (the source itself + leftovers from it)
			const relatedMeals = meals.filter(
				(m) => m._id === meal._id || m.sourceMealId === meal._id,
			);

			// Total servings made (use servingsMade if set, else dish default)
			const totalServings = meal.servingsMade ?? dish.defaultServings ?? 1;

			// Eaten servings
			const eatenServings = relatedMeals
				.filter((m) => m.status === "eaten")
				.reduce((sum, m) => sum + m.servingsUsed, 0);

			// Planned future servings (leftovers scheduled but not eaten yet)
			const plannedFutureServings = relatedMeals
				.filter((m) => m.status === "planned" && m.isLeftover && m.day >= today)
				.reduce((sum, m) => sum + m.servingsUsed, 0);

			// Count of future scheduled leftover meals
			const scheduledCount = relatedMeals.filter(
				(m) => m.status === "planned" && m.isLeftover && m.day >= today,
			).length;

			const available = totalServings - eatenServings - plannedFutureServings;
			const isUnscheduled = available > 0 && scheduledCount === 0;

			if (available > 0) {
				results.push({ meal, dish, available, scheduledCount, isUnscheduled });
			}
		}

		return results;
	},
});

/**
 * Plan a new meal component (status: planned)
 */
export const planMeal = mutation({
	args: {
		day: v.string(),
		mealType: mealTypeValidator,
		componentRole: v.optional(componentRoleValidator),
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
		servingsUsed: v.number(),
		servingsMade: v.optional(v.number()),
		isLeftover: v.boolean(),
		sourceMealId: v.optional(v.id("mealPlans")),
		householdId: v.string(),
	},
	handler: async (ctx, args) => {
		const componentRole = args.componentRole ?? "main";
		return await ctx.db.insert("mealPlans", {
			day: args.day,
			mealType: args.mealType,
			componentRole,
			dishId: args.dishId,
			customName: args.customName,
			servingsUsed: args.servingsUsed,
			servingsMade: args.servingsMade,
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
 * Update meal plan component details
 */
export const update = mutation({
	args: {
		id: v.id("mealPlans"),
		componentRole: componentRoleValidator,
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
		servingsUsed: v.number(),
		isLeftover: v.boolean(),
		sourceMealId: v.optional(v.id("mealPlans")),
		day: v.optional(v.string()),
		mealType: v.optional(mealTypeValidator),
	},
	handler: async (ctx, args) => {
		return await ctx.db.patch(args.id, {
			componentRole: args.componentRole,
			dishId: args.dishId,
			customName: args.customName,
			servingsUsed: args.servingsUsed,
			isLeftover: args.isLeftover,
			sourceMealId: args.sourceMealId,
			...(args.day !== undefined ? { day: args.day } : {}),
			...(args.mealType !== undefined ? { mealType: args.mealType } : {}),
		});
	},
});

/**
 * Log a meal as eaten (on-the-go consumption record).
 * Auto-skips any planned items in the target slot.
 */
export const logMeal = mutation({
	args: {
		householdId: v.string(),
		day: v.string(),
		mealType: mealTypeValidator,
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const hasDish = args.dishId !== undefined;
		const hasCustom = args.customName !== undefined && args.customName.trim() !== "";
		if (hasDish === hasCustom) {
			throw new Error("Provide either dishId or customName");
		}

		const today = new Date().toISOString().split("T")[0];
		if (args.day > today) {
			throw new Error("Cannot log meals for future dates");
		}

		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		const plannedInSlot = meals.filter(
			(m) =>
				m.day === args.day &&
				m.mealType === args.mealType &&
				m.status === "planned",
		);

		await Promise.all(
			plannedInSlot.map((m) => ctx.db.patch(m._id, { status: "skipped" })),
		);

		return await ctx.db.insert("mealPlans", {
			day: args.day,
			mealType: args.mealType,
			componentRole: DEFAULT_COMPONENT_ROLE,
			dishId: args.dishId,
			customName: args.customName?.trim(),
			servingsUsed: 1,
			status: "eaten",
			isLeftover: false,
			householdId: args.householdId,
		});
	},
});

/**
 * Update a logged (eaten) meal — name/dish, day, and meal type only.
 */
export const updateLog = mutation({
	args: {
		id: v.id("mealPlans"),
		day: v.string(),
		mealType: mealTypeValidator,
		dishId: v.optional(v.id("dishes")),
		customName: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const meal = await ctx.db.get(args.id);
		if (!meal) throw new Error("Meal not found");
		if (meal.status !== "eaten") {
			throw new Error("Only eaten meals can be updated via log edit");
		}

		const hasDish = args.dishId !== undefined;
		const hasCustom = args.customName !== undefined && args.customName.trim() !== "";
		if (hasDish === hasCustom) {
			throw new Error("Provide either dishId or customName");
		}

		const today = new Date().toISOString().split("T")[0];
		if (args.day > today) {
			throw new Error("Cannot log meals for future dates");
		}

		return await ctx.db.patch(args.id, {
			day: args.day,
			mealType: args.mealType,
			dishId: args.dishId,
			customName: args.customName?.trim(),
		});
	},
});

/**
 * Get eaten meals for the history view (date range + optional name search).
 */
export const getEatenHistory = query({
	args: {
		householdId: v.string(),
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
		searchQuery: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		let eaten = meals.filter((m) => m.status === "eaten");

		if (args.startDate !== undefined) {
			const startDate = args.startDate;
			eaten = eaten.filter((m) => m.day >= startDate);
		}
		if (args.endDate !== undefined) {
			const endDate = args.endDate;
			eaten = eaten.filter((m) => m.day <= endDate);
		}

		const dishIds = [
			...new Set(eaten.filter((m) => m.dishId).map((m) => m.dishId)),
		] as Id<"dishes">[];

		const dishes = await Promise.all(dishIds.map((id) => ctx.db.get(id)));
		const dishMap = new Map(
			dishes
				.filter((d): d is NonNullable<typeof d> => d !== null)
				.map((d) => [d._id, d]),
		);

		const search = args.searchQuery?.trim().toLowerCase();
		if (search) {
			eaten = eaten.filter((m) => {
				const dishName = m.dishId ? dishMap.get(m.dishId)?.name : undefined;
				const name = m.customName ?? dishName ?? "";
				return name.toLowerCase().includes(search);
			});
		}

		const mealTypeOrder = { breakfast: 0, lunch: 1, dinner: 2 };

		eaten.sort((a, b) => {
			if (a.day !== b.day) return b.day.localeCompare(a.day);
			return mealTypeOrder[a.mealType] - mealTypeOrder[b.mealType];
		});

		return eaten.map((meal) => ({
			...meal,
			componentRole: meal.componentRole ?? DEFAULT_COMPONENT_ROLE,
			dish: meal.dishId ? (dishMap.get(meal.dishId) ?? null) : null,
		}));
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

		// Use servingsMade if set, else fall back to dish.defaultServings
		const totalServings = sourceMeal.servingsMade ?? dish.defaultServings ?? 1;
		const remaining = totalServings - totalUsed;

		if (remaining <= 0) return null;

		return await ctx.db.insert("mealPlans", {
			day: new Date().toISOString().split("T")[0],
			mealType: "dinner",
			componentRole: sourceMeal.componentRole ?? DEFAULT_COMPONENT_ROLE,
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

/**
 * Mark all planned meals in a slot as eaten.
 * Slot = (householdId, day, mealType).
 * Returns count of updated meals.
 */
export const eatSlot = mutation({
	args: {
		householdId: v.string(),
		day: v.string(),
		mealType: mealTypeValidator,
	},
	handler: async (ctx, args) => {
		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		const slotMeals = meals.filter(
			(m) =>
				m.day === args.day &&
				m.mealType === args.mealType &&
				m.status === "planned",
		);

		await Promise.all(
			slotMeals.map((m) => ctx.db.patch(m._id, { status: "eaten" })),
		);

		return slotMeals.length;
	},
});

/**
 * Mark all planned meals in a slot as skipped.
 * Slot = (householdId, day, mealType).
 * Returns count of updated meals.
 */
export const skipSlot = mutation({
	args: {
		householdId: v.string(),
		day: v.string(),
		mealType: mealTypeValidator,
	},
	handler: async (ctx, args) => {
		const meals = await ctx.db
			.query("mealPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		const slotMeals = meals.filter(
			(m) =>
				m.day === args.day &&
				m.mealType === args.mealType &&
				m.status === "planned",
		);

		await Promise.all(
			slotMeals.map((m) => ctx.db.patch(m._id, { status: "skipped" })),
		);

		return slotMeals.length;
	},
});
