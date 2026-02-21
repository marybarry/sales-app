import { APIGatewayProxyEvent } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyToken } from "./auth";
import { query } from "./db";
import { handler } from "./deals";

// Mock DB so tests don't need a real connection
vi.mock("./db", () => ({
  query: vi.fn(),
}));

// Mock auth so we can control who is logged in
vi.mock("./auth", () => ({
  corsHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  },
  verifyToken: vi.fn(),
  unauthorizedResponse: () => ({
    statusCode: 401,
    headers: {},
    body: JSON.stringify({ success: false, error: "Unauthorized" }),
  }),
}));

const mockQuery = vi.mocked(query);
const mockVerifyToken = vi.mocked(verifyToken);

const mockUser = { userId: 1, email: "test@example.com", name: "Test User" };

const makeEvent = (
  method: string,
  body?: object,
  pathParameters?: Record<string, string>
): APIGatewayProxyEvent =>
  ({
    httpMethod: method,
    body: body ? JSON.stringify(body) : null,
    pathParameters: pathParameters ?? null,
    headers: { Authorization: "Bearer fake-token" },
  } as unknown as APIGatewayProxyEvent);

const mockDealRow = {
  id: "deal-1",
  name: "Acme Corp",
  customer_name: "John",
  email: "john@acme.com",
  mpans: ["1234"],
  status: ["New Lead"],
  priority: "High",
  created_date: "2024-02-15",
  contract_start_date: null,
  contract_end_date: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyToken.mockReturnValue(mockUser);
});

describe("Deals Lambda", () => {
  describe("AUTH", () => {
    it("returns 401 when no token provided", async () => {
      mockVerifyToken.mockReturnValue(null);
      const event = makeEvent("GET");
      const res = await handler(event);
      expect(res.statusCode).toBe(401);
    });

    it("returns 200 for OPTIONS preflight without auth", async () => {
      const event = makeEvent("OPTIONS");
      const res = await handler(event);
      expect(res.statusCode).toBe(200);
    });
  });

  describe("GET /deals", () => {
    it("returns list of deals for the logged-in user", async () => {
      mockQuery.mockResolvedValue({ rows: [mockDealRow] } as any);
      const event = makeEvent("GET");
      const res = await handler(event);
      const body = JSON.parse(res.body);

      expect(res.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.deals).toHaveLength(1);
      expect(body.deals[0].name).toBe("Acme Corp");
      expect(body.deals[0].customerName).toBe("John");
    });

    it("returns empty array when user has no deals", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any);
      const event = makeEvent("GET");
      const res = await handler(event);
      const body = JSON.parse(res.body);

      expect(res.statusCode).toBe(200);
      expect(body.deals).toEqual([]);
    });
  });

  describe("POST /deals", () => {
    const newDeal = {
      name: "New Corp",
      customerName: "Alice",
      email: "alice@new.com",
      mpans: ["9999"],
      status: ["New Lead"],
      priority: "High",
      contractStartDate: "",
      contractEndDate: "",
    };

    it("creates a deal and returns it", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ ...mockDealRow, name: "New Corp", customer_name: "Alice" }],
      } as any);

      const event = makeEvent("POST", newDeal);
      const res = await handler(event);
      const body = JSON.parse(res.body);

      expect(res.statusCode).toBe(201);
      expect(body.success).toBe(true);
      expect(body.deal.name).toBe("New Corp");
    });

    it("returns 400 when required fields are missing", async () => {
      const event = makeEvent("POST", { name: "Incomplete" }); // missing email, priority etc
      const res = await handler(event);
      const body = JSON.parse(res.body);

      expect(res.statusCode).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/required/i);
    });

    it("returns 400 when body is missing entirely", async () => {
      const event = makeEvent("POST");
      const res = await handler(event);

      expect(res.statusCode).toBe(400);
    });
  });

  describe("PATCH /deals/:id", () => {
    const updatedDeal = {
      name: "Updated Corp",
      customerName: "John",
      email: "john@acme.com",
      mpans: ["1234"],
      status: ["Signed"],
      priority: "Low",
      contractStartDate: "",
      contractEndDate: "",
    };

    it("updates a deal and returns it", async () => {
      // First query = ownership check, second = update
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: "deal-1" }] } as any)
        .mockResolvedValueOnce({
          rows: [{ ...mockDealRow, name: "Updated Corp" }],
        } as any);

      const event = makeEvent("PATCH", updatedDeal, { id: "deal-1" });
      const res = await handler(event);
      const body = JSON.parse(res.body);

      expect(res.statusCode).toBe(200);
      expect(body.deal.name).toBe("Updated Corp");
    });

    it("returns 404 when deal does not belong to user", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any); // ownership check fails

      const event = makeEvent("PATCH", updatedDeal, { id: "deal-999" });
      const res = await handler(event);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /deals/:id", () => {
    it("deletes a deal and returns the deleted id", async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: "deal-1" }] } as any);

      const event = makeEvent("DELETE", undefined, { id: "deal-1" });
      const res = await handler(event);
      const body = JSON.parse(res.body);

      expect(res.statusCode).toBe(200);
      expect(body.deletedId).toBe("deal-1");
    });

    it("returns 404 when deal not found or belongs to another user", async () => {
      mockQuery.mockResolvedValue({ rows: [] } as any);

      const event = makeEvent("DELETE", undefined, { id: "deal-999" });
      const res = await handler(event);

      expect(res.statusCode).toBe(404);
    });
  });
});
