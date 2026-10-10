import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/common/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { AdminDashboardPage } from '@/features/dashboard/AdminDashboardPage';
import { TeacherDashboardPage } from '@/features/dashboard/TeacherDashboardPage';
import { StudentListPage } from '@/features/students/StudentListPage';
import { StudentDetailPage } from '@/features/students/StudentDetailPage';
import { AcademicSessionsPage } from '@/features/academics/AcademicSessionsPage';
import { ClassesAndArmsPage } from '@/features/academics/ClassesAndArmsPage';
import { SubjectsPage } from '@/features/academics/SubjectsPage';
import { TeachersPage } from '@/features/academics/TeachersPage';
import { AttendanceRegisterPage } from '@/features/attendance/AttendanceRegisterPage';
import { AssessmentSchemesPage } from '@/features/results/AssessmentSchemesPage';
import { ScoreEntrySpreadsheetPage } from '@/features/results/ScoreEntrySpreadsheetPage';
import { ResultReviewPage } from '@/features/results/ResultReviewPage';
import { ReportCardsPage } from '@/features/results/ReportCardsPage';
import { InvoicesListPage } from '@/features/finance/InvoicesListPage';
import { FeeStructuresPage } from '@/features/finance/FeeStructuresPage';
import { ExpensesPage } from '@/features/finance/ExpensesPage';
import { AuditLogsPage } from '@/features/audit/AuditLogsPage';
import { UserAccountsPage } from '@/features/accounts/UserAccountsPage';
import { SchoolSettingsPage } from '@/features/settings/SchoolSettingsPage';
import { UserProfilePage } from '@/features/settings/UserProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'ADMIN' | 'TEACHER' }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading, isAdmin, isTeacher } = useAuth();

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

  if (requiredRole === 'ADMIN' && !isAdmin) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isLoading, isAdmin } = useAuth();

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

  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/teacher/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

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
        <Route
          path="admin/finance/invoices"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <InvoicesListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/finance/fee-structures"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <FeeStructuresPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/finance/expenses"
          element={
            <ProtectedRoute requiredRole="ADMIN">
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
  );
};
