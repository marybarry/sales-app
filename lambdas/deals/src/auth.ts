import { APIGatewayProxyResult } from "aws-lambda";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

export const verifyToken = (
  authHeader: string | undefined
): TokenPayload | null => {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

export const unauthorizedResponse = (): APIGatewayProxyResult => ({
  statusCode: 401,
  headers: corsHeaders,
  body: JSON.stringify({ success: false, error: "Unauthorized" }),
});
