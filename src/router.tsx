import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import { LoginForm } from "./features/auth/LoginForm";
import { OpFormPage } from "./features/public/opform/OpFormPage";
import { OpResultPage } from "./features/public/opform/OpResultPage";
import { AssessmentPage } from "./features/public/assessmentform/AssessmentPage";
import { AssessmentDashboard } from "./features/assessments/AssessmentDashboard";
import { AssessmentIndex } from "./features/assessments/AssessmentIndex";
import { AssessmentEdit } from "./features/assessments/AssessmentEdit";
import { AssessmentResultPage } from "./features/public/assessmentform/AssessmentResultPage";
import { AssessmentSuccessPage } from "./features/public/assessmentform/AssessmentSuccessPage";
import { StaffDashboardPage } from "./features/staff/StaffDashboardPage";
import { StaffRequestsPage } from "./features/staff/StaffRequestsPage";
import { StaffRequestDetailPage } from "./features/staff/StaffRequestDetailPage";
import { StaffActivityLogPage } from "./features/staff/StaffActivityLogPage";
import { CashierRequestsPage } from "./features/cashier/CashierRequestsPage";
import { CashierRequestDetailPage } from "./features/cashier/CashierRequestDetailPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { AdminUsersPage } from "./features/admin/AdminUsersPage";
import { AdminActivityLogPage } from "./features/admin/AdminActivityLogPage";
import { MasterDataPage } from "./features/masterdata/MasterDataPage";
import { LedgerPage } from "./features/ledger/LedgerPage";
import { LedgerBalancePage } from "./features/ledger/LedgerBalancePage";
import { PrintSelectPage } from "./features/ledger/PrintSelectPage";
import { ProfilePage } from "./features/settings/ProfilePage";
import { SecurityPage } from "./features/settings/SecurityPage";
import { AppearancePage } from "./features/settings/AppearancePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { NotFoundPage } from "./routes/NotFoundPage";
import { AppShellLayout } from "./layouts/AppShellLayout";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/login", element: <LoginForm /> },
  { path: "/opform", element: <OpFormPage /> },
  { path: "/opform/result", element: <OpResultPage /> },
  { path: "/public/success/:reference", element: <OpResultPage /> },
  { path: "/assessment", element: <AssessmentPage /> },
  { path: "/assessment/result", element: <AssessmentResultPage /> },
  { path: "/assessment/success", element: <AssessmentSuccessPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShellLayout />,
        children: [
          { path: "/app", element: <App /> },

          // User Settings (all authenticated users)
          {
            path: "/settings",
            element: <Navigate to="/settings/profile" replace />,
          },
          { path: "/settings/profile", element: <ProfilePage /> },
          { path: "/settings/security", element: <SecurityPage /> },
          { path: "/settings/appearance", element: <AppearancePage /> },

          // Staff & Admin Ledgers
          {
            element: <RoleRoute roles={["staff", "admin"]} />,
            children: [
              {
                path: "/graduate-ledger",
                element: <LedgerPage ledger="graduate" />,
              },
              {
                path: "/graduate-ledger/print-select",
                element: <PrintSelectPage ledger="graduate" />,
              },
              { path: "/law-ledger", element: <LedgerPage ledger="law" /> },
              {
                path: "/law-ledger/print-select",
                element: <PrintSelectPage ledger="law" />,
              },
              {
                path: "/graduate-ledger/students/:studentId/balance",
                element: <LedgerBalancePage ledger="graduate" />,
              },
              {
                path: "/law-ledger/students/:studentId/balance",
                element: <LedgerBalancePage ledger="law" />,
              },
            ],
          },
          {
            element: <RoleRoute roles={["staff", "admin"]} />,
            children: [{ path: "/documents", element: <DocumentsPage /> }],
          },

          // Admin only
          {
            element: <RoleRoute roles={["admin"]} />,
            children: [
              { path: "/admin", element: <AdminDashboardPage /> },
              { path: "/admin/dashboard", element: <AdminDashboardPage /> },
              { path: "/admin/users", element: <AdminUsersPage /> },
              { path: "/admin/master-data", element: <MasterDataPage /> },
              {
                path: "/admin/activity-log",
                element: <AdminActivityLogPage />,
              },
            ],
          },

          // Staff & Admin Operations
          {
            element: <RoleRoute roles={["staff", "admin"]} />,
            children: [
              { path: "/staff", element: <StaffDashboardPage /> },
              {
                path: "/staff/staffdashboard",
                element: <StaffDashboardPage />,
              },
              { path: "/staff/requests", element: <StaffRequestsPage /> },
              {
                path: "/staff/requests/:id",
                element: <StaffRequestDetailPage />,
              },
              {
                path: "/staff/bank-accounts",
                element: <MasterDataPage initialResource="bank-accounts" />,
              },
              {
                path: "/staff/payment-options",
                element: <MasterDataPage initialResource="payment-options" />,
              },
              {
                path: "/staff/memberships",
                element: <MasterDataPage initialResource="memberships" />,
              },
              {
                path: "/staff/authorized-officials",
                element: (
                  <MasterDataPage initialResource="authorized-officials" />
                ),
              },
              {
                path: "/staff/uacs",
                element: <MasterDataPage initialResource="uacs" />,
              },
              {
                path: "/staff/courses",
                element: <MasterDataPage initialResource="courses" />,
              },
              // TODO move these into feature/assessment folder rather than at public
              {
                path: "/staff/assessments/dashboard",
                element: <AssessmentDashboard />,
              },
              { path: "/staff/assessments", element: <AssessmentIndex /> },
              {
                path: "/staff/assessments/:id/edit",
                element: <AssessmentEdit />,
              },
              {
                path: "/staff/activity-log",
                element: <StaffActivityLogPage />,
              },
            ],
          },

          // Cashier
          {
            element: <RoleRoute roles={["cashier"]} />,
            children: [
              { path: "/cashier", element: <App /> },
              { path: "/cashier/requests", element: <CashierRequestsPage /> },
              {
                path: "/cashier/requests/:id",
                element: <CashierRequestDetailPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
