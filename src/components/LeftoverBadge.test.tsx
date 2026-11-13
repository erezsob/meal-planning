import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { LeftoverBadge } from "./LeftoverBadge";

describe("LeftoverBadge", () => {
	it("renders 'Leftover' text", () => {
		render(<LeftoverBadge />);
		expect(screen.getByText("Leftover")).toBeInTheDocument();
	});
});
