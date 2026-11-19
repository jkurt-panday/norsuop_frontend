import { createBrowserRouter } from "react-router";
import App from "./App";
import { LoginForm } from "./features/auth/LoginForm";
import { OpFormPage } from "./features/public/opform/OpFormPage";
import { OpResultPage } from "./features/public/opform/OpResultPage";
import { AssessmentPage } from "./features/public/assessment/AssessmentPage";
import { AssessmentResultPage } from "./features/public/assessment/AssessmentResultPage";
import { AssessmentSuccessPage } from "./features/public/assessment/AssessmentSuccessPage";
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
import { BankAccountsPage } from "./features/masterdata/BankAccountsPage";
import { PaymentOptionsPage } from "./features/masterdata/PaymentOptionsPage";
import { MembershipsPage } from "./features/masterdata/MembershipsPage";
import { AuthorizedOfficialsPage } from "./features/masterdata/AuthorizedOfficialsPage";
import { UacsPage } from "./features/masterdata/UacsPage";
import { CoursesPage } from "./features/masterdata/CoursesPage";
import { LedgerPage } from "./features/ledger/LedgerPage";
import { LedgerBalancePage } from "./features/ledger/LedgerBalancePage";
import { PrintSelectPage } from "./features/ledger/PrintSelectPage";
import { AssessmentIndexPage } from "./features/assessments/AssessmentIndexPage";
import { AssessmentDashboardPage } from "./features/assessments/AssessmentDashboardPage";
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
              { path: "/admin/activity-log", element: <AdminActivityLogPage /> },
            ],
          },

          // Staff & Admin Operations
          {
            element: <RoleRoute roles={["staff", "admin"]} />,
            children: [
              { path: "/staff", element: <StaffDashboardPage /> },
              { path: "/staff/staffdashboard", element: <StaffDashboardPage /> },
              { path: "/staff/requests", element: <StaffRequestsPage /> },
              {
                path: "/staff/requests/:id",
                element: <StaffRequestDetailPage />,
              },
              {
                path: "/staff/bank-accounts",
                element: <BankAccountsPage />,
              },
              {
                path: "/staff/payment-options",
                element: <PaymentOptionsPage />,
              },
              {
                path: "/staff/memberships",
                element: <MembershipsPage />,
              },
              {
                path: "/staff/authorized-officials",
                element: <AuthorizedOfficialsPage />,
              },
              {
                path: "/staff/uacs",
                element: <UacsPage />,
              },
              {
                path: "/staff/courses",
                element: <CoursesPage />,
              },
              {
                path: "/staff/assessments/dashboard",
                element: <AssessmentDashboardPage />,
              },
              {
                path: "/staff/assessments",
                element: <AssessmentIndexPage />,
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
