import { render, screen } from "@testing-library/react";
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
});