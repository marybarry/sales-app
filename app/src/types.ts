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

export interface DealCard {
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
