# System Primitives

Composition contract for humans and AI agents. A **system primitive** is an intentional, foundational building block that defines what you compose when building features — not a low-level language construct.

Primitives shrink the action space: reuse documented capabilities instead of inventing brittle one-offs.

This document is the human/agent composition contract. The machine-readable primitives map lives at [`docs/contributing/architecture/primitives.yaml`](contributing/architecture/primitives.yaml) — use it for PR visual-recap classification and path-to-primitive mapping. **Keep both files in sync** when adding, changing, deprecating, or promoting a primitive.

**Related docs:** [CONTEXT.md](../CONTEXT.md) (domain language), [.docs/CODE_STANDARDS.md](../.docs/CODE_STANDARDS.md) (implementation standards), [.cursor/rules/shadcn-ui.mdc](../.cursor/rules/shadcn-ui.mdc) (UI policy), [.cursor/rules/fp-paradigm.mdc](../.cursor/rules/fp-paradigm.mdc) (error/Result patterns).

---

## Operating rules

### Status labels

| Label                            | Meaning                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| **Canonical**                    | Default for new work; public, intentional, consistently used |
| **Boundary**                     | External package or layer rule that constrains choices       |
| **Legacy / migration candidate** | Exists today; do not copy into new code                      |
| **Candidate**                    | Useful but ownership or default status not yet proven        |

**Evidence bar:** mark **Canonical** only with explicit public intent + consistent multi-site usage. When ambiguous → **Candidate**.

### Inclusion rule

Include a primitive when an agent should **actively choose** it when building a feature, or it establishes a **mandatory constraint**. Exclude generic helpers (`clamp`, date formatters, internal query keys) unless they define required behavior.

### Fallback hierarchy

When nothing fits exactly:

1. Reuse an exact local primitive
2. Use the sanctioned **platform** primitive (shadcn, Convex, TanStack Query)
3. Build at the **narrowest owning layer** (route → feature folder → `src/components/` root → `lib/`)
4. **Promote** to shared only after a second consumer proves reuse

Do not pre-build generic abstractions "for later."

### Entry format

Each entry is an **agent decision card**: location, use when, do not use when, constraints, underlying dependency, status. Inspect source/types on demand — this doc does not mirror every export or prop.

---

## 1. UI components

### Layering (Boundary)

| Layer              | Path              | Role                                      |
| ------------------ | ----------------- | ----------------------------------------- |
| Design system      | `lib/components/` | shadcn primitives + app toast adapter     |
| Domain composition | `src/components/` | Reusable and feature-specific UI          |
| Route shells       | `src/routes/`     | Thin wrappers only — no inline components |

**Constraints:** import primitives from `@/lib/components/<name>`; merge classes with `cn()` from `@/lib/utils`. Add missing shadcn controls via `pnpm dlx shadcn@latest add <component>` — do not hand-roll standard controls.

**Known drift vs rules:** `.cursor/rules/shadcn-ui.mdc` references `next-themes` and `@remixicon/react`; the app uses static dark mode (`<html className="dark">`) and `lucide-react` throughout (including shadcn files). Prefer semantic tokens (`bg-background`, `text-foreground`) over hardcoded `gray-*` / `emerald-*`.

### Design system — `lib/components/`

| Primitive                                                  | Use when                                              | Do not use when                       | Status                              |
| ---------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| **Button** / `buttonVariants`                              | Clickable controls, icon buttons, destructive actions | Plain navigation links (use `Link`)   | Canonical                           |
| **Input**, **Label**, **Textarea**                         | Form fields                                           | Multi-line vs single-line mismatch    | Canonical                           |
| **Dialog** (+ Header, Footer, Title, Description, Content) | Modal flows (confirm, forms)                          | Non-blocking overlays                 | Canonical                           |
| **Badge**                                                  | Status/tag chips                                      | Large interactive controls            | Canonical                           |
| **Card** (+ Footer)                                        | Grouped content panels                                | Simple list rows                      | Canonical (partial API used)        |
| **Skeleton**                                               | Loading placeholders inside components                | —                                     | Canonical                           |
| **Checkbox**                                               | Boolean toggles with label                            | Single-select from many options       | Canonical (narrow)                  |
| **Tabs**                                                   | Segmented content switching                           | Inline tab UIs built with raw buttons | Canonical (narrow)                  |
| **Sheet**                                                  | Mobile drawer / side panel                            | Desktop inline nav                    | Canonical (Header mobile nav)       |
| **Toast** / `useToast`                                     | Brief success/error feedback                          | Persistent notifications              | Canonical (app adapter, not Sonner) |

**Dependency (Boundary):** shadcn **new-york** style on Radix primitives via `components.json`. Do not catalog every export — unused today: `CardHeader`, `CardTitle`, `DialogTrigger`, `SheetTrigger`, etc.

### Domain reusables — `src/components/`

| Component                           | Location                           | Use when                                    | Do not use when            | Status                      |
| ----------------------------------- | ---------------------------------- | ------------------------------------------- | -------------------------- | --------------------------- |
| **TagList**                         | `TagBadge.tsx`                     | Dish dietary/nutrition tags with truncation | Non-dish tags              | Canonical                   |
| **DishCard** / **DishCardSkeleton** | `DishCard.tsx`                     | Library grid item for a Convex dish         | Generic cards              | Canonical                   |
| **Header**                          | `Header.tsx`                       | App shell nav + global "Log meal" entry     | Inside feature views       | Canonical                   |
| **LogMealModal**                    | `log/LogMealModal.tsx`             | Global/history meal logging                 | Inline forms without modal | Canonical                   |
| **MealActionModal**                 | `meal/MealActionModal.tsx`         | Edit/delete on a logged meal                | Plan-grid editing          | Canonical                   |
| **WeekPlanCellEditor**              | `week-plan/WeekPlanCellEditor.tsx` | Inline editable plan cells with linkify     | Outside week plan          | Canonical                   |
| **WeekHeader**                      | `shopping/WeekHeader.tsx`          | Week prev/next/today navigation             | Non-week-scoped pages      | Candidate (single consumer) |

**Router link as button (Canonical):** `cn(buttonVariants({ … }))` + TanStack `Link` — see `WeekPlanToolbar.tsx`, `ArchivedPlansView.tsx`.

**Route skeleton (Canonical):** export `<Feature>ViewSkeleton` from feature barrel; wrap route in `<Suspense fallback={…}>`.

**Domain badge (Canonical):** shadcn `Badge` wrapper + color map from `@/lib/constants` — model: `TagBadge.tsx`.

### Legacy / candidate UI

| Item                               | Issue                                                             | Canonical alternative                                             |
| ---------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| **DishSelector**                   | Zero production imports                                           | Wire into log/week plan or merge with `LogMealForm` library panel |
| **StatusBadge**, **LeftoverBadge** | Tests only; never rendered                                        | Wire to history/plan UI or remove                                 |
| Raw `<button>` + bespoke Tailwind  | `DishCard`, `LogMealForm` tabs, `WeekPlanCellEditor` display mode | shadcn `Button` or `buttonVariants`                               |
| Hand-rolled tabs                   | `LogMealForm.tsx`, `DishSelector.tsx`                             | shadcn `Tabs` (see `ArchivedPlansView`)                           |
| Hand-rolled skeletons              | Several `*ViewSkeleton` components                                | shadcn `Skeleton` (see `ShoppingViewSkeleton`)                    |
| Hardcoded palette                  | `gray-*`, `teal-*` in shell and badges                            | Semantic tokens                                                   |

**Not primitives:** feature folders (`week-plan/`, `library/`, `shopping/`, `history/`) and archived plan views — compose from primitives above.

---

## 2. APIs and data entities

### Platform conventions (Boundary)

| Concern            | Primitive                                    | Location                                                |
| ------------------ | -------------------------------------------- | ------------------------------------------------------- |
| Real-time backend  | Convex document store                        | `convex/`                                               |
| Schema             | Table definitions + validators               | `convex/schema.ts`, `lib/weekPlanValidator.ts`          |
| Reads              | `useSuspenseQuery(convexQuery(api.*, args))` | `@convex-dev/react-query` + TanStack Query              |
| Writes             | `useMutation(api.*)` from `convex/react`     | Feature hooks and modals                                |
| Router wiring      | `ConvexQueryClient` + `ConvexProvider`       | `src/router.tsx`                                        |
| Pure transforms    | Immutable functions returning new values     | `lib/` (`weekPlan.ts`, `planSectionLifecycle.ts`, etc.) |
| Fallible logic     | `Result<T,E>` from `@/lib/fp`                | `lib/logMealValidation.ts` (golden path)                |
| Async UI boundary  | `tryCatchAsyncWithMessage`                   | Week plan saves, `LogMealModal`                         |
| Sync I/O boundary  | `tryCatch` + `getOrElseResult`               | `ShoppingView` localStorage                             |
| Types from backend | `FunctionReturnType<typeof api…>`            | `lib/mealPlanTypes.ts`                                  |
| Constants          | Domain enums, labels, error strings          | `lib/constants.ts`                                      |

**Do not use:** `useQuery` from `convex/react` in production UI (README boilerplate only). Do not invent custom TanStack `queryKey`/`queryFn` for Convex data.

**Constraints:** all data ops include `householdId`; MVP uses `HOUSEHOLD_ID` from `lib/constants.ts`. Schema changes → run `pnpm dev:convex`. Week plan content must pass `mainGridContentValidator` / `customPlansContentValidator`.

### Domain index

Compact bounded-context map — inspect `convex/*.ts` for full API; do not treat this as an endpoint catalog.

| Context                 | Responsibility                                                                          | Storage                                  | Public Convex module                                          | Frontend entry                                     |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| **Week plan**           | Scratch-pad grid (weekdays, backlog, weekly rows, custom categories); archive lifecycle | `planSections`                           | `planSections.*`                                              | `useWeekPlan`, `WeekPlanView`, `ArchivedPlansView` |
| **Recipe library**      | Dish CRUD, ingredients, tags                                                            | `dishes`                                 | `dishes.*`                                                    | `LibraryView`, `DishFormModal`, `LogMealForm`      |
| **Log & history**       | Consumption records (eaten meals)                                                       | `mealPlans` (status=`eaten`)             | `mealPlans.logMeal`, `updateLog`, `getEatenHistory`, `remove` | `LogMealModal`, `HistoryView`, `MealActionModal`   |
| **Calendar meal plans** | Dated slot-based planning, leftovers                                                    | `mealPlans` (status=`planned`/`skipped`) | `mealPlans.planMeal`, `getWeek`, `eatSlot`, …                 | **No active UI** — backend exists                  |
| **Shopping**            | Derived ingredient aggregation for calendar week                                        | Read-only over `mealPlans` + `dishes`    | `shoppingList.getWeekShoppingList`                            | `ShoppingView`                                     |

**Domain tension:** "Week plan" (scratch pad, no calendar dates) vs "Plan" (dated `mealPlans` records). v1 UI is week-plan-first; calendar `mealPlans` powers log, history, and shopping but not the home grid. See [CONTEXT.md](../CONTEXT.md).

### Week plan sync pattern (Canonical)

`useWeekPlan` → `useMainGridPlans` / `useCustomPlansSection`:

1. `useSuspenseQuery(convexQuery(api.planSections.getHome))` — remote subscription
2. Local pending overlay via `useDebouncedSectionSave` / `useDebouncedKeyedSectionSave`
3. `useMutation` for save and lifecycle mutations
4. `tryCatchAsyncWithMessage` on commit/lifecycle actions

### Established but inconsistent

| Pattern                                     | Gap                                            |
| ------------------------------------------- | ---------------------------------------------- |
| `Result<T,E>` in Convex handlers            | Only `assertLogMealInput`; rest throws `Error` |
| `tryCatchAsyncWithMessage` on all mutations | Missing in `DishFormModal`, `MealActionModal`  |
| Client-side validation before mutation      | `validateLogMealInput` server-only             |
| Route-level data prefetch                   | No loaders; components subscribe in-view       |

### Legacy / dormant — do not extend without explicit decision

- Calendar meal-plan UI API (`getWeek`, `planMeal`, `eatSlot`, `getLeftoverSources`, …) — no wired UI
- `DishSelector` leftover tab — no caller queries `getLeftoverSources`
- `tasks` table — schema only, no functions
- Shopping derived from calendar `mealPlans` — disconnected from week-plan scratch pad edits

---

## 3. Platform tools and workflows

### Routing (Canonical)

| Item                | Location                | Use when                                            |
| ------------------- | ----------------------- | --------------------------------------------------- |
| File routes         | `src/routes/`           | New pages — thin shell delegating to view component |
| Route tree          | `src/routeTree.gen.ts`  | Auto-generated; never edit                          |
| Router factory      | `src/router.tsx`        | Convex + TanStack Query integration                 |
| Root layout         | `src/routes/__root.tsx` | `ToastProvider`, `Header`, `Outlet`                 |
| Suspense + skeleton | All route files         | `<Suspense fallback={<FeatureViewSkeleton />}>`     |

**Routes:** `/` (week plan), `/library`, `/shopping`, `/history`, `/plans/archive`, `/plans/archive/$id`.

**Candidate:** archived detail route fetches inline; other routes fetch in views/hooks. No `beforeLoad`/`loader`/`errorComponent` anywhere.

### Providers (Canonical)

| Provider                                  | Mounted in              | Purpose                              |
| ----------------------------------------- | ----------------------- | ------------------------------------ |
| `ConvexProvider`                          | `src/router.tsx`        | Real-time Convex client              |
| `QueryClient` + `@convex-dev/react-query` | `src/router.tsx`        | Suspense queries via `convexQuery()` |
| `ToastProvider`                           | `src/routes/__root.tsx` | Global toasts                        |

**Environment:** `import.meta.env.VITE_CONVEX_URL` — Convex endpoint.

### Error handling & user feedback

| Pattern                                      | Used by                            | Status                                    |
| -------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| `lib/fp.ts` Result utilities                 | All fallible lib logic             | Canonical (Boundary)                      |
| `lib/errors.ts` domain errors                | Validation, meal plan errors       | Canonical                                 |
| `lib/constants.ts` user-facing error strings | Week plan saves                    | Canonical                                 |
| Inline `role="alert"`                        | `WeekPlanView` save errors         | Candidate (week plan only)                |
| Toast via `useToast`                         | `LogMealModal`                     | Candidate (log meal only)                 |
| Fire-and-forget mutations                    | `DishFormModal`, `MealActionModal` | Legacy — adopt `tryCatchAsyncWithMessage` |

**Not present:** global mutation error handler, route-level error boundaries.

### Testing (Canonical)

| Item         | Location                                          |
| ------------ | ------------------------------------------------- |
| Runner       | Vitest + jsdom (`vitest.config.ts`)               |
| Setup        | `src/test/setup.ts`                               |
| Test wrapper | `src/test/utils.tsx` — `QueryClientProvider`      |
| Mocks        | `src/test/mocks/convex.ts`                        |
| Co-location  | `*.test.ts(x)` beside source in `src/` and `lib/` |

**Candidate:** default `TestWrapper` lacks `ConvexProvider`/`ToastProvider`; some tests wire providers ad hoc.

### PWA install surface (Candidate)

| Item | Location | Use when |
| --- | --- | --- |
| Install-surface contract | `lib/pwaInstallSurface.ts` | Guarding theme-color parity, install-critical manifest fields, document manifest / Apple touch icon links |
| Web app manifest | `public/manifest.json` | Changing name, icons, `display`, theme / background colors |
| Document head wiring | `src/routes/__root.tsx` via `PWA_DOCUMENT_INSTALL_SURFACE` | Exposing manifest + Apple touch icon + `theme-color` |

**Do not use when:** adding empty service workers “for installability,” in-app Install CTAs, or native/wrapper delivery (see ADR `docs/adr/0002-pwa-first-phone-install.md`).

### Build & deploy (Boundary)

Vite + TanStack Start; Cloudflare Workers SSR (`wrangler.jsonc`). React Compiler via babel plugin.

---

## 4. Trust boundaries

Document **frontend guardrails** and **backend enforcement** honestly. Client-side checks are UX — not authorization.

### What the frontend enforces

| Guardrail           | Mechanism                                      | Limit                                                   |
| ------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Tenancy (MVP)       | Hardcoded `HOUSEHOLD_ID` passed to all queries | Any client can pass any `householdId`                   |
| Log meal form       | Disable submit on invalid input                | Does not call `validateLogMealInput` — server validates |
| Archived plans UI   | Read-only presentation                         | Backend still writable if ID known                      |
| Shopping checkboxes | `localStorage` per week                        | Client-only; not synced                                 |

**Not present:** auth/session, route guards, RBAC, feature flags, CSP/security headers.

### What Convex enforces

| Layer                    | What                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Schema validators        | Field types, enums, content shapes via `lib/weekPlanValidator.ts`                          |
| Business rules (partial) | `assertLogMealInput` on log mutations; archived row filtering; section type checks on save |
| **Not enforced**         | Caller identity, household ownership on ID-based mutations                                 |

### Known gaps (not security — audit backlog)

1. ID-based mutations lack household ownership checks (`planSections.save*`, `dishes.update/remove`, `mealPlans.*`)
2. `getArchived` not scoped to household — ID enumeration risk
3. `householdId` is client-controlled on queries
4. No Convex Auth / deployment rules

When adding auth, treat these as required follow-ups — not optional hardening.

---

## Audit backlog

Human-owned migration and ownership decisions. Not prescriptions.

### Trust & security

- [ ] Add Convex Auth (or equivalent) before multi-household production use
- [ ] Scope ID-based mutations and `getArchived` to authenticated household
- [ ] Decide whether shopping checkboxes should sync to backend

### Data model

- [ ] Resolve week-plan scratch pad vs calendar `mealPlans` relationship (ADR candidate)
- [ ] Connect shopping list to week plan or document intentional separation
- [ ] Retire or implement `tasks` table; wire or remove leftover/calendar planning UI

### UI consistency

- [ ] Consolidate dish-picker UI (`DishSelector` vs `LogMealForm` library panel)
- [ ] Wire or remove `StatusBadge`, `LeftoverBadge`
- [ ] Unify error UX (inline alert vs toast vs silent) across features
- [ ] Adopt `tryCatchAsyncWithMessage` in `DishFormModal`, `MealActionModal`
- [ ] Migrate hand-rolled tabs/skeletons to shadcn primitives
- [ ] Align icon library and theme rules with actual implementation (lucide vs remixicon, static dark vs `next-themes`)
- [ ] Link `/shopping` in `Header` or document as intentional orphan

### Code organization

- [ ] Move root-level shared components (`DishSelector`, badges) into feature folders or promote with proven reuse
- [ ] Extend `Result` pattern in Convex handlers beyond log-meal path
- [ ] Add `docs/adr/` entries for dual plan models and auth strategy

### Enforcement (future)

- Agent rules + code review first
- ESLint import bans for known legacy patterns only when mechanically provable (e.g. new raw `<button>` in feature code)

---

## Maintenance

- **Now:** periodic architecture/primitives audits (realistic)
- **Ideal:** update when a canonical primitive is added, changed, deprecated, or promoted
- **Evidence pass:** downgrade overclaimed "canonical" when usage is mixed; upgrade when multi-module reuse is proven
- **Sync rule:** update [`docs/contributing/architecture/primitives.yaml`](contributing/architecture/primitives.yaml) in the same change when a primitive is added or materially reshaped
