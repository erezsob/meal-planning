import { v } from "convex/values";
import {
	ARCHIVED_PLAN_STATUS,
	CUSTOM_PLANS_SECTION,
	MAIN_PLAN_SECTION,
	MAIN_STACK_RANK_PREVIOUS_WEEK,
	MAIN_STACK_RANK_THIS_WEEK,
} from "../lib/constants";
import {
	planCustomPlansArchive,
	planMainStackCascade,
} from "../lib/planSectionLifecycle";
import {
	normalizeCustomPlansContent,
	normalizeMainGridContent,
} from "../lib/weekPlan";
import {
	type CustomPlansContent,
	createDefaultCustomPlansContent,
	createDefaultMainGridContent,
	type MainGridContent,
} from "../lib/weekPlanTypes";
import {
	customPlansContentValidator,
	mainGridContentValidator,
} from "../lib/weekPlanValidator";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

export type HomePlanSection<TContent> = {
	id?: Id<"planSections">;
	content: TContent;
	createdAt: number;
	updatedAt: number;
};

export type HomePlanSections = {
	mainGrids: HomePlanSection<MainGridContent>[];
	customPlans: HomePlanSection<CustomPlansContent>;
};

export type ArchivedPlanSection =
	| {
			/** Archived section document id. */
			id: Id<"planSections">;
			/** Main weekly-plan section discriminator. */
			section: typeof MAIN_PLAN_SECTION;
			/** Normalized archived weekly-plan grid content. */
			content: MainGridContent;
			/** Original plan creation timestamp. */
			createdAt: number;
			/** Timestamp when the plan was last changed, including archiving. */
			updatedAt: number;
	  }
	| {
			/** Archived section document id. */
			id: Id<"planSections">;
			/** Custom-plan section discriminator. */
			section: typeof CUSTOM_PLANS_SECTION;
			/** Normalized archived custom-plan content. */
			content: CustomPlansContent;
			/** Original plan creation timestamp. */
			createdAt: number;
			/** Timestamp when the plan was last changed, including archiving. */
			updatedAt: number;
	  };

function toHomePlanSection<TContent>({
	row,
	normalize,
}: {
	row: {
		_id: Id<"planSections">;
		content: unknown;
		createdAt: number;
		updatedAt: number;
	};
	normalize: (content: unknown) => TContent;
}): HomePlanSection<TContent> {
	return {
		id: row._id,
		content: normalize(row.content),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function toMainGridSection(row: {
	_id: Id<"planSections">;
	content: unknown;
	createdAt: number;
	updatedAt: number;
}): HomePlanSection<MainGridContent> {
	return toHomePlanSection({
		row,
		normalize: normalizeMainGridContent,
	});
}

function toCustomPlansSection(row: {
	_id: Id<"planSections">;
	content: unknown;
	createdAt: number;
	updatedAt: number;
}): HomePlanSection<CustomPlansContent> {
	return toHomePlanSection({
		row,
		normalize: normalizeCustomPlansContent,
	});
}

function toArchivedPlanSection(row: {
	_id: Id<"planSections">;
	section: typeof MAIN_PLAN_SECTION | typeof CUSTOM_PLANS_SECTION;
	content: unknown;
	createdAt: number;
	updatedAt: number;
}): ArchivedPlanSection {
	if (row.section === MAIN_PLAN_SECTION) {
		return {
			id: row._id,
			section: MAIN_PLAN_SECTION,
			content: normalizeMainGridContent(row.content),
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}

	return {
		id: row._id,
		section: CUSTOM_PLANS_SECTION,
		content: normalizeCustomPlansContent(row.content),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

async function ensureDefaultHomeRows(
	ctx: MutationCtx,
	householdId: string,
): Promise<void> {
	const activeMain = await ctx.db
		.query("planSections")
		.withIndex("by_household_section_stackRank", (q) =>
			q
				.eq("householdId", householdId)
				.eq("section", MAIN_PLAN_SECTION)
				.eq("stackRank", MAIN_STACK_RANK_THIS_WEEK),
		)
		.first();

	if (!activeMain) {
		const now = Date.now();
		await ctx.db.insert("planSections", {
			householdId,
			section: MAIN_PLAN_SECTION,
			content: createDefaultMainGridContent(),
			status: "active",
			stackRank: MAIN_STACK_RANK_THIS_WEEK,
			createdAt: now,
			updatedAt: now,
		});
	}

	const activeCustomPlans = await ctx.db
		.query("planSections")
		.withIndex("by_household_section_status", (q) =>
			q
				.eq("householdId", householdId)
				.eq("section", CUSTOM_PLANS_SECTION)
				.eq("status", "active"),
		)
		.first();

	if (!activeCustomPlans) {
		const now = Date.now();
		await ctx.db.insert("planSections", {
			householdId,
			section: CUSTOM_PLANS_SECTION,
			content: createDefaultCustomPlansContent(),
			status: "active",
			createdAt: now,
			updatedAt: now,
		});
	}
}

async function loadActiveMainGrids(
	ctx: QueryCtx | MutationCtx,
	householdId: string,
): Promise<HomePlanSection<MainGridContent>[]> {
	const [rank0, rank1] = await Promise.all([
		ctx.db
			.query("planSections")
			.withIndex("by_household_section_stackRank", (q) =>
				q
					.eq("householdId", householdId)
					.eq("section", MAIN_PLAN_SECTION)
					.eq("stackRank", MAIN_STACK_RANK_THIS_WEEK),
			)
			.first(),
		ctx.db
			.query("planSections")
			.withIndex("by_household_section_stackRank", (q) =>
				q
					.eq("householdId", householdId)
					.eq("section", MAIN_PLAN_SECTION)
					.eq("stackRank", MAIN_STACK_RANK_PREVIOUS_WEEK),
			)
			.first(),
	]);

	return [rank0, rank1]
		.filter((row): row is NonNullable<typeof row> => row != null)
		.map(toMainGridSection);
}

async function loadActiveHomeSections(
	ctx: QueryCtx | MutationCtx,
	householdId: string,
): Promise<HomePlanSections | null> {
	const [mainGrids, activeCustomPlans] = await Promise.all([
		loadActiveMainGrids(ctx, householdId),
		ctx.db
			.query("planSections")
			.withIndex("by_household_section_status", (q) =>
				q
					.eq("householdId", householdId)
					.eq("section", CUSTOM_PLANS_SECTION)
					.eq("status", "active"),
			)
			.first(),
	]);

	if (mainGrids.length === 0 || !activeCustomPlans) {
		return null;
	}

	return {
		mainGrids,
		customPlans: toCustomPlansSection(activeCustomPlans),
	};
}

/**
 * Load active main grids (stack ranks 0–1) and custom plans for the home page.
 * Returns null for households with no planSections rows yet.
 */
export const getHome = query({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		return await loadActiveHomeSections(ctx, args.householdId);
	},
});

/**
 * List archived plan sections, optionally filtered by section, newest first.
 */
export const listArchived = query({
	args: {
		householdId: v.string(),
		section: v.optional(
			v.union(v.literal(MAIN_PLAN_SECTION), v.literal(CUSTOM_PLANS_SECTION)),
		),
	},
	handler: async (ctx, args) => {
		const { section } = args;
		const rows = section
			? await ctx.db
					.query("planSections")
					.withIndex("by_household_section_status", (q) =>
						q
							.eq("householdId", args.householdId)
							.eq("section", section)
							.eq("status", ARCHIVED_PLAN_STATUS),
					)
					.collect()
			: await ctx.db
					.query("planSections")
					.withIndex("by_household_section_status", (q) =>
						q.eq("householdId", args.householdId),
					)
					.filter((q) => q.eq(q.field("status"), ARCHIVED_PLAN_STATUS))
					.collect();

		return rows
			.slice()
			.sort((a, b) => b.updatedAt - a.updatedAt)
			.map(toArchivedPlanSection);
	},
});

/**
 * Load one archived plan section for its read-only detail view.
 */
export const getArchived = query({
	args: { id: v.id("planSections") },
	handler: async (ctx, args) => {
		const row = await ctx.db.get(args.id);
		if (!row || row.status !== ARCHIVED_PLAN_STATUS) {
			return null;
		}

		return toArchivedPlanSection(row);
	},
});

/**
 * Ensure default rows exist for a brand-new household, then load home state.
 * Idempotent — safe to call before saves or on first load.
 */
export const ensureHome = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		await ensureDefaultHomeRows(ctx, args.householdId);

		const home = await loadActiveHomeSections(ctx, args.householdId);
		if (!home) {
			throw new Error("Failed to load home plan sections");
		}

		return home;
	},
});

/**
 * Patch a main-grid row by id.
 */
export const saveMain = mutation({
	args: {
		id: v.id("planSections"),
		content: mainGridContentValidator,
	},
	handler: async (ctx, args) => {
		const row = await ctx.db.get(args.id);
		if (!row || row.section !== MAIN_PLAN_SECTION) {
			throw new Error("Main plan section not found");
		}

		const content = normalizeMainGridContent(args.content);
		const updatedAt = Date.now();

		await ctx.db.patch(args.id, { content, updatedAt });
		return args.id;
	},
});

/**
 * Clear the rank-0 main grid in place without changing its lifecycle metadata.
 */
export const clearMainTop = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		await ensureDefaultHomeRows(ctx, args.householdId);

		const topGrid = await ctx.db
			.query("planSections")
			.withIndex("by_household_section_stackRank", (q) =>
				q
					.eq("householdId", args.householdId)
					.eq("section", MAIN_PLAN_SECTION)
					.eq("stackRank", MAIN_STACK_RANK_THIS_WEEK),
			)
			.first();

		if (!topGrid) {
			throw new Error("Top main plan section not found");
		}

		await ctx.db.patch(topGrid._id, {
			content: createDefaultMainGridContent(),
			updatedAt: Date.now(),
		});

		return topGrid._id;
	},
});

/**
 * Patch the active custom-plans row by id.
 */
export const saveCustomPlans = mutation({
	args: {
		id: v.id("planSections"),
		content: customPlansContentValidator,
	},
	handler: async (ctx, args) => {
		const row = await ctx.db.get(args.id);
		if (!row || row.section !== CUSTOM_PLANS_SECTION) {
			throw new Error("Custom plans section not found");
		}

		const content = normalizeCustomPlansContent(args.content);
		const updatedAt = Date.now();

		await ctx.db.patch(args.id, { content, updatedAt });
		return args.id;
	},
});

/**
 * Stack cascade for "New weekly plan": insert rank-0, demote former rank-0,
 * archive former rank-1.
 */
export const archiveAndCreateNewMain = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		await ensureDefaultHomeRows(ctx, args.householdId);

		const now = Date.now();

		const [rank0, rank1] = await Promise.all([
			ctx.db
				.query("planSections")
				.withIndex("by_household_section_stackRank", (q) =>
					q
						.eq("householdId", args.householdId)
						.eq("section", MAIN_PLAN_SECTION)
						.eq("stackRank", MAIN_STACK_RANK_THIS_WEEK),
				)
				.first(),
			ctx.db
				.query("planSections")
				.withIndex("by_household_section_stackRank", (q) =>
					q
						.eq("householdId", args.householdId)
						.eq("section", MAIN_PLAN_SECTION)
						.eq("stackRank", MAIN_STACK_RANK_PREVIOUS_WEEK),
				)
				.first(),
		]);

		const steps = planMainStackCascade({
			rank0Id: rank0?._id,
			rank1Id: rank1?._id,
		});

		for (const step of steps) {
			if (step.type === "insert-rank-0") {
				await ctx.db.insert("planSections", {
					householdId: args.householdId,
					section: MAIN_PLAN_SECTION,
					content: createDefaultMainGridContent(),
					status: "active",
					stackRank: MAIN_STACK_RANK_THIS_WEEK,
					createdAt: now,
					updatedAt: now,
				});
				continue;
			}

			if (step.type === "demote-to-rank-1") {
				await ctx.db.patch(step.sectionId, {
					stackRank: step.stackRank,
					updatedAt: now,
				});
				continue;
			}

			await ctx.db.patch(step.sectionId, {
				status: ARCHIVED_PLAN_STATUS,
				stackRank: undefined,
				updatedAt: now,
			});
		}

		const home = await loadActiveHomeSections(ctx, args.householdId);
		if (!home) {
			throw new Error("Failed to load home plan sections");
		}

		return home;
	},
});

/**
 * Archive the active custom-plans row and insert a fresh active row.
 */
export const archiveAndCreateNewCustomPlans = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		await ensureDefaultHomeRows(ctx, args.householdId);

		const now = Date.now();

		const activeCustomPlans = await ctx.db
			.query("planSections")
			.withIndex("by_household_section_status", (q) =>
				q
					.eq("householdId", args.householdId)
					.eq("section", CUSTOM_PLANS_SECTION)
					.eq("status", "active"),
			)
			.first();

		const steps = planCustomPlansArchive(activeCustomPlans?._id);

		for (const step of steps) {
			if (step.type === "archive") {
				await ctx.db.patch(step.sectionId, {
					status: ARCHIVED_PLAN_STATUS,
					updatedAt: now,
				});
				continue;
			}

			await ctx.db.insert("planSections", {
				householdId: args.householdId,
				section: CUSTOM_PLANS_SECTION,
				content: createDefaultCustomPlansContent(),
				status: "active",
				createdAt: now,
				updatedAt: now,
			});
		}

		const home = await loadActiveHomeSections(ctx, args.householdId);
		if (!home) {
			throw new Error("Failed to load home plan sections");
		}

		return home;
	},
});
