import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GroupBySelector } from "../group-by-selector";
import { CustomField } from "../../../types";

const fields: CustomField[] = [
    { id: 1, name: "region", label: "Region", entity: "opportunity", type: "text" },
];

describe("GroupBySelector", () => {
    it("renders nothing when there are no custom fields", () => {
        const { container } = render(
            <GroupBySelector customFields={[]} groupBy={null} setGroupBy={vi.fn()} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("shows the None pill and field pills when custom fields are present", () => {
        render(<GroupBySelector customFields={fields} groupBy={null} setGroupBy={vi.fn()} />);
        expect(screen.getByText("None")).toBeInTheDocument();
        expect(screen.getByText("Region")).toBeInTheDocument();
    });

    it("marks None as active when groupBy is null", () => {
        render(<GroupBySelector customFields={fields} groupBy={null} setGroupBy={vi.fn()} />);
        expect(screen.getByText("None")).toHaveClass("bg-blue-500");
    });

    it("marks the matching field pill as active when groupBy matches its id", () => {
        render(<GroupBySelector customFields={fields} groupBy={1} setGroupBy={vi.fn()} />);
        expect(screen.getByText("Region")).toHaveClass("bg-blue-500");
    });

    it("calls setGroupBy with null when None is clicked", () => {
        const setGroupBy = vi.fn();
        render(<GroupBySelector customFields={fields} groupBy={1} setGroupBy={setGroupBy} />);
        fireEvent.click(screen.getByText("None"));
        expect(setGroupBy).toHaveBeenCalledWith(null);
    });

    it("calls setGroupBy with the field id when a field pill is clicked", () => {
        const setGroupBy = vi.fn();
        render(<GroupBySelector customFields={fields} groupBy={null} setGroupBy={setGroupBy} />);
        fireEvent.click(screen.getByText("Region"));
        expect(setGroupBy).toHaveBeenCalledWith(1);
    });
});
