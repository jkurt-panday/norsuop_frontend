import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { AuthSplitLayout } from "../../layouts/AuthSplitLayout";
import { useLogin } from "./mutations";
import { useCurrentUser } from "./queries";

const sharedInputClass =
  "min-h-[54px] w-full rounded-[9px] border-[1.5px] border-[#D3DCE6] bg-white px-4 py-3 text-[#0F1E33] placeholder:text-[#55667D] placeholder:opacity-70 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#0B7BE0] aria-invalid:border-[#B3261E] dark:border-[#243652] dark:bg-[#101D31] dark:text-[#E6EEF8] dark:focus-visible:outline-[#5AA9F5] dark:aria-invalid:border-[#FF8A80]";

export function LoginForm() {
  const navigate = useNavigate();
  const mutation = useLogin();
  const { data: currentUser } = useCurrentUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeactivatedOpen, setIsDeactivatedOpen] = useState(false);

  // If already authenticated, bounce to role dashboard
  useEffect(() => {
    if (currentUser?.data) {
      const role = currentUser.data.role;
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "staff") {
        navigate("/staff/requests", { replace: true });
      } else if (role === "cashier") {
        navigate("/cashier/requests", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [currentUser, navigate]);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate(
      { email, password, remember },
      {
        onSuccess: (response) => {
          const role = response?.data?.role;
          if (role === "admin") {
            navigate("/admin");
          } else if (role === "staff") {
            navigate("/staff/requests");
          } else if (role === "cashier") {
            navigate("/cashier/requests");
          } else {
            navigate("/");
          }
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            const message = err.message || "";
            const emailErrors = err.errors?.email || [];
            if (
              /deactivated/i.test(message) ||
              emailErrors.some((e) => /deactivated/i.test(e))
            ) {
              setIsDeactivatedOpen(true);
            }
          }
        },
      },
    );
  }

  const validation =
    mutation.error instanceof ApiError ? mutation.error.errors : {};

  return (
    <AuthSplitLayout>
      <h2 className="font-heading text-[30px] leading-tight font-bold text-[#0F1E33] dark:text-[#E6EEF8]">
        Sign in
      </h2>
      <p className="mt-1 mb-6 text-[#55667D] dark:text-[#8FA4BF]">
        Access your university finance account.
      </p>

      {mutation.isError && Object.keys(validation).length === 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-3.5 min-h-[22px] text-sm text-destructive"
        >
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Sign in failed."}
        </div>
      )}

      <form onSubmit={submit}>
        <div>
          <Label htmlFor="email" className="mb-2">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-invalid={validation.email ? "true" : undefined}
            placeholder="e.g. cashier@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={sharedInputClass}
          />
          {validation.email?.map((message) => (
            <small className="mt-1 block text-sm text-destructive" key={message}>
              {message}
            </small>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="password" className="mb-2">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={validation.password ? "true" : undefined}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${sharedInputClass} pr-[76px]`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-controls="password"
              aria-pressed={showPassword}
              className="absolute top-[9px] right-0 bottom-[9px] flex items-center border-l border-[#D3DCE6] px-[18px] text-[15px] font-medium text-[#0B5CAD] dark:border-[#243652] dark:text-[#5AA9F5]"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {validation.password?.map((message) => (
            <small className="mt-1 block text-sm text-destructive" key={message}>
              {message}
            </small>
          ))}
        </div>

        <div className="my-5 flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 font-normal select-none">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(c) => setRemember(c === true)}
            />
            Keep me signed in
          </label>
          <Link
            to="/"
            className="text-sm font-medium text-[#0B5CAD] hover:underline dark:text-[#5AA9F5]"
          >
            Back to portal
          </Link>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[9px] bg-[#0B5CAD] text-base font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#5AA9F5] dark:text-[#04152B]"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <p className="mt-6 border-t border-[#D3DCE6] pt-[18px] text-center text-[13.5px] text-[#55667D] dark:border-[#243652] dark:text-[#8FA4BF]">
        Need access? Contact your system administrator.
      </p>

      <Dialog open={isDeactivatedOpen} onOpenChange={setIsDeactivatedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account Deactivated</DialogTitle>
            <DialogDescription>
              Your account has been deactivated. Please contact an administrator
              for assistance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsDeactivatedOpen(false)}
              className="w-full"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthSplitLayout>
  );
}
