import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { Search, UtensilsCrossed } from "lucide-react";
import { Suspense, useId, useState } from "react";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Skeleton } from "@/lib/components/skeleton";
import {
	formatDateKey,
	HOUSEHOLD_ID,
	inferMealType,
	MEAL_TYPE_LABELS,
	MEAL_TYPES,
	type MealType,
} from "@/lib/constants";
import { TagList } from "../TagBadge";

export interface LogMealFormValues {
	day: string;
	mealType: MealType;
	dishId?: Id<"dishes">;
	customName?: string;
}

interface LogMealFormProps {
	/** Initial values for edit mode */
	initialValues?: Partial<LogMealFormValues> & {
		dish?: Doc<"dishes"> | null;
	};
	/** Submit button label */
	submitLabel?: string;
	onSubmit: (values: LogMealFormValues) => void;
	onCancel: () => void;
}

type InputTab = "custom" | "library";

/**
 * Shared form for logging or editing an eaten meal.
 */
export function LogMealForm({
	initialValues,
	submitLabel = "Log meal",
	onSubmit,
	onCancel,
}: LogMealFormProps) {
	const today = formatDateKey(new Date());
	const [day, setDay] = useState(initialValues?.day ?? today);
	const [mealType, setMealType] = useState<MealType>(
		initialValues?.mealType ?? inferMealType(),
	);
	const [activeTab, setActiveTab] = useState<InputTab>(
		initialValues?.dishId || initialValues?.dish ? "library" : "custom",
	);
	const [customName, setCustomName] = useState(initialValues?.customName ?? "");
	const [selectedDish, setSelectedDish] = useState<Doc<"dishes"> | null>(
		initialValues?.dish ?? null,
	);
	const [searchQuery, setSearchQuery] = useState("");

	const dateId = useId();
	const customNameId = useId();
	const librarySearchId = useId();
	const customTabId = useId();
	const libraryTabId = useId();
	const customPanelId = useId();
	const libraryPanelId = useId();

	const canSubmit =
		activeTab === "custom"
			? customName.trim().length > 0
			: selectedDish !== null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!canSubmit) return;

		if (activeTab === "custom") {
			onSubmit({ day, mealType, customName: customName.trim() });
			return;
		}

		if (selectedDish) {
			onSubmit({ day, mealType, dishId: selectedDish._id });
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div>
					<Label htmlFor={dateId} className="mb-1">
						Date
					</Label>
					<Input
						id={dateId}
						type="date"
						value={day}
						max={today}
						onChange={(e) => setDay(e.target.value)}
						required
					/>
				</div>
				<fieldset>
					<legend className="mb-1 block text-sm font-medium">Meal</legend>
					<div className="flex gap-1">
						{MEAL_TYPES.map((type) => (
							<Button
								key={type}
								type="button"
								variant={mealType === type ? "default" : "secondary"}
								size="sm"
								className="flex-1 px-2 text-xs"
								onClick={() => setMealType(type)}
								aria-pressed={mealType === type}
							>
								{MEAL_TYPE_LABELS[type]}
							</Button>
						))}
					</div>
				</fieldset>
			</div>

			<div className="flex border-b" role="tablist" aria-label="Meal source">
				<button
					type="button"
					id={customTabId}
					role="tab"
					aria-selected={activeTab === "custom"}
					aria-controls={customPanelId}
					onClick={() => setActiveTab("custom")}
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "custom"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Custom
				</button>
				<button
					type="button"
					id={libraryTabId}
					role="tab"
					aria-selected={activeTab === "library"}
					aria-controls={libraryPanelId}
					onClick={() => setActiveTab("library")}
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
						activeTab === "library"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					<UtensilsCrossed size={14} className="mr-1 inline" />
					Library
				</button>
			</div>

			{activeTab === "custom" ? (
				<div id={customPanelId} role="tabpanel" aria-labelledby={customTabId}>
					<Label htmlFor={customNameId} className="mb-1">
						What did you eat?
					</Label>
					<Input
						id={customNameId}
						type="text"
						value={customName}
						onChange={(e) => setCustomName(e.target.value)}
						placeholder="e.g., Takeout, Restaurant, etc."
						autoFocus
					/>
				</div>
			) : (
				<div
					id={libraryPanelId}
					role="tabpanel"
					aria-labelledby={libraryTabId}
					className="space-y-3"
				>
					<div className="relative">
						<Label htmlFor={librarySearchId} className="sr-only">
							Search dishes
						</Label>
						<Search
							size={18}
							className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id={librarySearchId}
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search dishes..."
							className="pl-10"
						/>
					</div>
					{selectedDish && (
						<p className="text-sm text-primary">
							Selected: <span className="font-medium">{selectedDish.name}</span>
						</p>
					)}
					<div className="max-h-48 overflow-y-auto">
						<Suspense fallback={<DishListSkeleton />}>
							<LogDishList
								searchQuery={searchQuery}
								selectedDishId={selectedDish?._id}
								onSelect={setSelectedDish}
							/>
						</Suspense>
					</div>
				</div>
			)}

			<div className="flex gap-2 pt-2">
				<Button
					type="button"
					variant="secondary"
					onClick={onCancel}
					className="flex-1"
				>
					Cancel
				</Button>
				<Button type="submit" disabled={!canSubmit} className="flex-1">
					{submitLabel}
				</Button>
			</div>
		</form>
	);
}

interface LogDishListProps {
	searchQuery: string;
	selectedDishId?: Id<"dishes">;
	onSelect: (dish: Doc<"dishes">) => void;
}

function LogDishList({
	searchQuery,
	selectedDishId,
	onSelect,
}: LogDishListProps) {
	const { data: dishes } = useSuspenseQuery(
		convexQuery(api.dishes.search, {
			householdId: HOUSEHOLD_ID,
			query: searchQuery,
		}),
	);

	if (dishes.length === 0) {
		return (
			<p className="py-4 text-center text-sm text-muted-foreground">
				{searchQuery
					? "No dishes match your search"
					: "No dishes in library yet"}
			</p>
		);
	}

	return (
		<div className="space-y-2">
			{dishes.map((dish) => (
				<button
					key={dish._id}
					type="button"
					onClick={() => onSelect(dish)}
					className={`w-full rounded-lg border p-3 text-left transition-colors ${
						selectedDishId === dish._id
							? "border-primary bg-primary/10"
							: "bg-card hover:bg-accent"
					}`}
				>
					<span className="font-medium text-foreground">{dish.name}</span>
					{(dish.tags?.length ?? 0) > 0 && (
						<div className="mt-1">
							<TagList tags={dish.tags ?? []} maxVisible={3} />
						</div>
					)}
				</button>
			))}
		</div>
	);
}

const DISH_SKELETON_KEYS = ["log-sk-1", "log-sk-2"] as const;

function DishListSkeleton() {
	return (
		<div className="space-y-2">
			{DISH_SKELETON_KEYS.map((key) => (
				<Skeleton key={key} className="h-12 w-full rounded-lg" />
			))}
		</div>
	);
}
