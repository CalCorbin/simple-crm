import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { LeadEditDialog } from "../lead-edit-dialog";
import { Lead } from "../../../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const lead: Lead = { id: 1, firstName: "Jane", lastName: "Doe", age: 30, phoneNumber: "555-1234" };

function renderDialog({ onOpenChange = vi.fn(), onUpdate = vi.fn() } = {}) {
    render(<LeadEditDialog lead={lead} open={true} onOpenChange={onOpenChange} onUpdate={onUpdate} />);
    return { onOpenChange, onUpdate };
}

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("LeadEditDialog", () => {
    it("pre-fills form fields with the lead's current values", async () => {
        renderDialog();
        expect(await screen.findByLabelText("First Name")).toHaveValue("Jane");
        expect(screen.getByLabelText("Last Name")).toHaveValue("Doe");
        expect(screen.getByLabelText("Age")).toHaveValue("30");
        expect(screen.getByLabelText("Phone Number")).toHaveValue("555-1234");
    });

    it("updates form inputs as user types", async () => {
        renderDialog();
        const input = await screen.findByLabelText("First Name");
        fireEvent.change(input, { target: { value: "Janet" } });
        expect(input).toHaveValue("Janet");
    });

    it("submits updated values to the API", async () => {
        mockedAxios.put.mockResolvedValue({});
        renderDialog();
        fireEvent.change(await screen.findByLabelText("Last Name"), { target: { value: "Smith" } });
        fireEvent.change(screen.getByLabelText("Age"), { target: { value: "35" } });
        fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "555-9999" } });
        fireEvent.click(screen.getByText("Update Lead"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith(`/api/leads/${lead.id}`, expect.objectContaining({
                lastName: "Smith",
                age: "35",
                phoneNumber: "555-9999",
            }))
        );
    });

    it("loads and renders custom fields when open", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [{ id: 1, name: "company", label: "Company" }] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        expect(await screen.findByLabelText("Company")).toBeInTheDocument();
    });

    it("updates a custom field value in the form", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [{ id: 1, name: "company", label: "Company" }] });
            return Promise.resolve({ data: [] });
        });
        renderDialog();
        const companyInput = await screen.findByLabelText("Company");
        fireEvent.change(companyInput, { target: { value: "Acme" } });
        expect(companyInput).toHaveValue("Acme");
    });

    it("calls onUpdate after a successful save", async () => {
        mockedAxios.put.mockResolvedValue({});
        const { onUpdate } = renderDialog();
        fireEvent.click(await screen.findByText("Update Lead"));
        await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    });

    it("calls onOpenChange(false) after a successful save", async () => {
        mockedAxios.put.mockResolvedValue({});
        const { onOpenChange } = renderDialog();
        fireEvent.click(await screen.findByText("Update Lead"));
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    });

    it("shows an error message when the save fails", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: "Invalid age" } });
        renderDialog();
        fireEvent.click(await screen.findByText("Update Lead"));
        expect(await screen.findByText("Invalid age")).toBeInTheDocument();
    });

    it("clears the error when closed and reopened", async () => {
        mockedAxios.put.mockRejectedValue({ response: { data: "Invalid age" } });
        const { onOpenChange } = renderDialog();
        fireEvent.click(await screen.findByText("Update Lead"));
        expect(await screen.findByText("Invalid age")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
