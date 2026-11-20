import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MasterList } from "../api";
import { useCurrentUser } from "@/features/auth/queries";

export interface ColumnDef<T> {
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
  width?: string;
  sortable?: boolean | string;
}

export interface SortOptionDef {
  label: string;
  sort: string;
  direction: "asc" | "desc";
}

export interface ResourceTableProps<T extends { id: number }> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  addLabel?: string;
  onAdd?: () => void;
  headerActions?: React.ReactNode;
  columns: ColumnDef<T>[];
  data?: MasterList<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => Promise<void> | void;
  emptyIcon: LucideIcon;
  emptyMessage: string;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  actionsWidth?: string;
  filters?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  currentSort?: string;
  currentDirection?: "asc" | "desc";
  onSortChange?: (sort: string, direction: "asc" | "desc") => void;
  sortOptions?: SortOptionDef[];
  onPageChange: (page: number) => void;
  onReload?: () => void;
  onReset?: () => void;
  hideActions?: boolean;
}

export function ResourceTable<T extends { id: number }>({
  title,
  description,
  icon: HeaderIcon,
  addLabel,
  onAdd,
  headerActions,
  columns,
  data,
  isLoading = false,
  isFetching = false,
  onEdit,
  onDelete,
  emptyIcon: EmptyIcon,
  emptyMessage,
  deleteConfirmTitle = "Confirm Delete",
  deleteConfirmMessage = "Are you sure you want to delete this record? This action cannot be undone.",
  actionsWidth = "140px",
  filters,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  onSearchSubmit,
  currentSort,
  currentDirection = "asc",
  onSortChange,
  sortOptions,
  onPageChange,
  onReload,
  onReset,
  hideActions = false,
}: ResourceTableProps<T>) {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentUserQuery = useCurrentUser();
  const isAdmin = currentUserQuery.data?.data.role === "admin";

  // Reload cooldown
  const [cooldown, setCooldown] = useState(0);

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const currentPage = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;
  const total = meta?.total ?? rows.length;
  const perPage = meta?.per_page ?? 20;
  const from = total > 0 ? (currentPage - 1) * perPage + 1 : 0;
  const to = total > 0 ? Math.min(currentPage * perPage, total) : 0;

  const handleReload = () => {
    if (cooldown > 0 || isFetching) return;
    onReload?.();
    setCooldown(5);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSortClick = (sortKey: string) => {
    if (!onSortChange) return;
    if (currentSort !== sortKey) {
      onSortChange(sortKey, "asc");
    } else if (currentDirection === "asc") {
      onSortChange(sortKey, "desc");
    } else {
      onSortChange("id", "desc");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string };
      if (errObj?.status === 409) {
        setDeleteError(
          errObj.message ||
            "This record cannot be deleted because it is currently linked to other records or is active.",
        );
      } else {
        setDeleteError(
          errObj?.message || "Failed to delete record. Please try again.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex items-center gap-4">
          {HeaderIcon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
              <HeaderIcon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <CardTitle className="bg-[#3399FF] font-['Poppins'] bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {headerActions}
          {onAdd && addLabel && (
            <Button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="w-full gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 text-card-foreground shadow-sm">
        {/* Loading progress bar */}
        <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 animate-[table-loading-bar_1s_ease-in-out_infinite] bg-blue-500" />
          )}
        </div>
        <style>{`
          @keyframes table-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        {/* Toolbar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit?.();
            }}
            className="flex w-full max-w-md flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-xl border border-input bg-background pr-8 pl-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");
                    onSearchSubmit?.();
                  }}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              aria-label="Search"
              title="Search"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-500"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {filters}

            {sortOptions && sortOptions.length > 0 && onSortChange && (
              <Popover>
                <PopoverTrigger
                  className={`inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted ${
                    currentSort
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-input bg-background"
                  }`}
                  aria-label="Sort"
                  title="Sort"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-52 space-y-1 border-border bg-popover p-2 text-popover-foreground shadow-lg"
                >
                  <p className="px-2 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                    Sort by
                  </p>
                  {sortOptions.map((opt) => {
                    const isActive =
                      currentSort === opt.sort &&
                      currentDirection === opt.direction;
                    return (
                      <button
                        key={`${opt.sort}:${opt.direction}`}
                        type="button"
                        onClick={() => onSortChange(opt.sort, opt.direction)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                        {isActive && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            )}

            <button
              type="button"
              onClick={handleReload}
              disabled={cooldown > 0 || isFetching}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Reload table"
              title={
                cooldown > 0 ? `Wait ${cooldown}s to reload` : "Reload table"
              }
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              <span className="hidden text-xs sm:inline">
                {isFetching
                  ? "Reloading..."
                  : cooldown > 0
                    ? `Reload (${cooldown}s)`
                    : "Reload"}
              </span>
            </button>

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Reset filters"
                title="Reset filters and sorting"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="overflow-x-auto p-0">
          <Table
            className={`min-w-200 table-fixed transition-opacity duration-150 ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            <colgroup>
              {columns.map((col, i) => (
                <col
                  key={i}
                  style={col.width ? { width: col.width } : undefined}
                />
              ))}
              {!hideActions && <col style={{ width: actionsWidth }} />}
            </colgroup>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                {columns.map((col, i) => {
                  const sortKey =
                    typeof col.sortable === "string"
                      ? col.sortable
                      : col.sortable
                        ? col.header.toLowerCase().replace(/\s+/g, "_")
                        : null;
                  const isActiveSort =
                    sortKey !== null && currentSort === sortKey;

                  return (
                    <TableHead
                      key={i}
                      className={`h-11 truncate bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
                        i === 0 ? "pl-6" : ""
                      }`}
                    >
                      {sortKey && onSortChange ? (
                        <button
                          type="button"
                          onClick={() => handleSortClick(sortKey)}
                          className="flex w-full items-center gap-1.5 rounded-sm py-1 text-left select-none hover:text-foreground focus-visible:outline-none"
                        >
                          {col.header}
                          {isActiveSort ? (
                            currentDirection === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          {col.header}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
                {!hideActions && (
                  <TableHead className="h-11 bg-muted/50 pr-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row, i) => (
                  <TableRow
                    key={row.id}
                    className={`border-b border-border/50 transition-colors duration-200 last:border-0 hover:bg-muted/40 ${
                      i % 2 === 1 ? "bg-muted/20" : "bg-card"
                    }`}
                  >
                    {columns.map((col, j) => (
                      <TableCell
                        key={j}
                        className={`py-3 text-sm ${col.className ?? "truncate text-foreground"} ${
                          j === 0 ? "pl-6" : ""
                        }`}
                      >
                        {col.render(row, i)}
                      </TableCell>
                    ))}
                    {!hideActions && (
                      <TableCell className="py-3 pr-10 text-right">
                        <div className="mr-2 inline-flex items-center gap-1.5">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(row)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-amber-600 text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-neutral-950 dark:hover:bg-amber-600"
                              aria-label="Edit"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && onDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleteTarget(row);
                              }}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-red-600 text-white transition-colors hover:bg-red-700"
                              aria-label="Delete"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length + (hideActions ? 0 : 1)}
                    className="h-56"
                  >
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <EmptyIcon className="h-8 w-8" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-muted-foreground">
                        {emptyMessage}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
              Showing {from}-{to} of {total} results
            </p>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Previous page"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="inline-flex h-8 items-center justify-center px-3 text-xs font-medium text-muted-foreground sm:text-sm">
                Page {currentPage} of {lastPage}
              </span>

              <button
                type="button"
                disabled={currentPage >= lastPage}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Next page"
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmMessage}
            </AlertDialogDescription>
            {deleteError && (
              <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {deleteError}
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
