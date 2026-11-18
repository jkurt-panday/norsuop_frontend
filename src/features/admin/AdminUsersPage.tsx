import { useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Power,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "../../api/client";
import { useCurrentUser } from "../auth/queries";
import type {
  AdminUser,
  AdminUserRole,
  AdminUsersFilterParams,
} from "./api";
import {
  useCreateAdminUser,
  useToggleAdminUser,
  useUpdateAdminUser,
} from "./mutations";
import { useAdminUsers } from "./queries";

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border dark:border-blue-800/40",
  staff:
    "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/40",
  cashier:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40",
};

const ROLE_OPTIONS: { value: AdminUserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "cashier", label: "Cashier" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUsersPage() {
  const [, startTransition] = useTransition();

  // Current logged in user for self-deactivation guard
  const { data: authData } = useCurrentUser();
  const currentUserId = authData?.data?.id;

  // Filter state
  const [searchInput, setSearchInput] = useState("");
  const [roleInput, setRoleInput] = useState("");

  const [activeFilters, setActiveFilters] = useState<AdminUsersFilterParams>({
    page: 1,
    per_page: 10,
    search: "",
    role: "",
    sort: "created_at",
    direction: "desc",
  });

  // Feedback notifications
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<AdminUser | null>(null);

  // Form field states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<AdminUserRole>("staff");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Queries & Mutations
  const query = useAdminUsers(activeFilters);
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const toggleUser = useToggleAdminUser();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      setActiveFilters((prev) => ({
        ...prev,
        page: 1,
        search: searchInput.trim(),
        role: roleInput === "All" ? "" : roleInput,
      }));
    });
  };

  const handleRoleChange = (selected: string) => {
    setRoleInput(selected);
    startTransition(() => {
      setActiveFilters((prev) => ({
        ...prev,
        page: 1,
        role: selected === "All" ? "" : selected,
      }));
    });
  };

  const handleReset = () => {
    setSearchInput("");
    setRoleInput("");
    startTransition(() => {
      setActiveFilters({
        page: 1,
        per_page: 10,
        search: "",
        role: "",
        sort: "created_at",
        direction: "desc",
      });
    });
  };

  const handleSortClick = (columnKey: string) => {
    startTransition(() => {
      setActiveFilters((prev) => {
        const isActive = prev.sort === columnKey;
        const nextDir = isActive && prev.direction === "asc" ? "desc" : "asc";
        return {
          ...prev,
          page: 1,
          sort: columnKey,
          direction: nextDir,
        };
      });
    });
  };

  const setPage = (pageNumber: number) => {
    startTransition(() => {
      setActiveFilters((prev) => ({ ...prev, page: pageNumber }));
    });
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("staff");
    setShowPassword(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setShowPassword(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (editingUser) {
      updateUser.mutate(
        {
          id: editingUser.id,
          payload: {
            name: formName,
            email: formEmail,
            role: formRole,
            ...(formPassword.trim() ? { password: formPassword } : {}),
          },
        },
        {
          onSuccess: (res) => {
            setFeedback({
              type: "success",
              message: res.message || "User updated successfully!",
            });
            setDialogOpen(false);
            setEditingUser(null);
          },
          onError: (err) => {
            setFormError(
              err instanceof ApiError ? err.message : "Failed to update user.",
            );
          },
        },
      );
    } else {
      createUser.mutate(
        {
          name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
        },
        {
          onSuccess: (res) => {
            setFeedback({
              type: "success",
              message: res.message || "User added successfully!",
            });
            setDialogOpen(false);
            setFormName("");
            setFormEmail("");
            setFormPassword("");
          },
          onError: (err) => {
            setFormError(
              err instanceof ApiError ? err.message : "Failed to create user.",
            );
          },
        },
      );
    }
  };

  const confirmToggle = (user: AdminUser) => {
    if (user.id === currentUserId) {
      setFeedback({
        type: "error",
        message: "You cannot deactivate your own account (currently logged in).",
      });
      return;
    }
    setUserToToggle(user);
    setToggleDialogOpen(true);
  };

  const handleToggle = () => {
    if (!userToToggle) return;
    const willActivate = !!userToToggle.deleted_at;

    toggleUser.mutate(userToToggle.id, {
      onSuccess: (res) => {
        setFeedback({
          type: "success",
          message:
            res.message ||
            (willActivate
              ? "Account reactivated successfully!"
              : "Account deactivated successfully!"),
        });
        setToggleDialogOpen(false);
        setUserToToggle(null);
      },
      onError: (err) => {
        setFeedback({
          type: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Failed to update user status.",
        });
      },
    });
  };

  const COLUMNS = [
    { label: "Name", sortable: "name" },
    { label: "Email", sortable: "email" },
    { label: "Role", width: "w-[130px]" },
    { label: "Status", width: "w-[120px]", sortable: "deleted_at" },
    { label: "Created", width: "w-[180px]", sortable: "created_at" },
    { label: "Actions", width: "w-[120px]" },
  ];

  const users = query.data?.data ?? [];
  const meta = query.data?.meta ?? {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  };

  const fromCount = (meta.current_page - 1) * meta.per_page + (users.length > 0 ? 1 : 0);
  const toCount = (meta.current_page - 1) * meta.per_page + users.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            User Management
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage system users, roles, and access permissions.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-lg p-3 text-sm border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
              : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Users Card & Filter Bar */}
      <Card className="border border-border bg-card shadow-sm">
        {/* Loading Bar */}
        <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
          {query.isFetching && (
            <div className="absolute inset-0 animate-[table-loading-bar_1s_ease-in-out_infinite] bg-primary" />
          )}
        </div>
        <style>{`
          @keyframes table-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <CardHeader className="border-b border-border px-6 py-3.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-full flex-wrap items-center gap-2"
          >
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name, email, role..."
                className="h-9 pl-8 text-xs"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Role Filter Select */}
            <div className="w-full sm:w-40">
              <select
                aria-label="User role"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={roleInput || "All"}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="All">All roles</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              size="sm"
              className="h-9 bg-primary text-xs text-primary-foreground hover:bg-primary/90"
            >
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Search
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleReset}
              title="Reset search, filter and sorting"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          </form>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table
              className={`transition-opacity duration-150 ${
                query.isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                  {COLUMNS.map((col) => {
                    const sortKeyName = col.sortable;
                    const isActive = sortKeyName
                      ? activeFilters.sort === sortKeyName
                      : false;

                    return (
                      <TableHead
                        key={col.label}
                        className={`${col.width || ""} ${
                          sortKeyName
                            ? "cursor-pointer transition-colors select-none"
                            : ""
                        } ${
                          isActive
                            ? "bg-primary/10 font-bold text-primary"
                            : "hover:text-foreground"
                        }`}
                        onClick={
                          sortKeyName
                            ? () => handleSortClick(sortKeyName)
                            : undefined
                        }
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          {sortKeyName &&
                            (isActive ? (
                              activeFilters.direction === "asc" ? (
                                <ChevronLeft className="h-4 w-4 stroke-[2.5] text-primary" />
                              ) : (
                                <ChevronRight className="h-4 w-4 stroke-[2.5] text-primary" />
                              )
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 rotate-90 text-muted-foreground/60" />
                            ))}
                        </span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>

              <TableBody>
                {query.isPending ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-4">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell className="font-medium text-foreground">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            ROLE_BADGE_CLASSES[user.role] ||
                            "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                          }
                        >
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.deleted_at ? (
                          <Badge
                            variant="secondary"
                            className="bg-rose-100 text-rose-800 dark:border dark:border-rose-800/40 dark:bg-rose-950/60 dark:text-rose-300"
                          >
                            Deactivated
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 dark:border dark:border-emerald-800/40 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="Edit user"
                            className="text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmToggle(user)}
                            title={
                              user.deleted_at
                                ? "Activate user"
                                : "Deactivate user"
                            }
                            className={
                              user.deleted_at
                                ? "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
                                : "text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                            }
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination bar */}
          {meta.total > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
              <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                Showing {fromCount}-{toCount} of {meta.total} results
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={meta.current_page <= 1 || query.isFetching}
                  onClick={() => setPage(meta.current_page - 1)}
                  aria-label="Previous page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {meta.current_page} of {meta.last_page}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={
                    meta.current_page >= meta.last_page || query.isFetching
                  }
                  onClick={() => setPage(meta.current_page + 1)}
                  aria-label="Next page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? editingUser.id === currentUserId
                  ? "Update your name, email, or password. Role changes are restricted for the current account."
                  : "Update user information and role."
                : "Fill in the details below to create a new system user."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-user-name">Full Name</Label>
              <Input
                id="admin-user-name"
                placeholder="e.g., Juan Dela Cruz"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-user-email">Email Address</Label>
              <Input
                id="admin-user-email"
                type="email"
                placeholder="name@norsu.edu.ph"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-user-password">
                {editingUser
                  ? "New Password (leave blank to keep current)"
                  : "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="admin-user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    editingUser ? "•••••••• (optional)" : "Enter password"
                  }
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required={!editingUser}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-user-role">Role</Label>
              <select
                id="admin-user-role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as AdminUserRole)}
                disabled={editingUser?.id === currentUserId}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {createUser.isPending || updateUser.isPending
                  ? "Saving..."
                  : editingUser
                    ? "Update User"
                    : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {userToToggle?.deleted_at ? "Activate User" : "Deactivate User"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to{" "}
              {userToToggle?.deleted_at ? "activate" : "deactivate"}{" "}
              <strong>{userToToggle?.name}</strong> ({userToToggle?.email})?
              {!userToToggle?.deleted_at &&
                " This will disable their access to the system."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setToggleDialogOpen(false);
                setUserToToggle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={userToToggle?.deleted_at ? "default" : "destructive"}
              onClick={handleToggle}
              disabled={toggleUser.isPending}
            >
              {toggleUser.isPending
                ? userToToggle?.deleted_at
                  ? "Activating..."
                  : "Deactivating..."
                : userToToggle?.deleted_at
                  ? "Activate User"
                  : "Deactivate User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
