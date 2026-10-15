# Task 1: Fix BURSAR Role Access & Navigation Routing

**Assignee**: [@derojuu](https://github.com/derojuu) (@derojuu)  
**Target Repository**: `davistolu/provident-sms` (Frontend: `frontend/`)  
**Priority**: **P0 (Critical Blocker)**  
**Issue Type**: Bug Fix / Role-Based Access Control (RBAC)  
**Associated Audit Report**: [`AUDIT_REPORT.md`](./AUDIT_REPORT.md)  
**Associated Checklist**: [`TODO.md`](./TODO.md) (TASK-SEC-01)  

---

## 📌 Context & Problem Statement

Wagwan @derojuu 😮‍💨😌,

Work choke!! 🙂‍↔️ we are tackling our frontend production-readiness roadmap sequentially, **one task at a time**. 

In the application today, the role-based access control and navigation logic completely breaks for users with the **`BURSAR`** role:

1. **Role derivation bug** in [`frontend/src/context/AuthContext.tsx`](./frontend/src/context/AuthContext.tsx):
   `activeMembership?.role === 'BURSAR'` is not recognized. `isAdmin` evaluates to `false` and `isTeacher` evaluates to `false`.
2. **Broken login redirect** in [`frontend/src/routes/AppRoutes.tsx`](./frontend/src/routes/AppRoutes.tsx):
   Upon logging in, `RootRedirect` checks `isAdmin ? "/admin/dashboard" : "/teacher/dashboard"`. Because `isAdmin` is `false`, Bursars are forcibly redirected to the Teacher dashboard (`/teacher/dashboard`), where they have no assigned classes or subjects.
3. **Route lockout** in [`frontend/src/routes/AppRoutes.tsx`](./frontend/src/routes/AppRoutes.tsx):
   Finance routes (`/admin/finance/invoices`, `/admin/finance/expenses`, `/admin/finance/fee-structures`) are protected with `<ProtectedRoute requiredRole="ADMIN">`. Any Bursar attempting to navigate to finance pages is kicked back to `/teacher/dashboard`.
4. **Sidebar mismatch** in [`frontend/src/components/common/Sidebar.tsx`](./frontend/src/components/common/Sidebar.tsx):
   `const navSections = isAdmin ? adminSections : teacherSections;` causes Bursars to see the Teacher sidebar (Teaching Workspace, Examinations) and completely hides Finance & Billing!

We need you to implement this single task first so Bursars have full access to their finance workspace.

---

## 🛠 Required Changes (Step-by-Step)

### 1. Update `frontend/src/context/AuthContext.tsx`

#### (a) Update `AuthContextType` interface:
Expose `isBursar` and `canAccessFinance`:
```typescript
interface AuthContextType {
  user: User | null;
  activeMembership: SchoolMembership | null;
  memberships: SchoolMembership[];
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isBursar: boolean;            // <-- ADD THIS
  canAccessFinance: boolean;     // <-- ADD THIS (isAdmin || isBursar)
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchSchool: (schoolId: string) => void;
  setAuthData: (token: string, user: User, memberships: SchoolMembership[], activeMembership: SchoolMembership) => void;
  refreshProfile: () => Promise<void>;
}
```

#### (b) Update role derivations in `AuthProvider`:
Around line 135-137:
```typescript
const isAdmin = activeMembership?.role === 'ADMIN' || activeMembership?.role === 'SUPER_ADMIN' || activeMembership?.role === 'PRINCIPAL' || (user?.is_staff ?? false);
const isTeacher = activeMembership?.role === 'TEACHER';
const isBursar = activeMembership?.role === 'BURSAR';
const canAccessFinance = isAdmin || isBursar;
```
Ensure `isBursar` and `canAccessFinance` are passed into the `AuthContext.Provider` `value` object.

---

### 2. Update `frontend/src/routes/AppRoutes.tsx`

#### (a) Update `ProtectedRoute` to support multiple allowed roles:
Currently lines 28-51:
```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'TEACHER' | 'BURSAR';
  allowedRoles?: Array<'ADMIN' | 'TEACHER' | 'BURSAR'>;
}
```
Update authorization check inside `ProtectedRoute`:
```tsx
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
}) => {
  const { user, isLoading, isAdmin, isTeacher, isBursar, canAccessFinance } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle allowedRoles array if provided
  if (allowedRoles) {
    const hasRole =
      (allowedRoles.includes('ADMIN') && isAdmin) ||
      (allowedRoles.includes('TEACHER') && isTeacher) ||
      (allowedRoles.includes('BURSAR') && isBursar);

    if (!hasRole) {
      if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
      if (isBursar) return <Navigate to="/admin/finance/invoices" replace />;
      return <Navigate to="/teacher/dashboard" replace />;
    }
  }

  // Backward-compatible requiredRole check
  if (requiredRole === 'ADMIN' && !isAdmin) {
    if (isBursar) return <Navigate to="/admin/finance/invoices" replace />;
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (requiredRole === 'TEACHER' && !isTeacher) {
    if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
    if (isBursar) return <Navigate to="/admin/finance/invoices" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

#### (b) Update `RootRedirect`:
Lines 53-69:
```tsx
const RootRedirect: React.FC = () => {
  const { user, isLoading, isAdmin, isBursar } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isBursar) {
    return <Navigate to="/admin/finance/invoices" replace />;
  }

  return <Navigate to="/teacher/dashboard" replace />;
};
```

#### (c) Grant Bursars access to Finance routes:
Update the finance routes (around lines 186-215):
```tsx
{/* Finance Routes accessible to both Admins and Bursars */}
<Route
  path="admin/finance/invoices"
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'BURSAR']}>
      <InvoicesListPage />
    </ProtectedRoute>
  }
/>
<Route
  path="admin/finance/fee-structures"
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'BURSAR']}>
      <FeeStructurePage />
    </ProtectedRoute>
  }
/>
<Route
  path="admin/finance/expenses"
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'BURSAR']}>
      <ExpensesPage />
    </ProtectedRoute>
  }
/>
```

---

### 3. Update `frontend/src/components/common/Sidebar.tsx`

#### (a) Define dedicated navigation for Bursars:
Around line 68, add `bursarSections`:
```typescript
const bursarSections: NavSection[] = [
  {
    title: 'Finance & Billing',
    items: [
      { title: 'Fee Invoices', to: '/admin/finance/invoices', icon: CreditCard },
      { title: 'Fee Tariffs', to: '/admin/finance/fee-structures', icon: BookMarked },
      { title: 'Expenses Ledger', to: '/admin/finance/expenses', icon: DollarSign },
    ],
  },
];
```

#### (b) Update `navSections` selection:
Around line 88:
```typescript
const { user, activeMembership, memberships, isAdmin, isTeacher, isBursar, logout } = useAuth();

const navSections = isAdmin
  ? adminSections
  : isBursar
  ? bursarSections
  : teacherSections;
```

---

## ✅ Acceptance Criteria & Verification

Before submitting the PR, verify the following:

- [ ] **TypeScript Check**: `npx tsc --noEmit` runs from `frontend/` and completes with **0 errors**.
- [ ] **Linter Check**: `npm run lint` completes with **0 errors**.
- [ ] **Bursar Login Flow**:
  - Log in with a user whose `activeMembership.role === 'BURSAR'`.
  - The browser automatically navigates to `/admin/finance/invoices`.
- [ ] **Bursar Sidebar**:
  - The sidebar displays only "Finance & Billing" (`Fee Invoices`, `Fee Tariffs`, `Expenses Ledger`).
  - Academic Management, Assessment, and User Settings links are **not displayed**.
- [ ] **Route Protection**:
  - Navigating manually to `/admin/users` or `/admin/settings` as a Bursar redirects gracefully without crashing.
  - Navigating to `/admin/finance/invoices` works smoothly without being kicked to `/teacher/dashboard`.
- [ ] **Admin & Teacher Preserved**:
  - Admin login still routes to `/admin/dashboard` and displays all admin sections.
  - Teacher login still routes to `/teacher/dashboard` and displays teacher sections.

---

## 🚀 Branch & PR Instructions

1. **Branch Name**: `fix/task-1-bursar-role-access`
2. **Commit Message**: `fix(auth): enable BURSAR role routing, finance permissions, and sidebar navigation`
3. **PR Title**: `[TASK-1] Fix BURSAR role access and finance navigation routing`
4. **Description**: Mention that this resolves **TASK-SEC-01** from `TODO.md` and `AUDIT_REPORT.md`.

Once this PR is merged and verified, we will proceed to **Task 2** (Preventing Self-Account Deletion). Thanks [@derojuu](https://github.com/derojuu)!
