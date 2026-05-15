import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { LeadRow } from "../lead-row";
import { Lead } from "../../../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const lead: Lead = { id: 1, firstName: "Jane", lastName: "Doe", age: 30, phoneNumber: "555-1234" };

function renderRow(oppCount = 0) {
    render(
        <table><tbody>
            <LeadRow lead={lead} oppCount={oppCount} onUpdate={vi.fn()} />
        </tbody></table>
    );
}

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("LeadRow", () => {
    it("displays the lead's name, age, and phone number", () => {
        renderRow();
        expect(screen.getByText("Jane")).toBeInTheDocument();
        expect(screen.getByText("Doe")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument();
        expect(screen.getByText("555-1234")).toBeInTheDocument();
    });

    it("shows the opp count badge when oppCount is non-zero", () => {
        renderRow(3);
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("hides the opp count badge when oppCount is zero", () => {
        renderRow(0);
        expect(screen.queryByText("0")).not.toBeInTheDocument();
    });

    it("opens the edit dialog when Edit is clicked", async () => {
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        expect(await screen.findByText("Update Lead")).toBeInTheDocument();
    });

    it("mounts the opportunities panel when Opportunities is clicked", async () => {
        renderRow();
        fireEvent.click(screen.getByRole("button", { name: /opportunities/i }));
        expect(await screen.findByText("No opportunities")).toBeInTheDocument();
    });
});