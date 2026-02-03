import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TagList } from "./TagBadge";

describe("TagList", () => {
	it("renders valid tags with correct labels", () => {
		render(<TagList tags={["high-protein", "vegetarian"]} />);
		expect(screen.getByText("High Protein")).toBeInTheDocument();
		expect(screen.getByText("Vegetarian")).toBeInTheDocument();
	});

	it("filters out invalid tags", () => {
		render(<TagList tags={["high-protein", "invalid-tag", "quick"]} />);
		expect(screen.getByText("High Protein")).toBeInTheDocument();
		expect(screen.getByText("Quick")).toBeInTheDocument();
		expect(screen.queryByText("invalid-tag")).not.toBeInTheDocument();
	});

	it("truncates with '+N more' when exceeding maxVisible", () => {
		render(
			<TagList
				tags={["high-protein", "vegetarian", "quick", "low-carb", "vegan"]}
				maxVisible={3}
			/>,
		);
		expect(screen.getByText("High Protein")).toBeInTheDocument();
		expect(screen.getByText("Vegetarian")).toBeInTheDocument();
		expect(screen.getByText("Quick")).toBeInTheDocument();
		expect(screen.getByText("+2 more")).toBeInTheDocument();
		expect(screen.queryByText("Low Carb")).not.toBeInTheDocument();
	});

	it("shows all tags when count equals maxVisible", () => {
		render(
			<TagList tags={["high-protein", "vegetarian", "quick"]} maxVisible={3} />,
		);
		expect(screen.getByText("High Protein")).toBeInTheDocument();
		expect(screen.getByText("Vegetarian")).toBeInTheDocument();
		expect(screen.getByText("Quick")).toBeInTheDocument();
		expect(screen.queryByText(/more/)).not.toBeInTheDocument();
	});

	it("renders nothing when no valid tags", () => {
		render(<TagList tags={["invalid1", "invalid2"]} />);
		expect(screen.queryByText("invalid1")).not.toBeInTheDocument();
		expect(screen.queryByText("invalid2")).not.toBeInTheDocument();
	});
});
