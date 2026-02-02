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
