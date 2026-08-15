# Bizloom ERP — Comprehensive Project Technical Summary

**Project Title**: Bizloom Enterprise Resource Planning (ERP) Web Application  
**Tech Stack**: Next.js 14/16 (TypeScript), Node.js / Express.js, Prisma ORM, PostgreSQL / SQLite, Anthropic Claude AI, Recharts, Jest  
**Documentation Version**: 1.0 (Final Academic & FYP Evaluation Build)  

---

## 📌 Executive Summary

Bizloom ERP is a modern, modular, cloud-ready Enterprise Resource Planning system built to streamline core enterprise operations for small-to-medium businesses. The system integrates six core operational pillars:
1. **Inventory Management & Predictive Reordering**
2. **Sales Order Processing & Invoicing**
3. **Purchase Orders & Supplier Management**
4. **Human Resource Directory & Attendance Tracking**
5. **Finance Ledger, Profit & Loss, and Cash Flow Analysis**
6. **AI Business Intelligence & Sales Forecasting**

The system enforces strict **Role-Based Access Control (RBAC)** across 4 user roles (Admin, Manager, Employee, Accountant), maintains an immutable **System Audit Log** for security compliance, and includes a **52-test automated unit & integration testing suite**.

---

## 🏗️ Core Architecture & Design Patterns

### 1. Three-Tier System Architecture
- **Presentation Tier**: Next.js App Router (React 18) with client-side interactive widgets and server-rendered shells.
- **Application Tier**: Express.js REST API using TypeScript controllers, custom JWT authentication, and RBAC middleware.
- **Data Tier**: Prisma ORM with 11 relational database tables (User, RefreshToken, Product, StockHistory, Customer, Order, OrderItem, Supplier, PurchaseOrder, PurchaseOrderItem, Employee, Attendance, Transaction, SystemLog).

### 2. Security & Authentication Architecture
- **Stateless JWT Rotation**: Short-lived Access Tokens (1 hour) stored in memory; long-lived Refresh Tokens (7 days) stored in secure, `httpOnly`, `SameSite=Strict` cookies.
- **Unauthorized Access Auditing**: Every `403 Forbidden` response from the `requireRoles` middleware automatically writes a `WARNING` entry to the `SystemLog` table capturing user email, attempted route, IP address, and timestamp.

---

## 🤖 AI Features & Unique Technical Contributions

1. **AI Business Health Score (0–100)**:
   - Evaluates 4 weighted key performance indicators:
     - **Inventory Turnover Rate** (20%)
     - **Sales Growth Trend** (30%)
     - **Cash Flow Ratio** (30%)
     - **Payment Collection Efficiency** (20%)
   - Generates an executive natural language summary via **Anthropic Claude 3.5 Sonnet API**.

2. **Predictive Reorder Recommendation**:
   - Calculates 14-day rolling daily sales velocity to predict stockout dates and generate suggested reorder quantities.

3. **AI Sales Forecasting**:
   - Implements a pure TypeScript **Simple Linear Regression** algorithm trained on 90-day sales history to project 30-day revenue trends.

4. **Conversational AI Business Assistant**:
   - Context-aware chatbot drawer using live database query injection to answer natural language queries.

---

## 📊 Dashboard & UI Widgets (13 Interactive Widgets)

1. **Personalized Header**: Time-based greeting with live date and AI priority summary.
2. **Trend Stat Cards**: Total Sales, Inventory Valuation, Pending Orders, Active Staff (`+X% vs last month`).
3. **AI Business Health Score**: Radial gauge with factor breakdown list.
4. **Revenue & Orders Trend Chart**: Dual-axis historical Recharts visualization.
5. **Top Products Leaderboard**: Top 5 best-selling items this month.
6. **Upcoming Payments**: Invoices due in 7 days with `Overdue` / `Due Soon` urgency tags.
7. **Cash Flow Snapshot**: 6-month historical Income vs Expense bar chart with Net Cash Flow.
8. **Customer Insights**: New customer growth, top account spend, and repeat order rate %.
9. **Today's Attendance Snapshot**: SVG donut chart showing Present / Absent / On Leave.
10. **Recent Activity Feed**: Real-time audit timeline of ERP events.
11. **Mini Calendar & Schedule**: Month view with event dots (yellow=invoice, blue=leave, purple=PO) and popover agenda.
12. **Quick Data Insights**: Automated business alerts for peak sales day, top growing category, and inactive accounts.
13. **Monthly Sales Target & Milestones**: Progress bar trackers with Admin inline editing and celebratory animations.
14. **Low Stock Priority List**: Queue of low stock products with 1-click PO reorder navigation.
15. **Dashboard Personalization**: Modal allowing users to toggle visibility of any widget, saved in `localStorage`.

---

## 🧪 Testing & Verification (52 Test Cases)

Run via `npm test` inside `/backend`:

- [`auth.test.ts`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/backend/tests/auth.test.ts) — 7 tests (password hashing, JWT issuance, expiration, signature verification)
- [`inventory.test.ts`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/backend/tests/inventory.test.ts) — 13 tests (stock deduction, PO addition, risk calculation, EOQ reordering)
- [`hr.test.ts`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/backend/tests/hr.test.ts) — 7 tests (net payroll tax deductions, total payroll calculation)
- [`finance.test.ts`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/backend/tests/finance.test.ts) — 9 tests (Profit & Loss revenue/expense summation, profit margin %, date range filtering)
- [`dashboard.test.ts`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/backend/tests/dashboard.test.ts) — 16 tests (Health Score factor calculations & weighted total score)

---

## 📑 Documentation Artifacts Summary

| File Path | Description | Usage |
|---|---|---|
| [`README.md`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/README.md) | GitHub repository landing page & setup guide | General project overview |
| [`docs/ARCHITECTURE.md`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/ARCHITECTURE.md) | 10-section formal technical design document | FYP System Architecture chapter |
| [`docs/Bizloom_ERD.svg`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/Bizloom_ERD.svg) | Scalable Entity Relationship Diagram | FYP Database Design diagrams |
| [`docs/Bizloom_API_Collection.postman_collection.json`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/Bizloom_API_Collection.postman_collection.json) | Exported Postman REST API Collection | API Testing appendix |
| `http://localhost:5000/api-docs` | Live OpenAPI 3.0 Swagger UI | Interactive API documentation |
