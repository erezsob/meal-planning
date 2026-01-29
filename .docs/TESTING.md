# Testing Guide

This document describes the testing strategy, patterns, and practices for the meal planning application.

## Overview

The project uses **Vitest** as the test runner with **React Testing Library** for component testing. Tests are co-located with source files using the `.test.ts` or `.test.tsx` extension.

## Tech Stack

- **Vitest** - Fast, Vite-native test runner
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **jsdom** - DOM environment for Node.js
- **@vitest/coverage-v8** - Code coverage reporting

## Test Categories

### 1. Unit Tests

Pure function tests that run in isolation without React components.

**Location**: Co-located with source files (e.g., `utils.test.ts` next to `utils.ts`)

**Examples**:
- `lib/fp.test.ts` - Tests for Result, Option, pipe utilities
- `lib/errors.test.ts` - Tests for error constructors
- `lib/constants.test.ts` - Tests for date/formatting helpers

**Key patterns**:
```typescript
import { describe, expect, it, vi } from "vitest";

describe("functionName", () => {
  it("describes expected behavior", () => {
    const result = functionName(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### 2. Component Tests

Tests for React components using React Testing Library.

**Location**: Co-located with components (e.g., `MealSlot.test.tsx`)

**Examples**:
- `src/components/MealSlot.test.tsx`
- `src/components/DishCard.test.tsx`
- `src/components/DishSelector.test.tsx`
- `src/components/TagBadge.test.tsx`

**Key patterns**:
```typescript
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Component } from "./Component";

describe("Component", () => {
  it("renders content", () => {
    render(<Component prop="value" />);
    expect(screen.getByText("expected text")).toBeInTheDocument();
  });

  it("handles user interaction", () => {
    const onClick = vi.fn();
    render(<Component onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 3. Hook Integration Tests

Tests for React hooks with Convex queries and TanStack Query.

**Location**: Co-located with hooks (e.g., `useMealPlans.test.tsx`)

**Examples**:
- `src/hooks/useMealPlans.test.tsx`
- `src/hooks/useDishes.test.tsx`
- `src/hooks/useShoppingList.test.tsx`

**Key patterns**:
```typescript
import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ConvexProvider } from "convex/react";
import { vi } from "vitest";

// Mock Convex hooks
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

it("returns meal plans for the week", async () => {
  const { result } = renderHook(() => useMealPlans("2026-01-26"), {
    wrapper: TestWrapper,
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

## Test Infrastructure

### Setup Files

- **`src/test/setup.ts`** - Global test setup (jest-dom matchers, RTL cleanup)
- **`src/test/utils.tsx`** - Test utilities, wrapper components
- **`src/test/mocks/convex.ts`** - Mock factories for Convex data

### Mocking Convex

Mock Convex queries and mutations for isolated testing:

```typescript
import { useQuery, useMutation } from "convex/react";
import { vi } from "vitest";

vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
  };
});

// In your test
(useQuery as vi.Mock).mockReturnValue(mockDishes);
```

### Creating Mock Data

Use mock factory functions for consistent test data:

```typescript
import { createMockDish, createMockMealPlan } from "src/test/mocks/convex";

// Single dish
const dish = createMockDish({ name: "Pasta", defaultServings: 4 });

// Meal plan entry
const meal = createMockMealPlan({
  day: "2026-01-28",
  mealType: "dinner",
  dishId: dish._id,
});
```

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with Vitest UI (optional)
pnpm test:ui
```

## Coverage

Code coverage is configured with 80% thresholds for:
- Lines
- Functions
- Branches
- Statements

Coverage reports are generated in multiple formats:
- `text` - Terminal output
- `json` - Machine-readable
- `html` - Visual report in `coverage/` directory

## Best Practices

### General

1. **Co-locate tests** - Place test files next to source files
2. **Descriptive names** - Use clear `describe` and `it` block names
3. **Arrange-Act-Assert** - Structure tests clearly
4. **One assertion per concept** - Keep tests focused
5. **Mock at boundaries** - Only mock external dependencies (electronAPI)

### Component Testing

1. **Query by accessibility** - Prefer `getByRole`, `getByLabelText`
2. **Use `fireEvent`** - For simple click/input events
3. **Avoid implementation details** - Test behavior, not internals
4. **Test user interactions** - Click handlers, form inputs, keyboard events

### Async Testing

1. **Use `waitFor`** - For async state updates
2. **Avoid `act` warnings** - Wrap state updates properly
3. **Handle promise rejections** - Catch errors explicitly in tests

### Fake Timers

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-08T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Note**: Avoid using fake timers with complex user interactions. Use `fireEvent` instead of `userEvent` when fake timers are active.

## Future Improvements

1. **E2E Tests** - Add Playwright for end-to-end testing
2. **Visual Regression** - Screenshot testing for UI components
3. **CI Integration** - Add tests to GitHub Actions workflow
4. **Mutation Testing** - Verify test quality with Stryker
