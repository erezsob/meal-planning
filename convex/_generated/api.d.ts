/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `pnpm dev:convex`.
 * @module
 */

import type * as dishes from "../dishes.js";
import type * as mealPlans from "../mealPlans.js";
import type * as planSections from "../planSections.js";
import type * as seed from "../seed.js";
import type * as shoppingList from "../shoppingList.js";
import type * as weekPlans from "../weekPlans.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  dishes: typeof dishes;
  mealPlans: typeof mealPlans;
  planSections: typeof planSections;
  seed: typeof seed;
  shoppingList: typeof shoppingList;
  weekPlans: typeof weekPlans;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
