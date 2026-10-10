# Providence School Management System (PROVI SMS)

> **Institutional Operating System for Nursery, Primary, Junior Secondary, and Senior Secondary Academies.**  
> Built with **Django REST Framework (Python 3.12)** and **React 19 + TypeScript + Vite + Tailwind CSS**.

---

## Architecture & System Overview

Providence SMS is a multi-tenant, security-hardened, production-ready educational management platform designed for multi-tier school entities.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PROVIDENCE SMS OS                                      │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│           Frontend (React + Vite)         │          Backend (Django REST Framework)   │
│  • Modern Classical Academy UI/UX         │  • Multi-Tenant Isolation Middleware       │
│  • TanStack React Query + AuthContext     │  • Role-Based Access Control (RBAC)        │
│  • Standardized Toast & Error System      │  • ReportLab PDF Engines + QR Verification │
│  • Keyboard-Accessible Spreadsheets       │  • DRF Scoped Rate Limiting Throttles      │
│  • Realtime Dashboards (Recharts)         │  • Atomic Concurrency & Financial Locks    │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

---

## Key Modules & Capabilities

### 1. Multi-School Architecture & Tenant Isolation
- **Organization-Level Isolation**: Every school entity has strict data partitioning (`School`, `User`, `SchoolMembership`).
- **Portfolio School Switcher**: Multi-school operators and teachers switch seamlessly between institutions via dynamic `X-School-ID` context resolution.
- **Onboarding Wizard**: Guided multi-step institutional provisioning (`/register`) that auto-populates class levels, default arm 'A', foundational core subjects, and universal grading schemes.

### 2. Comprehensive Security Hardening & Defense-in-Depth
- **Cross-Tenant Credential Protection**: School administrators cannot overwrite global user passwords when adding existing users to their school roster.
- **Mass Assignment Defenses**: `is_staff`, `is_active`, and sensitive administrative flags are strictly read-only on public/profile endpoints.
- **Scoped Rate Limiting & Abuse Prevention**: Built-in DRF throttles protecting authentication (`10/min`), anonymous requests (`60/min`), file uploads (`20/min`), and PDF exports (`30/min`).
- **CSV Formula Injection Defense**: All exported cells with leading formula triggers (`=`, `+`, `-`, `@`) are sanitized, preventing Excel/DDE execution.
- **File Upload Safeguards**: MIME-type allowlists and strict size validation (2MB for school logos, 5MB for student CSV rosters).
- **Security Headers & Clickjacking Defense**: `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS = 'DENY'`, `SECURE_REFERRER_POLICY`, and HSTS enabled.

### 3. Academics & Curriculum Management
- Complete support for **Nursery 1-3**, **Basic / Primary 1-6**, **Junior Secondary (JSS 1-3)**, and **Senior Secondary (SS 1-3)**.
- Academic calendar cycles with multi-term transitions and active session switching.
- Subject allocation and teacher stream assignments.

### 4. Continuous Assessments, Moderation & Report Cards
- **Customizable Assessment Schemes**: Configurable weight breakdowns (e.g. 15% CA1 + 15% CA2 + 70% Exam) with automated letter grades and remarks.
- **Live Spreadsheet Grid**: Interactive score input spreadsheet supporting real-time calculations, status indications (Draft, Submitted, Approved, Published), and teacher comments.
- **Administrative Moderation**: Principals/admins review, approve, or return score sheets with feedback notes.
- **ReportLab PDF Report Cards with QR Verification**: High-fidelity, printable report cards with institutional crests, term attendance stats, subject score breakdowns, position rankings (`1st, 2nd, 2nd, 4th`), and authenticating QR codes.

### 5. Financial Operations & Bursary
- **Fee Structures**: Class-level and general fee categories (Tuition, ICT, Development, Examinations).
- **Batch Class Invoicing**: One-click invoice generation for entire class streams.
- **Atomic Payment Ledger**: Payments computed with exact `Decimal('0.01')` math and row-level `select_for_update()` concurrency locks to prevent double allocations.
- **Printable Invoices & Payment Receipts**: Automated PDF invoice and receipt generation with verifiable reference numbers.
- **Institutional Expense Tracking**: Categorized school expenditures with user attribution.

### 6. Attendance & Student Records
- Student profiles with admission numbers, parent/guardian links, and enrollment histories.
- Bulk CSV student admissions with validation reporting.
- Daily attendance registers with instant mark-all present/absent/late/excused actions.

### 7. Immutable Institutional Audit Trail
- High-resolution audit logging capturing administrative events, score approvals, result publishing, and financial transactions with authorizing actor, timestamp, IP address, and JSON payload inspection.

---

## Default Seeded Credentials

When running `python manage.py seed_data`:

| Role | Email Address | Password |
| :--- | :--- | :--- |
| **Principal / Admin** | `admin@providence.edu` | `Admin123!` |
| **Teacher (Math & Science)** | `john.doe@providence.edu` | `Teacher123!` |
| **Teacher (English)** | `sarah.smith@providence.edu` | `Teacher123!` |

---

## Local Development & Setup

### Prerequisites
- Python 3.12+
- Node.js 20+ & npm
- PostgreSQL (optional, SQLite fallback enabled by default)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed initial institutional data
python manage.py seed_data

# Run security & functional test suites
pytest

# Start Django development server (Port 8000)
python manage.py runserver 8000
```

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server (Port 3000)
npm run dev

# Run TypeScript compilation and production build
npm run build
```

---

## Running Tests

### Backend Automated Test Suite
```bash
cd backend
pytest
```
The test suite executes 13 automated tests covering:
- Security hardening & mass assignment defense
- Cross-tenant password isolation
- Multi-tenant query isolation and mutation defenses
- CSV formula injection sanitization and validation
- Atomic payment calculations and balance reconciliation
- Academic grading, position rankings, and CA schemes

### Frontend Production Typecheck & Build
```bash
cd frontend
npm run build
```

---

## Docker Production Deployment

To run the complete production environment (PostgreSQL, Django Gunicorn application server, and Nginx reverse proxy):

```bash
docker-compose up --build -d
```

- **Frontend Application**: `http://localhost`
- **Backend API**: `http://localhost:8000/api/v1/`
- **OpenAPI / Swagger Documentation**: `http://localhost:8000/api/docs/`
