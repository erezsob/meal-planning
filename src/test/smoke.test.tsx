import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("test setup", () => {
	it("runs in jsdom and has jest-dom matchers", () => {
		render(<main>Hello</main>);
		expect(screen.getByRole("main")).toBeInTheDocument();
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});
});
