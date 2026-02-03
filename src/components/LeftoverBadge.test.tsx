import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeftoverBadge } from "./LeftoverBadge";

describe("LeftoverBadge", () => {
	it("renders 'Leftover' text", () => {
		render(<LeftoverBadge />);
		expect(screen.getByText("Leftover")).toBeInTheDocument();
	});
});
