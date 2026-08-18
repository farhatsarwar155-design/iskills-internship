# 🚀 InternLynk — Complete System Documentation & Role-Based Access Guide

> **InternLynk (Academic-Industry Internship & Placement Platform)**  
> **Platform Version:** 1.0.0  
> **Frontend:** React (Vite, TailwindCSS, React Query, Lucide Icons)  
> **Backend:** Node.js / Express (Port 3001)  
> **Database & Auth:** Supabase (PostgreSQL with Row Level Security - RLS)

---

## 📌 1. Project Overview & Architecture

**InternLynk** is an end-to-end platform bridging the gap between **Universities**, **Students / Job Seekers**, and **Software Houses (Companies)**, supervised and managed by a **Super Administrator**.

```
                           ┌───────────────────────────┐
                           │      Platform Admin       │
                           │  (Governance & Approvals) │
                           └─────────────┬─────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 │                       │                       │
                 ▼                       ▼                       ▼
      ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
      │     University     │  │   Software House   │  │   Student / Guest  │
      │  (Student Rosters) │  │  (Post Internships │  │  (Apply, CV Builder│
      │   & Applications   │  │   & Hire Talent)   │  │   & Track Status)  │
      └────────────────────┘  └────────────────────┘  └────────────────────┘
```

---

## 👥 2. Roles, Permissions & Access Matrix

| Role | Primary Purpose | What They Can View | What They Can Change / Actions Allowed |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | Platform Governance & Security | All users, all internships, audit logs, platform analytics, system metrics | Approve/Reject accounts & internships, activate/deactivate users, edit profiles, export logs |
| **🏢 Software House** | Talent Acquisition & Internship Management | Applications received, candidate CVs, internship statistics | Post new internships, update internship details, accept/reject candidate applications, update company profile |
| **🎓 University** | Academic Monitoring & Student Placement | Student roster, bulk upload history, student applications & placement metrics | Bulk upload students via CSV, monitor student progress, update university profile |
| **👨‍🎓 Student** | Official University Student Job Seeking | Approved internships, application history, status notifications | Build & update interactive CV, apply to internships with cover letter, edit profile |
| **👤 Guest Applicant** | External / Independent Job Seeking | Public approved internships, own application statuses | Create custom CV, apply to public internships, track application status |

---

## 🔑 3. Verified Test Accounts & Credentials

| Role | Email Address | Password | Student ID / Metadata |
| :--- | :--- | :--- | :--- |
| **Admin (Platform)** | `admin@internlynk.com` | `Password123!` | Role: `admin` |
| **Admin (Personal)** | `farhatsarwar.155@gmail.com` | `Password123!` | Role: `admin` |
| **Software House** | `softwarehouse@internlynk.com` | `Password123!` | Org: `TechLogix Software Solutions` |
| **University** | `university@internlynk.com` | `Password123!` | Org: `NUST University` |
| **Student** | `student@internlynk.com` | `Password123!` | Student ID: `CS-2024-101` |
| **Guest Applicant** | `guest@internlynk.com` | `Password123!` | Role: `guest` |

---

## 🛠️ 4. Detailed Role Workflows & Features

### 1. 🛡️ Admin Portal (`/dashboard/admin`)
- **Dashboard Overview:** Live counts of Total Users, Pending Approvals, Total Internships, and Quick Action feeds.
- **User Management (`/admin/users`):** View all registered users across all roles. Admins can toggle account activation status (Activate/Deactivate) and edit details.
- **Pending Accounts (`/admin/pending-accounts`):** Verification queue for newly registered Software Houses and Universities with **Approve** and **Reject** buttons.
- **Pending Internships (`/admin/pending-internships`):** Quality review queue for new internship postings submitted by Software Houses before they go live.
- **Platform Analytics (`/admin/analytics`):** Growth charts, role distribution, acceptance rates, conversion metrics, and top hiring companies.
- **Audit Logs (`/admin/logs`):** Immutable log of every approval, rejection, user creation, and configuration change with **Export to CSV**.
- **Admin Settings & Profile:** Update admin info and capture/upload profile pictures via Webcam Camera or Gallery.

---

### 2. 🏢 Software House Portal (`/dashboard/software-house`)
- **Dashboard Overview:** Metric cards for active postings, pending applications, accepted candidates, and total views.
- **Post New Internship (`/internships/new`):** Form to create new internship listings (Title, Description, Requirements, Location, Duration, Stipend). Automatically submitted for Admin verification.
- **My Internships (`/internships/my`):** Management view of all postings with status filters (`pending`, `approved`, `rejected`).
- **Applicant Pipeline (`/applications/manage`):** Inspect applicants, view candidate CV profiles and cover letters, with instant **Accept / Reject** action triggers that automatically notify candidates.
- **Software House Analytics (`/software-house/analytics`):** Conversion rates, monthly applicant volume, and pipeline analytics.
- **Profile Picture & Branding:** Upload company logo/picture via Gallery or live Camera.

---

### 3. 🎓 University Portal (`/dashboard/university`)
- **Dashboard Overview:** Enrolled student counts, active applications, and placement success ratios.
- **Student Roster (`/university/students`):** View all enrolled university students, their degrees, batches, semesters, and verified status.
- **Bulk CSV Student Upload (`/bulk-upload`):** Import hundreds of students at once via CSV template. The system automatically creates verified student accounts and assigns default passwords.
- **Student Applications (`/university/applications`):** Monitor which students have applied to which companies and track who gets hired.
- **University Analytics (`/university/analytics`):** Student employment rate and department placement performance.

---

### 4. 👨‍🎓 Student Portal (`/dashboard/student`)
- **Dashboard Overview:** Welcome card, total applications submitted, pending reviews, accepted offers, and quick links.
- **Interactive CV Form (`/cv`):** Comprehensive CV Builder (Personal Info, Education, Technical Skills, Projects, Experience, Social Links).
- **Find Internships (`/listings`):** Real-time internship search engine with filters for domain, location, duration, and stipend.
- **Apply to Internships:** One-click application modal with custom cover letter submission.
- **My Applications (`/applications`):** Live tracking of submitted applications with real-time status badges (`Pending`, `Accepted 🎉`, `Rejected`).
- **Student Notifications (`/student/notifications`):** Instant notifications when a Software House reviews or updates an application.
- **Profile Picture & Camera Capture:** Upload avatar directly from device or take a live webcam photo.

---

### 5. 👤 Guest Portal (`/dashboard/guest`)
- Designed for independent learners, self-taught developers, or external graduates not tied to a participating university.
- Has full access to CV creation, browsing public verified internship opportunities, and tracking hiring decisions.

---

## 🔒 5. Database Schema & Security Architecture

InternLynk employs a multi-tiered security architecture across the database, API server, and frontend client:

### 1. Database Row Level Security (RLS)
- **Granular Table Isolation:** Every table in the PostgreSQL database has Row Level Security (RLS) enabled.
- **`SECURITY DEFINER` Functions:** Custom helper functions (`public.is_admin()`, `public.is_university()`, `public.is_software_house()`) run with elevated database privileges to verify user roles without triggering recursive policy lookups (`42P17`).
- **Strict Data Isolation Rules:**
  - **Students:** Can only view approved internships and their own applications/CV data.
  - **Software Houses:** Can only update internships they created and view applications submitted specifically to their listings.
  - **Universities:** Can only view/manage student records associated with their unique `university_id`.
  - **Admins:** Have global oversight to govern platforms, approve accounts, and audit activities.

### 2. Authentication & Session Gating (RBAC)
- **Cryptographic JWTs:** All user sessions use signed JSON Web Tokens issued by Supabase Auth with automatic token refreshing.
- **Multi-Factor Status Gating:**
  - Unapproved accounts (`approval_status !== 'approved'`) are blocked from navigating protected routes.
  - Deactivated accounts (`is_active === false`) are immediately logged out.
- **Client Route Guards:** `RoleRoute.jsx` prevents privilege escalation by deflecting unauthorized role requests directly to their authorized portal.

### 3. Backend & API Security
- **Service Role Key Isolation:** High-privilege database operations (such as bulk student provisioning and user administration) are performed exclusively on the Node.js backend using `SUPABASE_SERVICE_ROLE_KEY`. This key is never exposed to the client bundle.
- **Strict CORS Protection:** Express API restricts cross-origin resource sharing strictly to verified frontend origins.
- **Secure File Upload Pipelines:**
  - Profile pictures and attachments pass through strict Multer filters: MIME-type verification (JPEG, PNG, WEBP only), file size capping (5MB max), and randomized/sanitized disk naming to prevent directory traversal attacks.

### 4. Immutable Audit Logging
- Every approval, rejection, user provisioning, and role modification is recorded in `public.admin_logs` with actor ID, target metadata, and ISO timestamps for enterprise compliance.

---

## 🚀 6. How to Run & Verify the Project

1. **Start Backend & Frontend:**
   ```bash
   cd InternLynk
   npm run dev
   ```
2. **URLs:**
   - **Frontend App:** [http://localhost:5173](http://localhost:5173)
   - **Backend API Status:** [http://localhost:3001](http://localhost:3001)
3. **Login Portals:**
   - Go to [http://localhost:5173/login](http://localhost:5173/login) and select the respective role tab to test any account.
