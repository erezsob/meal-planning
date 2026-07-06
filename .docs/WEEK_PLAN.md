# Week Plan Grid

Feature plan — replace the slot-based calendar with a simple spreadsheet-style week plan.

**Status:** Implemented

---

## Problem

The calendar implementation (7-day × meal-slot grid, modals, leftovers, library integration) was too complex and fragile. It was hard to use, so the app was not adopted.

The household already plans meals with a naive grid: free-text **Dish** and **Grocery List** columns, no logic — closer to a notes table than a calendar.

## Solution overview

Replace the home screen (`/`) with a **week plan grid**: a timeless Sat → Fri table plus weekly rows and a dynamic backlog. v1 is UI-only (single `localStorage` slot); Log and History stay unchanged on `mealPlans`.

See [CONTEXT.md](../CONTEXT.md) for domain terminology.

---

## Decisions

| Topic                  | Choice                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| Weekday rows           | Freeform per day (often dinner; not enforced)                    |
| Weekly rows            | Weekly lunch + weekly breakfast                                  |
| Backlog                | Dynamic idea rows (add/remove); **3 empty rows on first load**   |
| Columns                | **Dish** + **Grocery List** — free text only                     |
| Calendar tie-in        | **None** — timeless Sat–Fri labels (no dates on rows)            |
| Week navigation        | **None**                                                         |
| Persistence            | Single `localStorage` slot; no multi-week history                |
| Clear plan             | Button with confirmation — wipes all cells                       |
| Cross-device           | Export / import current plan as JSON via clipboard               |
| Cell editing           | Multiline textarea; debounced auto-save (~300ms)                 |
| Cell display           | Plain text; auto-link `https://…` URLs when not editing          |
| Near future            | Markdown editor for `[label](url)` (hide long URLs)              |
| Desktop layout         | 3-column table (Date \| Dish \| Grocery List)                    |
| Mobile layout          | Stacked card per week plan line                                  |
| Home (`/`)             | Week plan grid replaces dashboard                                |
| Archive                | `WeekCalendar`, planning modals, `LeftoverTracker`, `WeekHeader` |
| Log / History          | Unchanged — day + meal slot; logging is optional and flexible    |
| Library                | Unchanged                                                        |
| Shopping (`/shopping`) | Hidden from nav in v1; route and code kept for later             |

---

## Row layout

Fixed sections (top to bottom):

1. **Weekdays** — Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday
2. **Backlog** — undated idea rows (dynamic count; add/remove)
3. **Weekly lunch**
4. **Weekly breakfast**

Weekday rows are **freeform** — one cell may hold multiple dishes (e.g. a Sunday spread), grocery may exist without a dish, and dish may exist without grocery. Informal text (`?`, rough units) is expected.

---

## Relationship to Log / History

| Surface            | Granularity                                                 | Data                  |
| ------------------ | ----------------------------------------------------------- | --------------------- |
| **Week plan grid** | Coarse scratch pad (weekday / backlog / weekly rows)        | `localStorage` in v1  |
| **Log / History**  | Day (`YYYY-MM-DD`) + meal type (breakfast / lunch / dinner) | `mealPlans` in Convex |

The grid does not force logging. Logging does not have to match the grid. No sync between the two in v1.

---

## Data shape (v1)

```typescript
interface WeekPlanCell {
  dish: string;
  grocery: string;
}

type WeekdayKey =
  | "saturday"
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday";

interface WeekPlan {
  weekdays: Record<WeekdayKey, WeekPlanCell>;
  weeklyLunch: WeekPlanCell;
  weeklyBreakfast: WeekPlanCell;
  backlog: WeekPlanCell[];
}
```

**localStorage key:** `meal-planner-week-plan-v1` (single slot — not keyed by week)

**Export format:**

```json
{ "version": 1, "plan": { /* WeekPlan */ } }
```

**Import:** validate structure → confirm “Replace current plan?” → overwrite slot.

---

## Implementation phases

### Phase 1 — Core grid

- New `src/components/week-plan/` (or `plan/`)
- `WeekPlanView` on `/`
- Desktop table + mobile stacked cards
- `WeekPlanCell` — edit/display toggle, multiline textarea
- Fixed weekday + weekly rows; dynamic backlog with add/remove

### Phase 2 — Persistence & actions

- `lib/weekPlanStorage.ts` — load/save, debounced writes
- `lib/linkify.ts` — URL linkification in display mode
- Clear plan, copy to clipboard, import from clipboard

### Phase 3 — Archive calendar

Move to `src/components/dashboard/_archived/`:

- `WeekCalendar.tsx`, `AddMealModal.tsx`, `MealActionModal.tsx`
- `LeftoverTracker.tsx`, `CalendarSkeleton.tsx`, `WeekHeader.tsx`, `types.ts`
- `MealSlot.tsx` if only used by calendar

### Phase 4 — Nav & polish

- Hide Shopping from header nav
- Rename **Calendar** → **Plan**
- Dark table styling aligned with the household spreadsheet

### Phase 5 — Tests & docs

- Storage roundtrip, import validation, clear plan
- Grid render, backlog add/remove
- Linkify URL detection

---

## Explicitly out of v1

- Convex persistence for the week plan
- Week header / prev-next navigation
- Library picker in dish cells
- Derived `/shopping` from grid content
- Leftovers, meal slots, status on the grid
- Markdown editor
- Multi-week `localStorage` history

---

## Future path

| When     | What                                                            |
| -------- | --------------------------------------------------------------- |
| **v1.1** | Markdown links in cells (`[title](url)`)                        |
| **v2**   | Convex persistence — new table or redesigned `mealPlans`        |
| **v2+**  | Reconnect shopping; optional library autocomplete on dish cells |

**Note:** Reusing `mealPlans` for the grid (instead of a separate store) may align long-term but requires a deliberate schema and behavior rewrite — not a thin reskin of the calendar.

---

## Supersedes

- [FUTURE_PLANS.md](./FUTURE_PLANS.md) — “Plan Mode (Decoupled Meal Planning)” (drag-to-slot brainstorm UI)
