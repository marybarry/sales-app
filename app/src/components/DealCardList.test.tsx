import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "../api";
import { DealCardList } from "./DealCardList";

// Mock apiFetch so tests never hit the network
vi.mock("../api", () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

const mockDeals = [
  {
    id: "deal-1",
    name: "Acme Corp",
    customerName: "John",
    email: "john@acme.com",
    mpans: ["1234"],
    status: ["New Lead"],
    createdDate: "2024-02-15",
    priority: "High",
    contractStartDate: "",
    contractEndDate: "",
  },
  {
    id: "deal-2",
    name: "Tech Ltd",
    customerName: "Sarah",
    email: "sarah@tech.com",
    mpans: ["5678"],
    status: ["Signed"],
    createdDate: "2024-02-10",
    priority: "Medium",
    contractStartDate: "",
    contractEndDate: "",
  },
];

const makeResponse = (data: object, ok = true) =>
  ({ ok, json: async () => data } as Response);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("DealCardList", () => {
  describe("loading and rendering", () => {
    it("shows loading spinner initially", () => {
      mockApiFetch.mockReturnValue(new Promise(() => {})); // never resolves
      render(<DealCardList />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it("renders deals returned from the API", async () => {
      mockApiFetch.mockResolvedValue(
        makeResponse({ success: true, deals: mockDeals })
      );
      render(<DealCardList />);
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Tech Ltd")).toBeInTheDocument();
      });
    });

    it("shows deal count in the header", async () => {
      mockApiFetch.mockResolvedValue(
        makeResponse({ success: true, deals: mockDeals })
      );
      render(<DealCardList />);
      await waitFor(() => {
        expect(screen.getByText(/2 active deals/i)).toBeInTheDocument();
      });
    });

    it("shows empty state when no deals returned", async () => {
      mockApiFetch.mockResolvedValue(
        makeResponse({ success: true, deals: [] })
      );
      render(<DealCardList />);
      await waitFor(() => {
        expect(screen.getByText(/no deal cards found/i)).toBeInTheDocument();
      });
    });
  });

  describe("error handling", () => {
    it("shows error message when API returns failure", async () => {
      mockApiFetch.mockResolvedValue(
        makeResponse({ success: false, error: "Unauthorized" }, false)
      );
      render(<DealCardList />);
      await waitFor(() => {
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
      });
    });

    it("shows error message on network failure", async () => {
      mockApiFetch.mockRejectedValue(new Error("Network error"));
      render(<DealCardList />);
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe("creating a deal", () => {
    it("adds a new deal to the list after successful create", async () => {
      const newDeal = { ...mockDeals[0], id: "deal-new", name: "New Co" };

      // First call = GET /deals, second call = POST /deals
      mockApiFetch
        .mockResolvedValueOnce(
          makeResponse({ success: true, deals: mockDeals })
        )
        .mockResolvedValueOnce(makeResponse({ success: true, deal: newDeal }));

      render(<DealCardList />);
      await waitFor(() => screen.getByText("Acme Corp"));

      await userEvent.click(screen.getByText(/\+ new deal/i));
      // Fill in required fields
      await userEvent.type(screen.getByLabelText("Name *"), "New Co");
      await userEvent.type(screen.getByLabelText(/customer name \*/i), "Alice");
      await userEvent.type(
        screen.getByLabelText(/contact email \*/i),
        "alice@new.com"
      );
      await userEvent.selectOptions(
        screen.getByLabelText(/priority \*/i),
        "High"
      );
      // Add an MPAN
      await userEvent.click(screen.getByText(/\+ add mpan/i));
      const mpanInput = screen.getByPlaceholderText("Enter MPAN");
      await userEvent.type(mpanInput, "1234567890");

      // Select a status
      await userEvent.click(screen.getByLabelText("New Lead"));

      await userEvent.click(
        screen.getByRole("button", { name: /create deal/i })
      );

      await waitFor(() => {
        expect(screen.getByText("New Co")).toBeInTheDocument();
      });
    });
  });

  describe("deleting a deal", () => {
    it("removes a deal from the list after successful delete", async () => {
      mockApiFetch
        .mockResolvedValueOnce(
          makeResponse({ success: true, deals: mockDeals })
        ) // GET
        .mockResolvedValueOnce(
          makeResponse({ success: true, deletedId: "deal-1" })
        ); // DELETE

      render(<DealCardList />);

      // Wait for cards to load
      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });

      // Click first delete button
      const deleteButtons = screen.getAllByTitle("Delete deal");
      await userEvent.click(deleteButtons[0]);

      // Modal should now be open — click the confirm Delete button
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Delete" })
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() => {
        expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
      });
    });
  });
});
