import { v } from "convex/values";
import {
	normalizeCustomPlansContent,
	normalizeMainGridContent,
	normalizeWeekPlan,
	splitWeekPlan,
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

const CUSTOM_PLANS_SECTION = "custom-plans" as const;

export type HomePlanSection<TContent> = {
	id?: Id<"planSections">;
	content: TContent;
	createdAt: number;
	updatedAt: number;
};

export type HomePlanSections = {
	mainGrids: HomePlanSection<MainGridContent>[];
	customPlans: HomePlanSection<CustomPlansContent>;
	needsEnsure: boolean;
};

function toMainGridSection(row: {
	_id: Id<"planSections">;
	content: unknown;
	createdAt: number;
	updatedAt: number;
}): HomePlanSection<MainGridContent> {
	return {
		id: row._id,
		content: normalizeMainGridContent(row.content as MainGridContent),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

function toCustomPlansSection(row: {
	_id: Id<"planSections">;
	content: unknown;
	createdAt: number;
	updatedAt: number;
}): HomePlanSection<CustomPlansContent> {
	return {
		id: row._id,
		content: normalizeCustomPlansContent(row.content as CustomPlansContent),
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

async function isMigrationComplete(
	ctx: QueryCtx | MutationCtx,
	householdId: string,
): Promise<boolean> {
	const activeMain = await ctx.db
		.query("planSections")
		.withIndex("by_household_section_stackRank", (q) =>
			q.eq("householdId", householdId).eq("section", "main").eq("stackRank", 0),
		)
		.first();

	const activeCustomPlans = await ctx.db
		.query("planSections")
		.withIndex("by_household_section_status", (q) =>
			q
				.eq("householdId", householdId)
				.eq("section", CUSTOM_PLANS_SECTION)
				.eq("status", "active"),
		)
		.first();

	return activeMain != null && activeCustomPlans != null;
}

async function migrateLegacyWeekPlan(
	ctx: MutationCtx,
	householdId: string,
): Promise<boolean> {
	if (await isMigrationComplete(ctx, householdId)) {
		return false;
	}

	const legacy = await ctx.db
		.query("weekPlans")
		.withIndex("by_householdId", (q) => q.eq("householdId", householdId))
		.first();

	if (!legacy) {
		return false;
	}

	const plan = normalizeWeekPlan(legacy.plan);
	const { main, customPlans } = splitWeekPlan(plan);
	const timestamp = legacy.updatedAt;

	await ctx.db.insert("planSections", {
		householdId,
		section: "main",
		content: main,
		status: "active",
		stackRank: 0,
		createdAt: timestamp,
		updatedAt: timestamp,
	});

	await ctx.db.insert("planSections", {
		householdId,
		section: CUSTOM_PLANS_SECTION,
		content: customPlans,
		status: "active",
		createdAt: timestamp,
		updatedAt: timestamp,
	});

	return true;
}

async function ensureDefaultHomeRows(
	ctx: MutationCtx,
	householdId: string,
): Promise<void> {
	const activeMain = await ctx.db
		.query("planSections")
		.withIndex("by_household_section_stackRank", (q) =>
			q.eq("householdId", householdId).eq("section", "main").eq("stackRank", 0),
		)
		.first();

	if (!activeMain) {
		const now = Date.now();
		await ctx.db.insert("planSections", {
			householdId,
			section: "main",
			content: createDefaultMainGridContent(),
			status: "active",
			stackRank: 0,
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
					.eq("section", "main")
					.eq("stackRank", 0),
			)
			.first(),
		ctx.db
			.query("planSections")
			.withIndex("by_household_section_stackRank", (q) =>
				q
					.eq("householdId", householdId)
					.eq("section", "main")
					.eq("stackRank", 1),
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
		needsEnsure: false,
	};
}

function homeFromLegacyWeekPlan(
	plan: ReturnType<typeof normalizeWeekPlan>,
	timestamp: number,
): HomePlanSections {
	const { main, customPlans } = splitWeekPlan(plan);

	return {
		mainGrids: [
			{
				content: main,
				createdAt: timestamp,
				updatedAt: timestamp,
			},
		],
		customPlans: {
			content: customPlans,
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		needsEnsure: true,
	};
}

/**
 * Load active main grids (stack ranks 0–1) and custom plans for the home page.
 * Synthesizes a read-only view from legacy weekPlans when not yet migrated.
 */
export const getHome = query({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		const existing = await loadActiveHomeSections(ctx, args.householdId);
		if (existing) {
			return existing;
		}

		const legacy = await ctx.db
			.query("weekPlans")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.first();

		if (legacy) {
			return homeFromLegacyWeekPlan(
				normalizeWeekPlan(legacy.plan),
				legacy.updatedAt,
			);
		}

		return null;
	},
});

/**
 * Migrate legacy data and ensure default rows exist.
 * Idempotent — safe to call before saves or on first load.
 */
export const ensureHome = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		await migrateLegacyWeekPlan(ctx, args.householdId);
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
		if (!row || row.section !== "main") {
			throw new Error("Main plan section not found");
		}

		const content = normalizeMainGridContent(args.content);
		const updatedAt = Date.now();

		await ctx.db.patch(args.id, { content, updatedAt });
		return args.id;
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
 * Stack cascade for "New weekly plan": archive former rank-1, demote rank-0
 * to rank-1, insert fresh rank-0.
 */
export const archiveAndCreateNewMain = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		await migrateLegacyWeekPlan(ctx, args.householdId);
		await ensureDefaultHomeRows(ctx, args.householdId);

		const now = Date.now();

		const [rank0, rank1] = await Promise.all([
			ctx.db
				.query("planSections")
				.withIndex("by_household_section_stackRank", (q) =>
					q
						.eq("householdId", args.householdId)
						.eq("section", "main")
						.eq("stackRank", 0),
				)
				.first(),
			ctx.db
				.query("planSections")
				.withIndex("by_household_section_stackRank", (q) =>
					q
						.eq("householdId", args.householdId)
						.eq("section", "main")
						.eq("stackRank", 1),
				)
				.first(),
		]);

		await ctx.db.insert("planSections", {
			householdId: args.householdId,
			section: "main",
			content: createDefaultMainGridContent(),
			status: "active",
			stackRank: 0,
			createdAt: now,
			updatedAt: now,
		});

		if (rank0) {
			await ctx.db.patch(rank0._id, {
				stackRank: 1,
				updatedAt: now,
			});
		}

		if (rank1) {
			await ctx.db.patch(rank1._id, {
				status: "archived",
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
		await migrateLegacyWeekPlan(ctx, args.householdId);
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

		if (activeCustomPlans) {
			await ctx.db.patch(activeCustomPlans._id, {
				status: "archived",
				updatedAt: now,
			});
		}

		await ctx.db.insert("planSections", {
			householdId: args.householdId,
			section: CUSTOM_PLANS_SECTION,
			content: createDefaultCustomPlansContent(),
			status: "active",
			createdAt: now,
			updatedAt: now,
		});

		const home = await loadActiveHomeSections(ctx, args.householdId);
		if (!home) {
			throw new Error("Failed to load home plan sections");
		}

		return home;
	},
});
