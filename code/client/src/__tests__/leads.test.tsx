import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { Leads } from "../leads";
import { Lead } from "../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("Leads", () => {
    it("renders an Add Lead button", () => {
        render(<Leads />);
        expect(screen.getByRole("button", { name: "Add Lead" })).toBeInTheDocument();
    });

    it("renders the table column headers", () => {
        render(<Leads />);
        expect(screen.getByText("First Name")).toBeInTheDocument();
        expect(screen.getByText("Last Name")).toBeInTheDocument();
        expect(screen.getByText("Age")).toBeInTheDocument();
        expect(screen.getByText("Phone Number")).toBeInTheDocument();
    });

    it("renders a row for each lead returned by the API", async () => {
        const leads: Lead[] = [
            { id: 1, firstName: "Alice", lastName: "Smith", age: 25, phoneNumber: "111" },
            { id: 2, firstName: "Bob", lastName: "Jones", age: 35, phoneNumber: "222" },
        ];
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/leads") return Promise.resolve({ data: leads });
            return Promise.resolve({ data: [] });
        });
        render(<Leads />);
        expect(await screen.findByText("Alice")).toBeInTheDocument();
        expect(await screen.findByText("Bob")).toBeInTheDocument();
    });

    it("closes the Add Lead modal and refreshes leads after a lead is created", async () => {
        const newLead: Lead = { id: 99, firstName: "Carol", lastName: "White", age: 28, phoneNumber: "333" };
        mockedAxios.post.mockResolvedValue({});
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/leads") return Promise.resolve({ data: [newLead] });
            return Promise.resolve({ data: [] });
        });
        render(<Leads />);
        fireEvent.click(screen.getByRole("button", { name: "Add Lead" }));
        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByLabelText("First Name")).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole("button", { name: "Add Lead" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(await screen.findByText("Carol")).toBeInTheDocument();
    });

    it("shows the opportunity count badge on rows with opportunities", async () => {
        const leads: Lead[] = [{ id: 1, firstName: "Alice", lastName: "Smith", age: 25, phoneNumber: "111" }];
        const stage = { id: 1, name: "Qualified", status: "pending" as const, conversionLikelihood: 0.5, order: 1 };
        const opps = [
            { id: 10, lead: leads[0], stage, value: 1000 },
            { id: 11, lead: leads[0], stage, value: 2000 },
        ];
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/leads") return Promise.resolve({ data: leads });
            if (url === "/api/opportunities") return Promise.resolve({ data: opps });
            return Promise.resolve({ data: [] });
        });
        render(<Leads />);
        expect(await screen.findByText("2")).toBeInTheDocument();
    });
});
