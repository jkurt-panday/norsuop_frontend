import { Link, useNavigate } from "react-router";
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  RefreshCw,
  Filter,
  ListFilter,
  XCircle,
} from "lucide-react";

// ============ TYPE DEFINITIONS ============

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  links: PaginationLink[];
  from: number | null;
  to: number | null;
  total: number;
  current_page: number;
  last_page: number;
}

export interface ColumnDef<T> {
  header: string;
  width?: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
  sortable?: string | boolean;
}

export interface SortOptionDef {
  label: string;
  sort: string;
  direction: "asc" | "desc";
}

export interface StatusOption {
  value: string;
  label: string;
  color?: string;
}

export interface RequestTableProps<T extends { id: number | string }> {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  addLabel?: string;
  addHref?: string;
  columns: ColumnDef<T>[];
  resource: PaginatedData<T>;
  renderActions: (row: T) => React.ReactNode;
  actionsWidth?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyMessage?: string;
  onPageChange?: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: StatusOption[];
  statusPlaceholder?: string;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onFilterSubmit: (e: React.SyntheticEvent) => void;
  onFilterReset: () => void;
  resourceKey?: string;
  highlightDuration?: number;
  customToolbar?: React.ReactNode;
  sortOptions?: SortOptionDef[];
  enableColumnSorting?: boolean;
  sort?: string;
  direction?: "asc" | "desc";
  onSortChange?: (sort: string, direction: "asc" | "desc") => void;
}

const STATUS_COLORS = {
  green: "bg-emerald-500",
  "light-green": "bg-green-300",
  "dark-green": "bg-green-600",
  blue: "bg-blue-500",
  purple: "bg-violet-500",
  red: "bg-rose-500",
  orange: "bg-amber-500",
  grey: "bg-slate-400",
} as const;

const statusColorMap: Record<string, string> = {
  paid: "light-green",
  processed: "dark-green",
  cancelled: "red",
  pending: "orange",
  unprocessed: "grey",
  active: "green",
  inactive: "grey",
} as const;

const resolveStatusColor = (color?: string, statusValue?: string) => {
  if (statusValue && statusColorMap[statusValue]) {
    return STATUS_COLORS[statusColorMap[statusValue] as keyof typeof STATUS_COLORS];
  }
  return (color && STATUS_COLORS[color as keyof typeof STATUS_COLORS]) || color || STATUS_COLORS.grey;
};

const alignClass: Record<NonNullable<ColumnDef<unknown>["align"]>, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

function rowSignature(row: unknown): string {
  try {
    return JSON.stringify(row);
  } catch {
    return "";
  }
}

function StatusSelect({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: StatusOption[];
  placeholder: string;
}) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Select value={value || "all"} onValueChange={(v) => onValueChange(v === null || v === "all" ? "" : v)}>
      <SelectTrigger className="h-10! w-full rounded-lg border-input bg-background shadow-sm transition-colors hover:bg-muted focus:ring-2 focus:ring-ring/20">
        <SelectValue placeholder={placeholder}>
          {value && selectedOption ? (
            <span className="flex items-center gap-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", resolveStatusColor(selectedOption.color, selectedOption.value))} />
              {selectedOption.label}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <ListFilter className="h-3.5 w-3.5" />
              {placeholder}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent sideOffset={6} className="min-w-(--anchor-width) rounded-lg border-border shadow-lg">
        <SelectGroup>
          <SelectLabel>Filter by status</SelectLabel>
          <SelectItem value="all" className="cursor-pointer rounded-md">
            <span className="flex items-center gap-2 text-foreground">
              <ListFilter className="h-3.5 w-3.5" />
              {placeholder}
            </span>
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-md">
              <span className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", resolveStatusColor(opt.color, opt.value))} />
                {opt.label}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function RequestTable<T extends { id: number | string }>({
  title,
  description,
  icon: HeaderIcon,
  addLabel,
  addHref,
  columns,
  resource,
  renderActions,
  actionsWidth = "110px",
  emptyIcon: EmptyIcon,
  emptyMessage = "No records found",
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  status,
  onStatusChange,
  statusOptions,
  statusPlaceholder = "All Status",
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onFilterSubmit,
  onFilterReset,
  resourceKey,
  highlightDuration = 2000,
  customToolbar,
  sortOptions,
  enableColumnSorting = true,
  sort,
  direction = "asc",
  onSortChange,
}: RequestTableProps<T>) {
  const navigate = useNavigate();

  const [isNavigating, setIsNavigating] = React.useState(false);

  const prevSignatures = React.useRef<Map<string | number, string> | null>(null);
  const [highlightedIds, setHighlightedIds] = React.useState<Set<string | number>>(new Set());
  const highlightTimers = React.useRef<Map<string | number, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    const nextSignatures = new Map<string | number, string>();
    const changed: (string | number)[] = [];

    for (const row of resource.data) {
      const sig = rowSignature(row);
      nextSignatures.set(row.id, sig);

      if (prevSignatures.current) {
        const prevSig = prevSignatures.current.get(row.id);

        if (prevSig === undefined || prevSig !== sig) {
          changed.push(row.id);
        }
      }
    }

    if (prevSignatures.current && changed.length > 0) {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        changed.forEach((id) => next.add(id));
        return next;
      });

      changed.forEach((id) => {
        const existing = highlightTimers.current.get(id);

        if (existing) {
          clearTimeout(existing);
        }

        const timer = setTimeout(() => {
          setHighlightedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          highlightTimers.current.delete(id);
        }, highlightDuration);

        highlightTimers.current.set(id, timer);
      });
    }

    prevSignatures.current = nextSignatures;

    const timers = highlightTimers.current;

    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, [resource.data, highlightDuration]);

  // ---- Page-jump dropdown -----------------------------------------------
  const [pageJumpOpen, setPageJumpOpen] = React.useState(false);
  const [pageJumpInput, setPageJumpInput] = React.useState("");

  const navigateToPage = (page: number) => {
    setIsNavigating(true);
    onPageChange?.(page);
    setPageJumpOpen(false);
    setTimeout(() => setIsNavigating(false), 500);
  };

  // ---- Sortable column headers -------------------------------------
  const currentSort = sort ?? "";
  const currentDirection = direction ?? "asc";

  const handleSortClick = (sortKey: string) => {
    const isActiveColumn = currentSort === sortKey;
    let newSort: string;
    let newDirection: "asc" | "desc";

    if (!isActiveColumn) {
      newSort = sortKey;
      newDirection = "asc";
    } else if (currentDirection === "asc") {
      newSort = sortKey;
      newDirection = "desc";
    } else {
      newSort = "";
      newDirection = "asc";
    }

    onSortChange?.(newSort, newDirection);
  };

  return (
    <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background p-3 sm:p-6">
      {(title || resource.total !== undefined || customToolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title && (
            <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              {title}
            </CardTitle>
          )}
          {customToolbar && <div className="flex items-center">{customToolbar}</div>}
        </div>
      )}

      {/* ---- Filter bar: search + status + date range ---- */}
      <Card className="min-w-0 overflow-x-auto border-border shadow-sm">
        <CardContent className="p-5 sm:p-5">
          <form onSubmit={onFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
              <div className="flex flex-col gap-1.5 lg:col-span-4">
                <label htmlFor="rt-search" className="text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="rt-search"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-10 rounded-lg pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <StatusSelect
                  value={status}
                  onValueChange={onStatusChange}
                  options={statusOptions}
                  placeholder={statusPlaceholder}
                />
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-4">
                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                <div className="flex h-10 items-center overflow-hidden rounded-lg border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring/50">
                  <input
                    id="rt-date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    aria-label="Date from"
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground [color-scheme:light] outline-none dark:[color-scheme:dark]"
                  />
                  <span className="shrink-0 px-1 text-xs font-medium text-muted-foreground">to</span>
                  <input
                    id="rt-date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    aria-label="Date to"
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground [color-scheme:light] outline-none dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2 lg:col-span-2">
                <Button type="submit" className="h-10 flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 lg:flex-none">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onFilterReset}>
                  Reset
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ---- Table ---- */}
      <Card className="min-w-0 gap-0 overflow-hidden border-border p-0 py-0 shadow-sm">
        <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
          {isNavigating && <div className="absolute inset-0 animate-[table-loading-bar_1s_ease_in_out_infinite] bg-primary" />}
        </div>
        <style>{`
          @keyframes table-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <CardContent className="min-w-0 overflow-x-auto p-0">
          <Table className={`transition-opacity duration-150 ${isNavigating ? "opacity-60" : "opacity-100"}`}>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                {columns.map((col, i) => {
                  const isActiveSort = col.sortable && currentSort === col.sortable;

                  const sortIcon = col.sortable ? (
                    isActiveSort ? (
                      currentDirection === "asc" ? (
                        <ArrowUp className="h-3 w-3 text-primary" aria-hidden="true" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-primary" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
                    )
                  ) : null;

                  return (
                    <TableHead
                      key={i}
                      style={col.width ? { width: col.width } : undefined}
                      aria-sort={
                        col.sortable
                          ? isActiveSort
                            ? currentDirection === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                      className={cn(
                        "h-11 bg-muted/50 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
                        i === 0 && "pl-4 sm:pl-6",
                        col.align && alignClass[col.align],
                        col.hideOnMobile && "hidden md:table-cell",
                        col.sortable && "select-none hover:text-foreground",
                        col.className,
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSortClick(col.sortable!)}
                          className="flex w-full items-center gap-1.5 rounded-sm py-1 text-left focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset focus-visible:outline-none"
                        >
                          {col.header}
                          {sortIcon}
                        </button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  );
                })}
                <TableHead style={{ width: actionsWidth }} className="h-11 bg-muted/50 pr-4 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {resource.data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length + 1} className="h-56">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      {EmptyIcon && <EmptyIcon className="h-8 w-8" strokeWidth={1.5} />}
                      <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                resource.data.map((row, i) => {
                  const isHighlighted = highlightedIds.has(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "border-b border-border transition-colors duration-700 last:border-0 hover:bg-muted/50",
                        isHighlighted ? "animate-[row-flash_2s_ease-out] bg-primary/10" : i % 2 === 1 && "bg-muted/20",
                      )}
                    >
                      {columns.map((col, j) => (
                        <TableCell
                          key={j}
                          style={col.width ? { width: col.width } : undefined}
                          className={cn(
                            "py-3 text-sm text-foreground",
                            j === 0 && "pl-4 font-medium text-foreground sm:pl-6",
                            col.align && alignClass[col.align],
                            col.hideOnMobile && "hidden md:table-cell",
                            col.className,
                          )}
                        >
                          {col.render(row, i)}
                        </TableCell>
                      ))}
                      <TableCell style={{ width: actionsWidth }} className="py-3 pr-4 text-right sm:pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {renderActions(row)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>

        {resource.last_page > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
              Showing {resource.from ?? 0}-{resource.to ?? 0} of {resource.total} results
            </p>

            {resource.last_page > 5 ? (
              (() => {
                const prevLink = resource.links.find((l) =>
                  l.label.replace(/&laquo;|&raquo;/g, "").trim().toLowerCase().includes("previous"),
                );
                const nextLink = resource.links.find((l) =>
                  l.label.replace(/&laquo;|&raquo;/g, "").trim().toLowerCase().includes("next"),
                );

                return (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={!prevLink?.url}
                      onClick={() => navigateToPage(resource.current_page - 1)}
                      aria-label="Previous page"
                      className="h-8 w-8 shrink-0 rounded-md text-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Popover open={pageJumpOpen} onOpenChange={(open) => { setPageJumpOpen(open); if (open) setPageJumpInput(String(resource.current_page)); }}>
                      <PopoverTrigger>
                        <span role="button" tabIndex={0} className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                          Page {resource.current_page} of {resource.last_page}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent align="center" className="w-48 space-y-2 border-border bg-popover p-2">
                        <form onSubmit={(e) => { e.preventDefault(); const parsed = Number(pageJumpInput); if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= resource.last_page) { navigateToPage(parsed); setPageJumpOpen(false); } }} className="flex items-center gap-1.5">
                          <input type="number" min={1} max={resource.last_page} value={pageJumpInput} onChange={(e) => setPageJumpInput(e.target.value)} placeholder={`1–${resource.last_page}`} className="h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20" autoFocus />
                          <button type="submit" className="h-8 shrink-0 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Go</button>
                        </form>
                        <div className="max-h-56 space-y-0.5 overflow-y-auto border-t border-border pt-1.5">
                          {Array.from({ length: resource.last_page }, (_, i) => i + 1).map((page) => (
                            <button key={page} type="button" onClick={() => { navigateToPage(page); setPageJumpOpen(false); }} className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors ${page === resource.current_page ? "bg-primary/15 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>Page {page}</button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button type="button" size="icon" variant="outline" disabled={!nextLink?.url} onClick={() => navigateToPage(resource.current_page + 1)} aria-label="Next page" className="h-8 w-8 shrink-0 rounded-md text-sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-nowrap items-center gap-1">
                {resource.links.map((link, i) => {
                  const rawLabel = link.label.replace(/&laquo;|&raquo;/g, "").trim();
                  const isPrev = rawLabel.toLowerCase() === "previous";
                  const isNext = rawLabel.toLowerCase() === "next";

                  return (
                    <Button key={i} type="button" size="icon" variant={link.active ? "default" : "outline"} disabled={!link.url} onClick={() => link.url && onPageChange?.(Number(new URL(link.url, window.location.origin).searchParams.get("page") ?? 1))} aria-label={isPrev ? "Previous page" : isNext ? "Next page" : rawLabel} className={cn("h-8 w-8 shrink-0 rounded-md text-sm", link.active && "bg-primary text-primary-foreground hover:bg-primary/90")}>
                      {isPrev ? <ChevronLeft className="h-4 w-4" /> : isNext ? <ChevronRight className="h-4 w-4" /> : rawLabel}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}