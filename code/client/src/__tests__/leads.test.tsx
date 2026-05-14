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
        mockedAxios.get.mockResolvedValue({ data: leads });
        render(<Leads />);
        expect(await screen.findByText("Alice")).toBeInTheDocument();
        expect(await screen.findByText("Bob")).toBeInTheDocument();
    });
});
