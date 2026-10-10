# Providence SMS - Frontend Application

The frontend of Providence SMS is built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. It follows the **Modern Classical Academy** design system.

---

## Tech Stack & Libraries

- **Framework**: React 19 + TypeScript (Strict Mode)
- **Bundler & Dev Server**: Vite 5
- **Styling & Design System**: Tailwind CSS v4 (Modern Classical Academy Palette)
- **State & Server Cache**: TanStack React Query v5
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Executive KPI & Enrollment distribution charts)
- **Routing**: React Router DOM v6

---

## Directory Structure

```
frontend/src/
├── components/
│   ├── common/             # Reusable UI primitives (Button, Input, Badge, DataTable, Modal, ConfirmDialog, ToastContainer, StatCard)
│   └── layout/             # AppLayout, Navbar, Sidebar, PageHeader
├── context/
│   ├── AuthContext.tsx     # Authentication state, active school switcher, token storage
│   └── ToastContext.tsx    # Zero-dependency deduplicating toast system (success, error, warning, info, loading, promise)
├── features/
│   ├── auth/               # LoginPage, RegisterOnboardingPage (multi-step wizard)
│   ├── dashboard/          # AdminDashboardPage, TeacherDashboardPage
│   ├── academics/          # ClassesAndArmsPage, SubjectsPage, TeachersPage, AcademicSessionsPage
│   ├── students/           # StudentListPage, StudentDetailPage
│   ├── attendance/         # AttendanceRegisterPage
│   ├── results/            # ScoreEntrySpreadsheetPage, ResultReviewPage, ReportCardsPage, AssessmentSchemesPage
│   ├── finance/            # InvoicesListPage, FeeStructuresPage, ExpensesPage
│   ├── accounts/           # UserAccountsPage (staff RBAC)
│   ├── settings/           # SchoolSettingsPage (logo, branding, prefixes), UserProfilePage
│   └── audit/              # AuditLogsPage (event filtering & JSON inspector)
├── services/
│   ├── api.ts              # Fetch client with tenant header injection & download handlers
│   └── errorService.ts     # Normalized DRF validation and HTTP error parser
├── types/                  # TypeScript domain interfaces
├── App.tsx                 # Root router & query client setup
└── main.tsx                # Application mounting
```

---

## Key Frontend Features

### 1. Modern Classical Academy Design System
- Custom palette featuring deep emerald accents (`#064e3b`), warm alabaster backgrounds (`#fbfbfa`), and crisp typography.
- Standardized badge system (evergreen, gold, success, danger, neutral).
- Clean interactive skeletons and responsive cards.

### 2. Normalized Error Handling & Deduplicating Toast System
- Automatic parsing of nested DRF error dictionaries into readable user summaries.
- Dedicated toast notifications (`toast.success`, `toast.error`, `toast.warning`, `toast.info`, `toast.loading`, `toast.promise`).
- Built-in **2000ms deduplication window** to eliminate notification spam during query refetches.

### 3. Resilient UI State & Non-Destructive Forms
- **Data Tables (`DataTable.tsx`)**: Skeletons during data loading, informative error states with retry buttons on failure, and clean empty placeholders.
- **Action Buttons (`Button.tsx`)**: Automatic `loadingText`, `aria-busy`, and disabled states during mutations to eliminate double submissions.
- **Form State Preservation**: User input is preserved across validation errors for rapid, frictionless correction.

---

## Available Scripts

```bash
# Start local development server on http://localhost:3000
npm run dev

# Run TypeScript typecheck and production build
npm run build

# Preview production build locally
npm run preview
```
