import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { corsHeaders, unauthorizedResponse, verifyToken } from "./auth";
import { query } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealBody {
  name: string;
  customerName: string;
  email: string;
  mpans: string[];
  status: string[];
  priority: "High" | "Medium" | "Low";
  contractStartDate: string;
  contractEndDate: string;
}

// ─── Parse db row to deal type ───────────────────────────────────────────────────

const rowToDeal = (row: Record<string, unknown>) => ({
  id: row.id,
  name: row.name,
  customerName: row.customer_name,
  email: row.email,
  mpans: row.mpans,
  status: row.status,
  priority: row.priority,
  createdDate: row.created_date,
  contractStartDate: row.contract_start_date ?? "",
  contractEndDate: row.contract_end_date ?? "",
});

// ─── Route handlers ───────────────────────────────────────────────────────────

/** GET /deals — fetch all deals for the logged-in user */
const getDeals = async (userId: number): Promise<APIGatewayProxyResult> => {
  const result = await query(
    `SELECT id, name, customer_name, email, mpans, status, priority,
            created_date, contract_start_date, contract_end_date
     FROM deals
     WHERE user_id = $1
     ORDER BY created_date DESC`,
    [userId]
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, deals: result.rows.map(rowToDeal) }),
  };
};

/** POST /deals — create a new deal */
const createDeal = async (
  event: APIGatewayProxyEvent,
  userId: number
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Missing request body" }),
    };
  }

  const deal: DealBody = JSON.parse(event.body);

  if (!deal.name || !deal.customerName || !deal.email || !deal.priority) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: "name, customerName, email, and priority are required",
      }),
    };
  }

  const id = `deal-${Date.now()}`;

  const result = await query(
    `INSERT INTO deals
       (id, name, customer_name, email, mpans, status, priority,
        contract_start_date, contract_end_date, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, name, customer_name, email, mpans, status, priority,
               created_date, contract_start_date, contract_end_date`,
    [
      id,
      deal.name,
      deal.customerName,
      deal.email,
      deal.mpans ?? [],
      deal.status ?? [],
      deal.priority,
      deal.contractStartDate || null,
      deal.contractEndDate || null,
      userId,
    ]
  );

  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, deal: rowToDeal(result.rows[0]) }),
  };
};

/** PATCH /deals/{id} — update an existing deal */
const updateDeal = async (
  event: APIGatewayProxyEvent,
  userId: number
): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Missing deal id" }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Missing request body" }),
    };
  }

  const deal: DealBody = JSON.parse(event.body);

  // Confirm the deal belongs to this user before updating
  const existing = await query(
    "SELECT id FROM deals WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  if (existing.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Deal not found" }),
    };
  }

  const result = await query(
    `UPDATE deals SET
       name = $1,
       customer_name = $2,
       email = $3,
       mpans = $4,
       status = $5,
       priority = $6,
       contract_start_date = $7,
       contract_end_date = $8,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $9 AND user_id = $10
     RETURNING id, name, customer_name, email, mpans, status, priority,
               created_date, contract_start_date, contract_end_date`,
    [
      deal.name,
      deal.customerName,
      deal.email,
      deal.mpans ?? [],
      deal.status ?? [],
      deal.priority,
      deal.contractStartDate || null,
      deal.contractEndDate || null,
      id,
      userId,
    ]
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, deal: rowToDeal(result.rows[0]) }),
  };
};

/** DELETE /deals/{id} — delete a deal */
const deleteDeal = async (
  event: APIGatewayProxyEvent,
  userId: number
): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Missing deal id" }),
    };
  }

  const result = await query(
    "DELETE FROM deals WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );

  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Deal not found" }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ success: true, deletedId: id }),
  };
};

// ─── Main handler ─────────────────────────────────────────────────────────────

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  // Auth
  const user = verifyToken(
    event.headers["Authorization"] ?? event.headers["authorization"]
  );
  if (!user) return unauthorizedResponse();

  try {
    const method = event.httpMethod;
    const hasId = !!event.pathParameters?.id;

    if (method === "GET" && !hasId) return getDeals(user.userId);
    if (method === "POST" && !hasId) return createDeal(event, user.userId);
    if (method === "PATCH" && hasId) return updateDeal(event, user.userId);
    if (method === "DELETE" && hasId) return deleteDeal(event, user.userId);

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Route not found" }),
    };
  } catch (error) {
    console.error("Deals Lambda error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: "Internal server error" }),
    };
  }
};
