import { createBrowserRouter } from "react-router";
import App from "./App";
import { LoginForm } from "./features/auth/LoginForm";
import { OpFormPage } from "./features/public/opform/OpFormPage";
import { OpResultPage } from "./features/public/opform/OpResultPage";
import { AssessmentPage } from "./features/public/assessment/AssessmentPage";
import { AssessmentResultPage } from "./features/public/assessment/AssessmentResultPage";
import { AssessmentSuccessPage } from "./features/public/assessment/AssessmentSuccessPage";
import { StaffRequestsPage } from "./features/staff/StaffRequestsPage";
import { StaffRequestDetailPage } from "./features/staff/StaffRequestDetailPage";
import { CashierRequestsPage } from "./features/cashier/CashierRequestsPage";
import { CashierRequestDetailPage } from "./features/cashier/CashierRequestDetailPage";
import { DocumentsPage } from "./features/documents/DocumentsPage";
import { AdminDashboardPage } from "./features/admin/AdminDashboardPage";
import { AdminUsersPage } from "./features/admin/AdminUsersPage";
import { MasterDataPage } from "./features/masterdata/MasterDataPage";
import { LedgerPage } from "./features/ledger/LedgerPage";
import { LedgerBalancePage } from "./features/ledger/LedgerBalancePage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { NotFoundPage } from "./routes/NotFoundPage";

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
      { path: "/app", element: <App /> },
      {
        element: <RoleRoute roles={["staff", "admin"]} />,
        children: [
          {
            path: "/graduate-ledger",
            element: <LedgerPage ledger="graduate" />,
          },
          { path: "/law-ledger", element: <LedgerPage ledger="law" /> },
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
          { path: "/admin/users", element: <AdminUsersPage /> },
          { path: "/admin/master-data", element: <MasterDataPage /> },
        ],
      },
      {
        element: <RoleRoute roles={["staff"]} />,
        children: [
          { path: "/staff", element: <App /> },
          { path: "/staff/requests", element: <StaffRequestsPage /> },
          { path: "/staff/requests/:id", element: <StaffRequestDetailPage /> },
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
  { path: "*", element: <NotFoundPage /> },
]);
