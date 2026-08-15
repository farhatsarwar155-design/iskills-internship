# 🚀 Bizloom ERP — Modern Enterprise Resource Planning System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-green.svg)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-indigo.svg)](https://www.prisma.io/)
[![Tests](https://img.shields.io/badge/Jest-52%2F52%20Passed-brightgreen.svg)](https://jestjs.io/)
[![Swagger](https://img.shields.io/badge/OpenAPI-3.0-orange.svg)](http://localhost:5000/api-docs)

**Bizloom ERP** is a full-stack, cloud-ready Enterprise Resource Planning (ERP) web application designed for small-to-medium enterprises. It unifies core business operations — **Inventory, Sales, Purchasing, HR, Finance, and Analytics** — with **AI-driven business intelligence**, role-based security (RBAC), live audit logging, and formal academic technical documentation.

---

## 📚 Table of Contents

- [Key Features & Highlights](#-key-features--highlights)
- [AI & Intelligence Engine](#-ai--intelligence-engine)
- [Technology Stack](#-technology-stack)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Quick Start Guide](#-quick-start-guide)
- [Seed User Accounts](#-seed-user-accounts)
- [Testing & Quality Assurance (52 Test Cases)](#-testing--quality-assurance-52-test-cases)
- [Technical Documentation & FYP Artifacts](#-technical-documentation--fyp-artifacts)
- [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)

---

## 🌟 Key Features & Highlights

### 1. 📊 Consolidated 13-Widget Interactive Dashboard
- **Personalized Header**: Time-based greeting ("Good morning/afternoon/evening, [Name] 👋"), live date, and dynamic AI summary of priorities.
- **Trend-Aware Stat Cards**: Real-time sales, inventory valuation, pending order count, and active payroll staff with `+X% vs last month` trend badges.
- **AI Business Health Score (0-100)**: Gauge chart powered by weighted metrics (turnover, sales growth, cash flow, payment collection) with Claude LLM natural language insights.
- **Top Products Leaderboard**: Top 5 best-selling products this month with animated performance bars.
- **Upcoming Payments**: Real-time tracking of invoices due within 7 days with color-coded urgency tags (`Overdue`, `Due Soon`, `Upcoming`).
- **Cash Flow Snapshot**: 6-month historical Recharts bar chart comparing Income vs Expense with net cash flow calculations.
- **Customer Insights**: 3-stat panel featuring new customer growth, top customer spend, and repeat order percentage.
- **Today's Attendance Snapshot**: SVG donut chart displaying Present / Absent / On Leave counts.
- **Live Activity Audit Feed**: Real-time timeline of business events across all modules.
- **Mini Calendar & Schedule**: Event-highlighted calendar (yellow dot for invoices, blue for leaves, purple for POs) with popover agenda views.
- **Quick Data Insights**: Auto-generated business pattern alerts (category growth, inactive customers, peak sales day).
- **Monthly Sales Target & Milestones**: Progress bar trackers with inline target editing for Admins and celebratory micro-animations.
- **Low Stock Priority List**: Automatic stockout risk queue with 1-click PO reorder pre-fills.
- **Layout Personalization**: Modal allowing users to show/hide any of the 13 widgets, with preferences saved in `localStorage`.

### 2. 🛡️ Enterprise Security & System Audit Logs
- **Stateless JWT + httpOnly Cookies**: Dual-token authentication with 1-hour access tokens and 7-day httpOnly refresh cookies.
- **RBAC Enforcement**: Server-side middleware (`requireRoles`) enforcing role restrictions across all REST endpoints.
- **Live System Audit Logging**: Every login attempt, record creation/update/deletion, and unauthorized access attempt (`403 Forbidden`) is logged to the database with user identity, timestamp, IP address, and `WARNING`/`INFO` severity.
- **System Audit Logs Page** (`/dashboard/logs`): Exclusive Admin interface with severity filter pills, IP tracking, and full search.

### 3. 🎯 Module Breakdown
- **Inventory Control** (`/dashboard/inventory`): Product catalog, SKU tracking, stock history audit, and 1-click PO reorder suggestions.
- **Sales & Invoicing** (`/dashboard/sales`): Customer order management, line item calculations, invoice PDF/CSV exports, and payment status tracking.
- **Purchasing** (`/dashboard/purchases`): Supplier management, purchase order generation, and stock receiving workflows.
- **HR & Attendance** (`/dashboard/hr` & `/dashboard/attendance`): Employee profiles, position/salary management, daily attendance logging, and automated net payroll calculations.
- **Finance & Analytics** (`/dashboard/finance` & `/dashboard/analytics`): Income/expense ledger, category breakdown, Profit & Loss summaries, and sales forecasting.
- **Calendar, Tasks, Settings, & Help** (`/dashboard/calendar`, `/dashboard/tasks`, `/dashboard/settings`, `/dashboard/help`): Operational agenda, internal to-do manager, system config, and embedded Swagger documentation links.

---

## 🤖 AI & Intelligence Engine

1. **AI Business Health Score**:
   - Computes a weighted 0-100 composite health score from live database metrics.
   - Leverages **Anthropic Claude 3.5 Sonnet** to generate a 2-3 sentence executive summary.
   - Includes deterministic fallback logic when an API key is not configured.
2. **Predictive Reorder Engine**:
   - Calculates 14-day rolling sales velocity to predict stockout dates and generate Economic Order Quantity (EOQ) reorder suggestions.
3. **AI Sales Forecasting**:
   - Uses a pure **Simple Linear Regression** algorithm trained on 90-day historical data to project 30-day future sales trends.
4. **Conversational AI Assistant**:
   - Integrated chatbot drawer using live context injection to answer natural language queries about inventory, sales, and HR data.

---

## 🛠️ Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18, Next.js 14/16 (App Router), TypeScript | Component-based SSR/CSR hybrid architecture for high performance and type safety. |
| **Styling** | Vanilla CSS, Tailwind CSS, shadcn/ui, Lucide Icons | Premium aesthetics with dark mode support, glassmorphism, and responsive breakpoints. |
| **Data Viz** | Recharts | Dynamic SVG charting for revenue trends, sales forecasts, and cash flow snapshots. |
| **Backend** | Node.js, Express.js, TypeScript | Non-blocking event-driven runtime ideal for concurrent REST API handling. |
| **Database** | SQLite (Dev) / PostgreSQL (Prod), Prisma ORM 5 | Type-safe database queries, schema migrations, and relational integrity. |
| **Auth** | JWT, bcryptjs, httpOnly Cookies | Industry-standard secure token rotation and hashed password storage. |
| **Testing** | Jest, ts-jest | 52 comprehensive unit and integration test cases covering business logic. |
| **API Spec** | Swagger UI (`swagger-ui-express`), Postman | OpenAPI 3.0 interactive docs and automated Postman collection generator. |

---

## 📁 Project Architecture & Directory Structure

```text
Bizloom/
├── backend/                        # Express.js REST API Server
│   ├── prisma/
│   │   ├── schema.prisma           # 11 DB models with relations
│   │   └── seed.ts                 # Real representative seed data
│   ├── src/
│   │   ├── config/                 # DB connection singleton
│   │   ├── controllers/            # Logic for Auth, Inv, Sales, PO, HR, Finance, AI, Dashboard
│   │   ├── middleware/             # authenticateJWT, requireRoles, auditLogger
│   │   ├── routes/                 # Express route definitions
│   │   ├── utils/                  # System logger & helper utilities
│   │   ├── swagger.json            # OpenAPI 3.0 Specification
│   │   └── index.ts                # Express app entry point
│   ├── tests/                      # Jest Test Suite (52 test cases)
│   │   ├── auth.test.ts
│   │   ├── inventory.test.ts
│   │   ├── hr.test.ts
│   │   ├── finance.test.ts
│   │   └── dashboard.test.ts
│   ├── scripts/
│   │   └── generate-postman.js     # Postman Collection generator
│   └── package.json
│
├── frontend/                       # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/                    # App Router pages ((auth), (dashboard))
│   │   ├── components/             # Layout (AppShell), Dashboard widgets, UI primitives
│   │   ├── context/                # Global AuthContext & ThemeContext
│   │   └── lib/                    # Axios instance with auto JWT refresh interceptors
│   └── package.json
│
└── docs/                           # FYP Academic & Technical Documentation
    ├── ARCHITECTURE.md             # 10-section formal system design document
    ├── Bizloom_ERD.svg             # Scalable Entity Relationship Diagram
    └── Bizloom_API_Collection.postman_collection.json # Exported Postman collection
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### 2. Backend Setup & Startup
```bash
cd backend
npm install
npx prisma generate
npx prisma db seed
npm run dev
```
*Backend runs on `http://localhost:5000` with Swagger UI at `http://localhost:5000/api-docs`.*

### 3. Frontend Setup & Startup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend client opens on `http://localhost:3000`.*

---

## 🔑 Seed User Accounts

The database comes pre-seeded with representative accounts for testing Role-Based Access Control:

| Role | Email | Password | Allowed Modules |
|---|---|---|---|
| **Admin** | `admin@bizloom.com` | `Admin123!` | All modules, System Audit Logs, Settings |
| **Manager** | `manager@bizloom.com` | `Manager123!` | Dashboard, Inventory, Sales, POs, HR, Customers, Suppliers |
| **Employee** | `employee@bizloom.com` | `Employee123!` | Dashboard, Inventory view, Sales creation, Attendance |
| **Accountant** | `accountant@bizloom.com` | `Accountant123!` | Dashboard, Sales, Customers, POs, Finance Ledger, Analytics |

---

## ✅ Testing & Quality Assurance (52 Test Cases)

The backend includes a comprehensive Jest test suite covering core business calculations and security logic:

```bash
cd backend
npm test
```

### Test Suite Execution Output
```text
PASS tests/auth.test.ts (7 tests)
PASS tests/inventory.test.ts (13 tests)
PASS tests/hr.test.ts (7 tests)
PASS tests/finance.test.ts (9 tests)
PASS tests/dashboard.test.ts (16 tests)

Test Suites: 5 passed, 5 total
Tests:       52 passed, 52 total
Time:        ~25 s
```

---

## 📑 Technical Documentation & FYP Artifacts

Located in the [`/docs`](./docs) folder for direct university Final Year Project (FYP) report inclusion:

1. 📄 **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)**: 10-section formal technical paper covering System Architecture, Tech Stack Justification, Database Design, Security & Auth Flows, AI Integration Patterns, and Data Life-cycle Walkthroughs.
2. 📐 **[`docs/Bizloom_ERD.svg`](./docs/Bizloom_ERD.svg)**: Vector Entity Relationship Diagram showing all 11 database tables, primary/foreign keys, and cardinality.
3. 📬 **[`docs/Bizloom_API_Collection.postman_collection.json`](./docs/Bizloom_API_Collection.postman_collection.json)**: Importable Postman API collection covering all 7 Express REST modules.
4. 🌐 **Interactive Swagger Docs**: Available live at [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs) while the backend server is running.

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Module / Endpoint | ADMIN | MANAGER | EMPLOYEE | ACCOUNTANT |
|---|:---:|:---:|:---:|:---:|
| Dashboard & AI Health Score | ✅ | ✅ | ✅ | ✅ |
| Inventory Control | ✅ | ✅ | View Only | ❌ |
| Sales & Invoicing | ✅ | ✅ | Create Only | ✅ |
| Purchase Orders | ✅ | ✅ | ❌ | ✅ |
| Customer Database | ✅ | ✅ | ❌ | ✅ |
| Suppliers | ✅ | ✅ | ❌ | ❌ |
| HR Directory | ✅ | ✅ | ❌ | ❌ |
| Attendance | ✅ | ✅ | Self Only | ❌ |
| Finance Ledger | ✅ | ❌ | ❌ | ✅ |
| Analytics & Forecasting | ✅ | ❌ | ❌ | ✅ |
| System Audit Logs | ✅ | ❌ | ❌ | ❌ |

---

*Bizloom ERP — Built with Next.js, Express, Prisma, and Claude AI.*
