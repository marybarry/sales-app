# Sales App

A simple sales pipeline application.

The project includes a React + TypeScript frontend and two AWS Lambda–based backend services (login + deals), backed by a database connection layer.

The application allows users to authenticate, view their sales deals, create/edit/delete deals, and manage deal status in a clean, intuitive UI.

## Setup Instructions

### **Prerequisites**

- Node.js (v18+ recommended)
- npm

## To run locally

- cd app
- npm install
- npm run dev

Go to http://localhost:5173/

Log in using test user:

    email: test@example.com
    password: password123

---

## A note on backend setup

The backend (AWS Lambda + API Gateway + PostgreSQL RDS) is already deployed and publicly accessible for the purpose of this task.
**You do NOT need to run the backend locally.**
The frontend is preconfigured to communicate with the live API endpoints.

I have included the deploy.sh scripts anyway for review, but omitted sensitive information.

## Features

### **Frontend**

- Login flow with context‑based authentication
- Dashboard displaying all deals
- Create, edit, and delete deals
- Modal‑based UI for editing and confirmations
- Deal completion toggle
- Responsive, clean UI built with Material UI + custom components
- API abstraction layer for backend communication
- Vitest + React Testing Library setup

### **Backend**

- AWS Lambda functions for:
  - **Login** (authentication)
  - **Deals** (CRUD operations)
- DB connection utilities
- Input validation and error handling
- Unit tests for deal logic

---

## Tech Stack

### **Frontend**

- **React + TypeScript**
- **Vite** (fast dev environment)
- **Material UI** (component library)
- **React Context** for authentication state
- **Vitest** for testing

### **Backend**

- **Node.js + TypeScript**
- **AWS Lambda** (serverless compute)
- **API Gateway** (HTTP interface)
- **PostgreSQL**
- **AWS IAM** for permissions

### **Infrastructure**

- Manual deploy scripts (`deploy.sh`) for each Lambda
- Zipped Lambda artifacts stored in repo
- Environment variables passed via AWS CLI

---

## 📦 Project Structure

├── README.md
├── app/ # Frontend
│ ├── index.html
│ ├── package.json
│ ├── src/
│ │ ├── api.ts # API client
│ │ ├── components/
│ │ │ ├── Dashboard.tsx
│ │ │ ├── DealCard.tsx
│ │ │ ├── DealCardList.tsx
│ │ │ ├── DeleteModal.tsx
│ │ │ ├── EditDeal.tsx
│ │ │ └── LoginForm.tsx
│ │ ├── context/AuthContext.tsx
│ │ ├── types.ts
│ │ └── test-setup.ts
│ ├── vite.config.ts
│ └── vitest.config.ts
└── lambdas/ # Backend
├── deals/
│ ├── deploy.sh
│ ├── src/
│ │ ├── deals.ts # Main deals handler
│ │ ├── auth.ts
│ │ ├── db.ts
│ │ └── deals.test.ts
└── login/
├── deploy.sh
├── src/
│ ├── login.ts # Login handler
│ └── db.ts

## Design Decisions

1. Serverless Backend

Pros:

- Minimal infrastructure
- Cheap and scalable
- Easy to deploy small functions

Tradeoffs:

- Cold starts (minor for small apps)
- Harder to debug locally

2. React + Vite Frontend

- Fast dev environment
- Component‑based architecture scales well

3. Manual Deploy Scripts

Pros:

- Transparent and easy to reason about
- No CI/CD complexity for a small project

Tradeoffs:

- Wouldn't be ideal for large teams
- Requires manual execution

## Validation & Edge Cases Considered

- Backend validates all required fields
- Frontend prevents empty submissions
- Delete actions require confirmation
- Auth state persists in context
- Empty deal lists are handled gracefully
- Toggling the 'complete' status UI updates immediately

## Testing

Frontend has component tests (App.test.tsx) using Vitest + React Testing Library.

Backend has unit tests for deals logic (deals.test.ts) and a mocked DB layer for isolation.

## Use of AI

I used Claude.ai chat and ChatGPT to:

- Generate boilerplate such as initial component scaffolding and test setup
- Generate template deploy scripts
- Refactor to replace native components with Material UI components
- Generate a template for this README that I could fill in myself

I designed the overall architecture and business logic, using my preferred tech stack.
I set up the backend infrastructure using a combination of the AWS Console and the AWS CLI.

## What I would do in future / given more time

- Extract data-fetching logic from components into a dedicated hook (e.g., `useDeals`) and a service layer. This would improve separation of concerns, reduce component complexity, and make the codebase more scalable and testable
- Add the ability to create a new user at login (just use test user for now)
- Add pagination, search and filtering for deals (inc. pagination at the API level too)
- Tighter validation / edge case coverage, e.g. max length on inputs, do not allow contract_end_date to be before contract_start_date, disable submit button when creating a deal to avoid double-clicking
- Create a theme and use MUI theme to implement it, reducing the amount of CSS needed
- Optimistic UI updates: update the UI before the API response to make the experience feel smoother
- Accessibility improvements, e.g. aria labels, keyboard navigation and colour checks
- Pre-commit hooks: run linting, type‑checking, and tests automatically
- Add CI/CD pipeline in GitHub and replace manual deploy scripts with automated workflows
- Integrate CloudWatch structured logs
- Caching: use CloudFront or Redis (ElastiCache) for frequently accessed data
- Local development environment using Docker Compose - allow devs to spin up Postgres + local Lambda
- Host the frontend (e.g., on AWS S3 + CloudFront) so the entire application is deployed end‑to‑end and accessible via a single public URL
