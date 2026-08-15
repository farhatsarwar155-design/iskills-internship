# 📊 Bizloom ERP — Comprehensive Features & Access Control Guide

**Project Name**: Bizloom Enterprise Resource Planning (ERP) System  
**Document Purpose**: Detailed breakdown of all Dashboard Widgets, System Modules, Features, and Role-Based Access Control (RBAC) Permissions.

---

## 🔐 1. Role-Based Access Control (RBAC) Summary

Bizloom ERP supports **4 User Roles**, each tailored to specific operational needs:

| Role | Access Level | Description |
|---|---|---|
| **👑 ADMIN** | **Full System Access** | Access to all 12 modules, System Audit Logs, System Settings, Inline Goal Editing, and User Management. |
| **💼 MANAGER** | **Operations & HR Management** | Full operational control over Inventory, Sales, Purchases, Customers, Suppliers, HR Directory, and Attendance. Restricted from financial ledgers & system logs. |
| **👷 EMPLOYEE** | **Self-Service & Basic Operations** | View inventory stock, create sales orders, mark personal daily attendance, track personal tasks, and view calendar events. |
| **💰 ACCOUNTANT** | **Financials & Analytics** | Access to Sales Invoices, Customer Accounts, Purchase Orders, Finance Ledger, Profit & Loss reports, and Sales Analytics. |

---

## 📋 2. Comprehensive Module & Role Access Matrix

Below is the complete access permission matrix across all ERP pages and REST API endpoints:

| Module / Page | Route | ADMIN | MANAGER | EMPLOYEE | ACCOUNTANT | Description / Capabilities |
|---|---|:---:|:---:|:---:|:---:|---|
| **Main Dashboard** | `/dashboard` | ✅ Full | ✅ Full | ✅ Full | ✅ Full | View 13 interactive widgets, stats, trends & AI score. |
| **Inventory Control** | `/dashboard/inventory` | ✅ Full | ✅ Full | 👁️ View Only | ❌ No Access | Manage stock levels, SKUs, history log & predictive reorders. |
| **Sales & Invoicing** | `/dashboard/sales` | ✅ Full | ✅ Full | ➕ Create Only | ✅ Full | Create sales orders, track invoices, export PDF/CSV. |
| **Purchase Orders** | `/dashboard/purchases` | ✅ Full | ✅ Full | ❌ No Access | ✅ Full | Create POs to suppliers, mark stock as received. |
| **Customer Database** | `/dashboard/customers` | ✅ Full | ✅ Full | ❌ No Access | ✅ Full | Manage customer accounts, contact details, total spend. |
| **Suppliers Directory** | `/dashboard/suppliers` | ✅ Full | ✅ Full | ❌ No Access | ❌ No Access | Manage vendor/supplier contacts and purchase history. |
| **HR Directory** | `/dashboard/hr` | ✅ Full | ✅ Full | ❌ No Access | ❌ No Access | Manage employee details, salaries, departments & hiring. |
| **Attendance Tracking** | `/dashboard/attendance` | ✅ Full | ✅ Full | 👤 Self Only | ❌ No Access | Daily check-in/out, status logging (Present, Late, Absent). |
| **Finance Ledger** | `/dashboard/finance` | ✅ Full | ❌ No Access | ❌ No Access | ✅ Full | Income/expense transactions, Profit & Loss analysis. |
| **Analytics & Forecast** | `/dashboard/analytics` | ✅ Full | ❌ No Access | ❌ No Access | ✅ Full | Revenue analytics, linear regression 30-day sales forecast. |
| **System Audit Logs** | `/dashboard/logs` | ✅ Full | ❌ No Access | ❌ No Access | ❌ No Access | Live security audit feed, login attempts, IP tracking, 403 warnings. |
| **Operational Calendar** | `/dashboard/calendar` | ✅ Full | ✅ Full | ✅ Full | ✅ Full | Monthly agenda, invoice due dates, leaves, PO deliveries. |
| **Tasks & To-Do** | `/dashboard/tasks` | ✅ Full | ✅ Full | ✅ Full | ✅ Full | Internal task creation, department tags, priority status. |
| **App Settings** | `/dashboard/settings` | ✅ Full | ⚙️ View/Theme | ⚙️ View/Theme | ⚙️ View/Theme | Admin can edit company profile & target; others view/theme toggle. |
| **Help & Support** | `/dashboard/help` | ✅ Full | ✅ Full | ✅ Full | ✅ Full | FAQs, Swagger API documentation link, support contact. |

---

## 🎨 3. Dashboard Features & Widgets Detailed Breakdown

The Bizloom ERP main dashboard (`/dashboard`) contains **13 interactive widgets** organized into 7 visual rows:

### 1. Personalized Greeting Header
- **Features**: Time-based greeting ("Good morning/afternoon/evening, [Name] 👋"), user role badge, live date display.
- **AI Daily Summary**: Dynamically counts pending invoices, low-stock items, and pending POs to generate a 1-line priority summary.
- **Access**: All Roles (Admin, Manager, Employee, Accountant).

### 2. Trend-Aware Stat Cards (4 Cards)
- **Features**: Real-time totals for **Total Sales**, **Inventory Value**, **Pending Orders**, and **Active Staff**.
- **Trend Indicators**: Compares current period vs previous period with color-coded badges (`+12% vs last month` green up arrow, `-5%` red down arrow).
- **Access**: All Roles.

### 3. AI Business Health Score (0–100)
- **Features**: Radial gauge chart calculating enterprise health from 4 weighted factors:
  1. *Inventory Turnover Rate* (20%)
  2. *Sales Growth Trend* (30%)
  3. *Cash Flow Ratio* (30%)
  4. *Payment Collection Efficiency* (20%)
- **AI Summary**: Powered by Anthropic Claude 3.5 Sonnet API to explain score factors in 2-3 sentences.
- **Access**: All Roles.

### 4. Revenue & Orders Trend Chart
- **Features**: Dual-axis Recharts visualization showing 7-month historical sales revenue and order volume.
- **AI Sales Forecast Overlay**: Toggle button to project 4-week linear regression predictions directly on the chart.
- **Access**: All Roles.

### 5. Top Products Leaderboard
- **Features**: Ranks the top 5 best-selling products of the current month with animated progress bars showing relative performance.
- **Access**: All Roles.

### 6. Upcoming Payments Widget
- **Features**: Lists invoices due within the next 7 days.
- **Urgency Badges**: Color-coded status (`Overdue` 🔴, `Due Soon` 🟡, `Upcoming` ⚫).
- **Quick Action**: Click any row to navigate directly to the sales invoice detail.
- **Access**: Admin, Manager, Accountant.

### 7. Cash Flow Snapshot Widget
- **Features**: 6-month historical Bar Chart comparing Monthly Income (green) vs Expenses (red).
- **Summary Numbers**: Displays Total Income, Total Expenses, and Net Cash Flow (green if positive, red if negative).
- **Access**: Admin, Accountant.

### 8. Customer Insights Widget
- **Features**: 3-stat mini layout:
  - *New Customers*: Count created this month + growth % vs last month.
  - *Top Customer*: Highest spending customer account name + total revenue.
  - *Repeat Order Rate*: Percentage of customers with >1 order.
- **Access**: Admin, Manager, Accountant.

### 9. Today's Attendance Snapshot
- **Features**: SVG donut chart displaying Present / Absent / On Leave counts with total payroll staff count in the center.
- **Access**: Admin, Manager, Employee.

### 10. Recent Activity Live Audit Feed
- **Features**: Real-time vertical timeline of ERP operations (new sales, stock restocks, PO issues, employee onboarding, transactions).
- **Access**: All Roles.

### 11. Mini Calendar & Schedule Widget
- **Features**: Month calendar view highlighting event dates with color-coded dots:
  - 🟡 *Yellow*: Unpaid invoice due dates
  - 🟦 *Blue*: Employee leave records
  - 🟣 *Purple*: Expected PO deliveries
- **Popover**: Click any date to view detailed agenda.
- **Access**: All Roles.

### 12. Quick Data Insights Widget
- **Features**: Auto-generated business intelligence alerts (top growing category, inactive accounts, peak sales day).
- **Access**: All Roles.

### 13. Monthly Sales Target & Goal Milestones
- **Features**: Progress bars tracking Revenue Goal, Order Count, and Active Catalog Size.
- **Admin Target Editing**: Admin role can click the ✏️ pencil icon to adjust goals inline.
- **Celebration Animation**: Triggers a `🏆 Reached!` badge and glowing animation when a milestone reaches 100%.
- **Access**: All Roles (Admin can edit targets).

### 14. Low Stock Priority List
- **Features**: Displays products closest to stockout with urgency tags (`Critical`, `Low`, `Watch`).
- **Quick Action**: "Reorder" button per row pre-fills a new Purchase Order with suggested quantity.
- **Access**: Admin, Manager, Employee.

### 15. Dashboard Layout Personalization
- **Features**: "Customize Layout" button in header opens a modal to show/hide any of the 13 widgets. Preferences persist in `localStorage`.
- **Access**: All Roles.

---

## 👥 4. Detailed Role Scenarios & Credentials

For demo and testing purposes, use the following credentials to test access permissions:

### 1. Admin (`admin@bizloom.com` / `Admin123!`)
- **Scope**: Complete system administrator.
- **Exclusive Privileges**:
  - View & filter **System Audit Logs** (`/dashboard/logs`).
  - Edit Sales Targets & Goal Milestones inline.
  - Modify company settings and global tax rates in `/dashboard/settings`.
  - Full CRUD on Inventory, Sales, Purchases, HR, and Finance.

### 2. Manager (`manager@bizloom.com` / `Manager123!`)
- **Scope**: Operational supervisor.
- **Allowed**: Dashboard, Inventory, Sales, Purchases, Customers, Suppliers, HR Directory, Attendance.
- **Restricted**: Cannot access Finance Ledger, Analytics, or System Logs.

### 3. Employee (`employee@bizloom.com` / `Employee123!`)
- **Scope**: Frontline staff.
- **Allowed**: Dashboard, View Inventory stock levels, Create new Sales Orders, Log daily attendance, Manage personal tasks, View operational calendar.
- **Restricted**: Cannot edit stock, cannot view HR salaries, cannot access Finance, Purchases, or System Logs.

### 4. Accountant (`accountant@bizloom.com` / `Accountant123!`)
- **Scope**: Financial officer.
- **Allowed**: Dashboard, Sales & Invoices, Customer Accounts, Purchase Orders, Finance Ledger, Profit & Loss analysis, Analytics & Sales Forecast.
- **Restricted**: Cannot edit Inventory stock, cannot access HR Directory, Attendance, or System Logs.

---

## 🛠️ 5. Technical Documentation Links

- **Main README**: [`README.md`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/README.md)
- **Technical Architecture Paper**: [`docs/ARCHITECTURE.md`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/ARCHITECTURE.md)
- **Project Academic Summary**: [`docs/PROJECT_SUMMARY.md`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/PROJECT_SUMMARY.md)
- **Database ER Diagram**: [`docs/Bizloom_ERD.svg`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/Bizloom_ERD.svg)
- **Postman API Collection**: [`docs/Bizloom_API_Collection.postman_collection.json`](file:///c:/Users/pc/OneDrive/Documents/GitHub/iskills-internship/Bizloom/docs/Bizloom_API_Collection.postman_collection.json)
- **Live Swagger OpenAPI Docs**: `http://localhost:5000/api-docs`
