import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { LeadOppPanel } from "../lead-opps-panel";
import { Lead, Opportunity } from "../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const lead: Lead = { id: 1, firstName: "Jane", lastName: "Doe", age: 30, phoneNumber: "555-1234" };

const opp: Opportunity = {
    id: 10,
    lead,
    stage: { id: 1, name: "Qualified", status: "pending", conversionLikelihood: 0.5, order: 1 },
    value: 5000,
    name: "Deal A",
};

function renderPanel() {
    render(
        <table><tbody>
            <LeadOppPanel leadId={lead.id} />
        </tbody></table>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("LeadOppPanel", () => {
    it("shows no opportunities message when the lead has none", async () => {
        renderPanel();
        expect(await screen.findByText("No opportunities")).toBeInTheDocument();
    });

    it("shows 'Unnamed' for opportunities with no name", async () => {
        const unnamedOpp: Opportunity = { id: 11, lead, stage: opp.stage, value: 1000 };
        mockedAxios.get.mockResolvedValue({ data: [unnamedOpp] });
        renderPanel();
        expect(await screen.findByText("Unnamed")).toBeInTheDocument();
    });

    it("shows opportunity name, stage, value, and expected value", async () => {
        mockedAxios.get.mockResolvedValue({ data: [opp] });
        renderPanel();
        expect(await screen.findByText("Deal A")).toBeInTheDocument();
        expect(screen.getByText("Qualified")).toBeInTheDocument();
        expect(screen.getByText("$5,000.00")).toBeInTheDocument();
        expect(screen.getByText("$2,500.00")).toBeInTheDocument();
    });

    it("removes the deleted opportunity from the list without refetching", async () => {
        mockedAxios.get.mockResolvedValue({ data: [opp] });
        mockedAxios.delete.mockResolvedValue({});
        renderPanel();
        fireEvent.click(await screen.findByText("Delete"));
        await waitFor(() => expect(mockedAxios.delete).toHaveBeenCalledWith("/api/opportunities/10"));
        expect(screen.queryByText("Deal A")).not.toBeInTheDocument();
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it("displays a formatted close date when one is set", async () => {
        const oppWithDate: Opportunity = { ...opp, closeDate: "2026-06-01" };
        mockedAxios.get.mockResolvedValue({ data: [oppWithDate] });
        renderPanel();
        expect(await screen.findByText("Jun 1, 2026")).toBeInTheDocument();
    });

    it("displays a dash when no close date is set", async () => {
        mockedAxios.get.mockResolvedValue({ data: [opp] });
        renderPanel();
        expect(await screen.findByText("—")).toBeInTheDocument();
    });

    it("opens the edit dialog when Edit is clicked", async () => {
        mockedAxios.get.mockResolvedValue({ data: [opp] });
        renderPanel();
        fireEvent.click(await screen.findByText("Edit"));
        expect(screen.getByText("Edit Opportunity")).toBeInTheDocument();
    });

    it("reflects updated opportunity name in the list after a successful edit", async () => {
        const updatedOpp = { ...opp, name: "Deal B" };
        mockedAxios.get.mockResolvedValue({ data: [opp] });
        mockedAxios.put.mockResolvedValue({ data: updatedOpp });
        renderPanel();
        fireEvent.click(await screen.findByText("Edit"));
        fireEvent.click(await screen.findByText("Update Opportunity"));
        expect(await screen.findByText("Deal B")).toBeInTheDocument();
        expect(screen.queryByText("Deal A")).not.toBeInTheDocument();
    });
});
