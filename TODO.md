# Master Implementation TODO Checklist: Production Readiness

**Application**: Provident SMS  
**Audit Reference**: [`AUDIT_REPORT.md`](./AUDIT_REPORT.md)  
**Overall Status**: Pending Implementation  

---

## Progress Overview

| Stage | Focus Area | Tasks | Status |
| :--- | :--- | :---: | :---: |
| **Stage 0** | Critical Security & Authorization Hardening | 4 | Ready for Dev |
| **Stage 1** | Architectural Resilience & QA Infrastructure | 2 | Ready for Dev |
| **Stage 2** | Data Integrity & Academic Business Logic | 4 | Pending Stage 0-1 |
| **Stage 3** | Accessibility (WCAG 2.2 AA) & Form Standards | 3 | Pending |
| **Stage 4** | Performance & Code Splitting | 3 | Pending |
| **Stage 5** | Code Hygiene & Configuration Schemas | 2 | Pending |
| **Total** | | **18 Tasks** | **0% Completed** |

---

## Stage 0: Critical Security & Authorization Fixes (P0 / P1)

- [ ] **TASK-SEC-01**: **Fix BURSAR Role Access & Refactor Protected Route Guards**
  - **Assignee**: [@derojuu](https://github.com/derojuu) (@derojuu)
  - **Priority**: P0 (Critical)
  - **Files**:
    - `frontend/src/context/AuthContext.tsx`
    - `frontend/src/AppRoutes.tsx`
    - `frontend/src/components/common/Sidebar.tsx`
  - **Acceptance Criteria**:
    - [ ] `AuthContext` derives `isBursar = user?.role === 'BURSAR'`.
    - [ ] Bursar login routes to finance interface (`/admin/finance/invoices` or `/bursar/dashboard`) instead of `/teacher/dashboard`.
    - [ ] Sidebar navigation dynamically hides academic/user settings from Bursars while providing direct access to Invoices, Expenses, and Fee Structure.
    - [ ] Non-privileged users navigating directly to `/admin/users` or `/admin/settings` are redirected to an unauthorized notice.
  - **Test Requirements**: Unit test `AuthContext` role logic; verify navigation redirect matrix for `ADMIN`, `BURSAR`, and `TEACHER`.
  - **Complexity**: Medium (2-3 hours)

- [ ] **TASK-SEC-02**: **Prevent Self-Account Membership Deletion (Admin Lockout)**
  - **Priority**: P1 (High)
  - **Files**:
    - `frontend/src/features/accounts/UserAccountsPage.tsx`
  - **Acceptance Criteria**:
    - [ ] Compare `m.user.id` against currently logged-in user `user.id`.
    - [ ] When `m.user.id === user.id`, disable or hide the "Remove" button with tooltip: *"You cannot remove your own active administrator account."*
    - [ ] `handleDelete` function checks `if (selectedMember?.user.id === user?.id) return;` to guard against modified DOM execution.
  - **Test Requirements**: RTL test ensuring "Remove" button is disabled and non-clickable for acting admin.
  - **Complexity**: Low (1 hour)

- [ ] **TASK-SEC-03**: **Sanitize API Client URLs to Prevent Credential Exfiltration**
  - **Priority**: P1 (High)
  - **Files**:
    - `frontend/src/services/api.ts`
  - **Acceptance Criteria**:
    - [ ] `resolveUrl` validates origin if an absolute URL is supplied.
    - [ ] If `new URL(endpoint).origin !== new URL(API_BASE_URL).origin`, reject or strip `Authorization` and `X-School-ID` headers.
    - [ ] Prevent leakage of private tokens to third-party endpoints.
  - **Test Requirements**: Unit test `apiClient.get()` against relative URL, same-origin URL, and cross-origin URL.
  - **Complexity**: Low (1 hour)

- [ ] **TASK-SEC-04**: **Add Security Headers in Vercel Deployment Configuration**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/vercel.json`
  - **Acceptance Criteria**:
    - [ ] Add `headers` configuration block to `frontend/vercel.json`.
    - [ ] Configure `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
  - **Test Requirements**: Validate JSON syntax; verify headers in preview deployment.
  - **Complexity**: Low (30 mins)

---

## Stage 1: Architectural Resilience & Error Boundaries (P1)

- [ ] **TASK-ARCH-01**: **Implement Top-Level and Route-Level Error Boundaries**
  - **Priority**: P1 (High)
  - **Files**:
    - `frontend/src/components/common/ErrorBoundary.tsx` *(new)*
    - `frontend/src/App.tsx`
    - `frontend/src/components/layout/AdminLayout.tsx`
    - `frontend/src/components/layout/TeacherLayout.tsx`
  - **Acceptance Criteria**:
    - [ ] Create reusable `ErrorBoundary` class component with branded fallback UI (error message, error ID, and action to reload or navigate home).
    - [ ] Wrap `<AppRoutes />` in root error boundary.
    - [ ] Wrap layout `<Outlet />` tags in layout-level boundaries so a single page crash preserves header and sidebar navigation.
  - **Test Requirements**: Vitest test simulating unhandled component crash and asserting graceful error boundary rendering.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-ARCH-02**: **Configure Automated Testing Infrastructure (Vitest + RTL)**
  - **Priority**: P1 (High)
  - **Files**:
    - `frontend/package.json`
    - `frontend/vite.config.ts`
    - `frontend/src/test/setup.ts` *(new)*
  - **Acceptance Criteria**:
    - [ ] Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
    - [ ] Add npm scripts: `"test": "vitest run"` and `"test:watch": "vitest"`.
    - [ ] Configure test setup file mocking `localStorage`, `window.matchMedia`, and `ResizeObserver`.
    - [ ] Add initial smoke tests for `ErrorBoundary`, `AuthContext`, and `apiClient`.
  - **Test Requirements**: Execute `npm test` from CLI; verify test suite runs and passes.
  - **Complexity**: Medium (2-3 hours)

---

## Stage 2: Data Integrity & Academic Business Logic (P1 / P2)

- [ ] **TASK-DATA-01**: **Refactor Score Entry Spreadsheet to Support Dynamic Assessment Schemes**
  - **Priority**: P1 (High)
  - **Files**:
    - `frontend/src/features/results/ScoreEntrySpreadsheetPage.tsx`
  - **Acceptance Criteria**:
    - [ ] Replace hardcoded `ca1` (15), `ca2` (15), `exam` (70) columns with dynamic assessment components fetched from backend API.
    - [ ] Dynamically render column headers and input fields based on returned assessment entities.
    - [ ] Enforce `min="0"` and `max={component.max_score}` dynamically based on the component definition.
    - [ ] Compute cumulative totals and grade letters against active tenant grade configuration.
  - **Test Requirements**: Component tests verifying spreadsheet renders 2-component, 3-component, and custom weighting configurations.
  - **Complexity**: High (4-5 hours)

- [ ] **TASK-DATA-02**: **Implement Server-Side Search & Filtering in Audit Logs**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/features/accounts/AuditLogsPage.tsx`
  - **Acceptance Criteria**:
    - [ ] Remove client-side filtering on the 20 items of page 1.
    - [ ] Pass `action`, `user`, and `date` filter parameters to backend API query string.
    - [ ] Reset pagination page to 1 whenever a filter parameter is updated.
  - **Test Requirements**: Verify API queries include active filter parameters.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-DATA-03**: **Implement Debounced Search Hooks on High-Traffic Tables**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/hooks/useDebounce.ts` *(new)*
    - `frontend/src/features/students/StudentListPage.tsx`
    - `frontend/src/features/accounts/UserAccountsPage.tsx`
  - **Acceptance Criteria**:
    - [ ] Create `useDebounce<T>(value: T, delay: number): T` custom hook.
    - [ ] Debounce student list search input with 300ms delay.
    - [ ] Debounce user accounts search input with 300ms delay.
    - [ ] Prevent duplicate simultaneous API dispatches and out-of-order race conditions.
  - **Test Requirements**: Unit test `useDebounce` hook with fake timers.
  - **Complexity**: Low (1-2 hours)

- [ ] **TASK-DATA-04**: **Harden Financial Payment Amount Validation**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/features/finance/InvoicesListPage.tsx`
  - **Acceptance Criteria**:
    - [ ] Sanitize input to reject `NaN`, negative numbers, and values exceeding remaining balance.
    - [ ] Set HTML attributes `min="0.01"` and `step="0.01"` on amount input.
    - [ ] Provide explicit inline validation error message when amount is invalid.
  - **Test Requirements**: Test payment form rejection of `0`, negative amounts, and non-numeric strings.
  - **Complexity**: Low (1 hour)

---

## Stage 3: Accessibility (WCAG 2.2 AA) & Form Standards (P2)

- [ ] **TASK-A11Y-01**: **Harden Modal & Dialog Accessibility and Focus Management**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/components/common/Modal.tsx`
    - `frontend/src/components/common/ConfirmDialog.tsx`
  - **Acceptance Criteria**:
    - [ ] Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` attributes.
    - [ ] Trap keyboard focus inside modal while open (Tab and Shift+Tab wrap around).
    - [ ] Close modal on Escape key press.
    - [ ] Restore focus to trigger element upon modal closure.
    - [ ] Add `aria-label="Close modal"` to close icon button.
  - **Test Requirements**: RTL test asserting keyboard navigation containment and Escape key event handling.
  - **Complexity**: Medium (2-3 hours)

- [ ] **TASK-A11Y-02**: **Form Input ARIA Accessibility Linkage**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/components/common/Input.tsx`
    - `frontend/src/components/common/Select.tsx`
  - **Acceptance Criteria**:
    - [ ] Link error and helper text elements to inputs using `aria-describedby`.
    - [ ] Set `aria-invalid={Boolean(error)}` on inputs when error is present.
    - [ ] Ensure unique, deterministically generated `id` attributes associating `<label>` and `<input>`.
  - **Test Requirements**: Verify DOM attributes with RTL when `error` prop is supplied.
  - **Complexity**: Low (1-2 hours)

- [ ] **TASK-A11Y-03**: **Ensure Keyboard Focus Rings on Interactive Controls**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/components/common/Button.tsx`
    - `frontend/src/index.css`
  - **Acceptance Criteria**:
    - [ ] Apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` to all button variants.
    - [ ] Ensure visible focus indicators on all links, selects, and checkboxes.
  - **Test Requirements**: Visual keyboard tab navigation audit.
  - **Complexity**: Low (1 hour)

---

## Stage 4: Performance & Code Splitting (P2 / P3)

- [ ] **TASK-PERF-01**: **Introduce Route-Level Code Splitting (`React.lazy`)**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/AppRoutes.tsx`
    - `frontend/src/components/common/PageSkeleton.tsx` *(new)*
  - **Acceptance Criteria**:
    - [ ] Convert all 22 page imports to `React.lazy(() => import(...))`.
    - [ ] Wrap route element outputs in `<Suspense fallback={<PageSkeleton />}>`.
    - [ ] Verify Vite build chunk size drops from >955 kB monolithic bundle to <250 kB initial bundle.
  - **Test Requirements**: Execute `npm run build` and inspect bundle chunk sizes.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-PERF-02**: **Add File Size and MIME Type Validation to Upload Controls**
  - **Priority**: P2 (Medium)
  - **Files**:
    - `frontend/src/features/settings/SchoolSettingsPage.tsx`
    - `frontend/src/features/students/StudentListPage.tsx`
  - **Acceptance Criteria**:
    - [ ] Validate school logo: Max 2MB, allowed types `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`.
    - [ ] Validate student CSV upload: Max 5MB, allowed type `text/csv` / `.csv`.
    - [ ] Reject invalid files before network request with descriptive toast notification.
  - **Test Requirements**: Test oversized file upload rejection.
  - **Complexity**: Low (1 hour)

- [ ] **TASK-PERF-03**: **Standardize TanStack Query Cache Configuration**
  - **Priority**: P3 (Low)
  - **Files**:
    - `frontend/src/App.tsx`
  - **Acceptance Criteria**:
    - [ ] Set `defaultOptions.queries.staleTime = 5 * 60 * 1000` (5 minutes) for semi-static data.
    - [ ] Disable `refetchOnWindowFocus: false` to stop aggressive refetches during normal tab switching.
  - **Test Requirements**: Verify network tab during browser focus changes.
  - **Complexity**: Low (30 mins)

---

## Stage 5: Code Hygiene & Configuration (P3 / P4)

- [ ] **TASK-CODE-01**: **Clean 116 Linter Warnings (`oxlint`)**
  - **Priority**: P3 (Low)
  - **Files**: 43 files across `frontend/src/`
  - **Acceptance Criteria**:
    - [ ] Remove unused Lucide React icon imports.
    - [ ] Remove unused local variables and parameters.
    - [ ] Execute `npm run lint` with 0 warnings.
  - **Test Requirements**: Run `npm run lint` and verify clean exit code 0.
  - **Complexity**: Medium (2 hours)

- [ ] **TASK-DOC-01**: **Create Environment Variable Schema & Validation**
  - **Priority**: P4 (Low)
  - **Files**:
    - `frontend/src/config/env.ts` *(new)*
    - `frontend/.env.example`
  - **Acceptance Criteria**:
    - [ ] Define Zod schema validating `VITE_API_URL` format.
    - [ ] Fail fast on startup with clear error message if critical environment variables are invalid.
  - **Test Requirements**: Test configuration loading with valid and invalid values.
  - **Complexity**: Low (1 hour)
