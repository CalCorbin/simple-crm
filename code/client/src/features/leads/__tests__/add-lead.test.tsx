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
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Age")).toBeInTheDocument();
        expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
    });

    it("renders an input for each custom field returned by the API", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ id: 1, name: "company", label: "Company" }] });
        render(<AddLead />);
        expect(await screen.findByLabelText("Company")).toBeInTheDocument();
    });

    it("calls onSuccess instead of showing an inline message when the prop is provided", async () => {
        mockedAxios.post.mockResolvedValue({});
        const onSuccess = vi.fn();
        render(<AddLead onSuccess={onSuccess} />);
        fireEvent.click(screen.getByRole("button", { name: "Add Lead" }));
        await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
        expect(screen.queryByText("Lead added successfully")).not.toBeInTheDocument();
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
        fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "John" } });
        fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Smith" } });
        fireEvent.change(screen.getByLabelText("Age"), { target: { value: "30" } });
        fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "555-0000" } });
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
        const companyInput = await screen.findByLabelText("Company");
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