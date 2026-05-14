import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { Pipeline } from "../pipeline";
import { PipelineReport } from "../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const report: PipelineReport = {
    totalValue: 15000,
    expectedValue: 7500,
    byStage: [
        {
            stage: { id: 1, name: "Qualified", status: "pending", conversionLikelihood: 0.5, order: 1 },
            count: 3,
            totalValue: 10000,
            expectedValue: 5000,
        },
    ],
};

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: report });
});

describe("Pipeline", () => {
    it("shows a loading indicator before data arrives", () => {
        mockedAxios.get.mockReturnValue(new Promise(() => {}));
        render(<Pipeline />);
        expect(screen.getByText("Loading pipeline...")).toBeInTheDocument();
    });

    it("renders total pipeline value and expected close value", async () => {
        render(<Pipeline />);
        expect(await screen.findByText("$15,000.00")).toBeInTheDocument();
        expect(await screen.findByText("$7,500.00")).toBeInTheDocument();
    });

    it("renders a row for each stage in the report", async () => {
        render(<Pipeline />);
        expect(await screen.findByText("Qualified")).toBeInTheDocument();
    });

    it("applies green background to won stage rows", async () => {
        const wonReport: PipelineReport = {
            ...report,
            byStage: [{ ...report.byStage[0], stage: { ...report.byStage[0].stage, status: "won" } }],
        };
        mockedAxios.get.mockResolvedValue({ data: wonReport });
        const { container } = render(<Pipeline />);
        await screen.findByText("Qualified");
        const dataRows = container.querySelectorAll("tbody tr");
        expect(dataRows[0].className).toContain("bg-green-50");
    });

    it("applies red background to lost stage rows", async () => {
        const lostReport: PipelineReport = {
            ...report,
            byStage: [{ ...report.byStage[0], stage: { ...report.byStage[0].stage, status: "lost" } }],
        };
        mockedAxios.get.mockResolvedValue({ data: lostReport });
        const { container } = render(<Pipeline />);
        await screen.findByText("Qualified");
        const dataRows = container.querySelectorAll("tbody tr");
        expect(dataRows[0].className).toContain("bg-red-50");
    });
});
