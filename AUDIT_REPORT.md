# Comprehensive Frontend, Security & Production-Readiness Audit Report

**Target Application**: Provident SMS (Frontend Web Application)  
**Evaluator**: Principal Frontend Engineer, Application Security Engineer, UI/UX Auditor, Accessibility Specialist, Performance Engineer & QA Lead  
**Audit Date**: October 2026  
**Audit Status**: Complete (Read-Only Phase)  
**Production Verdict**: **NOT READY FOR PRODUCTION (Blocked by P0 & P1 Critical Deficiencies)**

---

## 1. Executive Summary

A comprehensive, read-only audit of the Provident SMS frontend application was conducted across its entire codebase (`frontend/src/`). The application is a multi-tenant School Management System built on React 19, TypeScript 5.6, Vite 5.4, Tailwind CSS v4, React Router v6, and TanStack Query v5, serving school administrators, teachers, and finance personnel.

### High-Level Assessment
While the visual presentation is clean and modern, the frontend exhibits **severe architectural, security, accessibility, and correctness deficiencies** that preclude production release:
1. **Critical Privilege & Routing Boundaries (P0/P1)**: The client-side role authorization model completely excludes the `BURSAR` role from administrative layouts and finance dashboards, locking bursars out of core fee management. In addition, administrative membership management allows an admin to accidentally or maliciously delete their own tenant membership, causing irrecoverable lockout.
2. **Credential Exfiltration Vector (P1)**: The central HTTP client (`services/api.ts`) automatically attaches active bearer authentication tokens and tenant identifiers (`Authorization`, `X-School-ID`) to any URL provided—including absolute third-party URLs—creating an origin-leakage vulnerability.
3. **Hardcoded Academic Business Logic (P1)**: The gradebook spreadsheet forcibly validates and calculates scores against a rigid, hardcoded 15/15/70 assessment scheme (`CA1`, `CA2`, `EXAM`), directly breaking tenant-configurable academic structures and risking data corruption.
4. **Total Absence of Resilience & Test Automation (P1)**: The application contains **zero Error Boundaries**; a single runtime exception anywhere in the component tree results in a complete white-screen crash. Furthermore, there are **zero automated tests** (0 unit tests, 0 component tests, 0 E2E tests).
5. **Systemic WCAG 2.2 AA Non-Compliance (P2)**: Modals lack dialog semantics, focus containment, and keyboard traps; form inputs lack accessible association with validation errors (`aria-invalid`, `aria-describedby`); and key interactive elements lack keyboard focus indicators.

---

## 2. Application Inventory

### 2.1 Route & View Inventory (22 Screen Surfaces)

| Route Path | Component / File | Intended Role(s) | Primary Purpose | State / Data Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage.tsx` | Unauthenticated | User authentication & school membership selection | `AuthContext`, `apiClient` |
| `/admin/dashboard` | `AdminDashboardPage.tsx` | Admin, Principal | High-level metrics, enrollment charts, quick actions | `useQuery(['dashboard-metrics'])` |
| `/admin/students` | `StudentListPage.tsx` | Admin, Staff | Student roster, filtering, CSV bulk upload, creation | `useQuery(['students'])`, `apiClient` |
| `/admin/students/:id` | `StudentDetailPage.tsx` | Admin, Staff | Student dossier, guardian info, attendance, results | `useQuery(['student', id])` |
| `/admin/results/spreadsheet` | `ScoreEntrySpreadsheetPage.tsx` | Admin, Teacher | Batch tabular continuous assessment & exam score entry | `useQuery(['classes'])`, `useQuery(['subjects'])`, `apiClient` |
| `/admin/results/reports` | `ReportCardsPage.tsx` | Admin, Teacher | Term report card generation, batch printing, distribution | `useQuery(['classes'])`, `useQuery(['report-cards'])` |
| `/admin/finance/invoices` | `InvoicesListPage.tsx` | Admin, Bursar | Fee billing, payment recording, balance tracking | `useQuery(['invoices'])`, `apiClient` |
| `/admin/finance/expenses` | `ExpensesPage.tsx` | Admin, Bursar | Expenditure logging, category breakdown, receipts | `useQuery(['expenses'])`, `apiClient` |
| `/admin/finance/fees` | `FeeStructurePage.tsx` | Admin, Bursar | Termly fee schedule definition by class/program | `useQuery(['fee-structures'])` |
| `/admin/attendance` | `AttendancePage.tsx` | Admin, Teacher | Daily roll-call attendance recording and summaries | `useQuery(['classes'])`, `apiClient` |
| `/admin/timetable` | `TimetablePage.tsx` | Admin, Teacher | Class and teacher weekly schedule management | `useQuery(['timetable'])` |
| `/admin/users` | `UserAccountsPage.tsx` | Admin, Super Admin | Staff invitation, role assignment, membership removal | `useQuery(['school-members'])`, `apiClient` |
| `/admin/audit-logs` | `AuditLogsPage.tsx` | Admin, Super Admin | System activity audit trail and compliance monitoring | `useQuery(['audit-logs'])` |
| `/admin/settings` | `SchoolSettingsPage.tsx` | Admin, Principal | Tenant profile, logo, grading scheme, term config | `useQuery(['school-profile'])`, `apiClient` |
| `/admin/profile` | `UserProfilePage.tsx` | All Authenticated | Personal details, password reset | `AuthContext`, `apiClient` |
| `/teacher/dashboard` | `TeacherDashboardPage.tsx` | Teacher | Assigned classes, upcoming periods, recent score submissions | `useQuery(['teacher-overview'])` |
| `/teacher/attendance` | `TeacherAttendancePage.tsx` | Teacher | Classroom attendance roll call | `useQuery(['teacher-classes'])` |
| `/teacher/scores` | `TeacherScoresPage.tsx` | Teacher | Subject-specific continuous assessment & exam entry | `useQuery(['teacher-subjects'])` |
| `/teacher/timetable` | `TeacherTimetablePage.tsx` | Teacher | Teacher's personal weekly schedule view | `useQuery(['teacher-timetable'])` |
| `/teacher/classes` | `TeacherClassesPage.tsx` | Teacher | Roster of students in assigned form/classrooms | `useQuery(['teacher-classes'])` |
| `/teacher/profile` | `TeacherProfilePage.tsx` | Teacher | Personal details and password change | `AuthContext`, `apiClient` |
| `*` | `NotFoundPage.tsx` | Any | 404 Route fallback | Static |

### 2.2 Global State & Infrastructure
- **Context Providers**:
  - `AuthContext.tsx`: Manages authentication token (`auth_token`), user object (`auth_user`), active tenant (`selected_school_id`), role derivation (`isAdmin`, `isTeacher`), login/logout lifecycle.
  - `ToastContext.tsx`: Imperative notifications (`success`, `error`, `info`, `warning`) with auto-dismiss timers.
- **Networking & API Layer**:
  - `api.ts`: Central HTTP fetch wrapper injecting auth headers, school IDs, and response error unboxing.
  - `errorService.ts`: DRF error extractor formatting backend dictionary errors into strings.
- **Shared UI Primitives**:
  - `Button`, `Input`, `Select`, `Card`, `Modal`, `ConfirmDialog`, `DataTable`, `Badge`, `Spinner`, `Tabs`, `Navbar`, `Sidebar`.

---

## 3. Audit Coverage Matrix

| Area | Inspection Method | Verified Status | Primary Risk Level |
| :--- | :--- | :--- | :--- |
| **Authentication & Session** | Static Code Analysis & State Trace | Inspected | **High** |
| **Authorization & RBAC** | Route Guard & Context Rule Analysis | Inspected | **Critical (P0)** |
| **API Client & Networking** | Network Layer Header & URL Trace | Inspected | **High (P1)** |
| **Input Validation & Forms** | Component Schema & Payload Analysis | Inspected | **Medium (P2)** |
| **File Handling & Uploads** | Multipart Handler & Size Check Audit | Inspected | **Medium (P2)** |
| **Data Integrity & Business Logic** | Spreadsheet & Finance Calculations | Inspected | **High (P1)** |
| **Error Handling & Resilience** | Tree Error Boundary & Catch Audit | Inspected | **High (P1)** |
| **Accessibility (WCAG 2.2 AA)** | Semantic DOM & ARIA Attribute Review | Inspected | **Medium (P2)** |
| **Responsive Design & UX** | CSS Breakpoints, Tables, Overlays | Inspected | **Medium (P2)** |
| **Performance & Bundling** | Bundle Tree & Import Trace | Inspected | **Medium (P2)** |
| **Automated Testing & CI/CD** | `package.json`, Config, Script Review | Inspected | **High (P1)** |
| **Linting & Code Hygiene** | `npm run lint` (`oxlint`) Execution | Completed (116 warnings) | **Low (P3)** |

---

## 4. Critical and High-Priority Findings (P0, P1)

### Finding SEC-P01: Role-Based Routing Defect Locks Out Bursars from Finance Operations
* **Severity**: **P0 (Critical)**
* **Category**: Authorization / Privilege Boundary
* **Location**: `frontend/src/context/AuthContext.tsx` (L135), `frontend/src/AppRoutes.tsx` (L46)
* **Code Evidence**:
  ```typescript
  // AuthContext.tsx:135
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'PRINCIPAL' || user?.is_staff;
  const isTeacher = user?.role === 'TEACHER';
  ```
  ```tsx
  // AppRoutes.tsx:46
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Navigate to={isAdmin ? "/admin/dashboard" : "/teacher/dashboard"} replace />
      </ProtectedRoute>
    }
  />
  ```
* **Vulnerability Analysis**:
  A user with the official tenant role `BURSAR` evaluates to `isAdmin === false` and `isTeacher === false`. Upon logging in, they are redirected to `/teacher/dashboard` (where they have no assigned classes or teaching duties). Furthermore, all administrative finance routes (`/admin/finance/invoices`, `/admin/finance/expenses`, `/admin/finance/fees`) are nested inside `<AdminLayout />`, which enforces `isAdmin`. Consequently, the Bursar cannot perform their core job responsibilities (issuing invoices, logging expenses, recording fee collections) without being granted full Super Admin/Principal credentials.
* **Impact**: Total denial of service for school bursars; forces institutions to over-privilege finance staff with Super Admin status, violating the Principle of Least Privilege.
* **Remediation**:
  1. Expand `AuthContext` to expose granular permission flags: `isBursar = user?.role === 'BURSAR'`, or feature permissions (`canManageFinance`, `canManageAcademics`, `canManageUsers`).
  2. Refactor route authorization guards to check specific capabilities (`<ProtectedRoute requiredRole={['ADMIN', 'BURSAR']}>`) rather than a binary `isAdmin` check.

---

### Finding SEC-P02: Unprotected Self-Account Membership Deletion Causes Irrecoverable Lockout
* **Severity**: **P1 (High)**
* **Category**: Authorization & Privilege Boundaries
* **Location**: `frontend/src/features/accounts/UserAccountsPage.tsx` (L158-177)
* **Code Evidence**:
  ```tsx
  // UserAccountsPage.tsx:158-177
  <button
    onClick={() => {
      setSelectedMember(m);
      setShowDeleteModal(true);
    }}
    className="text-red-600 hover:text-red-900 text-sm font-medium"
  >
    Remove
  </button>
  ```
* **Vulnerability Analysis**:
  The member table iterates through all school members and renders the "Remove" button unconditionally. There is **no check comparing `m.user.id !== currentUser.id`**. An administrator can trigger removal of their own school membership. If an admin deletes themselves—especially in a school with only one configured administrator—the school tenant becomes completely orphaned without any active administrative user.
* **Impact**: Administrative lockout, orphan tenant state, operational disruption requiring database-level manual intervention.
* **Remediation**:
  1. Hide or disable the "Remove" button when `m.user.id === user.id` or `m.user.email === user.email`.
  2. Display a tooltip explaining: *"You cannot remove your own active administrator account."*
  3. Ensure the backend independently rejects deletion of the acting user's own membership with HTTP 400/403.

---

### Finding SEC-P03: Credential & Tenant Token Leakage via Unvalidated Absolute URLs
* **Severity**: **P1 (High)**
* **Category**: Network Layer Security / Sensitive Data Exposure
* **Location**: `frontend/src/services/api.ts` (L8-32)
* **Code Evidence**:
  ```typescript
  // services/api.ts:8-13
  const resolveUrl = (endpoint: string) => {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  };

  // services/api.ts:24-32
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }
  const schoolId = localStorage.getItem('selected_school_id');
  if (schoolId) {
    headers.set('X-School-ID', schoolId);
  }
  ```
* **Vulnerability Analysis**:
  `resolveUrl` accepts any absolute URL starting with `http://` or `https://` without origin verification. `executeFetch` then attaches the school's private session token (`Authorization: Token <token>`) and tenant ID (`X-School-ID`) to the request headers. If any feature (e.g., student avatar preview, external invoice exporter, webhook tester, or report template loader) passes an external URL into `apiClient.get(externalUrl)`, the sensitive authentication token and tenant ID are transmitted to the external third-party server.
* **Impact**: Credential leakage, session hijacking, tenant ID exposure to untrusted third-party hosts.
* **Remediation**:
  1. In `executeFetch`, check that the target URL's origin strictly matches `window.location.origin` or `new URL(API_BASE_URL).origin`.
  2. If the URL is external, omit the `Authorization` and `X-School-ID` headers, or throw an error prohibiting external requests via `apiClient`.

---

### Finding ARCH-P01: Total Absence of React Error Boundaries
* **Severity**: **P1 (High)**
* **Category**: Reliability / Production Resilience
* **Location**: `frontend/src/App.tsx` (L1-25), `frontend/src/main.tsx` (L1-18)
* **Code Evidence**:
  ```tsx
  // App.tsx
  export function App() {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }
  ```
* **Vulnerability Analysis**:
  There are zero React `<ErrorBoundary>` components in the entire application—neither at the application root, nor at the route layout level, nor around complex visual widgets like Recharts charts or score entry spreadsheets. In React 19, an uncaught rendering error in any child component unmounts the entire React fiber tree. If a chart receives an unexpected data format or a student detail view encounters a `null` property, the entire window turns completely blank.
* **Impact**: Total application crash on unexpected edge-case data, zero user recovery mechanism, catastrophic UX in production.
* **Remediation**:
  1. Implement a top-level `RootErrorBoundary` with a branded fallback UI (*"Something went wrong"*, with a *Refresh Application* button and error reporting hook).
  2. Wrap `<AdminLayout>` and `<TeacherLayout>` route outlets in layout-level error boundaries so individual page crashes do not crash navigation headers or sidebars.
  3. Wrap complex rendering widgets (e.g., Recharts dashboards, data tables) in local component boundaries.

---

### Finding DATA-P01: Hardcoded Grade Assessment Scheme Breaking Dynamic School Configurations
* **Severity**: **P1 (High)**
* **Category**: Business Logic / Data Integrity
* **Location**: `frontend/src/features/results/ScoreEntrySpreadsheetPage.tsx` (L278-335)
* **Code Evidence**:
  ```tsx
  // ScoreEntrySpreadsheetPage.tsx:288-305
  <input
    type="number"
    min="0"
    max="15"
    value={scores[student.id]?.ca1 ?? ''}
    onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
    className="w-16 text-center border rounded py-1 text-sm focus:ring-1 focus:ring-primary-500"
  />
  ...
  <input
    type="number"
    min="0"
    max="70"
    value={scores[student.id]?.exam ?? ''}
    onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
    className="w-16 text-center border rounded py-1 text-sm focus:ring-1 focus:ring-primary-500"
  />
  ```
* **Vulnerability Analysis**:
  The grade entry spreadsheet completely hardcodes three assessment fields: `ca1` (max 15), `ca2` (max 15), and `exam` (max 70). However, the school settings model supports dynamic academic grading schemes (e.g., some schools use 20/20/60, others use 10/10/10/70, others use 30/70 or 40/60). Because `max="15"` and `max="70"` are hardcoded in the frontend DOM and state handlers, teachers at schools with different schemes are physically blocked from typing valid scores (e.g., entering 20 in CA1 is rejected or clamped), directly causing academic record failure.
* **Impact**: System-wide academic data entry failure for any school not adhering to the 15/15/70 configuration; severe data inaccuracy and customer churn.
* **Remediation**:
  1. Fetch the active school's assessment components and weights dynamically via API (`/api/v1/academics/assessment-components/` or from `activeTerm`/`schoolProfile`).
  2. Dynamically render columns based on the returned assessment structures, utilizing the backend component code, label, and maximum weight (`max={component.max_score}`).

---

### Finding QA-P01: Zero Automated Test Coverage Across Entire Frontend
* **Severity**: **P1 (High)**
* **Category**: Quality Assurance & Regression Risk
* **Location**: `frontend/package.json`
* **Evidence**:
  ```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  }
  ```
* **Vulnerability Analysis**:
  `package.json` contains no test runner (`vitest`, `jest`), no testing utilities (`@testing-library/react`), and no E2E automation (`playwright`, `cypress`). There is **not a single test file** (`*.test.ts`, `*.spec.tsx`) anywhere in `src/`. Critical business paths (fee collection calculations, authentication token handling, grading computations, membership removals) have zero automated verification. Any refactor or dependency upgrade risks silent production regressions.
* **Impact**: Extreme regression risk; no automated confidence during releases; high likelihood of breaking changes reaching end-users undetected.
* **Remediation**:
  1. Install and configure `vitest`, `@testing-library/react`, and `@testing-library/jest-dom`.
  2. Establish unit tests for core utilities (`errorService`, `apiClient`, date formatters, currency formatters).
  3. Establish component integration tests for critical workflows (`AuthContext`, `ScoreEntrySpreadsheet`, `InvoicesListPage`).
  4. Add `test` and `test:coverage` scripts to `package.json` and gate pull requests on clean passes.

---

## 5. Complete Findings Register

| ID | Title | File / Location | Sev | Category |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-P01** | BURSAR role excluded from admin layout & finance routes | `AuthContext.tsx` (L135) | P0 | Auth & Routing |
| **SEC-P02** | Unprotected self-account membership deletion causes admin lockout | `UserAccountsPage.tsx` (L158) | P1 | Authorization |
| **SEC-P03** | `apiClient` leaks auth tokens to absolute third-party URLs | `services/api.ts` (L8) | P1 | Network Security |
| **ARCH-P01** | Zero React Error Boundaries across entire application | `App.tsx` (L1) | P1 | Reliability |
| **DATA-P01** | Hardcoded 15/15/70 grading scheme breaks dynamic school configurations | `ScoreEntrySpreadsheetPage.tsx` (L288) | P1 | Data Integrity |
| **QA-P01** | Complete absence of automated tests (Vitest / RTL / Playwright) | `package.json` | P1 | Quality Assurance |
| **SEC-P04** | Missing Clickjacking (`X-Frame-Options`), CSP, and Security Headers | `vercel.json` | P2 | AppSec / Headers |
| **SEC-P05** | Unvalidated file uploads allow arbitrary sizes and MIME types | `SchoolSettingsPage.tsx` (L86) | P2 | Input Validation |
| **SEC-P06** | Cleartext auth token and tenant ID stored in unencrypted `localStorage` | `AuthContext.tsx` (L18) | P2 | Storage Security |
| **ARCH-P02** | Zero route-level lazy loading (`React.lazy`) inflates initial bundle (>955KB) | `AppRoutes.tsx` (L1) | P2 | Performance |
| **DATA-P02** | Audit logs client-side filter operates only on current page (20 items) | `AuditLogsPage.tsx` (L46) | P2 | Search / Pagination |
| **DATA-P03** | Un-debounced search inputs trigger redundant API calls on every keystroke | `StudentListPage.tsx` (L78) | P2 | Performance / Race |
| **DATA-P04** | Unsafe `parseFloat` on invoice payment without `min` step validation | `InvoicesListPage.tsx` (L414) | P2 | Form Validation |
| **A11Y-P01** | Modals lack `role="dialog"`, `aria-modal="true"`, and keyboard focus trap | `Modal.tsx` (L48) | P2 | Accessibility |
| **A11Y-P02** | Form inputs lack `aria-invalid` and `aria-describedby` links to error messages | `Input.tsx` (L23) | P2 | Accessibility |
| **A11Y-P03** | Button component lacks visible keyboard focus rings (`focus-visible:ring-2`) | `Button.tsx` (L29) | P2 | Accessibility |
| **RESP-P01** | Gradebook spreadsheet lacks sticky name/ID columns on mobile/tablet viewports | `ScoreEntrySpreadsheetPage.tsx` (L260) | P2 | Responsive UX |
| **ARCH-P03** | Inconsistent API error extraction drops backend field validation details | `InvoicesListPage.tsx` (L450) | P3 | Error Handling |
| **CODE-P01** | 116 linter warnings for unused imports and variables across 43 files | Full codebase (`oxlint`) | P3 | Code Hygiene |
| **UX-P01** | Missing empty states with call-to-actions in several resource tables | `ExpensesPage.tsx` (L180) | P3 | User Experience |
| **PERF-P01** | TanStack Query lacks standardized `staleTime`, refetching static datasets | `StudentListPage.tsx` (L65) | P3 | Performance |
| **DOC-P01** | Missing comprehensive environment variable configuration schema/validation | `src/services/api.ts` (L4) | P4 | Developer Experience |

---

## 6. Master Prioritized Implementation TODO Checklist

### Stage 0: Critical Security & Authorization Fixes (P0 / P1)
- [ ] **TASK-SEC-01**: **Fix BURSAR Role Access & Refactor Protected Route Guards**
  - **Files**: `frontend/src/context/AuthContext.tsx`, `frontend/src/AppRoutes.tsx`, `frontend/src/components/common/Sidebar.tsx`
  - **Acceptance Criteria**:
    - `AuthContext` derives `isBursar = user?.role === 'BURSAR'`.
    - Bursars logging in are redirected to `/admin/finance/invoices` or a dedicated finance dashboard.
    - Sidebar navigation items are filtered so Bursars see Fee Structures, Invoices, and Expenses, while being restricted from User Accounts and System Settings if unauthorized.
  - **Test Requirements**: Unit test `AuthContext` role derivations; verify Bursar login redirect.
  - **Complexity**: Medium (2-3 hours)

- [ ] **TASK-SEC-02**: **Prevent Self-Account Membership Deletion**
  - **Files**: `frontend/src/features/accounts/UserAccountsPage.tsx`
  - **Acceptance Criteria**:
    - Check current authenticated user against `m.user.id`.
    - If `m.user.id === user.id`, hide the "Remove" button or disable it with a disabled tooltip: *"Cannot remove your own active account."*
    - Ensure confirmation dialog verifies `member.user.id !== user.id` before dispatching API call.
  - **Test Requirements**: Component test verifying "Remove" button is disabled for logged-in user.
  - **Complexity**: Low (1 hour)

- [ ] **TASK-SEC-03**: **Sanitize API Client URLs to Prevent Credential Exfiltration**
  - **Files**: `frontend/src/services/api.ts`
  - **Acceptance Criteria**:
    - In `resolveUrl`, disallow untrusted third-party hosts.
    - If endpoint begins with `http://` or `https://`, verify `new URL(endpoint).origin === new URL(API_BASE_URL).origin`.
    - Never append `Authorization` or `X-School-ID` headers to external origins.
  - **Test Requirements**: Unit test `executeFetch` with relative URL, same-origin URL, and cross-origin URL (`https://attacker.com/leak`).
  - **Complexity**: Low (1 hour)

- [ ] **TASK-SEC-04**: **Add Security Headers in Vercel Deployment Configuration**
  - **Files**: `frontend/vercel.json`
  - **Acceptance Criteria**:
    - Configure HTTP response headers in `vercel.json`:
      - `X-Frame-Options: DENY`
      - `X-Content-Type-Options: nosniff`
      - `Referrer-Policy: strict-origin-when-cross-origin`
      - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - **Test Requirements**: Verify header schema against Vercel specification; check build passes.
  - **Complexity**: Low (30 mins)

---

### Stage 1: Architectural Resilience & Error Boundaries (P1)
- [ ] **TASK-ARCH-01**: **Implement Top-Level and Route-Level Error Boundaries**
  - **Files**: New `frontend/src/components/common/ErrorBoundary.tsx`, `frontend/src/App.tsx`, `frontend/src/components/layout/AdminLayout.tsx`, `frontend/src/components/layout/TeacherLayout.tsx`
  - **Acceptance Criteria**:
    - Implement React class-based or `react-error-boundary` wrapper catching render errors.
    - Render a user-friendly error screen with error ID, user message, and a *"Reload Page"* / *"Return to Dashboard"* action.
    - Wrap `<AppRoutes />` with root boundary and wrap layout `<Outlet />` instances with layout boundaries.
  - **Test Requirements**: Unit test throwing a test component error and asserting fallback UI appears.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-ARCH-02**: **Configure Automated Testing Infrastructure (Vitest + RTL)**
  - **Files**: `frontend/package.json`, `vite.config.ts`, `vitest.setup.ts`
  - **Acceptance Criteria**:
    - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
    - Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`.
    - Setup mock environment for `window.matchMedia` and `localStorage`.
  - **Test Requirements**: Run `npm test` and assert 0 errors.
  - **Complexity**: Medium (2-3 hours)

---

### Stage 2: Data Integrity & Business Logic Corrections (P1 / P2)
- [ ] **TASK-DATA-01**: **Refactor Score Entry Spreadsheet to Support Dynamic Assessment Schemes**
  - **Files**: `frontend/src/features/results/ScoreEntrySpreadsheetPage.tsx`
  - **Acceptance Criteria**:
    - Fetch active school's assessment configuration components via API.
    - Dynamically generate table columns based on returned assessment entities.
    - Bind `max` attribute dynamically to each component's configured maximum score.
    - Calculate total score and auto-grade dynamically using active grading bands.
  - **Test Requirements**: Component test with custom assessment schemes (e.g. 20/20/60 and 40/60).
  - **Complexity**: High (4-5 hours)

- [ ] **TASK-DATA-02**: **Implement Server-Side Search in Audit Logs**
  - **Files**: `frontend/src/features/accounts/AuditLogsPage.tsx`
  - **Acceptance Criteria**:
    - Pass search parameters (`action`, `user`, `search`) directly to the backend API query parameters.
    - Reset pagination to page 1 on search filter change.
  - **Test Requirements**: Verify API call includes query string parameters on filter changes.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-DATA-03**: **Implement Debounced Search Hooks on High-Traffic Tables**
  - **Files**: New `frontend/src/hooks/useDebounce.ts`, `frontend/src/features/students/StudentListPage.tsx`, `frontend/src/features/accounts/UserAccountsPage.tsx`
  - **Acceptance Criteria**:
    - Implement `useDebounce(value, 300)` hook.
    - Connect search inputs to debounced state to prevent network flooding and race conditions.
  - **Test Requirements**: Unit test `useDebounce`; verify timer delay and cleanup.
  - **Complexity**: Low (1-2 hours)

- [ ] **TASK-DATA-04**: **Harden Financial Payment Amount Validation**
  - **Files**: `frontend/src/features/finance/InvoicesListPage.tsx`
  - **Acceptance Criteria**:
    - Validate `paymentForm.amount` strictly before dispatch: ensure > 0, not `NaN`, and not exceeding balance due.
    - Add `min="0.01"` and `step="0.01"` to payment input.
  - **Test Requirements**: Unit test payment validation logic with edge cases (`0`, `""`, `-10`, `999999999`).
  - **Complexity**: Low (1 hour)

---

### Stage 3: Accessibility (WCAG 2.2 AA) & Form Standards (P2)
- [ ] **TASK-A11Y-01**: **Harden Modal & Dialog Accessibility and Focus Management**
  - **Files**: `frontend/src/components/common/Modal.tsx`, `frontend/src/components/common/ConfirmDialog.tsx`
  - **Acceptance Criteria**:
    - Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="modal-title"` to modal containers.
    - Implement focus trapping (Tab stays inside modal until dismissed).
    - Ensure Escape key triggers close handler.
    - Restore focus to trigger element on dismissal.
    - Add `aria-label="Close dialog"` to close buttons.
  - **Test Requirements**: Keyboard navigation test ensuring Tab loops inside open modal.
  - **Complexity**: Medium (2-3 hours)

- [ ] **TASK-A11Y-02**: **Form Input ARIA Accessibility Linkage**
  - **Files**: `frontend/src/components/common/Input.tsx`, `frontend/src/components/common/Select.tsx`
  - **Acceptance Criteria**:
    - Link helper and error text to inputs using `aria-describedby={`${id}-error`}`.
    - Set `aria-invalid={!!error}` on inputs when error is present.
    - Ensure every input has a deterministically associated `<label htmlFor={id}>`.
  - **Test Requirements**: Render input with error; assert `aria-invalid="true"` and `aria-describedby` matches error element ID.
  - **Complexity**: Low (1-2 hours)

- [ ] **TASK-A11Y-03**: **Ensure Keyboard Focus Rings on Interactive Controls**
  - **Files**: `frontend/src/components/common/Button.tsx`, `frontend/src/index.css`
  - **Acceptance Criteria**:
    - Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` to all button variants.
    - Ensure global keyboard navigation has high-visibility focus indicators.
  - **Test Requirements**: Visual inspection with Tab key across forms and buttons.
  - **Complexity**: Low (1 hour)

---

### Stage 4: Performance, Code Splitting & Client-Side Validation (P2 / P3)
- [ ] **TASK-PERF-01**: **Introduce Route-Level Code Splitting (`React.lazy`)**
  - **Files**: `frontend/src/AppRoutes.tsx`
  - **Acceptance Criteria**:
    - Convert all 22 static page imports into `React.lazy(() => import(...))`.
    - Wrap routes in `<Suspense fallback={<PageSkeleton />}>`.
    - Verify initial bundle drops from >955 kB to <250 kB.
  - **Test Requirements**: Run `npm run build` and inspect chunk distribution in output.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-PERF-02**: **Add File Size and MIME Type Validation to Upload Controls**
  - **Files**: `frontend/src/features/settings/SchoolSettingsPage.tsx`, `frontend/src/features/students/StudentListPage.tsx`
  - **Acceptance Criteria**:
    - Validate logo upload: Max 2MB, MIME types `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`.
    - Validate student CSV import: Max 5MB, MIME type `text/csv` or `.csv` extension.
    - Display explicit toast error on violation prior to network request.
  - **Test Requirements**: Upload test with oversized file; verify upload is aborted and error toast displayed.
  - **Complexity**: Low (1 hour)

- [ ] **TASK-PERF-03**: **Standardize TanStack Query Cache Configuration**
  - **Files**: `frontend/src/App.tsx`
  - **Acceptance Criteria**:
    - Configure default query client options: `staleTime: 1000 * 60 * 5` (5 minutes) for semi-static data.
    - Configure `refetchOnWindowFocus: false` to avoid aggressive re-querying during ordinary tab switches.
  - **Test Requirements**: Inspect query cache behavior during tab switching.
  - **Complexity**: Low (30 mins)

---

### Stage 5: Code Hygiene & Documentation (P3 / P4)
- [ ] **TASK-CODE-01**: **Clean 116 Linter Warnings (`oxlint`)**
  - **Files**: 43 files across `frontend/src/`
  - **Acceptance Criteria**:
    - Remove unused Lucide React icon imports.
    - Remove unused local variables and parameters.
    - Run `npm run lint` and verify clean exit: `0 errors, 0 warnings`.
  - **Test Requirements**: Execute `npm run lint` with 0 warnings.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-DOC-01**: **Create Environment Variable Schema & Validation**
  - **Files**: New `frontend/src/config/env.ts`, `.env.example`
  - **Acceptance Criteria**:
    - Define Zod schema validating `VITE_API_URL` format and fallback logic.
    - Prevent silent runtime `undefined` configuration errors.
  - **Test Requirements**: Test configuration loading with valid and invalid environment variables.
  - **Complexity**: Low (1 hour)

---

## 7. Recommended Implementation Roadmap

| Stage | Focus Area | Primary Deliverables | Estimated Effort |
| :--- | :--- | :--- | :--- |
| **Stage 0** | Critical Security & Authorization | Bursar role routing, self-account deletion guard, API URL sanitizer, security headers | 5 - 6 hours |
| **Stage 1** | Architectural Resilience & QA | Top-level & layout Error Boundaries, Vitest + React Testing Library infrastructure | 4 - 5 hours |
| **Stage 2** | Data Integrity & Correctness | Dynamic gradebook assessment scheme, audit search sync, debounced inputs, payment validation | 8 - 10 hours |
| **Stage 3** | Accessibility (WCAG 2.2 AA) | Accessible modals with focus trapping, form ARIA linkage, keyboard focus rings | 5 - 6 hours |
| **Stage 4** | Performance & Asset Handling | Code splitting (`React.lazy`), file upload client guards, TanStack cache rules | 3 - 4 hours |
| **Stage 5** | Code Hygiene & Final Polish | Clean 116 linter warnings, validate environment configuration | 3 hours |

---

## 8. Verification Results Table

| Tool / Command | Target / Scope | Exit Code / Result | Key Findings & Observations | Limits / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `npm run lint` (`oxlint`) | `frontend/` (43 files) | Code 0 (Passed with warnings) | **0 errors, 116 warnings**. Accumulation of unused icon imports (`Download`, `Filter`, etc.) and unused handler variables. | Fast AST linter; does not perform semantic type-aware linting. |
| `npx tsc --noEmit` | `frontend/src/` | Code 0 (Clean) | Zero TypeScript compiler errors. Type definitions and syntax align with TS 5.6. | Assumes types are conceptually correct; does not verify runtime schema mismatches. |
| `npm audit` | `frontend/package.json` | Code 1 (Network error) | Local proxy/corporate certificate validation failure (`unable to verify the first certificate`). | Cannot contact public npm advisory registry in current sandboxed proxy environment. |
| Manual Code Audit: Security | `AuthContext.tsx`, `api.ts`, `AppRoutes.tsx` | Issues Identified | Identified `BURSAR` role omission (`isAdmin`), token leakage on absolute URLs, and self-membership deletion. | Static code inspection. |
| Manual Code Audit: Data Integrity | `ScoreEntrySpreadsheetPage.tsx` | Issues Identified | Identified hardcoded `ca1` (15), `ca2` (15), and `exam` (70) input bounds and fields. | Static code inspection. |
| Manual Code Audit: Accessibility | `Modal.tsx`, `Input.tsx`, `Button.tsx` | Issues Identified | Identified absence of `role="dialog"`, missing `aria-invalid`, missing `aria-describedby`, missing focus rings. | Static code inspection against WCAG 2.2 AA criteria. |

---

## 9. Open Questions and External Dependencies

1. **Backend Dynamic Assessment API**: What is the exact API endpoint and JSON schema for retrieving a school's configured assessment components (names, codes, max scores, weights) for a given class and subject? Does `/api/v1/academics/assessment-components/` exist, or should it be derived from the school profile?
2. **Bursar Navigation Scope**: When a Bursar logs in, should they access `/admin/finance/invoices` directly, or is a dedicated Bursar Dashboard planned for financial KPIs?
3. **Authentication Token Storage Architecture**: Is there an architectural roadmap to transition from `localStorage` bearer tokens to backend-managed HttpOnly `SameSite=Lax` session cookies?
4. **Self-Deletion Backend Guard**: Does the Django backend currently enforce a check preventing a superuser/admin from deleting their own membership, or is it solely dependent on client-side protection?

---

## 10. Production-Readiness Decision

### Final Verdict: **NOT READY FOR PRODUCTION**

### Rationale:
The application cannot be certified for production deployment due to blocking P0 and P1 vulnerabilities:
1. **Critical Role Lockout (P0)**: Bursars cannot access their core financial workflows under current routing and layout rules.
2. **Administrative Lockout Risk (P1)**: The lack of self-membership protection allows administrators to permanently orphan their tenant.
3. **Academic Data Corruption (P1)**: The hardcoded 15/15/70 grading scheme directly breaks schools using alternative academic structures.
4. **Complete Lack of Resilience (P1)**: Total absence of React Error Boundaries means any unexpected runtime exception crashes into a blank white screen.
5. **Zero Test Coverage (P1)**: There is no safety net or automated verification for financial or academic operations.

### Conditions for Re-Evaluation:
Production certification can be granted once **Stage 0** (Security & Auth Hardening), **Stage 1** (Resilience & QA Infrastructure), and **Stage 2** (Data Integrity & Business Logic) are fully implemented and verified.
