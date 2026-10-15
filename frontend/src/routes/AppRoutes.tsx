import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/common/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterOnboardingPage } from '@/features/auth/RegisterOnboardingPage';

const AdminDashboardPage = lazy(() => import('@/features/dashboard/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const TeacherDashboardPage = lazy(() => import('@/features/dashboard/TeacherDashboardPage').then(m => ({ default: m.TeacherDashboardPage })));
const StudentListPage = lazy(() => import('@/features/students/StudentListPage').then(m => ({ default: m.StudentListPage })));
const StudentDetailPage = lazy(() => import('@/features/students/StudentDetailPage').then(m => ({ default: m.StudentDetailPage })));
const AcademicSessionsPage = lazy(() => import('@/features/academics/AcademicSessionsPage').then(m => ({ default: m.AcademicSessionsPage })));
const ClassesAndArmsPage = lazy(() => import('@/features/academics/ClassesAndArmsPage').then(m => ({ default: m.ClassesAndArmsPage })));
const SubjectsPage = lazy(() => import('@/features/academics/SubjectsPage').then(m => ({ default: m.SubjectsPage })));
const TeachersPage = lazy(() => import('@/features/academics/TeachersPage').then(m => ({ default: m.TeachersPage })));
const AttendanceRegisterPage = lazy(() => import('@/features/attendance/AttendanceRegisterPage').then(m => ({ default: m.AttendanceRegisterPage })));
const AssessmentSchemesPage = lazy(() => import('@/features/results/AssessmentSchemesPage').then(m => ({ default: m.AssessmentSchemesPage })));
const ScoreEntrySpreadsheetPage = lazy(() => import('@/features/results/ScoreEntrySpreadsheetPage').then(m => ({ default: m.ScoreEntrySpreadsheetPage })));
const ResultReviewPage = lazy(() => import('@/features/results/ResultReviewPage').then(m => ({ default: m.ResultReviewPage })));
const ReportCardsPage = lazy(() => import('@/features/results/ReportCardsPage').then(m => ({ default: m.ReportCardsPage })));
const InvoicesListPage = lazy(() => import('@/features/finance/InvoicesListPage').then(m => ({ default: m.InvoicesListPage })));
const FeeStructuresPage = lazy(() => import('@/features/finance/FeeStructuresPage').then(m => ({ default: m.FeeStructuresPage })));
const ExpensesPage = lazy(() => import('@/features/finance/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const AuditLogsPage = lazy(() => import('@/features/audit/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const UserAccountsPage = lazy(() => import('@/features/accounts/UserAccountsPage').then(m => ({ default: m.UserAccountsPage })));
const SchoolSettingsPage = lazy(() => import('@/features/settings/SchoolSettingsPage').then(m => ({ default: m.SchoolSettingsPage })));
const UserProfilePage = lazy(() => import('@/features/settings/UserProfilePage').then(m => ({ default: m.UserProfilePage })));

const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center py-16 text-xs text-[#52606d]">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-[#064e3b]/20 border-t-[#064e3b] animate-spin" />
      Loading page...
    </div>
  </div>
);

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'TEACHER';
  allowedRoles?: Array<'ADMIN' | 'TEACHER' | 'BURSAR'>;
}> = ({ children, requiredRole, allowedRoles }) => {
  const { user, isLoading, isAdmin, isTeacher, isBursar } = useAuth();

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

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOnboardingPage />} />
      <Route path="/onboarding" element={<RegisterOnboardingPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />

        {/* Administrator Routes */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/students"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <StudentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/students/:id"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/teachers"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <TeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <UserAccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/classes"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ClassesAndArmsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/subjects"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <SubjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/academic-sessions"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AcademicSessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AttendanceRegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/assessments"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AssessmentSchemesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/results/review"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ResultReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/results/report-cards"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ReportCardsPage />
            </ProtectedRoute>
          }
        />
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
              <FeeStructuresPage />
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
        <Route
          path="admin/settings"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <SchoolSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit-logs"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        {/* User Profile Route (Common) */}
        <Route
          path="settings/profile"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route path="teacher/dashboard" element={<TeacherDashboardPage />} />
        <Route path="teacher/classes" element={<StudentListPage />} />
        <Route path="teacher/students/:id" element={<StudentDetailPage />} />
        <Route path="teacher/attendance" element={<AttendanceRegisterPage />} />
        <Route path="teacher/assessments/scores" element={<ScoreEntrySpreadsheetPage />} />
        <Route path="teacher/submissions" element={<ResultReviewPage />} />
        <Route path="teacher/report-cards" element={<ReportCardsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};
