import { Link } from "react-router";
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
import { ApiError } from "../../api/client";
import { useLogout } from "./mutations";
import { useCurrentUser } from "./queries";

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function AuthBootstrap() {
  const userQuery = useCurrentUser();
  const logoutMutation = useLogout();

  function signOut() {
    logoutMutation.mutate(undefined, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          logoutMutation.reset();
        }
      },
    });
  }

  if (userQuery.isPending) {
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
  }

  if (userQuery.isError) {
    const error = userQuery.error;
    if (error instanceof ApiError && error.status === 401) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-blue-500 p-4">
          <Dialog open>
            <DialogContent
              showCloseButton={false}
              className="max-w-md border-0 bg-[#F8F9FA] text-slate-900 shadow-2xl"
            >
              <DialogHeader className="text-center sm:text-center">
                <DialogTitle className="text-2xl font-bold text-blue-950">
                  NORSU Order Payment System
                </DialogTitle>
                <DialogDescription className="text-base text-slate-700">
                  Your session is not signed in.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="justify-center sm:justify-center">
                <Button
                  render={<Link to="/login" />}
                  className="bg-blue-700 text-white hover:bg-blue-800"
                >
                  Sign in
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      );
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-blue-500 p-4">
        <Dialog open>
          <DialogContent
            showCloseButton={false}
            className="max-w-md border-0 bg-[#F8F9FA] text-slate-900 shadow-2xl"
          >
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-bold text-blue-950">
                Unable to connect
              </DialogTitle>
              <DialogDescription className="text-base text-slate-700">
                {error instanceof Error
                  ? error.message
                  : "The API could not be reached."}
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
  }

  const user = userQuery.data.data;
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-500 p-4">
      <Dialog open>
        <DialogContent
          showCloseButton={false}
          className="max-w-md border-0 bg-[#F8F9FA] text-slate-900 shadow-2xl"
        >
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold text-blue-950">
              Welcome, {user.name}
            </DialogTitle>
            <DialogDescription className="text-base text-slate-700">
              Signed in as {roleLabel(user.role)}.
            </DialogDescription>
          </DialogHeader>
          <p className="text-center text-sm text-slate-600">
            Feature screens will be migrated here incrementally.
          </p>
          <DialogFooter className="justify-center sm:justify-center">
            <Button
              type="button"
              onClick={signOut}
              disabled={logoutMutation.isPending}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              {logoutMutation.isPending ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
