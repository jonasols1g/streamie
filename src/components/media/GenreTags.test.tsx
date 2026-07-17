import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenreTags } from "./GenreTags";

describe("GenreTags", () => {
  it("viser hver sjanger som en egen tagg", () => {
    render(<GenreTags genres={["Action", "Sci-Fi"]} />);

    const list = screen.getByRole("list", { name: "Sjangre" });
    expect(list).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
  });

  it("rendrer ingenting når det ikke finnes sjangre", () => {
    const { container } = render(<GenreTags genres={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
