import { render, screen } from "@testing-library/react";
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
