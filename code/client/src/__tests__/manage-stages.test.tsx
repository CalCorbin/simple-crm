import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { ManageStages } from "../manage-stages";
import { Stage } from "../types";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const stage: Stage = { id: 1, name: "Qualified", status: "pending", conversionLikelihood: 0.5, order: 1 };

beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: [] });
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("ManageStages", () => {
    it("shows empty state when no stages exist", async () => {
        render(<ManageStages />);
        expect(await screen.findByText("No stages")).toBeInTheDocument();
    });

    it("renders each stage's name and status", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        expect(await screen.findByText("Qualified")).toBeInTheDocument();
        expect(await screen.findByText("(pending)")).toBeInTheDocument();
    });

    it("shows edit inputs when Edit is clicked", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        expect(screen.getByText("Save")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("hides the edit form when Cancel is clicked", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        fireEvent.click(screen.getByText("Cancel"));
        expect(screen.queryByText("Save")).not.toBeInTheDocument();
        expect(screen.getByText("Qualified")).toBeInTheDocument();
    });

    it("updates the edit name input as user types", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        const nameInput = screen.getByDisplayValue("Qualified");
        fireEvent.change(nameInput, { target: { value: "Prospecting" } });
        expect(nameInput).toHaveValue("Prospecting");
    });

    it("saves the edited stage to the API when Save is clicked", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        mockedAxios.put.mockResolvedValue({});
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() =>
            expect(mockedAxios.put).toHaveBeenCalledWith("/api/stages/1", expect.any(Object))
        );
    });

    it("adds a new stage to the API when the form is submitted", async () => {
        mockedAxios.post.mockResolvedValue({});
        render(<ManageStages />);
        fireEvent.change(screen.getByPlaceholderText("Stage name"), { target: { value: "Prospecting" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));
        await waitFor(() =>
            expect(mockedAxios.post).toHaveBeenCalledWith("/api/stages", expect.objectContaining({ name: "Prospecting" }))
        );
    });

    it("does not submit if the stage name is empty", async () => {
        mockedAxios.post.mockResolvedValue({});
        render(<ManageStages />);
        fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));
        await waitFor(() => expect(mockedAxios.post).not.toHaveBeenCalled());
    });

    it("deletes the stage when deletion is confirmed", async () => {
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        mockedAxios.delete.mockResolvedValue({});
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Delete"));
        await waitFor(() => expect(mockedAxios.delete).toHaveBeenCalledWith("/api/stages/1"));
    });

    it("skips deletion when the confirmation is dismissed", async () => {
        vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Delete"));
        await waitFor(() => expect(mockedAxios.delete).not.toHaveBeenCalled());
    });

    it("updates the status select in the edit form", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        const statusSelect = screen.getAllByRole("combobox")[0];
        fireEvent.change(statusSelect, { target: { value: "won" } });
        expect(statusSelect).toHaveValue("won");
    });

    it("updates the likelihood input in the edit form", async () => {
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        const likelihoodInput = screen.getByRole("spinbutton");
        fireEvent.change(likelihoodInput, { target: { value: "0.75" } });
        expect(likelihoodInput).toHaveValue(0.75);
    });

    it("updates the status select in the add form", () => {
        render(<ManageStages />);
        const statusSelect = screen.getByRole("combobox");
        fireEvent.change(statusSelect, { target: { value: "lost" } });
        expect(statusSelect).toHaveValue("lost");
    });

    it("updates the likelihood slider in the add form", () => {
        render(<ManageStages />);
        const slider = screen.getByRole("slider");
        fireEvent.change(slider, { target: { value: "0.75" } });
        expect(slider).toHaveValue("0.75");
    });

    it("alerts when adding a stage fails", async () => {
        const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
        mockedAxios.post.mockRejectedValue(new Error("Server error"));
        render(<ManageStages />);
        fireEvent.change(screen.getByPlaceholderText("Stage name"), { target: { value: "Prospecting" } });
        fireEvent.click(screen.getByRole("button", { name: "Add Stage" }));
        await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Failed to add stage"));
    });

    it("alerts when saving an edited stage fails", async () => {
        const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
        mockedAxios.get.mockResolvedValue({ data: [stage] });
        mockedAxios.put.mockRejectedValue(new Error("Server error"));
        render(<ManageStages />);
        fireEvent.click(await screen.findByText("Edit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(alertMock).toHaveBeenCalledWith("Failed to update stage"));
    });
});