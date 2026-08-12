# Bizloom ERP — System Architecture Documentation

*Version 1.0 | Academic Report Reference: System Design & Implementation Chapters*

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Technology Stack & Justification](#3-technology-stack--justification)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Design](#6-database-design)
7. [Authentication & Security Architecture](#7-authentication--security-architecture)
8. [AI Features Integration Architecture](#8-ai-features-integration-architecture)
9. [Folder Structure](#9-folder-structure)
10. [Data Flow Walkthrough](#10-data-flow-walkthrough)

---

## 1. System Overview

Bizloom ERP is a full-stack, cloud-ready Enterprise Resource Planning system designed for small-to-medium-sized businesses. The system integrates core business management modules — Inventory, Sales, Purchasing, Human Resources, Finance, and Reporting — into a single, unified web application.

The system follows a **three-tier client-server architecture**:

| Tier | Component | Technology |
|---|---|---|
| **Presentation Tier** | Web Client | Next.js 14 (React) |
| **Application Tier** | REST API Backend | Node.js with Express.js |
| **Data Tier** | Persistent Data Store | SQLite (development) / PostgreSQL (production) |

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Next.js 14 Application                 │   │
│  │  ┌─────────────┐  ┌────────────┐  ┌──────────┐ │   │
│  │  │  Dashboard  │  │  Modules   │  │  Auth    │ │   │
│  │  │  (AI Widget)│  │(Inv/Sales/ │  │  Pages   │ │   │
│  │  │             │  │ HR/Finance)│  │          │ │   │
│  │  └──────┬──────┘  └─────┬──────┘  └────┬─────┘ │   │
│  │         └───────────────┴──────────────┘       │   │
│  │                  Axios (api.ts)                 │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS / REST API
                          ▼
┌─────────────────────────────────────────────────────────┐
│                EXPRESS.JS BACKEND (Node.js)              │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Auth    │  │  RBAC    │  │  Audit   │             │
│  │Middleware│  │Middleware│  │  Logger  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐   │
│  │ Auth │ │ Inv. │ │Sales │ │  HR  │ │ Finance  │   │
│  │Route │ │Route │ │Route │ │Route │ │  Route   │   │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘   │
│     └────────┴─────────┴────────┴──────────┘          │
│                      Controllers                        │
│                          │                              │
│              ┌───────────┴───────────┐                 │
│              │     Prisma ORM        │                 │
│              └───────────┬───────────┘                 │
│                          │                              │
│              ┌───────────┴───────────┐                 │
│              │   Anthropic Claude    │                 │
│              │   AI API (Optional)   │                 │
│              └───────────────────────┘                 │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma Client
                           ▼
┌─────────────────────────────────────────────────────────┐
│            SQLite / PostgreSQL Database                  │
│                                                         │
│  Users │ Products │ Orders │ Employees │ Transactions  │
│  Suppliers │ PurchaseOrders │ StockHistory │ SystemLogs │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Justification

### 3.1 Frontend — React / Next.js 14

**Choice**: React 18 with the Next.js 14 App Router framework.

**Justification**:
- **Component-Based Architecture**: React's component model allows each ERP module (Inventory, HR, Finance) to be built as a self-contained, reusable unit of UI. This significantly reduces code duplication and enforces separation of concerns.
- **Server-Side Rendering (SSR)**: Next.js provides hybrid SSR and client-side rendering, enabling faster initial page loads and improved SEO without sacrificing the dynamic interactivity required for real-time dashboards.
- **App Router**: The Next.js App Router enables layout-based routing, allowing shared layouts (e.g., the `AppShell` sidebar) to persist across navigations without re-mounting, which is critical for a smooth ERP user experience.
- **TypeScript Integration**: Native TypeScript support enables compile-time type safety, which is essential for a complex ERP system with many interdependent data models.
- **Ecosystem**: The React ecosystem provides rich libraries for data visualization (`recharts`), UI components (`shadcn/ui`, `lucide-react`), and state management, all of which are utilized in Bizloom.

### 3.2 Backend — Node.js / Express.js

**Choice**: Node.js runtime with the Express.js HTTP framework.

**Justification**:
- **JavaScript Full-Stack**: Using JavaScript/TypeScript on both the frontend and backend eliminates the cognitive overhead of context-switching between languages, improves code reuse (e.g., shared type definitions), and simplifies deployment.
- **Non-Blocking I/O**: Node.js's event-driven architecture is well-suited for an ERP backend that handles many concurrent, I/O-bound requests (database queries, API calls) without the overhead of multi-threading.
- **Express.js Flexibility**: Express.js provides a minimal, un-opinionated framework, giving full control over middleware composition — critical for implementing the custom JWT authentication, RBAC middleware, and audit logging layers in Bizloom.
- **Prisma ORM**: The use of Prisma provides type-safe database access, auto-generated query builders, and a powerful schema migration system that accelerates development while preventing common SQL injection vulnerabilities.

### 3.3 Database — SQLite (Dev) / PostgreSQL (Production)

**Choice**: SQLite for local development with the Prisma ORM abstracting the provider, supporting migration to PostgreSQL for production.

**Justification**:
- **Development Simplicity**: SQLite requires zero infrastructure setup, enabling any developer to clone the repository and run the project immediately without installing a database server.
- **Production Scalability**: The Prisma ORM's database-agnostic design means the application can be migrated to PostgreSQL — a battle-hardened, ACID-compliant relational database — for production deployment by changing a single environment variable.
- **Relational Model**: An ERP system's data is inherently relational (orders link to customers, order items link to products, stock history links to products and orders). A relational database with foreign key constraints enforces this data integrity at the database level.

### 3.4 AI Integration — Anthropic Claude API

**Choice**: Anthropic Claude 3.5 Sonnet via the `@anthropic-ai/sdk` library.

**Justification**:
- **Advanced Reasoning**: Claude's strong natural language understanding makes it suitable for generating nuanced, context-aware business summaries (e.g., the Business Health Score explanation) that go beyond simple templated text.
- **Structured Prompt Engineering**: The Anthropic API supports a clear system/user message structure, allowing precise control over the AI's persona (financial advisor) and output format (2-3 sentences, professional tone).
- **Graceful Degradation**: The system is designed to work fully without the API key, falling back to a deterministic template-based summary, ensuring the ERP remains functional even when the AI service is unavailable.

---

## 4. Frontend Architecture

The frontend follows Next.js 14's App Router convention. All authenticated pages live under the `(dashboard)` route group, which automatically wraps them in the persistent `AppShell` layout.

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **`AuthContext` (React Context)** | Stores the authenticated user's data globally, providing role and token information to every component without prop drilling. |
| **Axios Instance (`api.ts`)** | A pre-configured Axios instance automatically attaches the JWT `Authorization` header to every outgoing request. A response interceptor handles 401 (redirect to login) and 403 (redirect to Access Denied) errors globally. |
| **Server Component + Client Component Split** | Static page shells (layout, metadata) are Server Components. Interactive elements (forms, tables, charts) are Client Components marked with `'use client'`. |
| **`shadcn/ui` Component Library** | Provides accessible, headless UI primitives (Dialogs, Sheets, Dropdowns) that are styled using Tailwind CSS, enabling rapid UI development without sacrificing design quality. |

---

## 5. Backend Architecture

The backend follows an MVC-like pattern (Routes → Controllers → Prisma ORM).

### Middleware Chain

Every authenticated request passes through the following middleware stack in order:

```
Request → CORS → express.json() → authenticateJWT → requireRoles() → auditLogger() → Controller → Response
```

1. **`authenticateJWT`**: Validates the `Authorization: Bearer <token>` header. Decodes the JWT and attaches the user object to `req.user`. Returns 401 if the token is missing or invalid.
2. **`requireRoles(roles[])`**: Checks `req.user.role` against the allowed roles array for the specific route. Returns 403 (Forbidden) if the role is insufficient, triggering the frontend's Access Denied redirect.
3. **`auditLogger(action, module)`**: Records a `SystemLog` entry in the database, capturing the user, action, module, IP address, and timestamp after every significant operation.

### Role-Based Access Control (RBAC) Matrix

| Module | ADMIN | MANAGER | EMPLOYEE | ACCOUNTANT |
|---|---|---|---|---|
| Inventory (View) | ✅ | ✅ | ✅ | ❌ |
| Inventory (Edit) | ✅ | ✅ | ❌ | ❌ |
| Sales (View/Create) | ✅ | ✅ | ✅ | ❌ |
| HR (View/Edit) | ✅ | ✅ | ❌ | ❌ |
| Finance (View/Edit) | ✅ | ❌ | ❌ | ✅ |
| Reporting | ✅ | ✅ | ❌ | ✅ |
| System Logs | ✅ | ❌ | ❌ | ❌ |

---

## 6. Database Design

The database schema consists of 11 models connected through foreign key relationships. The full Entity Relationship Diagram is available at `docs/Bizloom_ERD.svg`.

### Core Relationships

- **`User` ↔ `RefreshToken`**: One-to-Many. A user may have multiple active refresh tokens (e.g., logged in on multiple devices).
- **`Product` ↔ `StockHistory`**: One-to-Many. Every change to a product's quantity creates an immutable audit log entry.
- **`Customer` ↔ `Order`**: One-to-Many. A customer can place multiple orders.
- **`Order` ↔ `OrderItem`**: One-to-Many. An order contains one or more line items, each linking to a `Product`.
- **`Supplier` ↔ `PurchaseOrder`**: One-to-Many. A supplier can be associated with multiple purchase orders.
- **`PurchaseOrder` ↔ `PurchaseOrderItem`**: One-to-Many. A PO contains one or more line items, each linking to a `Product`.
- **`Employee` ↔ `Attendance`**: One-to-Many. An employee has a time-series log of daily attendance records.

---

## 7. Authentication & Security Architecture

Bizloom implements a stateless JWT authentication scheme augmented with refresh tokens for session longevity.

### Authentication Flow

1. Client POSTs credentials to `POST /api/auth/login`.
2. Server validates credentials and, if correct, issues a **short-lived Access Token** (1 hour) and a **long-lived Refresh Token** (7 days), stored as an httpOnly cookie.
3. The client stores the Access Token in memory (via React Context) and attaches it to all subsequent API requests.
4. When the Access Token expires, the client POSTs to `POST /api/auth/refresh` with the Refresh Token cookie to obtain a new Access Token without requiring the user to log in again.
5. On logout, the Refresh Token is invalidated in the database.

### Security Hardening Measures

- **Password Hashing**: All passwords are hashed using `bcryptjs` with a salt round of 10 before storage. Plaintext passwords are never stored.
- **httpOnly Cookies**: Refresh tokens are stored in httpOnly, Secure, SameSite=Strict cookies, preventing client-side JavaScript (and thus XSS attacks) from accessing them.
- **CORS Restriction**: The Express CORS middleware is configured to allow requests only from the trusted frontend origin.
- **Input Validation**: All incoming request bodies are validated before being passed to controllers or the Prisma ORM.
- **Audit Logging**: Every login attempt (successful and failed), and every record creation, modification, and deletion is recorded in the `SystemLog` table with a timestamp and IP address.

---

## 8. AI Features Integration Architecture

Bizloom integrates three distinct AI capabilities, each using a different architectural pattern.

### 8.1 AI Business Health Score

- **Pattern**: **On-Demand Computation + LLM Summarization**
- **Flow**: The frontend requests `GET /api/dashboard/health`. The backend controller executes five parallel Prisma queries to aggregate the four key metrics. The numeric results are fed into a deterministic weighted formula to produce a 0-100 score. The score and raw metrics are then passed as a structured prompt to the Claude API, which returns a 2-3 sentence executive summary. The complete response (score, factors, summary) is returned to the frontend in a single API call.
- **Fallback**: If `ANTHROPIC_API_KEY` is absent or the API call fails, a deterministic template-based sentence is generated from the computed metric values, ensuring the feature is always functional.

### 8.2 Sales Forecasting

- **Pattern**: **Statistical Regression (No External AI)**
- **Flow**: The backend computes a 6-month sales forecast using a pure **Linear Regression** algorithm implemented in TypeScript (no external ML service needed). Historical monthly revenue data is fetched from the database, and the regression model projects the trend forward. This approach ensures the forecasting feature is fast, free, and works entirely offline.

### 8.3 Conversational AI Chatbot

- **Pattern**: **Session-Less Prompt Engineering**
- **Flow**: The frontend sends a user's natural language query to `POST /api/ai/chat`. The backend controller performs **intent detection** to classify the query (e.g., "inventory query", "sales query", "HR query"). Based on the intent, it fetches the relevant live data from the database. The live data context is then injected into a structured system prompt sent to the Claude API, which generates a natural language answer grounded in real business data. No conversation history is maintained server-side; each query is stateless.

---

## 9. Folder Structure

```
Bizloom/
├── backend/                        # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema & relationships
│   │   └── seed.ts                 # Initial data seeding script
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts               # Prisma Client singleton
│   │   ├── controllers/            # Business logic handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── sales.controller.ts
│   │   │   ├── hr.controller.ts
│   │   │   ├── finance.controller.ts
│   │   │   ├── dashboard.controller.ts  # Includes Health Score & Forecast
│   │   │   └── ai.controller.ts         # Claude API integration & Chatbot
│   │   ├── middleware/
│   │   │   └── auth.ts             # authenticateJWT, requireRoles, auditLogger
│   │   ├── routes/                 # Express router definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── sales.routes.ts
│   │   │   ├── hr.routes.ts
│   │   │   ├── finance.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── ai.routes.ts
│   │   ├── swagger.json            # OpenAPI 3.0 API specification
│   │   └── index.ts                # Express app entry point
│   ├── tests/                      # Jest unit & integration tests
│   │   ├── auth.test.ts
│   │   ├── inventory.test.ts
│   │   ├── hr.test.ts
│   │   ├── finance.test.ts
│   │   └── dashboard.test.ts
│   ├── scripts/
│   │   └── generate-postman.js     # Converts Swagger to Postman Collection
│   ├── jest.config.js
│   └── package.json
│
├── frontend/                       # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/             # Login, Register pages (unauthenticated)
│   │   │   └── (dashboard)/        # All authenticated ERP pages
│   │   │       ├── layout.tsx      # AppShell with sidebar & navigation
│   │   │       └── dashboard/
│   │   │           ├── page.tsx          # Main Dashboard (with AI widget)
│   │   │           ├── inventory/page.tsx
│   │   │           ├── sales/page.tsx
│   │   │           ├── purchases/page.tsx
│   │   │           ├── hr/page.tsx
│   │   │           ├── finance/page.tsx
│   │   │           ├── reports/page.tsx
│   │   │           ├── logs/page.tsx     # Admin-only System Audit Logs
│   │   │           └── access-denied/page.tsx
│   │   ├── components/
│   │   │   ├── dashboard/          # Shared dashboard widgets
│   │   │   │   ├── SalesChart.tsx
│   │   │   │   ├── AIChatbot.tsx
│   │   │   │   └── HealthScoreWidget.tsx  # AI Business Health Score
│   │   │   ├── layout/
│   │   │   │   └── AppShell.tsx    # Sidebar navigation with RBAC-aware menu
│   │   │   └── ui/                 # shadcn/ui primitives
│   │   ├── context/
│   │   │   └── AuthContext.tsx     # Global auth state (user, token, role)
│   │   └── lib/
│   │       └── api.ts              # Axios instance with JWT & error interceptors
│   └── package.json
│
└── docs/                           # Academic & Technical Documentation
    ├── ARCHITECTURE.md             # This file
    ├── Bizloom_ERD.svg             # Entity Relationship Diagram
    └── Bizloom_API_Collection.postman_collection.json
```

---

## 10. Data Flow Walkthrough

The following example traces a complete request lifecycle for creating a new sale.

1. **User Action**: The user fills the "New Sale" form on the frontend and clicks "Save Order".
2. **API Call**: The Axios instance in `api.ts` sends `POST /api/sales` with the order payload and the JWT `Authorization` header.
3. **Auth Middleware**: `authenticateJWT` validates the JWT, decodes the user (`{ id, email, role }`), and attaches it to `req.user`.
4. **RBAC Middleware**: `requireRoles(['ADMIN', 'MANAGER', 'EMPLOYEE'])` confirms the user's role is permitted to create sales. If not, a `403 Forbidden` is returned.
5. **Audit Logger**: `auditLogger('CREATE_SALE', 'SALES')` pre-registers the intent to log this action.
6. **Controller**: `createOrder` in `sales.controller.ts` executes a **Prisma transaction**:
   - Creates the `Order` record.
   - Creates each `OrderItem` record.
   - For every item, deducts the sold quantity from `Product.quantity`.
   - Creates a `StockHistory` record for each product change.
7. **Audit Log Written**: The `SystemLog` entry is committed with the new order's ID, the user's email, and the client's IP address.
8. **Response**: The controller returns `201 Created` with the full order object.
9. **Frontend Update**: The frontend closes the drawer, shows a success toast notification, and refreshes the orders table to reflect the new record.
