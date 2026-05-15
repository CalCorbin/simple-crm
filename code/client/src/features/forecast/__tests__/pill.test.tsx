import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pill } from "../pill";

describe("Pill", () => {
    it("renders the label", () => {
        render(<Pill label="None" active={false} onClick={vi.fn()} />);
        expect(screen.getByText("None")).toBeInTheDocument();
    });

    it("applies active styling when active is true", () => {
        render(<Pill label="None" active={true} onClick={vi.fn()} />);
        expect(screen.getByText("None")).toHaveClass("bg-blue-500");
    });

    it("applies inactive styling when active is false", () => {
        render(<Pill label="None" active={false} onClick={vi.fn()} />);
        expect(screen.getByText("None")).toHaveClass("bg-gray-100");
    });

    it("calls onClick when clicked", () => {
        const handler = vi.fn();
        render(<Pill label="None" active={false} onClick={handler} />);
        fireEvent.click(screen.getByText("None"));
        expect(handler).toHaveBeenCalledOnce();
    });
});
