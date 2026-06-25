# Meal Logging & History

Feature plan — quick on-the-go logging of custom or library meals, plus a history view for reviewing past consumption.

**Status:** Planned (design complete, not yet implemented)

---

## Problem

Users need to record what they ate without planning ahead — takeout, snacks, impulse meals. The weekly calendar is built for planning and slot-based navigation; it is not suited to browsing or analyzing historical eating patterns.

## Solution overview

Two complementary features sharing the same underlying data (`mealPlans` with `status: "eaten"`):

1. **Log** — global quick-action to record consumption in one step
2. **History** — dedicated view to browse, filter, and analyze past eaten meals

See [CONTEXT.md](../CONTEXT.md) for domain terminology.

---

## Log feature

### Core behavior

| Decision                | Choice                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Meaning of "log"        | One action that creates a meal with `status: "eaten"` immediately — no intermediate `planned` state |
| When                    | `day` (YYYY-MM-DD) + `mealType` (breakfast / lunch / dinner) — no clock time                        |
| Defaults                | Today + inferred meal type from time of day; both editable before save                              |
| Date bounds             | Today and past only — no future dates                                                               |
| Content                 | Custom name (free text) **or** a dish from the library                                              |
| Form fields             | Minimal: what you ate + date + meal type                                                            |
| Implicit defaults       | `componentRole: main`, `servingsUsed: 1`, `isLeftover: false`, `status: eaten`                      |
| Input UX                | **Custom \| Library** tabs (explicit mode switch, same pattern as Add Meal)                         |
| Entry point             | Global **"Log meal"** button — header on desktop, FAB on mobile; available on every screen          |
| Slot conflict — planned | Auto-skip all `planned` items in the target slot when logging                                       |
| Slot conflict — eaten   | Add alongside existing `eaten` items; do not replace them                                           |
| After save              | Close modal, stay on current screen; optional brief confirmation toast                              |
| Shopping list           | Unaffected — shopping list only aggregates `planned` meals with `dishId`                            |

### Meal type inference (proposed defaults)

| Time of day   | Default meal type |
| ------------- | ----------------- |
| Before 11:00  | breakfast         |
| 11:00 – 16:00 | lunch             |
| After 16:00   | dinner            |

### Edit & delete

| Decision             | Choice                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Correction path      | Edit and delete via meal action modal                                                                |
| Edit form            | Mirrors the log form — Custom/Library tabs + date + meal type; no role, servings, or leftover fields |
| Action modal (eaten) | Trimmed: Edit + Delete only; hide "Ate it", "Skip", "Add another component"                          |

---

## History feature

### Core behavior

| Decision | Choice                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Scope    | All meals with `status: "eaten"` — logged directly or planned then marked eaten |
| Location | Top-level nav item + dedicated route (`/history`)                               |
| Layout   | Grouped by day, newest days first; within each day: breakfast → lunch → dinner  |
| Filters  | Date range presets + custom range + text search by meal name                    |
| Row tap  | Opens trimmed action modal (Edit + Delete)                                      |

History is a **view** on existing data, not a separate record type. No `origin: "log"` field is required for v1.

---

## Implementation phases

### Phase 1 — Core logging

- `logMeal` mutation (creates `eaten`, auto-skips `planned` in slot)
- `inferMealType()` helper in `lib/constants.ts`
- `LogMealModal` component (tabs + date + meal type pickers)
- Global log button in header / FAB on mobile
- Toast on successful save

### Phase 2 — History

- `getEatenHistory` query (date range + search)
- `/history` route
- Nav item in header and mobile drawer
- Grouped list with date range presets and search

### Phase 3 — Edit polish

- Extend `update` mutation to accept `day` and `mealType`
- Shared log/edit form component
- Trimmed `MealActionModal` variant for eaten meals (calendar + history)

---

## Backend notes

- **`logMeal`** — preferred over overloading `planMeal`; encapsulates create-as-eaten + auto-skip-planned logic
- **`update`** — must gain `day` and `mealType` args for edit corrections (not supported today)
- **`getEatenHistory`** — new query; filter by household, status `eaten`, date range, optional name search
- Leftover logging explicitly **out of scope** for v1

---

## Unresolved questions

1. **Meal-type inference windows** — Confirm `<11:00` / `11:00–16:00` / `≥16:00` cutoffs or adjust
2. **History default range** — Last 7 days, Last 30 days, or All time on first visit?
3. **History pagination** — Infinite scroll vs load-all when "All time" is selected (matters as data grows)
4. **History row display** — Show component role for planned-then-eaten meals that had side/dessert roles, or hide role in v1?
5. **Leftover logging** — Defer to a later phase?

---

## Out of scope (v1)

- Calendar slot as log entry point
- Logging leftovers
- Future-date logging
- Full component options (role, servings) in log form
- Skipped meals in history
- Separate `origin` field to distinguish logs from planned-then-eaten
