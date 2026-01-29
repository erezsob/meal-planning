import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { RefreshCw, Search, UtensilsCrossed, X } from "lucide-react";
import { Suspense, useEffect, useId, useRef, useState } from "react";
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
}: DishSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [customName, setCustomName] = useState("");
	const [activeTab, setActiveTab] = useState<"dishes" | "custom" | "leftovers">(
		"dishes",
	);

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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Escape" && onClose()}
				aria-hidden="true"
			/>

			{/* Modal */}
			<div className="relative w-full max-w-lg max-h-[80vh] flex flex-col bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<h2 className="text-lg font-semibold text-gray-100">Add Meal</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-gray-700">
					<button
						type="button"
						onClick={() => setActiveTab("dishes")}
						className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === "dishes"
								? "text-emerald-400 border-b-2 border-emerald-400"
								: "text-gray-400 hover:text-gray-200"
						}`}
					>
						<UtensilsCrossed size={16} className="inline mr-2" />
						From Library
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("custom")}
						className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
							activeTab === "custom"
								? "text-emerald-400 border-b-2 border-emerald-400"
								: "text-gray-400 hover:text-gray-200"
						}`}
					>
						Custom Meal
					</button>
					{leftoverSources.length > 0 && (
						<button
							type="button"
							onClick={() => setActiveTab("leftovers")}
							className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
								activeTab === "leftovers"
									? "text-emerald-400 border-b-2 border-emerald-400"
									: "text-gray-400 hover:text-gray-200"
							}`}
						>
							<RefreshCw size={16} className="inline mr-2" />
							Leftovers ({leftoverSources.length})
						</button>
					)}
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					{activeTab === "dishes" && (
						<>
							{/* Search */}
							<div className="relative mb-4">
								<Search
									size={18}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
								/>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									placeholder="Search dishes..."
									className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
								/>
							</div>

							{/* Dish list */}
							<Suspense fallback={<DishListSkeleton />}>
								<DishList
									searchQuery={searchQuery}
									onSelect={(dish) => {
										onSelectDish(dish);
										onClose();
									}}
								/>
							</Suspense>
						</>
					)}

					{activeTab === "custom" && (
						<CustomMealForm
							customName={customName}
							setCustomName={setCustomName}
							onSubmit={handleCustomSubmit}
						/>
					)}

					{activeTab === "leftovers" && (
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
									className="w-full p-3 flex items-center justify-between bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition-colors text-left"
								>
									<div>
										<p className="font-medium text-gray-100">{dish.name}</p>
										<p className="text-sm text-gray-400">
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
			</div>
		</div>
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
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div>
				<label
					htmlFor={inputId}
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					Meal Name
				</label>
				<input
					ref={inputRef}
					id={inputId}
					type="text"
					value={customName}
					onChange={(e) => setCustomName(e.target.value)}
					placeholder="e.g., Takeout, Restaurant, etc."
					className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500"
				/>
			</div>
			<button
				type="submit"
				disabled={!customName.trim()}
				className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors"
			>
				Add Custom Meal
			</button>
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
			<div className="text-center py-8 text-gray-500">
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
					className="w-full p-3 flex flex-col items-start bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg transition-colors text-left"
				>
					<span className="font-medium text-gray-100">{dish.name}</span>
					{dish.description && (
						<span className="text-sm text-gray-400 line-clamp-1">
							{dish.description}
						</span>
					)}
					{dish.tags.length > 0 && (
						<div className="mt-2">
							<TagList tags={dish.tags} maxVisible={3} />
						</div>
					)}
				</button>
			))}
		</div>
	);
}

/**
 * Loading skeleton for dish list
 */
function DishListSkeleton() {
	return (
		<div className="space-y-2">
			{Array.from({ length: 3 }).map(() => {
				const key = `dish-list-skeleton-${crypto.randomUUID()}`;
				return (
					<div
						key={key}
						className="p-3 bg-gray-800 border border-gray-700 rounded-lg animate-pulse"
					>
						<div className="h-5 bg-gray-700 rounded w-1/2 mb-2" />
						<div className="h-4 bg-gray-700 rounded w-3/4" />
					</div>
				);
			})}
		</div>
	);
}
