import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "../auth/queries";
import { SettingsNav } from "./SettingsNav";
import { useUpdateProfile } from "./mutations";
import { ApiError } from "../../api/client";

export function ProfilePage() {
  const { data: userData, isPending } = useCurrentUser();
  const updateMutation = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (userData?.data) {
      setName(userData.data.name || "");
      setEmail(userData.data.email || "");
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setFieldErrors({});

    try {
      const res = await updateMutation.mutateAsync({ name, email });
      setSuccessMessage(res.message || "Profile updated successfully.");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
        setFieldErrors(err.errors);
      } else {
        setErrorMessage("Failed to update profile.");
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* Page Header */}
      <div>
        <h1 className="font-['Poppins'] text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account profile, password credentials, and theme preferences.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col lg:flex-row lg:space-x-12">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-56 mb-6 lg:mb-0">
          <SettingsNav />
        </aside>

        {/* Content Section */}
        <div className="flex-1 max-w-xl">
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your account's display name and primary email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={isPending || updateMutation.isPending}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={isPending || updateMutation.isPending}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isPending || updateMutation.isPending}
                    className="gap-2"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
