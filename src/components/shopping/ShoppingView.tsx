import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import type { GroupedShoppingList, ShoppingItem } from "convex/shoppingList";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	formatDateKey,
	getShoppingItemKey,
	getWeekStart,
	HOUSEHOLD_ID,
	INGREDIENT_CATEGORIES,
	SHOPPING_CHECKED_KEY_PREFIX,
} from "../../../lib/constants";
import { WeekHeader } from "../dashboard/WeekHeader";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";

/** Format quantity + unit for display (no conversion per spec) */
function formatQuantity(item: ShoppingItem): string {
	const qty = item.quantity;
	const u = item.unit?.trim();
	if (!u) return `${qty} ${item.name}`;
	return `${qty} ${u} ${item.name}`;
}

interface ShoppingListItemProps {
	item: ShoppingItem;
	startDateKey: string;
	checked: boolean;
	onToggle: (itemKey: string, checked: boolean) => void;
}

/**
 * Single shopping list row with checkbox
 */
function ShoppingListItem({
	item,
	startDateKey,
	checked,
	onToggle,
}: ShoppingListItemProps) {
	const itemKey = getShoppingItemKey(item);
	const id = `shopping-${startDateKey}-${itemKey}`;

	const handleChange = (checkedState: boolean | "indeterminate") => {
		onToggle(itemKey, checkedState === true);
	};

	return (
		<li className="flex items-center gap-3 py-2 px-4 border-b border-border last:border-0">
			<Checkbox
				id={id}
				checked={checked}
				onCheckedChange={handleChange}
				aria-label={`Mark ${item.name} as purchased`}
			/>
			<Label
				htmlFor={id}
				className={`flex-1 cursor-pointer select-none ${
					checked ? "line-through text-muted-foreground" : "text-foreground"
				}`}
			>
				{formatQuantity(item)}
			</Label>
		</li>
	);
}

interface CategorySectionProps {
	category: string;
	items: ShoppingItem[];
	startDateKey: string;
	checked: Record<string, boolean>;
	onToggle: (itemKey: string, checked: boolean) => void;
}

/**
 * Section for one ingredient category
 */
function CategorySection({
	category,
	items,
	startDateKey,
	checked,
	onToggle,
}: CategorySectionProps) {
	const label = categoryLabel(category);
	const headingId = `category-${label.replace(/\s+/g, "-")}`;
	return (
		<section
			className="rounded-xl bg-card/60 border overflow-hidden"
			aria-labelledby={headingId}
		>
			<h2
				id={headingId}
				className="px-4 py-3 text-sm font-semibold text-muted-foreground bg-card/80 border-b"
			>
				{label}
			</h2>
			<ul
				className="divide-y divide-border list-none p-0 m-0"
				aria-label={`${label} items`}
			>
				{items.map((item) => (
					<ShoppingListItem
						key={getShoppingItemKey(item)}
						item={item}
						startDateKey={startDateKey}
						checked={checked[getShoppingItemKey(item)] ?? false}
						onToggle={onToggle}
					/>
				))}
			</ul>
		</section>
	);
}

/**
 * Order categories for display (INGREDIENT_CATEGORIES order, then unknown at end).
 * Empty or unknown category keys display as "Other".
 */
function orderedCategories(grouped: GroupedShoppingList): string[] {
	const known = INGREDIENT_CATEGORIES.filter((c) => grouped[c]?.length);
	const unknown = Object.keys(grouped).filter(
		(c) =>
			!INGREDIENT_CATEGORIES.includes(
				c as (typeof INGREDIENT_CATEGORIES)[number],
			),
	);
	return [...known, ...unknown];
}

/** Display label for category (empty → "Other") */
function categoryLabel(category: string): string {
	return category.trim() || "Other";
}

/**
 * Shopping list: week nav, ingredients grouped by category, checkboxes (persisted per week in localStorage)
 */
export function ShoppingView() {
	const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
	const [checked, setChecked] = useState<Record<string, boolean>>({});

	const startDateKey = formatDateKey(weekStart);
	const storageKey = `${SHOPPING_CHECKED_KEY_PREFIX}-${startDateKey}`;

	useEffect(() => {
		try {
			const raw = localStorage.getItem(storageKey);
			setChecked(raw ? JSON.parse(raw) : {});
		} catch {
			setChecked({});
		}
	}, [storageKey]);

	const { data: grouped } = useSuspenseQuery(
		convexQuery(api.shoppingList.getWeekShoppingList, {
			householdId: HOUSEHOLD_ID,
			startDate: startDateKey,
		}),
	);

	const categories = useMemo(() => orderedCategories(grouped), [grouped]);

	const handleToggle = useCallback(
		(itemKey: string, value: boolean) => {
			setChecked((prev) => {
				const next = { ...prev, [itemKey]: value };
				try {
					localStorage.setItem(storageKey, JSON.stringify(next));
				} catch {
					// ignore quota / private mode
				}
				return next;
			});
		},
		[storageKey],
	);

	const navigateWeek = useCallback((direction: -1 | 1) => {
		setWeekStart((prev) => {
			const next = new Date(prev);
			next.setDate(next.getDate() + direction * 7);
			return next;
		});
	}, []);

	const totalItems = useMemo(
		() => Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0),
		[grouped],
	);

	return (
		<div className="space-y-6">
			<WeekHeader
				title="Shopping List"
				weekStart={weekStart}
				onPrevious={() => navigateWeek(-1)}
				onNext={() => navigateWeek(1)}
				onToday={() => setWeekStart(getWeekStart(new Date()))}
			/>

			{totalItems === 0 ? (
				<p className="text-muted-foreground py-8 text-center">
					No meals planned for this week. Add meals on the dashboard to see
					ingredients here.
				</p>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{categories.map((category) => (
						<CategorySection
							key={category}
							category={category}
							items={grouped[category] ?? []}
							startDateKey={startDateKey}
							checked={checked}
							onToggle={handleToggle}
						/>
					))}
				</div>
			)}
		</div>
	);
}

/**
 * Loading fallback for shopping list
 */
export function ShoppingViewSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-2">
					<Skeleton className="h-10 w-10" />
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-10" />
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{["Produce", "Dairy", "Pantry"].map((label) => (
					<div key={label} className="rounded-xl bg-card/60 border p-4">
						<Skeleton className="h-5 w-24 mb-4" />
						<div className="space-y-2">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-4 w-full" />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
