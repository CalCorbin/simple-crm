import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { ManageSettings } from "../manage-settings";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("ManageSettings", () => {
    it("shows empty state when no settings exist", async () => {
        render(<ManageSettings />);
        expect(await screen.findByText("No settings")).toBeInTheDocument();
    });

    it("renders each setting's key", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ key: "wonStageLikelihood", value: "1" }] });
        render(<ManageSettings />);
        expect(await screen.findByText("wonStageLikelihood")).toBeInTheDocument();
    });

    it("Save button is disabled when the value is unchanged", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ key: "wonStageLikelihood", value: "1" }] });
        render(<ManageSettings />);
        expect(await screen.findByText("Save")).toBeDisabled();
    });

    it("Save button is enabled after the value is changed", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ key: "wonStageLikelihood", value: "1" }] });
        render(<ManageSettings />);
        const input = await screen.findByDisplayValue("1");
        fireEvent.change(input, { target: { value: "0.9" } });
        expect(screen.getByText("Save")).not.toBeDisabled();
    });

    it("saves the new value to the API when Save is clicked", async () => {
        mockedAxios.get.mockResolvedValue({ data: [{ key: "wonStageLikelihood", value: "1" }] });
        mockedAxios.put.mockResolvedValue({});
        render(<ManageSettings />);
        const input = await screen.findByDisplayValue("1");
        fireEvent.change(input, { target: { value: "0.9" } });
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/settings/wonStageLikelihood", { value: "0.9" })
        );
    });
});