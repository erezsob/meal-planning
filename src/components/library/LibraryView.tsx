import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import { Skeleton } from "@/lib/components/skeleton";
import { DISH_TAGS, type DishTag, HOUSEHOLD_ID } from "@/lib/constants";
import { DishCard, DishCardSkeleton } from "../DishCard";
import { DishFormModal } from "./DishFormModal";

/**
 * Filter dishes by search query and selected tags (client-side)
 */
function filterDishes(
	dishes: Doc<"dishes">[],
	searchQuery: string,
	selectedTags: string[],
): Doc<"dishes">[] {
	const searchLower = searchQuery.trim().toLowerCase();
	return dishes.filter((dish) => {
		const matchesSearch =
			!searchLower || dish.name.toLowerCase().includes(searchLower);
		const matchesTags =
			selectedTags.length === 0 ||
			selectedTags.some((t) => (dish.tags ?? []).includes(t));
		return matchesSearch && matchesTags;
	});
}

/**
 * Recipe library: grid of dish cards, search, tag filters, add/edit modal
 */
export function LibraryView() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [modalDish, setModalDish] = useState<Doc<"dishes"> | null | "add">(
		null,
	);
	const searchInputId = useId();

	const { data: dishes } = useSuspenseQuery(
		convexQuery(api.dishes.getAll, { householdId: HOUSEHOLD_ID }),
	);

	const filteredDishes = useMemo(
		() => filterDishes(dishes, searchQuery, selectedTags),
		[dishes, searchQuery, selectedTags],
	);

	const toggleTag = (tag: DishTag) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h1 className="text-2xl font-bold text-gray-100">Recipe Library</h1>
				<Button onClick={() => setModalDish("add")} className="shrink-0">
					Add dish
				</Button>
			</div>

			<div className="flex flex-col gap-4">
				<div className="relative">
					<label htmlFor={searchInputId} className="sr-only">
						Search dishes by name
					</label>
					<Search
						size={18}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<Input
						id={searchInputId}
						type="search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search dishes..."
						className="pl-10"
					/>
				</div>

				<div>
					<span className="sr-only">Filter by tag</span>
					<div className="flex flex-wrap gap-2">
						{(DISH_TAGS as readonly string[]).map((tag) => (
							<Button
								key={tag}
								variant={selectedTags.includes(tag) ? "default" : "outline"}
								size="sm"
								onClick={() => toggleTag(tag as DishTag)}
								className={
									selectedTags.includes(tag)
										? "bg-primary/30 text-primary border-primary"
										: ""
								}
							>
								{tag
									.replace(/-/g, " ")
									.replace(/\b\w/g, (c) => c.toUpperCase())}
							</Button>
						))}
					</div>
				</div>
			</div>

			{filteredDishes.length === 0 ? (
				<p className="text-gray-400 py-8 text-center">
					{dishes.length === 0
						? "No dishes yet. Add one to get started."
						: "No dishes match your search or filters."}
				</p>
			) : (
				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
					{filteredDishes.map((dish) => (
						<li key={dish._id}>
							<DishCard dish={dish} onClick={() => setModalDish(dish)} />
						</li>
					))}
				</ul>
			)}

			{modalDish !== null && (
				<DishFormModal
					dish={modalDish === "add" ? null : modalDish}
					onClose={() => setModalDish(null)}
				/>
			)}
		</div>
	);
}

/**
 * Loading fallback for library (skeleton grid)
 */
export function LibraryViewSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-28" />
			</div>
			<Skeleton className="h-10 w-full max-w-md rounded-lg" />
			<div className="flex gap-2">
				{["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((key) => (
					<Skeleton key={key} className="h-8 w-24 rounded-full" />
				))}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<DishCardSkeleton count={6} />
			</div>
		</div>
	);
}
