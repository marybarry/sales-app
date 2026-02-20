export interface User {
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type Status =
  | "New Lead"
  | "Awaiting Pricing"
  | "Awaiting KYC"
  | "Signed"
  | "Active"
  | "Complete";

export type Priority = "High" | "Medium" | "Low";

/**
 * e.g.
 * {
2 "id": "rec-001",
3 "name": "Energy Supply Account",
4 "customerName": "Alice Johnson",
5 "email": "alice.johnson@example.com",
6 "mpans": [
7 "1234567890123",
8 "9876543210987"
9 ],
10 "createdDate": "2025-10-29T09:45:00Z",
11 "contractStartDate": "2025-01-01",
12 "contractEndDate": "2026-01-01",
13 "status": "active"
14 }
 */
export interface SaleCard {
  id: string;
  name: string;
  customerName: string;
  email: string;
  mpans: string[];
  status: Status[];
  createdDate: string;
  priority: Priority;
  contractStartDate: string;
  contractEndDate: string;
}
