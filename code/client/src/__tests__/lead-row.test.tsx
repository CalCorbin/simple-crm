import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { LeadRow } from "../lead-row";
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

function renderRow(onUpdate = vi.fn()) {
    render(
        <table><tbody>
            <LeadRow lead={lead} onUpdate={onUpdate} />
        </tbody></table>
    );
    return { onUpdate };
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

    it("shows the edit form when Edit is clicked", async () => {
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        expect(await screen.findByText("Update Lead")).toBeInTheDocument();
    });

    it("updates edit form inputs as user types", async () => {
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        const firstNameInput = await screen.findByPlaceholderText("First Name");
        fireEvent.change(firstNameInput, { target: { value: "Janet" } });
        expect(firstNameInput).toHaveValue("Janet");
    });

    it("submits updated Last Name, Age, and Phone values to the API", async () => {
        mockedAxios.put.mockResolvedValue({});
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.change(await screen.findByPlaceholderText("Last Name"), { target: { value: "Smith" } });
        fireEvent.change(screen.getByPlaceholderText("Age"), { target: { value: "35" } });
        fireEvent.change(screen.getByPlaceholderText("Phone Number"), { target: { value: "555-9999" } });
        fireEvent.click(screen.getByText("Update Lead"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith(`/api/leads/${lead.id}`, expect.objectContaining({
                lastName: "Smith",
                age: "35",
                phoneNumber: "555-9999",
            }))
        );
    });

    it("updates a custom field value in the edit form", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [{ id: 1, name: "company", label: "Company" }] });
            return Promise.resolve({ data: [] });
        });
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        const companyInput = await screen.findByPlaceholderText("Company");
        fireEvent.change(companyInput, { target: { value: "Acme" } });
        expect(companyInput).toHaveValue("Acme");
    });

    it("calls onUpdate after a successful save", async () => {
        mockedAxios.put.mockResolvedValue({});
        const { onUpdate } = renderRow();
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.click(await screen.findByText("Update Lead"));
        await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    });

    it("shows an error message when the save fails", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: "Invalid age" } });
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.click(await screen.findByText("Update Lead"));
        expect(await screen.findByText("Invalid age")).toBeInTheDocument();
    });

    it("clears the error when the dialog is closed and reopened", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: "Invalid age" } });
        renderRow();
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.click(await screen.findByText("Update Lead"));
        expect(await screen.findByText("Invalid age")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        fireEvent.click(screen.getByText("Edit"));
        await screen.findByPlaceholderText("First Name");
        expect(screen.queryByText("Invalid age")).not.toBeInTheDocument();
    });

    it("shows the opportunities panel when Show Opps is clicked", async () => {
        renderRow();
        fireEvent.click(screen.getByText("Show Opps"));
        expect(await screen.findByText("Opportunities")).toBeInTheDocument();
    });

    it("shows no opportunities message when the lead has none", async () => {
        renderRow();
        fireEvent.click(screen.getByText("Show Opps"));
        expect(await screen.findByText("No opportunities")).toBeInTheDocument();
    });

    it("shows 'Unnamed' for opportunities with no name", async () => {
        const unnamedOpp: Opportunity = { id: 11, lead, stage: opp.stage, value: 1000 };
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/opportunities") return Promise.resolve({ data: [unnamedOpp] });
            return Promise.resolve({ data: [] });
        });
        renderRow();
        fireEvent.click(screen.getByText("Show Opps"));
        expect(await screen.findByText("Unnamed")).toBeInTheDocument();
    });

    it("shows opportunity name, stage, and formatted value when opps exist", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/opportunities") return Promise.resolve({ data: [opp] });
            return Promise.resolve({ data: [] });
        });
        renderRow();
        fireEvent.click(screen.getByText("Show Opps"));
        expect(await screen.findByText("Deal A")).toBeInTheDocument();
        expect(await screen.findByText("Qualified")).toBeInTheDocument();
        expect(await screen.findByText("$5,000.00")).toBeInTheDocument();
    });

    it("deletes an opportunity when its Delete button is clicked", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/opportunities") return Promise.resolve({ data: [opp] });
            return Promise.resolve({ data: [] });
        });
        mockedAxios.delete.mockResolvedValue({});
        renderRow();
        fireEvent.click(screen.getByText("Show Opps"));
        fireEvent.click(await screen.findByText("Delete"));
        await waitFor(() => expect(mockedAxios.delete).toHaveBeenCalledWith("/api/opportunities/10"));
    });
});