import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { ManageFields } from "../manage-fields";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] });
});

describe("ManageFields", () => {
    it("shows empty state when no custom fields exist", async () => {
        render(<ManageFields onFieldsChanged={vi.fn()} />);
        expect(await screen.findByText("No custom fields yet")).toBeInTheDocument();
    });

    it("renders each field's label and internal name", async () => {
        mockedAxios.get.mockResolvedValue({
            data: [{ id: 1, name: "company", label: "Company", entity: "lead", type: "text" }],
        });
        render(<ManageFields onFieldsChanged={vi.fn()} />);
        expect(await screen.findByText("Company")).toBeInTheDocument();
        expect(await screen.findByText("(company)")).toBeInTheDocument();
    });

    it("calls onFieldsChanged after adding a field", async () => {
        mockedAxios.post.mockResolvedValue({});
        const onFieldsChanged = vi.fn();
        render(<ManageFields onFieldsChanged={onFieldsChanged} />);
        fireEvent.change(screen.getByPlaceholderText("company"), { target: { value: "industry" } });
        fireEvent.change(screen.getByPlaceholderText("Company"), { target: { value: "Industry" } });
        fireEvent.click(screen.getByText("Add Field"));
        await waitFor(() => expect(onFieldsChanged).toHaveBeenCalled());
    });

    it("calls onFieldsChanged after deleting a field", async () => {
        mockedAxios.get.mockResolvedValue({
            data: [{ id: 1, name: "company", label: "Company", entity: "lead", type: "text" }],
        });
        mockedAxios.delete.mockResolvedValue({});
        const onFieldsChanged = vi.fn();
        render(<ManageFields onFieldsChanged={onFieldsChanged} />);
        fireEvent.click(await screen.findByText("Delete"));
        await waitFor(() => expect(onFieldsChanged).toHaveBeenCalled());
    });

    it("shows an alert when adding a field fails", async () => {
        const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
        mockedAxios.post.mockRejectedValue(new Error("Duplicate"));
        render(<ManageFields onFieldsChanged={vi.fn()} />);
        fireEvent.change(screen.getByPlaceholderText("company"), { target: { value: "industry" } });
        fireEvent.change(screen.getByPlaceholderText("Company"), { target: { value: "Industry" } });
        fireEvent.click(screen.getByText("Add Field"));
        await waitFor(() => expect(alertMock).toHaveBeenCalled());
        alertMock.mockRestore();
    });

    it("updates the entity select when changed", () => {
        render(<ManageFields onFieldsChanged={vi.fn()} />);
        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[0], { target: { value: "opportunity" } });
        expect(selects[0]).toHaveValue("opportunity");
    });

    it("updates the type select when changed", () => {
        render(<ManageFields onFieldsChanged={vi.fn()} />);
        const selects = screen.getAllByRole("combobox");
        fireEvent.change(selects[1], { target: { value: "number" } });
        expect(selects[1]).toHaveValue("number");
    });
});