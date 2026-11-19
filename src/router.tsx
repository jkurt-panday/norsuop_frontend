import { createBrowserRouter } from "react-router";
import App from "./App";
import { LoginForm } from "./features/auth/LoginForm";
import { OpFormPage } from "./features/public/opform/OpFormPage";
import { OpResultPage } from "./features/public/opform/OpResultPage";
import { AssessmentPage } from "./features/public/assessment/AssessmentPage";
import { AssessmentDashboard } from "./features/public/assessment/AssessmentDashboard";
import { AssessmentIndex } from "./features/public/assessment/AssessmentIndex";
import { AssessmentEdit } from "./features/public/assessment/AssessmentEdit";
import { AssessmentResultPage } from "./features/public/assessment/AssessmentResultPage";
import { AssessmentSuccessPage } from "./features/public/assessment/AssessmentSuccessPage";
import { StaffRequestsPage } from "./features/staff/StaffRequestsPage";
import { StaffRequestDetailPage } from "./features/staff/StaffRequestDetailPage";
import { CashierRequestsPage } from "./features/cashier/CashierRequestsPage";
import { CashierRequestDetailPage } from "./features/cashier/CashierRequestDetailPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { AdminUsersPage } from "./features/admin/AdminUsersPage";
import { AdminActivityLogPage } from "./features/admin/AdminActivityLogPage";
import { MasterDataPage } from "./features/masterdata/MasterDataPage";
import { LedgerPage } from "./features/ledger/LedgerPage";
import { LedgerBalancePage } from "./features/ledger/LedgerBalancePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { NotFoundPage } from "./routes/NotFoundPage";
import { PlaceholderPage } from "./routes/PlaceholderPage";
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
          {
            element: <RoleRoute roles={["staff", "admin"]} />,
            children: [
              {
                path: "/graduate-ledger",
                element: <LedgerPage ledger="graduate" />,
              },
              {
                path: "/graduate-ledger/print-select",
                element: (
                  <PlaceholderPage
                    title="Graduate Ledger - Print Statement"
                    description="Statement selection and printing interface for Graduate School Ledger."
                    backHref="/graduate-ledger"
                  />
                ),
              },
              { path: "/law-ledger", element: <LedgerPage ledger="law" /> },
              {
                path: "/law-ledger/print-select",
                element: (
                  <PlaceholderPage
                    title="Law Ledger - Print Statement"
                    description="Statement selection and printing interface for College of Law Ledger."
                    backHref="/law-ledger"
                  />
                ),
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
          {
            element: <RoleRoute roles={["admin"]} />,
            children: [
              { path: "/admin", element: <AdminDashboardPage /> },
              { path: "/admin/dashboard", element: <AdminDashboardPage /> },
              { path: "/admin/users", element: <AdminUsersPage /> },
              { path: "/admin/master-data", element: <MasterDataPage /> },
              { path: "/admin/activity-log", element: <AdminActivityLogPage /> },
            ],
          },
          {
            element: <RoleRoute roles={["staff", "admin"]} />,
            children: [
              { path: "/staff", element: <StaffRequestsPage /> },
              { path: "/staff/staffdashboard", element: <StaffRequestsPage /> },
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
                element: <MasterDataPage initialResource="authorized-officials" />,
              },
              {
                path: "/staff/uacs",
                element: <MasterDataPage initialResource="uacs" />,
              },
              {
                path: "/staff/courses",
                element: <MasterDataPage initialResource="courses" />,
              },
              {
                path: "/staff/assessments/dashboard",
                element: <AssessmentDashboard />,
              },
              { path: "/staff/assessments", element: <AssessmentIndex /> },
              { path: "/staff/assessments/:id/edit", element: <AssessmentEdit /> },
              {
                path: "/staff/activity-log",
                element: (
                  <PlaceholderPage
                    title="Staff Activity Log"
                    description="Audit trail of staff processing actions and requests."
                    backHref="/staff/requests"
                  />
                ),
              },
            ],
          },
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
