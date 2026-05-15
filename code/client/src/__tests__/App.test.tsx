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
    it("renders the nav with all four pages", async () => {
        render(<App />);
        expect(await screen.findByText("SimpleCRM")).toBeInTheDocument();
        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Pipeline")).toBeInTheDocument();
        expect(screen.getByText("Forecast")).toBeInTheDocument();
        expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("shows the home page by default", async () => {
        render(<App />);
        expect((await screen.findByText("Home")).className).toContain("bg-blue-500");
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

    it("shows the forecast page when Forecast is clicked", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/forecast") return Promise.resolve({ data: { buckets: [] } });
            return Promise.resolve({ data: [] });
        });
        render(<App />);
        fireEvent.click(screen.getByText("Forecast"));
        expect(await screen.findByText("Opportunities Forecast")).toBeInTheDocument();
    });

    it("renders a matrix table with Bucket and Total columns on the forecast page", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/forecast") return Promise.resolve({ data: {
                buckets: [
                    { label: "Past", count: 2, totalExpectedValue: 500 },
                    { label: "May 2026", count: 1, totalExpectedValue: 200 },
                ],
            }});
            return Promise.resolve({ data: [] });
        });
        render(<App />);
        fireEvent.click(screen.getByText("Forecast"));
        expect(await screen.findByText("Past")).toBeInTheDocument();
        expect(screen.getByText("May 2026")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("shows group-by pills for opportunity-scoped custom fields", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [
                { id: 1, name: "region", label: "Region", entity: "opportunity", type: "text" },
                { id: 2, name: "source", label: "Source", entity: "lead", type: "text" },
            ]});
            if (url === "/api/forecast") return Promise.resolve({ data: { buckets: [] } });
            return Promise.resolve({ data: [] });
        });
        render(<App />);
        fireEvent.click(screen.getByText("Forecast"));
        expect(await screen.findByText("Region")).toBeInTheDocument();
        expect(screen.queryByText("Source")).not.toBeInTheDocument();
    });

    it("fetches grouped forecast data and renders group columns when a pill is selected", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url === "/api/custom-fields") return Promise.resolve({ data: [
                { id: 1, name: "region", label: "Region", entity: "opportunity", type: "text" },
            ]});
            if (url === "/api/forecast") return Promise.resolve({ data: { buckets: [
                { label: "Past", count: 1, totalExpectedValue: 300 },
            ]}});
            if (url === "/api/forecast?groupBy=1") return Promise.resolve({ data: { buckets: [
                { label: "Past", groups: [
                    { groupValue: "East", count: 1, totalExpectedValue: 300 },
                ]},
            ]}});
            return Promise.resolve({ data: [] });
        });
        render(<App />);
        fireEvent.click(screen.getByText("Forecast"));
        fireEvent.click(await screen.findByText("Region"));
        expect(await screen.findByText("East")).toBeInTheDocument();
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
