import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
	it("renders 'Planned' label for planned status", () => {
		render(<StatusBadge status="planned" />);
		expect(screen.getByText("Planned")).toBeInTheDocument();
	});

	it("renders 'Eaten' label for eaten status", () => {
		render(<StatusBadge status="eaten" />);
		expect(screen.getByText("Eaten")).toBeInTheDocument();
	});

	it("renders 'Skipped' label for skipped status", () => {
		render(<StatusBadge status="skipped" />);
		expect(screen.getByText("Skipped")).toBeInTheDocument();
	});
});
