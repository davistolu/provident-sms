# PROVI School Management System (SMS)

A multi-tenant, production-ready School Management System supporting Nursery, Primary, Junior Secondary, and Senior Secondary educational institutions. Built with **Django REST Framework + PostgreSQL** and **React + TypeScript + Tailwind CSS**.

---

## Key Features

1. **Multi-School Architecture & Tenant Isolation**:
   - Organization-level logical isolation for all models (`School`, `User`, `SchoolMembership`).
   - QuerySet-level and Service-layer tenant scoping via `TenantHeaderMiddleware` and `TenantScopedModelViewSet`.
   - Comprehensive test suite preventing cross-tenant data leaks and unauthorized mutations.

2. **Role-Based Access Control**:
   - **School Administrator**: Institutional configuration, class arms, teacher provisioning, subject assignments, continuous assessment approval, result publishing, report cards, fee structuring, invoicing, partial payments, receipts, and audit trails.
   - **Teacher**: Personalized workspace for assigned classes and subjects, interactive bulk attendance register, keyboard-friendly continuous assessment spreadsheet, and submission reviews.

3. **Academic Structure & Continuous Assessment**:
   - Nursery 1-3, Primary 1-6, JSS 1-3, SS 1-3 class management.
   - Configurable assessment schemes (e.g. 15% CA1 + 15% CA2 + 70% Exam) and WAEC/Standard letter grading scales.
   - Authoritative server-side calculations for totals, averages, and standard competition ranking positions (`1st, 2nd, 2nd, 4th`).
   - High-fidelity server-side PDF report cards generated using **ReportLab** with official school branding and student biodata.

4. **Financial Operations & Billing**:
   - Class-level and general fee structures (Tuition, Development, Exam).
   - Batch invoice generation for entire classes.
   - Partial and full payment allocations, balance reconciliation, and official printable PDF receipts.
   - Institutional operating expense logs.

5. **Security & Compliance**:
   - Immutable audit logging on critical actions (admissions, score submissions, approvals, fee payments).
   - OpenAPI schema generation & Swagger UI documentation at `/api/docs/`.

---

## Default Seeded Credentials

When running `python manage.py seed_data`:
- **School Administrator**: `admin@providence.edu` | Password: `Admin123!`
- **Teacher (Math & Science)**: `john.doe@providence.edu` | Password: `Teacher123!`
- **Teacher (English)**: `sarah.smith@providence.edu` | Password: `Teacher123!`

---

## Quickstart & Local Development

### 1. Backend Setup
```bash
# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations & seed data
python backend/manage.py migrate
python backend/manage.py seed_data

# Run tests
pytest backend/tests

# Start development server
python backend/manage.py runserver 8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server (Port 3000)
npm run dev

# Build for production
npm run build
```

---

## Docker Deployment

To launch the full production stack (PostgreSQL, Django Gunicorn backend, and Nginx frontend):
```bash
docker-compose up --build -d
```
The application will be accessible at `http://localhost`.
OpenAPI documentation will be accessible at `http://localhost:8000/api/docs/`.
