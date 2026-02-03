# Future Plans

Enhancements and features for future development.

---

## User-Defined Component Roles

**Context**: Currently using fixed roles: `main`, `side`, `dessert`, `drink`, `other`.

**Goal**: Allow households to create custom roles (e.g., "appetizer", "snack", "sauce").

### Requirements

- New schema for custom roles per household
- UI to manage roles (add/edit/delete)
- Validation updates to accept custom roles
- Migration for existing data
- Default roles as starter set for new households

### Considerations

- Role ordering (drag-to-reorder or priority field)
- Role icons/colors for visual distinction
- Prevent deletion of roles in use

---

## Household Size Settings

**Context**: Leftover scheduling defaults to 2 servings (hardcoded).

**Goal**: Configure default servings based on household size.

### Requirements

- New household settings schema (size, default servings per meal)
- Settings UI for household preferences
- Use household size as default for leftover servings

---

## Leftover Expiry Tracking

**Context**: Leftovers can go bad if not used in time.

**Goal**: Track cook date and warn users after X days.

### Requirements

- Store cook date on source meal (already have `day` field)
- Configurable expiry threshold per household (default 5 days?)
- Visual warning on leftover cards nearing expiry
- Optional: auto-void after expiry

---

## Improved Void Confirmation

**Context**: Currently using simple `window.confirm` for voiding leftovers.

**Goal**: Better UX for confirmation with undo capability.

### Requirements

- Replace confirm dialog with toast notification
- "Undo" action within toast (5 second window)
- Soft delete pattern: mark as voiding, commit after timeout

---

## Plan Mode (Decoupled Meal Planning)

**Context**: Calendar view is noisy/cluttered - mixing planning with viewing/actions.

**Goal**: Separate planning workflow from calendar view for better UX.

### Calendar View (Simplified)

- Read-only summary of planned meals
- Click meal → dialog with details
- Actions: eat, skip only
- Clean, scannable layout

### Plan Mode (New UI)

- Dedicated planning interface
- Collect meal ideas/brainstorm
- Select dishes from library
- Drag/distribute to days and meal slots
- Batch planning for entire week

### Considerations

- Toggle between calendar and plan mode
- Draft state before committing plan?
- Copy previous week's plan as template

---

## AI-Assisted Dish Creation

**Context**: Entering recipes + ingredients manually is tedious.

**Goal**: Paste recipe text → AI parses into structured data.

### Requirements

- New "AI Helper" tab in Add Dish modal
- Text input for pasting recipe content (from websites, firewalled sources)
- LLM processes raw text and extracts:
  - Recipe instructions → recipe textarea
  - Ingredients → structured list with:
    - Name
    - Quantity
    - Unit/metric
    - Supermarket department (produce, dairy, etc.)

### Considerations

- Handle various recipe formats (ingredient lists, inline mentions)
- User review/edit before saving
- Fallback for parsing failures
- Rate limiting / cost management for LLM calls
