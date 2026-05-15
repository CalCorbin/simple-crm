import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { OppAddDialog } from "../opp-add-dialog";
import { Lead, Opportunity, Stage } from "../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const lead: Lead = { id: 1, firstName: "Jane", lastName: "Doe", age: 30, phoneNumber: "555-1234" };
const stage: Stage = { id: 1, name: "Qualified", status: "pending", conversionLikelihood: 0.5, order: 1 };
const createdOpp: Opportunity = {
    id: 20,
    lead,
    stage,
    value: 3000,
    name: "New Deal",
};

function renderDialog({ onOpenChange = vi.fn(), onAdd = vi.fn() } = {}) {
    render(<OppAddDialog lead={lead} open={true} onOpenChange={onOpenChange} onAdd={onAdd} />);
    return { onOpenChange, onAdd };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: createdOpp });
});

describe("OppAddDialog", () => {
    it("shows the lead's full name in the dialog header", async () => {
        renderDialog();
        expect(await screen.findByText("For Jane Doe")).toBeInTheDocument();
    });

    it("loads and displays stages after opening", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        expect(await screen.findByDisplayValue("Qualified")).toBeInTheDocument();
    });

    it("defaults the stage selector to the first available stage", async () => {
        const stage2: Stage = { id: 2, name: "Proposal", status: "pending", conversionLikelihood: 0.7, order: 2 };
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage, stage2] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        expect(await screen.findByDisplayValue("Qualified")).toBeInTheDocument();
    });

    it("submits leadId, stageId, name, value, and closeDate to the API", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        await screen.findByDisplayValue("Qualified");
        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New Deal" } });
        fireEvent.change(screen.getByLabelText("Value"), { target: { value: "3000" } });
        fireEvent.change(screen.getByLabelText("Close Date"), { target: { value: "2026-09-01" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Opportunity" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/opportunities", expect.objectContaining({
                leadId: 1,
                stageId: 1,
                name: "New Deal",
                value: 3000,
                closeDate: "2026-09-01",
            }))
        );
    });

    it("sends closeDate as null when the field is left empty", async () => {
        renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/opportunities", expect.objectContaining({
                closeDate: null,
            }))
        );
    });

    it("calls onAdd with the server response after a successful create", async () => {
        const { onAdd } = renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        await waitFor(() => expect(onAdd).toHaveBeenCalledWith(createdOpp));
    });

    it("calls onOpenChange(false) after a successful create", async () => {
        const { onOpenChange } = renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows error message from response data.error when the save fails", async () => {
        mockedAxios.post.mockRejectedValue({ response: { data: { error: "Value must be at least 100" } } });
        renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        expect(await screen.findByText("Value must be at least 100")).toBeInTheDocument();
    });

    it("shows raw response data as the error when there is no data.error property", async () => {
        mockedAxios.post.mockRejectedValue({ response: { data: "Bad request" } });
        renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        expect(await screen.findByText("Bad request")).toBeInTheDocument();
    });

    it("shows a fallback error message when the error has no response data", async () => {
        mockedAxios.post.mockRejectedValue({});
        renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        expect(await screen.findByText("An error occurred")).toBeInTheDocument();
    });

    it("clears the error and calls onOpenChange(false) when closed via the close button", async () => {
        mockedAxios.post.mockRejectedValue({ response: { data: { error: "Some error" } } });
        const { onOpenChange } = renderDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Add Opportunity" }));
        expect(await screen.findByText("Some error")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByText("Some error")).not.toBeInTheDocument();
        expect(onOpenChange).toHaveBeenCalledWith(false);
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

    it("submits the custom field value when a custom field is edited", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [
                { id: 1, name: "dealSource", label: "Deal Source", entity: "opportunity" },
            ]});
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        fireEvent.change(await screen.findByLabelText("Deal Source"), { target: { value: "Referral" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Opportunity" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/opportunities", expect.objectContaining({
                customFields: { dealSource: "Referral" },
            }))
        );
    });

    it("submits the selected stageId when the stage selector is changed", async () => {
        const stage2: Stage = { id: 2, name: "Proposal", status: "pending", conversionLikelihood: 0.7, order: 2 };
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/stages") return Promise.resolve({ data: [stage, stage2] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        await screen.findByDisplayValue("Qualified");
        fireEvent.change(screen.getByLabelText("Stage"), { target: { value: "2" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Opportunity" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/opportunities", expect.objectContaining({
                stageId: 2,
            }))
        );
    });

    it("shows an error when stages or custom fields fail to load", async () => {
        mockedAxios.get.mockRejectedValue(new Error("Network error"));
        renderDialog();
        expect(await screen.findByText("Failed to load form data")).toBeInTheDocument();
    });
});
