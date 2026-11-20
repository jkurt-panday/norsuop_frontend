import { Navigate, Outlet, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "../api/client";
import { useCurrentUser } from "../features/auth/queries";

export function ProtectedRoute() {
  const location = useLocation();
  const userQuery = useCurrentUser();
  if (userQuery.isPending)
    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-500 p-4">
        <Dialog open>
          <DialogContent
            showCloseButton={false}
            className="max-w-md border-0 bg-[#F8F9FA] text-slate-900 shadow-2xl"
          >
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold text-blue-950">
                Checking your session
              </DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                Please wait while we verify your account.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-2" aria-label="Loading">
              <Loader2 className="size-8 animate-spin text-blue-700" />
            </div>
          </DialogContent>
        </Dialog>
      </main>
    );
  if (
    userQuery.isError &&
    userQuery.error instanceof ApiError &&
    userQuery.error.status === 401
  ) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (userQuery.isError)
    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-500 p-4">
        <Dialog open>
          <DialogContent
            showCloseButton={false}
            className="max-w-md border-0 bg-[#F8F9FA] text-slate-900 shadow-2xl"
          >
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold text-blue-950">
                Session verification failed
              </DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                We could not verify your session. Please try again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="justify-center sm:justify-center">
              <Button
                type="button"
                onClick={() => void userQuery.refetch()}
                className="bg-blue-700 text-white hover:bg-blue-800"
              >
                Try again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    );
  return <Outlet />;
}
