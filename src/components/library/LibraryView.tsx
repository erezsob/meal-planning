import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { useId, useMemo, useState } from "react";
import { DISH_TAGS, type DishTag, HOUSEHOLD_ID } from "../../../lib/constants";
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
				<button
					type="button"
					onClick={() => setModalDish("add")}
					className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium text-gray-100 transition-colors shrink-0"
				>
					Add dish
				</button>
			</div>

			<div className="flex flex-col gap-4">
				<div className="relative">
					<label htmlFor={searchInputId} className="sr-only">
						Search dishes by name
					</label>
					<input
						id={searchInputId}
						type="search"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search dishes..."
						className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
					/>
					<svg
						className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden
					>
						<title>Search</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>

				<div>
					<span className="sr-only">Filter by tag</span>
					<div className="flex flex-wrap gap-2">
						{(DISH_TAGS as readonly string[]).map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => toggleTag(tag as DishTag)}
								className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
									selectedTags.includes(tag)
										? "bg-emerald-600/30 text-emerald-400 border-emerald-500"
										: "bg-gray-800 text-gray-400 border-gray-600 hover:border-gray-500"
								}`}
							>
								{tag
									.replace(/-/g, " ")
									.replace(/\b\w/g, (c) => c.toUpperCase())}
							</button>
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
				<div className="h-8 bg-gray-700 rounded w-48 animate-pulse" />
				<div className="h-10 bg-gray-700 rounded w-28 animate-pulse" />
			</div>
			<div className="h-10 bg-gray-800 rounded-lg w-full max-w-md animate-pulse" />
			<div className="flex gap-2">
				{["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((key) => (
					<div
						key={key}
						className="h-8 w-24 bg-gray-700 rounded-full animate-pulse"
					/>
				))}
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<DishCardSkeleton count={6} />
			</div>
		</div>
	);
}
