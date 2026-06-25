import { convexQuery } from "@convex-dev/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { ArrowRight, Copy, Plus, RefreshCw, Search, X } from "lucide-react";
import { Suspense, useId, useState } from "react";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Skeleton } from "@/lib/components/skeleton";
import {
	DEFAULT_COMPONENT_ROLE,
	HOUSEHOLD_ID,
	type MealComponentRole,
} from "@/lib/constants";
import { isDishCollected, mealsToDraft } from "./draft-transforms";
import type { DraftDish, PlanDraft } from "./types";

type LeftoverSource = FunctionReturnType<
	typeof api.mealPlans.getLeftoverSources
>[number];

interface CollectStepProps {
	/** Current draft state */
	draft: PlanDraft;
	/** Plan start date key (YYYY-MM-DD) */
	startDateKey: string;
	/** Number of days in this plan */
	numDays: number;
	/** Add a dish to the collection */
	onCollect: (dish: DraftDish) => void;
	/** Remove a dish from the collection */
	onUncollect: (dishId: string) => void;
	/** Replace the entire draft (for Copy Last Week) */
	onLoadDraft: (draft: PlanDraft) => void;
	/** Navigate to next step */
	onNext: () => void;
}

/** Generate a simple unique id */
const uid = (): string => crypto.randomUUID();

/** Build a DraftDish from a library Doc<"dishes"> */
const fromLibraryDish = (dish: Doc<"dishes">): DraftDish => ({
	id: uid(),
	type: "library",
	dishId: dish._id,
	name: dish.name,
	servings: dish.defaultServings ?? 1,
	servingsMade: dish.defaultServings ?? 1,
	role: DEFAULT_COMPONENT_ROLE,
});

/** Build a DraftDish from a custom meal name */
const fromCustomName = (name: string): DraftDish => ({
	id: uid(),
	type: "custom",
	customName: name,
	name,
	servings: 1,
	role: DEFAULT_COMPONENT_ROLE,
});

/** Build a DraftDish from a leftover source */
const fromLeftover = (source: LeftoverSource): DraftDish => ({
	id: uid(),
	type: "leftover",
	dishId: source.dish._id,
	sourceMealId: source.meal._id as Id<"mealPlans">,
	name: source.dish.name,
	servings: source.available,
	role: (source.meal.componentRole ??
		DEFAULT_COMPONENT_ROLE) as MealComponentRole,
});

/** Compute the previous period's start key */
const prevPeriodStartKey = (startDateKey: string, numDays: number): string => {
	const d = new Date(startDateKey);
	d.setDate(d.getDate() - numDays);
	return d.toISOString().split("T")[0];
};

/**
 * Step 1: Collect dishes for the week.
 * Search library, add custom meals, pull from leftovers.
 */
export function CollectStep({
	draft,
	startDateKey,
	numDays,
	onCollect,
	onUncollect,
	onLoadDraft,
	onNext,
}: CollectStepProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [customName, setCustomName] = useState("");
	const searchInputId = useId();
	const customInputId = useId();

	const prevKey = prevPeriodStartKey(startDateKey, numDays);
	const { data: prevPeriodMeals } = useQuery(
		convexQuery(api.mealPlans.getWeek, {
			householdId: HOUSEHOLD_ID,
			startDate: prevKey,
		}),
	);

	const handleCopyPrevious = () => {
		if (!prevPeriodMeals || prevPeriodMeals.length === 0) return;
		const newDraft = mealsToDraft({
			meals: prevPeriodMeals,
			sourceStart: prevKey,
			targetStart: startDateKey,
			numDays,
		});
		onLoadDraft(newDraft);
	};

	const handleAddCustom = () => {
		const trimmed = customName.trim();
		if (!trimmed) return;
		onCollect(fromCustomName(trimmed));
		setCustomName("");
	};

	const handleCustomKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAddCustom();
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>What are you cooking this week?</CardTitle>
					<CardDescription>
						Search your library, add custom meals, or pull from leftovers.
					</CardDescription>
					{prevPeriodMeals && prevPeriodMeals.length > 0 && (
						<CardAction>
							<Button variant="outline" size="sm" onClick={handleCopyPrevious}>
								<Copy size={14} />
								Copy Previous
							</Button>
						</CardAction>
					)}
				</CardHeader>

				<CardContent className="space-y-5">
					{/* Search bar */}
					<div className="space-y-1.5">
						<Label htmlFor={searchInputId}>Search Dishes</Label>
						<div className="relative">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								id={searchInputId}
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search your dish library..."
								className="pl-10"
							/>
						</div>
					</div>

					{/* Library results */}
					<Suspense fallback={<LibrarySearchSkeleton />}>
						<LibraryResults
							searchQuery={searchQuery}
							draft={draft}
							onCollect={(dish) => onCollect(fromLibraryDish(dish))}
						/>
					</Suspense>

					{/* Quick add custom meal */}
					<div className="space-y-1.5">
						<Label htmlFor={customInputId}>Quick Add Custom Meal</Label>
						<div className="flex gap-2">
							<Input
								id={customInputId}
								type="text"
								value={customName}
								onChange={(e) => setCustomName(e.target.value)}
								onKeyDown={handleCustomKeyDown}
								placeholder="e.g., Takeout, Restaurant..."
								className="flex-1"
							/>
							<Button
								variant="outline"
								onClick={handleAddCustom}
								disabled={!customName.trim()}
							>
								<Plus size={16} />
								Add
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Leftovers section */}
			<Suspense fallback={null}>
				<LeftoversSection draft={draft} onCollect={onCollect} />
			</Suspense>

			{/* Collected dishes */}
			{draft.dishes.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Collected Dishes</CardTitle>
						<CardAction>
							<Badge variant="secondary">{draft.dishes.length}</Badge>
						</CardAction>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
							{draft.dishes.map((dish) => (
								<CollectedDishCard
									key={dish.id}
									dish={dish}
									onRemove={() => onUncollect(dish.id)}
								/>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Footer */}
			<div className="flex justify-end">
				<Button onClick={onNext} disabled={draft.dishes.length === 0}>
					Next: Assign
					<ArrowRight size={16} />
				</Button>
			</div>
		</div>
	);
}

// ============================================================================
// Sub-components
// ============================================================================

interface LibraryResultsProps {
	searchQuery: string;
	draft: PlanDraft;
	onCollect: (dish: Doc<"dishes">) => void;
}

/** Dish library search results as compact inline pills */
function LibraryResults({
	searchQuery,
	draft,
	onCollect,
}: LibraryResultsProps) {
	const { data: dishes } = useSuspenseQuery(
		convexQuery(api.dishes.search, {
			householdId: HOUSEHOLD_ID,
			query: searchQuery,
		}),
	);

	if (dishes.length === 0) {
		return (
			<p className="text-sm text-muted-foreground text-center py-4">
				{searchQuery ? "No dishes match your search" : "No dishes in library"}
			</p>
		);
	}

	return (
		<div className="flex gap-2 flex-wrap">
			{dishes.map((dish) => {
				const alreadyCollected = isDishCollected(draft, dish._id);
				return (
					<Button
						key={dish._id}
						variant="outline"
						size="sm"
						onClick={() => onCollect(dish)}
						disabled={alreadyCollected}
						className="rounded-full gap-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
					>
						{dish.name}
						{alreadyCollected ? (
							<Badge variant="secondary" className="text-[9px] px-1.5 py-0">
								Added
							</Badge>
						) : (
							<Plus size={12} className="text-muted-foreground/60" />
						)}
					</Button>
				);
			})}
		</div>
	);
}

interface LeftoversSectionProps {
	draft: PlanDraft;
	onCollect: (dish: DraftDish) => void;
}

/** Available leftovers that can be collected */
function LeftoversSection({ draft, onCollect }: LeftoversSectionProps) {
	const { data: sources } = useSuspenseQuery(
		convexQuery(api.mealPlans.getLeftoverSources, {
			householdId: HOUSEHOLD_ID,
		}),
	);

	if (sources.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm text-teal-400 flex items-center gap-2">
					<RefreshCw size={14} />
					Available Leftovers
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex gap-2 flex-wrap">
					{sources.map((source) => {
						const alreadyCollected = draft.dishes.some(
							(d) =>
								d.type === "leftover" &&
								d.sourceMealId === (source.meal._id as Id<"mealPlans">),
						);
						return (
							<Button
								key={source.meal._id}
								variant="outline"
								onClick={() => onCollect(fromLeftover(source))}
								disabled={alreadyCollected}
								className="h-auto gap-2 rounded-lg bg-teal-950/30 border-teal-800/30 hover:border-teal-600/40 disabled:opacity-40"
							>
								<div className="text-left">
									<div className="text-sm font-medium text-card-foreground">
										{source.dish.name}
									</div>
									<div className="text-[10px] text-teal-400">
										{source.available} srv left
									</div>
								</div>
								{!alreadyCollected && (
									<Plus size={14} className="text-teal-600" />
								)}
							</Button>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}

interface CollectedDishCardProps {
	dish: DraftDish;
	onRemove: () => void;
}

/** Card for a dish already in the collection */
function CollectedDishCard({ dish, onRemove }: CollectedDishCardProps) {
	return (
		<div className="group relative flex items-center gap-3 p-3 rounded-lg bg-popover border">
			<div className="min-w-0 flex-1">
				<div className="text-sm font-medium text-card-foreground truncate">
					{dish.name}
				</div>
				<div className="flex items-center gap-1.5 mt-0.5">
					<span className="text-[10px] text-muted-foreground">
						{dish.servings} srv
					</span>
					<Badge variant="secondary" className="text-[9px] px-1.5 py-0">
						{dish.type}
					</Badge>
				</div>
			</div>
			<Button
				variant="ghost"
				size="icon-xs"
				onClick={onRemove}
				aria-label={`Remove ${dish.name}`}
				className="text-muted-foreground hover:text-foreground"
			>
				<X size={14} />
			</Button>
		</div>
	);
}

/** Stable keys for skeleton items */
const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

/** Loading skeleton for library search */
function LibrarySearchSkeleton() {
	return (
		<div className="space-y-2">
			{SKELETON_KEYS.map((key) => (
				<div key={key} className="p-3 bg-card border rounded-lg">
					<Skeleton className="h-5 w-1/2 mb-2" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			))}
		</div>
	);
}
