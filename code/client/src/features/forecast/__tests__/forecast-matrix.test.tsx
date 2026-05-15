import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ForecastMatrix } from "../forecast-matrix";
import { ForecastBucket } from "../../../types";

const ungroupedBuckets: ForecastBucket[] = [
    { label: "This Month", count: 2, totalExpectedValue: 3000 },
    { label: "Past", count: 0, totalExpectedValue: 0 },
];

const groupedBuckets: ForecastBucket[] = [
    {
        label: "This Month",
        groups: [
            { groupValue: "Enterprise", count: 1, totalExpectedValue: 2000 },
            { groupValue: "Unassigned", count: 1, totalExpectedValue: 500 },
        ],
    },
];

const sparseBuckets: ForecastBucket[] = [
    {
        label: "This Month",
        groups: [{ groupValue: "Enterprise", count: 1, totalExpectedValue: 2000 }],
    },
    {
        label: "Next Month",
        groups: [],
    },
];

describe("ForecastMatrix", () => {
    it("shows bucket labels in ungrouped mode", () => {
        render(<ForecastMatrix buckets={ungroupedBuckets} grouped={false} />);
        expect(screen.getByText("This Month")).toBeInTheDocument();
        expect(screen.getByText("Past")).toBeInTheDocument();
    });

    it("shows the formatted total in ungrouped mode", () => {
        render(<ForecastMatrix buckets={ungroupedBuckets} grouped={false} />);
        expect(screen.getByText("$3,000")).toBeInTheDocument();
    });

    it("does not render group columns in ungrouped mode", () => {
        render(<ForecastMatrix buckets={ungroupedBuckets} grouped={false} />);
        expect(screen.queryByText("Enterprise")).not.toBeInTheDocument();
    });

    it("renders group value column headers in grouped mode", () => {
        render(<ForecastMatrix buckets={groupedBuckets} grouped={true} />);
        expect(screen.getByRole("columnheader", { name: "Enterprise" })).toBeInTheDocument();
    });

    it("renders per-group cell values in grouped mode", () => {
        render(<ForecastMatrix buckets={groupedBuckets} grouped={true} />);
        expect(screen.getByText("$2,000")).toBeInTheDocument();
    });

    it("places Unassigned columns after named columns", () => {
        render(<ForecastMatrix buckets={groupedBuckets} grouped={true} />);
        const headers = screen.getAllByRole("columnheader").map(h => h.textContent);
        expect(headers.indexOf("Enterprise")).toBeLessThan(headers.indexOf("Unassigned"));
    });

    it("applies opacity-40 to rows with zero count", () => {
        const { container } = render(<ForecastMatrix buckets={ungroupedBuckets} grouped={false} />);
        const rows = container.querySelectorAll("tbody tr");
        expect(rows[1]).toHaveClass("opacity-40");
    });

    it("does not apply opacity-40 to rows with non-zero count", () => {
        const { container } = render(<ForecastMatrix buckets={ungroupedBuckets} grouped={false} />);
        const rows = container.querySelectorAll("tbody tr");
        expect(rows[0]).not.toHaveClass("opacity-40");
    });

    it("shows $0 total for a bucket missing totalExpectedValue in ungrouped mode", () => {
        const buckets: ForecastBucket[] = [{ label: "This Month" }];
        render(<ForecastMatrix buckets={buckets} grouped={false} />);
        expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("renders a dash placeholder for a column with no matching group data", () => {
        render(<ForecastMatrix buckets={sparseBuckets} grouped={true} />);
        expect(screen.getByText("—")).toBeInTheDocument();
    });
});
