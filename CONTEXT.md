# Meal Planning

Weekly meal planning and consumption tracking for a household — plan what to cook, log what you actually ate, and review eating history.

## Language

**Week plan**:
The household's current meal scratch pad — a simple grid of what you intend to cook or buy this week. Not tied to calendar dates.
_Avoid_: Calendar, schedule

**Week plan line**:
One row in the week plan — a weekday (Saturday through Friday), a backlog entry, or a weekly row (weekly lunch, weekly breakfast).
_Avoid_: Slot, cell

**Backlog line**:
A week plan line with no day label — a meal idea not yet assigned to a weekday.
_Avoid_: Queue item, todo

**Plan**:
Future intent to eat something on a specific day and meal slot. Stored in `mealPlans`; may affect the derived shopping list. Distinct from the week plan grid in v1.
_Avoid_: Schedule (when used for retrospective records)

**Log**:
A record of consumption — what was actually eaten. Created as eaten immediately, not planned first.
_Avoid_: Track, journal entry

**Meal slot**:
A specific day and meal type (breakfast, lunch, or dinner). Used by Log and History. Multiple meal components can share one slot.
_Avoid_: Meal time, eating occasion

**Custom meal**:
A meal identified by a free-text name, not linked to a dish in the recipe library.
_Avoid_: Ad-hoc dish, one-off recipe

**History**:
A read-only view of all eaten meals, regardless of whether they were logged directly or planned and later marked eaten.
_Avoid_: Food diary, journal
