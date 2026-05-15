import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { OppEditDialog } from "../opp-edit-dialog";
import { Opportunity, Stage } from "../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const stage: Stage = { id: 1, name: "Qualified", status: "pending", conversionLikelihood: 0.5, order: 1 };
const opp: Opportunity = {
    id: 10,
    lead: { id: 1, firstName: "Jane", lastName: "Doe", age: 30, phoneNumber: "555-1234" },
    stage,
    value: 5000,
    name: "Deal A",
    closeDate: "2026-06-01",
};

function renderDialog({ onOpenChange = vi.fn(), onUpdate = vi.fn() } = {}) {
    render(<OppEditDialog opportunity={opp} open={true} onOpenChange={onOpenChange} onUpdate={onUpdate} />);
    return { onOpenChange, onUpdate };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.put.mockResolvedValue({ data: opp });
});

describe("OppEditDialog", () => {
    it("pre-fills name, value, and close date from the opportunity", async () => {
        renderDialog();
        expect(await screen.findByLabelText("Name")).toHaveValue("Deal A");
        expect(screen.getByLabelText("Value")).toHaveValue(5000);
        expect(screen.getByLabelText("Close Date")).toHaveValue("2026-06-01");
    });

    it("shows the opportunity's stage in the stage selector after stages load", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        expect(await screen.findByDisplayValue("Qualified")).toBeInTheDocument();
    });

    it("submits name, value, stageId, and closeDate to the API", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        await screen.findByDisplayValue("Qualified");
        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Updated Deal" } });
        fireEvent.click(screen.getByText("Update Opportunity"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/opportunities/10", expect.objectContaining({
                name: "Updated Deal",
                value: 5000,
                stageId: 1,
                closeDate: "2026-06-01",
            }))
        );
    });

    it("calls onUpdate with the server response after a successful save", async () => {
        const updatedOpp = { ...opp, name: "Updated Deal" };
        mockedAxios.put.mockResolvedValue({ data: updatedOpp });
        const { onUpdate } = renderDialog();
        fireEvent.click(await screen.findByText("Update Opportunity"));
        await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updatedOpp));
    });

    it("calls onOpenChange(false) after a successful save", async () => {
        const { onOpenChange } = renderDialog();
        fireEvent.click(await screen.findByText("Update Opportunity"));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows an error message when the save fails", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: { error: "Value must be at least 100" } } });
        renderDialog();
        fireEvent.click(await screen.findByText("Update Opportunity"));
        expect(await screen.findByText("Value must be at least 100")).toBeInTheDocument();
    });

    it("only shows opportunity custom fields, not lead custom fields", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [
                { id: 1, name: "dealSource", label: "Deal Source", entity: "opportunity" },
                { id: 2, name: "company", label: "Company", entity: "lead" },
            ]});
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        expect(await screen.findByLabelText("Deal Source")).toBeInTheDocument();
        expect(screen.queryByLabelText("Company")).not.toBeInTheDocument();
    });

    it("sends closeDate as null when the field is cleared", async () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText("Close Date"), { target: { value: "" } });
        fireEvent.click(await screen.findByText("Update Opportunity"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/opportunities/10", expect.objectContaining({
                closeDate: null,
            }))
        );
    });

    it("submits the updated value when the value input is changed", async () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText("Value"), { target: { value: "7500" } });
        fireEvent.click(await screen.findByText("Update Opportunity"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/opportunities/10", expect.objectContaining({
                value: 7500,
            }))
        );
    });

    it("submits the updated stageId when the stage selector is changed", async () => {
        const stage2: Stage = { id: 2, name: "Proposal", status: "pending", conversionLikelihood: 0.7, order: 2 };
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage, stage2] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        await screen.findByDisplayValue("Qualified");
        fireEvent.change(screen.getByLabelText("Stage"), { target: { value: "2" } });
        fireEvent.click(screen.getByText("Update Opportunity"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/opportunities/10", expect.objectContaining({
                stageId: 2,
            }))
        );
    });

    it("submits the updated custom field value when a custom field is edited", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [
                { id: 1, name: "dealSource", label: "Deal Source", entity: "opportunity" },
            ]});
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        fireEvent.change(await screen.findByLabelText("Deal Source"), { target: { value: "Referral" } });
        fireEvent.click(screen.getByText("Update Opportunity"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/opportunities/10", expect.objectContaining({
                customFields: { dealSource: "Referral" },
            }))
        );
    });

    it("pre-fills with an empty name when the opportunity has no name", async () => {
        const unnamed = { ...opp, name: undefined };
        render(<OppEditDialog opportunity={unnamed} open={true} onOpenChange={vi.fn()} onUpdate={vi.fn()} />);
        expect(await screen.findByLabelText("Name")).toHaveValue("");
    });

    it("falls back to 0 when a non-numeric value is entered in the value field", async () => {
        renderDialog();
        fireEvent.change(screen.getByLabelText("Value"), { target: { value: "abc" } });
        fireEvent.click(await screen.findByText("Update Opportunity"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/opportunities/10", expect.objectContaining({
                value: 0,
            }))
        );
    });

    it("shows raw response data as the error when there is no data.error property", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: "Bad request" } });
        renderDialog();
        fireEvent.click(await screen.findByText("Update Opportunity"));
        expect(await screen.findByText("Bad request")).toBeInTheDocument();
    });

    it("shows a fallback error message when the error has no response data", async () => {
        mockedAxios.put.mockRejectedValue({});
        renderDialog();
        fireEvent.click(await screen.findByText("Update Opportunity"));
        expect(await screen.findByText("An error occurred")).toBeInTheDocument();
    });

    it("shows an error when stages or custom fields fail to load", async () => {
        mockedAxios.get.mockRejectedValue(new Error("Network error"));
        renderDialog();
        expect(await screen.findByText("Failed to load form data")).toBeInTheDocument();
    });

    it("clears the error and calls onOpenChange(false) when closed via the close button", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: { error: "Some error" } } });
        const { onOpenChange } = renderDialog();
        fireEvent.click(await screen.findByText("Update Opportunity"));
        expect(await screen.findByText("Some error")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByText("Some error")).not.toBeInTheDocument();
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});