import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { AddLead } from "../add-lead";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("AddLead", () => {
    it("renders the four standard input fields", () => {
        render(<AddLead />);
        expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Age")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Phone Number")).toBeInTheDocument();
    });

    it("renders an input for each custom field returned by the API", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ id: 1, name: "company", label: "Company" }] });
        render(<AddLead />);
        expect(await screen.findByPlaceholderText("Company")).toBeInTheDocument();
    });

    it("shows a success message after the lead is created", async () => {
        mockedAxios.post.mockResolvedValue({});
        render(<AddLead />);
        fireEvent.click(screen.getByRole("button", { name: "Add Lead" }));
        expect(await screen.findByText("Lead added successfully")).toBeInTheDocument();
    });

    it("shows the server error message when create fails", async () => {
        mockedAxios.post.mockRejectedValue({ response: { data: "Phone number is required" } });
        render(<AddLead />);
        fireEvent.click(screen.getByRole("button", { name: "Add Lead" }));
        expect(await screen.findByText("Phone number is required")).toBeInTheDocument();
    });

    it("submits the entered field values to the API", async () => {
        mockedAxios.post.mockResolvedValue({});
        render(<AddLead />);
        fireEvent.change(screen.getByPlaceholderText("First Name"), { target: { value: "John" } });
        fireEvent.change(screen.getByPlaceholderText("Last Name"), { target: { value: "Smith" } });
        fireEvent.change(screen.getByPlaceholderText("Age"), { target: { value: "30" } });
        fireEvent.change(screen.getByPlaceholderText("Phone Number"), { target: { value: "555-0000" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Lead" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/leads", {
                firstName: "John",
                lastName: "Smith",
                age: "30",
                phoneNumber: "555-0000",
                customFields: {},
            })
        );
    });

    it("includes custom field values in the submitted payload", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ id: 1, name: "company", label: "Company" }] });
        mockedAxios.post.mockResolvedValue({});
        render(<AddLead />);
        const companyInput = await screen.findByPlaceholderText("Company");
        fireEvent.change(companyInput, { target: { value: "Acme" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Lead" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith(
                "/api/leads",
                expect.objectContaining({ customFields: { company: "Acme" } })
            )
        );
    });
});