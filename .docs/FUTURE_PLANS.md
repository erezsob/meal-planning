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
