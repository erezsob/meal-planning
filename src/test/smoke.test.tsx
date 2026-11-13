import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

describe("test setup", () => {
	it("runs in jsdom and has jest-dom matchers", () => {
		render(<main>Hello</main>);
		expect(screen.getByRole("main")).toBeInTheDocument();
		expect(screen.getByText("Hello")).toBeInTheDocument();
	});
});
