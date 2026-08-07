# Business ERP Lite

A modern, polished Enterprise Resource Planning (ERP) web application foundation.

## Technology Stack

- **Frontend**: Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui components (via Base UI preset)
- **Backend**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (Access Token in-memory, Refresh Token in Secure HTTP-Only Cookie) + bcryptjs

---

## Project Structure

```text
/Bizloom
  ├── /backend                  # Express API Server
  │     ├── /prisma             # Prisma Schema and Seeds
  │     └── /src                # TS Source Code (Controllers, Routes, Middlewares)
  ├── /frontend                 # Next.js App Client
  │     ├── /src/app            # Routing structure (Auth and Dashboard sub-modules)
  │     ├── /src/components     # Custom layouts, widgets, and charts
  │     └── /src/context        # Global Auth and Theme states
  └── README.md                 # Setup & running instructions
```

---

## Setup & Installation

### Prerequisite

Make sure you have:
- [Node.js](https://nodejs.org/) (v18.x or later)
- A running [PostgreSQL](https://www.postgresql.org/) database instance

---

### 1. Database Configuration

1. Locate the `.env` file inside the `/backend` folder.
2. Edit the `DATABASE_URL` line to match your PostgreSQL instance connection string:
   ```env
   DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database_name>?schema=public"
   ```

### 2. Database Migrations & Seeding

Open a terminal and navigate to the `/backend` directory:
```bash
cd backend
```

1. **Run Migrations** (creates database tables):
   ```bash
   npx prisma migrate dev --name init
   ```
2. **Seed Database** (creates representative users for all roles):
   ```bash
   npx prisma db seed
   ```

**Seed Users created:**
- **Admin**: `admin@bizloom.com` (Password: `Admin123!`)
- **Manager**: `manager@bizloom.com` (Password: `Manager123!`)
- **Employee**: `employee@bizloom.com` (Password: `Employee123!`)
- **Accountant**: `accountant@bizloom.com` (Password: `Accountant123!`)

---

### 3. Start Development Servers

You will need to start both frontend and backend development servers.

#### Express Backend Server (`localhost:5000`)
```bash
cd backend
npm run dev
```

#### Next.js Frontend Client (`localhost:3000`)
Open another terminal:
```bash
cd frontend
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000) to view the application.

---

## Core Features Implemented

### 1. Scaffolding & Shared Setup
- Isolated frontend and backend workspaces.
- TypeScript configurations for compiler checks.

### 2. Authentication System
- **Sleek Split-screen Forms**: Indigo-theme gradients and layouts.
- **Silent Refresh Tokens**: Custom axios interceptor handles `401 Unauthorized` token refresh automatically by fetching `/auth/refresh` with cookies.
- **Role-based Middleware**: Restrict backend routes by checking user token payloads.
- **Next.js Protection Route Group**: Path `/dashboard` redirects users dynamically to `/login` if unauthenticated.

### 3. Premium Responsive App Shell
- **Collapsible Sidebar**: Adapts to standard screens. Navigation menus update automatically based on user roles.
- **Top Navbar**: Search bar, interactive notifications dropdown, theme toggle, and profile settings.
- **Persisted Theme**: Dark mode selection saved in local storage.
- **Breadcrumbs**: Paths updated dynamically.

### 4. Interactive Dashboard
- **Analytical Graphing**: Clean Recharts graphs displaying mock revenue and volume.
- **Stat Metric Cards**: Cards detailing Sales, Inventory, Orders, and Employees with trend stats.
- **Audit Feed**: Visual activity tracker lists recent tasks.
- **Loading Skeletons**: Dynamic skeletons render while waiting for API responses.
- **Toast Notifications**: Built-in `react-hot-toast` notifications for actions.
