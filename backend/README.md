# Providence SMS - Backend API Engine

The backend of Providence SMS is built on **Django 5.1** and **Django REST Framework (DRF)** with a modular architecture and built-in multi-tenancy.

---

## Directory & App Structure

```
backend/
├── provi_sms/                 # Project core configuration & settings
│   ├── settings.py           # Hardened Django settings & rate limits
│   ├── urls.py               # Global routing & OpenAPI documentation
│   ├── wsgi.py / asgi.py     # Deployment entrypoints
├── apps/
│   ├── accounts/             # User authentication, profiles, password management
│   ├── schools/              # School entity, memberships, multi-school provisioning
│   ├── academics/            # Academic sessions, terms, class levels, streams, subjects
│   ├── students/             # Student records, guardians, enrollments, CSV bulk imports
│   ├── attendance/           # Attendance sessions & daily student rosters
│   ├── assessments/          # Assessment schemes, weighting components, grading scales
│   ├── results/              # Score sheets, continuous assessment moderation, PDF report cards
│   ├── finance/              # Fee structures, student invoicing, payments, PDF receipts, expenses
│   ├── audit/                # Immutable institutional audit trail
│   └── common/               # Tenant models, middleware, permissions, exceptions, pagination
├── templates/                # Server-rendered HTML templates
├── tests/                    # Pytest test suite
└── manage.py                 # Django management CLI
```

---

## Multi-Tenancy Architecture

All school-specific models inherit from `TenantModel` in `apps.common.models`. Multi-tenancy is enforced through:

1. **`TenantHeaderMiddleware`**: Automatically extracts the `X-School-ID` header and verifies that the authenticated user possesses an active `SchoolMembership` in that specific institution.
2. **`TenantScopedModelViewSet`**: Automatically scopes all database queries (`get_queryset()`) to the active school and assigns `school` on newly created instances.
3. **`resolve_membership_for_request()`**: Validates role-based access without permitting arbitrary cross-school access.

---

## Security Hardening Controls

- **DRF Scoped Rate Limiting**:
  - `auth`: 10 requests / min (`/api/v1/auth/login/`, `/api/v1/auth/register-onboard/`, `/api/v1/auth/change-password/`)
  - `anon`: 60 requests / min
  - `user`: 300 requests / min
  - `file_upload`: 20 requests / min
  - `pdf_export`: 30 requests / min
- **Defense-in-Depth Authentication**: Token rotation on password changes; mass assignment protection on `UserSerializer` (`is_staff`, `is_active`, `email` read-only).
- **Financial Concurrency**: Row-level locking (`select_for_update()`) and exact `Decimal` math prevent race conditions and floating-point errors.
- **CSV & Upload Sanitization**: Leading formula triggers (`=`, `+`, `-`, `@`) are sanitized on export and import; strict size limits and MIME allowlists are enforced on files.
- **Security Headers**: HSTS, nosniff, frame-ancestors deny, and strict-origin referrer headers.

---

## API Endpoints Overview

| Base Endpoint | Description |
| :--- | :--- |
| `/api/v1/auth/login/` | Staff/Administrator authentication |
| `/api/v1/auth/register-onboard/` | Multi-step institution setup & initial user provisioning |
| `/api/v1/auth/me/` | Current user profile & school memberships |
| `/api/v1/auth/change-password/` | Authenticated password change with token rotation |
| `/api/v1/schools/` | School portfolio and settings management |
| `/api/v1/academics/` | Class levels, arms, subjects, teacher allocations, sessions |
| `/api/v1/students/` | Student directory, guardian coordinates, CSV import/export |
| `/api/v1/attendance/` | Class attendance sessions and daily registers |
| `/api/v1/assessments/` | Continuous assessment schemes and grading rules |
| `/api/v1/results/submissions/` | Subject score spreadsheets, moderation, result publishing |
| `/api/v1/results/term-results/` | Student term averages and printable PDF report cards |
| `/api/v1/finance/` | Fee categories, fee structures, student invoices, payments, PDF receipts |
| `/api/v1/audit/logs/` | Security and institutional audit logs |

---

## Running Backend Tests

```bash
pytest
```
Runs the full test suite in `tests/` verifying multi-tenant isolation, permissions, calculations, and security defenses.
