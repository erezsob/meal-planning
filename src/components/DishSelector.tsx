import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { RefreshCw, Search, UtensilsCrossed } from "lucide-react";
import { Suspense, useId, useState } from "react";
import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/lib/components/dialog";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Skeleton } from "@/lib/components/skeleton";
import { HOUSEHOLD_ID } from "../../lib/constants";
import { TagList } from "./TagBadge";

/** Leftover source - inferred from Convex query return type */
type LeftoverSource = FunctionReturnType<
	typeof api.mealPlans.getLeftoverSources
>[number];

interface DishSelectorProps {
	/** Whether the selector modal is open */
	isOpen: boolean;
	/** Called when closing the modal */
	onClose: () => void;
	/** Called when a dish is selected */
	onSelectDish: (dish: Doc<"dishes">) => void;
	/** Called when a custom meal name is entered */
	onSelectCustom: (name: string) => void;
	/** Available leftover sources to show */
	leftoverSources?: LeftoverSource[];
	/** Called when selecting a leftover */
	onSelectLeftover?: (
		sourceMealId: Id<"mealPlans">,
		dish: Doc<"dishes">,
		available: number,
	) => void;
	/** Optional content rendered below header (e.g. role picker) */
	headerContent?: React.ReactNode;
}

/**
 * Modal for selecting a dish, entering custom meal, or choosing leftovers
 */
export function DishSelector({
	isOpen,
	onClose,
	onSelectDish,
	onSelectCustom,
	leftoverSources = [],
	onSelectLeftover,
	headerContent,
}: DishSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [customName, setCustomName] = useState("");
	const [activeTab, setActiveTab] = useState<"dishes" | "custom" | "leftovers">(
		"dishes",
	);

	// Compute effective tab - reset to "dishes" if leftovers tab selected but no leftovers available
	const hasLeftovers = leftoverSources.length > 0;
	const effectiveTab =
		activeTab === "leftovers" && !hasLeftovers ? "dishes" : activeTab;

	if (!isOpen) return null;

	const handleCustomSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (customName.trim()) {
			onSelectCustom(customName.trim());
			setCustomName("");
			onClose();
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col gap-0 p-0">
				<DialogHeader className="p-4 pb-0">
					<DialogTitle>Add Meal</DialogTitle>
				</DialogHeader>

				{headerContent && (
					<div className="px-4 pt-2 pb-3 border-b">{headerContent}</div>
				)}

				{/* Tabs */}
				<div className="flex border-b">
					<button
						type="button"
						onClick={() => setActiveTab("dishes")}
						className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							effectiveTab === "dishes"
								? "text-primary border-b-2 border-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<UtensilsCrossed size={16} className="inline mr-2" />
						From Library
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("custom")}
						className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							effectiveTab === "custom"
								? "text-primary border-b-2 border-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						Custom Meal
					</button>
					{hasLeftovers && (
						<button
							type="button"
							onClick={() => setActiveTab("leftovers")}
							className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
								effectiveTab === "leftovers"
									? "text-primary border-b-2 border-primary"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<RefreshCw size={16} className="inline mr-2" />
							Leftovers ({leftoverSources.length})
						</button>
					)}
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					{effectiveTab === "dishes" && (
						<>
							{/* Search */}
							<div className="relative mb-4">
								<Search
									size={18}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search dishes..."
									className="pl-10"
								/>
							</div>

							{/* Dish list */}
							<Suspense fallback={<DishListSkeleton />}>
								<DishList
									searchQuery={searchQuery}
									onSelect={(dish) => {
										onSelectDish(dish);
									}}
								/>
							</Suspense>
						</>
					)}

					{effectiveTab === "custom" && (
						<CustomMealForm
							customName={customName}
							setCustomName={setCustomName}
							onSubmit={handleCustomSubmit}
						/>
					)}

					{effectiveTab === "leftovers" && (
						<div className="space-y-2">
							{leftoverSources.map(({ meal, dish, available }) => (
								<button
									key={meal._id}
									type="button"
									onClick={() => {
										onSelectLeftover?.(
											meal._id as Id<"mealPlans">,
											dish,
											available,
										);
										onClose();
									}}
									className="w-full p-3 flex items-center justify-between bg-card hover:bg-accent border rounded-lg transition-colors text-left"
								>
									<div>
										<p className="font-medium text-foreground">{dish.name}</p>
										<p className="text-sm text-muted-foreground">
											Cooked on {meal.day}
										</p>
									</div>
									<span className="text-sm text-teal-400 font-medium">
										{available} left
									</span>
								</button>
							))}
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

interface CustomMealFormProps {
	customName: string;
	setCustomName: (name: string) => void;
	onSubmit: (e: React.FormEvent) => void;
}

/**
 * Form for entering a custom meal name
 */
function CustomMealForm({
	customName,
	setCustomName,
	onSubmit,
}: CustomMealFormProps) {
	const inputId = useId();

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div>
				<Label htmlFor={inputId} className="mb-2">
					Meal Name
				</Label>
				<Input
					id={inputId}
					type="text"
					value={customName}
					onChange={(e) => setCustomName(e.target.value)}
					placeholder="e.g., Takeout, Restaurant, etc."
					autoFocus
				/>
			</div>
			<Button type="submit" disabled={!customName.trim()} className="w-full">
				Add Custom Meal
			</Button>
		</form>
	);
}

interface DishListProps {
	searchQuery: string;
	onSelect: (dish: Doc<"dishes">) => void;
}

/**
 * List of dishes from the library
 */
function DishList({ searchQuery, onSelect }: DishListProps) {
	const { data: dishes } = useSuspenseQuery(
		convexQuery(api.dishes.search, {
			householdId: HOUSEHOLD_ID,
			query: searchQuery,
		}),
	);

	if (dishes.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				{searchQuery
					? "No dishes match your search"
					: "No dishes in library yet"}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{dishes.map((dish) => (
				<button
					key={dish._id}
					type="button"
					onClick={() => onSelect(dish)}
					className="w-full p-3 flex flex-col items-start bg-card hover:bg-accent border rounded-lg transition-colors text-left"
				>
					<span className="font-medium text-foreground">{dish.name}</span>
					{dish.description && (
						<span className="text-sm text-muted-foreground line-clamp-1">
							{dish.description}
						</span>
					)}
					{(dish.tags?.length ?? 0) > 0 && (
						<div className="mt-2">
							<TagList tags={dish.tags ?? []} maxVisible={3} />
						</div>
					)}
				</button>
			))}
		</div>
	);
}

/** Stable keys for dish list skeleton */
const DISH_LIST_SKELETON_KEYS = ["dl-sk-1", "dl-sk-2", "dl-sk-3"] as const;

/**
 * Loading skeleton for dish list
 */
function DishListSkeleton() {
	return (
		<div className="space-y-2">
			{DISH_LIST_SKELETON_KEYS.map((key) => (
				<div key={key} className="p-3 bg-card border rounded-lg">
					<Skeleton className="h-5 w-1/2 mb-2" />
					<Skeleton className="h-4 w-3/4" />
				</div>
			))}
		</div>
	);
}
