# Architecture

## Overview

Meal Planning App - weekly meal planner with recipe library and auto-generated shopping lists.

**Stack:**
- Frontend: TanStack Start (React 19) + Tailwind CSS v4
- Backend: Convex (real-time document DB + serverless functions)
- Deploy: Cloudflare Workers (via Vite plugin)
- Tooling: TypeScript strict, Biome (lint/format), Vitest

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              TanStack Start (React 19)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │ │
│  │  │ Calendar │  │ Library  │  │     Shopping List      │ │ │
│  │  │  (home)  │  │ /library │  │       /shopping        │ │ │
│  │  └────┬─────┘  └────┬─────┘  └───────────┬────────────┘ │ │
│  │       │             │                    │              │ │
│  │       └─────────────┴────────────────────┘              │ │
│  │                      │                                   │ │
│  │        ┌─────────────▼─────────────────┐                │ │
│  │        │   TanStack Query + Convex     │                │ │
│  │        │   (real-time subscriptions)   │                │ │
│  │        └─────────────┬─────────────────┘                │ │
│  └──────────────────────│──────────────────────────────────┘ │
└─────────────────────────│────────────────────────────────────┘
                          │ WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────────┐  │
│  │    dishes     │ │   mealPlans   │ │    shoppingList   │  │
│  │   (queries/   │ │   (queries/   │ │     (query)       │  │
│  │   mutations)  │ │   mutations)  │ │                   │  │
│  └───────┬───────┘ └───────┬───────┘ └─────────┬─────────┘  │
│          │                 │                   │             │
│          └─────────────────┴───────────────────┘             │
│                            │                                 │
│                    ┌───────▼───────┐                         │
│                    │   Document DB │                         │
│                    │  (dishes,     │                         │
│                    │   mealPlans,  │                         │
│                    │   tasks)      │                         │
│                    └───────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
.
├── convex/               # Backend (Convex functions + schema)
│   ├── schema.ts         # Database schema definitions
│   ├── dishes.ts         # Dish CRUD queries/mutations
│   ├── mealPlans.ts      # Meal planning queries/mutations
│   ├── shoppingList.ts   # Shopping list aggregation query
│   └── _generated/       # Auto-generated types
├── lib/                  # Shared code
│   ├── components/       # shadcn/ui primitives
│   ├── constants.ts      # App constants, types, date utils
│   ├── utils.ts          # Tailwind merge helper
│   ├── fp.ts             # Functional programming helpers
│   └── errors.ts         # Error utilities
├── src/
│   ├── routes/           # TanStack file-based routes
│   │   ├── __root.tsx    # Root layout + shell
│   │   ├── index.tsx     # / → Dashboard
│   │   ├── library.tsx   # /library → LibraryView
│   │   └── shopping.tsx  # /shopping → ShoppingView
│   ├── components/       # Feature components
│   │   ├── dashboard/    # Calendar, meal modals
│   │   ├── library/      # Dish list, form modal
│   │   └── shopping/     # Shopping list view
│   ├── router.tsx        # TanStack router setup + Convex provider
│   └── styles.css        # Tailwind CSS entry
└── .docs/                # Project documentation
```

## Data Model

### Schema (convex/schema.ts)

**dishes** - Recipe/dish definitions
| Field           | Type         | Description               |
| --------------- | ------------ | ------------------------- |
| name            | string       | Dish name                 |
| description     | string?      | Optional description      |
| ingredients     | Ingredient[] | List of ingredients       |
| tags            | string[]?    | Diet/nutrition tags       |
| defaultServings | number?      | Default servings per cook |
| sourceUrl       | string?      | Recipe source URL         |
| householdId     | string?      | Multi-tenant identifier   |

**Ingredient** object:
- name: string
- quantity: number
- unit: string?
- category: string? (Produce, Dairy, Meat, etc.)

**mealPlans** - Planned meals on calendar
| Field         | Type                                                | Description                         |
| ------------- | --------------------------------------------------- | ----------------------------------- |
| day           | string (YYYY-MM-DD)                                 | Calendar date                       |
| mealType      | "breakfast" \| "lunch" \| "dinner"                  | Slot type                           |
| componentRole | "main" \| "side" \| "dessert" \| "drink" \| "other" | Role in meal                        |
| dishId        | Id<"dishes">?                                       | Reference to dish (or null)         |
| customName    | string?                                             | Custom meal name (no dish)          |
| servingsUsed  | number                                              | Portions consumed                   |
| servingsMade  | number?                                             | Override cook batch size            |
| status        | "planned" \| "eaten" \| "skipped"                   | Meal state                          |
| isLeftover    | boolean                                             | True if from previous cook          |
| sourceMealId  | Id<"mealPlans">?                                    | Original cook event (for leftovers) |
| householdId   | string                                              | Multi-tenant identifier             |

**Indexes:**
- `dishes.by_householdId` - filter by household
- `mealPlans.by_householdId` - filter by household
- `mealPlans.by_day` - query week's meals
- `mealPlans.by_dishId` - find related meals for leftover tracking

## Core Features

> **In transition:** The slot-based calendar is being replaced by a simple week plan grid. See [WEEK_PLAN.md](./WEEK_PLAN.md) for the new design. Sections below describe the current (legacy) implementation until migration is complete.

### 1. Weekly Calendar (Dashboard) — legacy
- 7-day grid, Monday start
- 3 meal slots per day (breakfast, lunch, dinner)
- Multi-component meals (main + sides)
- Status indicators (planned/eaten/skipped)
- Week navigation with "Today" shortcut

### 2. Meal Planning
- Add dish from library OR custom name
- Set servings used/made
- Mark meals as eaten/skipped
- Slot-level batch actions (eat all, skip all)

### 3. Leftover Tracking
- Fresh cook → `isLeftover: false`, no `sourceMealId`
- Leftover → `isLeftover: true`, `sourceMealId` points to original cook
- Available servings = `servingsMade - sum(eaten servings)`
- "Void leftovers" mutation marks remaining as consumed (food went bad)

### 4. Recipe Library
- CRUD operations for dishes
- Search by name (client-side filter)
- Filter by tags (high-protein, vegetarian, etc.)
- Tag-based filtering (OR logic)

### 5. Shopping List
- Auto-generated from week's planned meals
- Aggregates ingredients by name+unit+category
- Scales quantities by servings ratio
- Groups by category (Produce, Dairy, etc.)
- Checkbox state persisted in localStorage per week

## Frontend Architecture

### Routing (TanStack Start)
File-based routing in `src/routes/`:
```
/           → Dashboard (WeekCalendar)
/library    → LibraryView (dish management)
/shopping   → ShoppingView (ingredient list)
```

### State Management
- **Server state**: Convex subscriptions via `@convex-dev/react-query`
- **Queries**: `useSuspenseQuery(convexQuery(...))` for real-time data
- **Mutations**: `useMutation(useConvexMutation(...))` for writes
- **Local UI state**: React useState (week navigation, modals, filters)
- **Persistence**: localStorage for shopping checkboxes

### Component Patterns
- Feature components in `src/components/<feature>/`
- Shared primitives in `lib/components/` (shadcn/ui based)
- Skeleton components for Suspense fallbacks
- Modals via Radix Dialog/Sheet primitives

### Data Flow
```
User Action → useMutation → Convex Mutation → DB Write
                                    ↓
                            Subscription Update
                                    ↓
                            useSuspenseQuery → UI Re-render
```

## Backend Architecture (Convex)

### Query Functions
- `dishes.getAll` - all dishes for household
- `dishes.getOne` - single dish by ID
- `dishes.search` - name search (in-memory filter)
- `dishes.getByTags` - tag filter (OR)
- `mealPlans.getWeek` - 7-day meals with dish data
- `mealPlans.getOne` - single meal with dish
- `mealPlans.getLeftoverSources` - available leftovers
- `shoppingList.getWeekShoppingList` - aggregated ingredients

### Mutation Functions
- `dishes.create/update/remove`
- `mealPlans.planMeal` - add new meal
- `mealPlans.update` - modify meal details
- `mealPlans.eatMeal/skipMeal` - status changes
- `mealPlans.eatSlot/skipSlot` - batch status changes
- `mealPlans.voidLeftovers` - mark leftovers as consumed
- `mealPlans.remove` - delete meal

## Key Design Decisions

### 1. Hardcoded Household ID
MVP uses `HOUSEHOLD_ID = "household-1"` constant. Schema supports multi-tenancy but auth not implemented.

### 2. Real-time Subscriptions
All data fetched via Convex subscriptions → automatic UI updates when data changes (e.g., another tab adds a meal).

### 3. No Unit Conversion
Shopping list displays quantities as stored; no smart unit merging (e.g., 500g + 1kg stays separate).

### 4. Client-side Filtering
Search and tag filtering happen in-browser after fetching all dishes. Works fine for typical household scale (~100s of dishes).

### 5. Leftover Model
Leftovers link back to source cook event via `sourceMealId`. Enables tracking remaining servings across multiple leftover usages.

### 6. Component Roles
Meals support multiple components per slot (main, side, dessert, drink, other) for complex meals.

## Development Commands

```bash
pnpm dev           # Start Vite + Convex dev servers
pnpm build         # Production build
pnpm deploy        # Deploy to Cloudflare Workers
pnpm lint          # Biome lint check
pnpm types:check   # TypeScript check
pnpm test          # Run Vitest tests
pnpm seed          # Seed sample dishes
```

## Future Considerations

See `.docs/FUTURE_PLANS.md` for planned features including:
- Authentication (Clerk/Auth.js)
- Nutritional tracking
- Pantry inventory
- Recipe import
