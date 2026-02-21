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
- Generate a SQL script, given the desired schema, to initialise the database

I designed the overall architecture and business logic, using my preferred tech stack.
I set up the backend infrastructure using a combination of the AWS Console and the AWS CLI.

## What I would do in future / given more time

### Frontend Architecture & Code Quality

- Extract data‑fetching logic from components into a dedicated hook (e.g., useDeals) and a service layer to improve separation of concerns and testability
- Create a shared MUI theme to reduce duplicated styling and centralise design decisions
- Add optimistic UI updates so interactions feel smoother
- Improve accessibility (ARIA labels, keyboard navigation, colour contrast)
- Add pre‑commit hooks to run linting, type‑checking, and tests automatically

### Features & UX Enhancements

- Add the ability to create a new user at login (currently using a test user)
- Add pagination, search, and filtering for deals (including API‑level pagination)
- Add tighter validation and edge‑case handling (e.g., max input lengths, preventing contract_end_date < contract_start_date, disabling submit during requests)

### Environment & Configuration

- Move the API base URLs into environment variables instead of hard‑coding them
- Introduce multiple environments (local, dev, staging, prod) with separate configuration and API endpoints

### Infrastructure & DevOps

- Add a CI/CD pipeline in GitHub to replace manual deploy scripts
- Integrate structured logging with CloudWatch
- Add caching (CloudFront or Redis/ElastiCache) for frequently accessed data
- Create a local development environment using Docker Compose (Postgres + local Lambda)
- Host the frontend (e.g., S3 + CloudFront) so the entire application is deployed end‑to‑end and accessible via a single public URL
