import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import App from "../App";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("App", () => {
    it("renders the nav with all three pages", async () => {
        render(<App />);
        expect(screen.getByText("SimpleCRM")).toBeInTheDocument();
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Pipeline")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("shows the home page by default", () => {
        render(<App />);
        expect(screen.getByText("Home").className).toContain("bg-blue-500");
    });

    it("shows the pipeline page when Pipeline is clicked", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/pipeline") return Promise.resolve({ data: { totalValue: 0, expectedValue: 0, byStage: [] } });
            return Promise.resolve({ data: [] });
        });
        render(<App />);
        fireEvent.click(screen.getByText("Pipeline"));
        expect(await screen.findByText("Pipeline Report")).toBeInTheDocument();
    });

    it("shows the settings page when Settings is clicked", async () => {
        render(<App />);
        fireEvent.click(screen.getByText("Settings"));
        expect(await screen.findByText("Manage Custom Fields")).toBeInTheDocument();
    });

    it("shows the home page again after navigating away and back", async () => {
        render(<App />);
        fireEvent.click(screen.getByText("Settings"));
        fireEvent.click(screen.getByText("Home"));
        expect(await screen.findByText("Leads")).toBeInTheDocument();
    });

    it("Add Lead modal picks up a new custom field after one is added in Settings", async () => {
        let fields: object[] = [];
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: fields });
            return Promise.resolve({ data: [] });
        });
        mockedAxios.post.mockImplementation(async () => {
            fields = [{ id: 1, name: "company", label: "Company", entity: "lead", type: "text" }];
            return {};
        });

        render(<App />);

        // Navigate to Settings, add the field
        fireEvent.click(screen.getByText("Settings"));
        fireEvent.change(await screen.findByPlaceholderText("company"), { target: { value: "company" } });
        fireEvent.change(screen.getByPlaceholderText("Company"), { target: { value: "Company" } });
        fireEvent.click(screen.getByText("Add Field"));
        await waitFor(() => expect(mockedAxios.post).toHaveBeenCalled());

        // Return to Home and open the Add Lead modal — it should fetch and render the new field input
        fireEvent.click(screen.getByText("Home"));
        fireEvent.click(await screen.findByRole("button", { name: "Add Lead" }));
        expect(await screen.findByLabelText("Company")).toBeInTheDocument();
    });
});
