import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { Forecast } from "../forecast";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const forecastData = { buckets: [{ label: "This Month", count: 1, totalExpectedValue: 1000 }] };
const customFieldsData = [{ id: 1, name: "region", label: "Region", entity: "opportunity", type: "text" }];

beforeEach(() => {
    mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes("forecast")) return Promise.resolve({ data: { buckets: [] } });
        return Promise.resolve({ data: [] });
    });
});

describe("Forecast", () => {
    it("renders the page heading", async () => {
        render(<Forecast />);
        expect(await screen.findByText("Opportunities Forecast")).toBeInTheDocument();
    });

    it("renders the matrix once forecast data loads", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url.includes("forecast")) return Promise.resolve({ data: forecastData });
            return Promise.resolve({ data: [] });
        });
        render(<Forecast />);
        expect(await screen.findByText("This Month")).toBeInTheDocument();
    });

    it("does not render the matrix before data loads", () => {
        mockedAxios.get.mockReturnValue(new Promise(() => {}));
        render(<Forecast />);
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("shows GroupBySelector when custom fields load", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url.includes("custom-fields")) return Promise.resolve({ data: customFieldsData });
            return Promise.resolve({ data: forecastData });
        });
        render(<Forecast />);
        expect(await screen.findByText("Region")).toBeInTheDocument();
    });

    it("does not show GroupBySelector when no custom fields", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url.includes("custom-fields")) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: forecastData });
        });
        render(<Forecast />);
        await waitFor(() => expect(mockedAxios.get).toHaveBeenCalled());
        expect(screen.queryByText("Group by")).not.toBeInTheDocument();
    });

    it("fetches forecast with groupBy param when a field pill is selected", async () => {
        mockedAxios.get.mockImplementation((url: string) => {
            if (url.includes("custom-fields")) return Promise.resolve({ data: customFieldsData });
            return Promise.resolve({ data: forecastData });
        });
        render(<Forecast />);
        fireEvent.click(await screen.findByText("Region"));
        await waitFor(() => {
            expect(mockedAxios.get).toHaveBeenCalledWith("/api/forecast?groupBy=1");
        });
    });
});
