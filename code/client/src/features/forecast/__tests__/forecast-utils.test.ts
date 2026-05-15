import { describe, expect, it } from "vitest";
import { bucketAccent, fmt } from "../forecast-utils";

describe("bucketAccent", () => {
    it("returns amber styles for Past", () => {
        expect(bucketAccent("Past")).toBe("border-amber-400 bg-amber-50");
    });

    it("returns gray styles for Beyond 6 Months", () => {
        expect(bucketAccent("Beyond 6 Months")).toBe("border-gray-300 bg-gray-50");
    });

    it("returns gray styles for No Close Date", () => {
        expect(bucketAccent("No Close Date")).toBe("border-gray-300 bg-gray-50");
    });

    it("returns blue styles for any other label", () => {
        expect(bucketAccent("This Month")).toBe("border-blue-400 bg-white");
    });
});

describe("fmt", () => {
    it("formats a number as USD with no cents", () => {
        expect(fmt(1500)).toBe("$1,500");
    });
});
