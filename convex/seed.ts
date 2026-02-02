import { v } from "convex/values";
import { mutation } from "./_generated/server";

const SAMPLE_DISHES = [
	{
		name: "Spaghetti Bolognese",
		description: "Classic Italian pasta with rich meat sauce",
		ingredients: [
			{ name: "Spaghetti", quantity: 400, unit: "g", category: "pasta" },
			{ name: "Ground beef", quantity: 500, unit: "g", category: "meat" },
			{
				name: "Crushed tomatoes",
				quantity: 400,
				unit: "g",
				category: "canned",
			},
			{ name: "Onion", quantity: 1, unit: "medium", category: "produce" },
			{ name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
			{ name: "Olive oil", quantity: 2, unit: "tbsp", category: "oils" },
			{ name: "Parmesan", quantity: 50, unit: "g", category: "dairy" },
		],
		tags: ["italian", "pasta", "dinner", "comfort food"],
		defaultServings: 4,
	},
	{
		name: "Chicken Stir Fry",
		description: "Quick Asian-style stir fry with vegetables",
		ingredients: [
			{ name: "Chicken breast", quantity: 500, unit: "g", category: "meat" },
			{
				name: "Bell peppers",
				quantity: 2,
				unit: "medium",
				category: "produce",
			},
			{ name: "Broccoli", quantity: 200, unit: "g", category: "produce" },
			{ name: "Soy sauce", quantity: 3, unit: "tbsp", category: "condiments" },
			{ name: "Sesame oil", quantity: 1, unit: "tbsp", category: "oils" },
			{ name: "Ginger", quantity: 1, unit: "inch", category: "produce" },
			{ name: "Rice", quantity: 300, unit: "g", category: "grains" },
		],
		tags: ["asian", "quick", "healthy", "dinner"],
		defaultServings: 4,
	},
	{
		name: "Caesar Salad",
		description: "Crisp romaine with classic Caesar dressing",
		ingredients: [
			{
				name: "Romaine lettuce",
				quantity: 2,
				unit: "heads",
				category: "produce",
			},
			{ name: "Parmesan", quantity: 100, unit: "g", category: "dairy" },
			{ name: "Croutons", quantity: 100, unit: "g", category: "bread" },
			{
				name: "Caesar dressing",
				quantity: 120,
				unit: "ml",
				category: "condiments",
			},
			{ name: "Lemon", quantity: 1, unit: "whole", category: "produce" },
		],
		tags: ["salad", "lunch", "quick", "vegetarian"],
		defaultServings: 4,
	},
	{
		name: "Grilled Salmon",
		description: "Simple grilled salmon with lemon and herbs",
		ingredients: [
			{
				name: "Salmon fillets",
				quantity: 4,
				unit: "pieces",
				category: "seafood",
			},
			{ name: "Lemon", quantity: 2, unit: "whole", category: "produce" },
			{ name: "Dill", quantity: 2, unit: "tbsp", category: "herbs" },
			{ name: "Olive oil", quantity: 2, unit: "tbsp", category: "oils" },
			{ name: "Garlic", quantity: 2, unit: "cloves", category: "produce" },
		],
		tags: ["seafood", "healthy", "dinner", "quick"],
		defaultServings: 4,
	},
	{
		name: "Vegetable Curry",
		description: "Creamy coconut curry with mixed vegetables",
		ingredients: [
			{ name: "Coconut milk", quantity: 400, unit: "ml", category: "canned" },
			{
				name: "Curry paste",
				quantity: 3,
				unit: "tbsp",
				category: "condiments",
			},
			{ name: "Potatoes", quantity: 300, unit: "g", category: "produce" },
			{ name: "Chickpeas", quantity: 400, unit: "g", category: "canned" },
			{ name: "Spinach", quantity: 200, unit: "g", category: "produce" },
			{ name: "Onion", quantity: 1, unit: "large", category: "produce" },
			{ name: "Basmati rice", quantity: 300, unit: "g", category: "grains" },
		],
		tags: ["indian", "vegetarian", "vegan", "dinner"],
		defaultServings: 4,
	},
	{
		name: "Tacos",
		description: "Mexican-style tacos with seasoned ground beef",
		ingredients: [
			{ name: "Ground beef", quantity: 500, unit: "g", category: "meat" },
			{ name: "Taco shells", quantity: 12, unit: "shells", category: "bread" },
			{ name: "Lettuce", quantity: 1, unit: "head", category: "produce" },
			{ name: "Tomatoes", quantity: 2, unit: "medium", category: "produce" },
			{ name: "Cheddar cheese", quantity: 150, unit: "g", category: "dairy" },
			{ name: "Sour cream", quantity: 100, unit: "g", category: "dairy" },
			{
				name: "Taco seasoning",
				quantity: 1,
				unit: "packet",
				category: "spices",
			},
		],
		tags: ["mexican", "dinner", "family friendly"],
		defaultServings: 4,
	},
	{
		name: "Pancakes",
		description: "Fluffy breakfast pancakes",
		ingredients: [
			{ name: "Flour", quantity: 200, unit: "g", category: "baking" },
			{ name: "Eggs", quantity: 2, unit: "large", category: "dairy" },
			{ name: "Milk", quantity: 300, unit: "ml", category: "dairy" },
			{ name: "Butter", quantity: 50, unit: "g", category: "dairy" },
			{
				name: "Maple syrup",
				quantity: 100,
				unit: "ml",
				category: "condiments",
			},
			{ name: "Baking powder", quantity: 2, unit: "tsp", category: "baking" },
		],
		tags: ["breakfast", "sweet", "family friendly"],
		defaultServings: 4,
	},
	{
		name: "Greek Salad",
		description: "Fresh Mediterranean salad with feta",
		ingredients: [
			{ name: "Cucumber", quantity: 1, unit: "large", category: "produce" },
			{ name: "Tomatoes", quantity: 4, unit: "medium", category: "produce" },
			{ name: "Red onion", quantity: 1, unit: "small", category: "produce" },
			{ name: "Feta cheese", quantity: 200, unit: "g", category: "dairy" },
			{ name: "Kalamata olives", quantity: 100, unit: "g", category: "canned" },
			{ name: "Olive oil", quantity: 4, unit: "tbsp", category: "oils" },
		],
		tags: ["greek", "salad", "vegetarian", "lunch", "healthy"],
		defaultServings: 4,
	},
	{
		name: "Beef Burgers",
		description: "Homemade beef burgers with all the fixings",
		ingredients: [
			{ name: "Ground beef", quantity: 600, unit: "g", category: "meat" },
			{ name: "Burger buns", quantity: 4, unit: "buns", category: "bread" },
			{ name: "Lettuce", quantity: 4, unit: "leaves", category: "produce" },
			{ name: "Tomato", quantity: 1, unit: "large", category: "produce" },
			{
				name: "Cheddar cheese",
				quantity: 4,
				unit: "slices",
				category: "dairy",
			},
			{ name: "Onion", quantity: 1, unit: "medium", category: "produce" },
			{ name: "Pickles", quantity: 8, unit: "slices", category: "condiments" },
		],
		tags: ["american", "dinner", "grilling", "family friendly"],
		defaultServings: 4,
	},
	{
		name: "Oatmeal",
		description: "Warm oatmeal with fruits and honey",
		ingredients: [
			{ name: "Rolled oats", quantity: 200, unit: "g", category: "grains" },
			{ name: "Milk", quantity: 400, unit: "ml", category: "dairy" },
			{ name: "Banana", quantity: 2, unit: "medium", category: "produce" },
			{ name: "Honey", quantity: 2, unit: "tbsp", category: "condiments" },
			{ name: "Blueberries", quantity: 100, unit: "g", category: "produce" },
		],
		tags: ["breakfast", "healthy", "quick"],
		defaultServings: 2,
	},
	{
		name: "Mushroom Risotto",
		description: "Creamy Italian risotto with mixed mushrooms",
		ingredients: [
			{ name: "Arborio rice", quantity: 300, unit: "g", category: "grains" },
			{
				name: "Mixed mushrooms",
				quantity: 300,
				unit: "g",
				category: "produce",
			},
			{ name: "Vegetable broth", quantity: 1, unit: "L", category: "canned" },
			{ name: "White wine", quantity: 150, unit: "ml", category: "alcohol" },
			{ name: "Parmesan", quantity: 80, unit: "g", category: "dairy" },
			{ name: "Butter", quantity: 50, unit: "g", category: "dairy" },
			{ name: "Shallots", quantity: 2, unit: "medium", category: "produce" },
		],
		tags: ["italian", "vegetarian", "dinner", "comfort food"],
		defaultServings: 4,
	},
	{
		name: "Avocado Toast",
		description: "Simple avocado toast with eggs",
		ingredients: [
			{
				name: "Sourdough bread",
				quantity: 4,
				unit: "slices",
				category: "bread",
			},
			{ name: "Avocado", quantity: 2, unit: "ripe", category: "produce" },
			{ name: "Eggs", quantity: 4, unit: "large", category: "dairy" },
			{
				name: "Cherry tomatoes",
				quantity: 100,
				unit: "g",
				category: "produce",
			},
			{
				name: "Red pepper flakes",
				quantity: 1,
				unit: "tsp",
				category: "spices",
			},
		],
		tags: ["breakfast", "lunch", "quick", "vegetarian"],
		defaultServings: 2,
	},
];

/**
 * Seed the dishes table with sample data.
 * Run from Convex dashboard or via: npx convex run seed:seedDishes '{"householdId": "your-household-id"}'
 */
export const seedDishes = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		const insertedIds = [];

		for (const dish of SAMPLE_DISHES) {
			const id = await ctx.db.insert("dishes", {
				...dish,
				householdId: args.householdId,
			});
			insertedIds.push(id);
		}

		return {
			message: `Seeded ${insertedIds.length} dishes`,
			ids: insertedIds,
		};
	},
});

/**
 * Clear all dishes for a household (use with caution!)
 */
export const clearDishes = mutation({
	args: { householdId: v.string() },
	handler: async (ctx, args) => {
		const dishes = await ctx.db
			.query("dishes")
			.withIndex("by_householdId", (q) => q.eq("householdId", args.householdId))
			.collect();

		for (const dish of dishes) {
			await ctx.db.delete(dish._id);
		}

		return { message: `Deleted ${dishes.length} dishes` };
	},
});
