import * as React from "react";
import { cn } from "cn";
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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Search,
  Filter,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ListFilter,
  RefreshCw,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean | string;
  visible?: boolean;
  align?: "left" | "right" | "center";
  hideOnMobile?: boolean;
  width?: string;
}

export interface SortOptionDef {
  label: string;
  sort: string;
  direction: "asc" | "desc";
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
  page?: number;
  perPage?: number;
  total?: number;
  lastPage?: number;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  // CRUD actions
  addLabel?: string;
  addHref?: string;
  editHref?: (row: T) => string;
  deleteUrl?: (id: number | string) => string;
  deleteConfirmMessage?: string;
  onDelete?: (id: number | string) => void;
  // Header
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  // Empty state
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyMessage?: string;
  emptyDescription?: string;
  // Sorting
  sortOptions?: SortOptionDef[];
  enableColumnSorting?: boolean;
  // UI
  className?: string;
  showPagination?: boolean;
  storageKey?: string;
  defaultVisibleColumns?: string[];
  highlightDuration?: number;
  actionsWidth?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

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

function DataTableSkeleton({ columnCount }: { columnCount: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columnCount }).map((_, i) => (
            <TableHead key={i} className="h-10">
              <Skeleton className="h-4 w-20" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  isLoading,
  isError,
  error,
  onRefresh,
  page = 1,
  perPage = 10,
  total = 0,
  lastPage = 1,
  onPageChange,
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder = "Search...",
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  hasActiveFilters = false,
  // CRUD
  addLabel,
  addHref,
  editHref,
  deleteUrl,
  deleteConfirmMessage = "Are you sure you want to delete this record?",
  onDelete,
  // Header
  title,
  description,
  icon: HeaderIcon,
  // Empty state
  emptyIcon: EmptyIcon,
  emptyMessage = "No records found",
  emptyDescription = "Try adjusting your search or filters.",
  // Sorting
  sortOptions,
  enableColumnSorting = true,
  // UI
  className,
  showPagination = true,
  storageKey,
  defaultVisibleColumns,
  highlightDuration = 2000,
  actionsWidth = "110px",
}: DataTableProps<T>) {
  const visibleColumns = React.useMemo(
    () => columns.filter((c) => c.visible !== false),
    [columns],
  );

  const currentlyVisibleColumns = visibleColumns;
  const columnCount = currentlyVisibleColumns.length + ((editHref || deleteUrl || onDelete) ? 1 : 0);

  // Local search state for responsive input
  const [localSearch, setLocalSearch] = React.useState(searchValue);

  React.useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  // Row highlighting state
  const prevSignatures = React.useRef<Map<string | number, string> | null>(null);
  const [highlightedIds, setHighlightedIds] = React.useState<Set<string | number>>(new Set());
  const highlightTimers = React.useRef<Map<string | number, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    const nextSignatures = new Map<string | number, string>();
    const changed: (string | number)[] = [];

    for (const row of data) {
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
        if (existing) clearTimeout(existing);

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
  }, [data, highlightDuration]);

  // Page jump state
  const [pageJumpOpen, setPageJumpOpen] = React.useState(false);
  const [pageJumpInput, setPageJumpInput] = React.useState("");

  // Sort dropdown state
  const [sortOpen, setSortOpen] = React.useState(false);
  const [currentSort, setCurrentSort] = React.useState<string>("");
  const [currentDirection, setCurrentDirection] = React.useState<"asc" | "desc">("asc");

  const handlePageChange = (newPage: number) => {
    if (onPageChange && newPage >= 1 && newPage <= lastPage) {
      onPageChange(newPage);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(localSearch);
    } else if (onSearchChange) {
      onSearchChange(localSearch);
    }
    if (onPageChange) onPageChange(1);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  // Navigate to page with local loading bar
  const [isNavigating, setIsNavigating] = React.useState(false);

  const navigateToPage = (pageNum: number) => {
    setIsNavigating(true);
    handlePageChange(pageNum);
    setPageJumpOpen(false);
    // Reset loading bar after navigation
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleSortClick = (sortKey: string) => {
    if (!sortOptions && !enableColumnSorting) return;
    
    if (sortOptions) {
      // Find the sort option
      const option = sortOptions.find((o) => o.sort === sortKey);
      if (option) {
        setCurrentSort(option.sort);
        setCurrentDirection(option.direction);
        // Trigger the search with sort params
        if (onSearchSubmit) {
          onSearchSubmit(localSearch);
        }
      }
    }
    // For column header sorting, parent handles via onPageChange with sort params
  };

  const handleSortOptionSelect = (option: SortOptionDef) => {
    setCurrentSort(option.sort);
    setCurrentDirection(option.direction);
    setSortOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(localSearch);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("border-border", className)}>
        <CardContent className="p-4">
          <DataTableSkeleton columnCount={columnCount} />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={cn("border-border", className)}>
        <CardContent className="py-12 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Loader2 className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Failed to load data</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {error instanceof Error ? error.message : "An error occurred while loading data."}
          </p>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs">
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn("border-border", className)}>
        <CardContent className="py-14 text-center space-y-3">
          {EmptyIcon && (
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <EmptyIcon className="size-6" />
            </div>
          )}
          <h2 className="text-base font-semibold text-foreground">{emptyMessage}</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{emptyDescription}</p>
          {hasActiveFilters && onClearFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs gap-1">
              <XCircle className="size-3" />
              <span>Clear filters</span>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const hasActions = editHref || deleteUrl || onDelete;

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl min-w-0 space-y-4 bg-page-background p-3 sm:p-6">
      {/* Header */}
      {(title || description || HeaderIcon) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {HeaderIcon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                <HeaderIcon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              {title && (
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">{title}</CardTitle>
              )}
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {addHref && addLabel && (
            <Button asChild>
              <a href={addHref}>
                <Plus className="mr-1.5 h-4 w-4" />
                {addLabel}
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Filter bar */}
      <Card className="min-w-0 overflow-x-auto border-border shadow-sm">
        <CardContent className="p-5 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
              {/* Search */}
              <div className="flex flex-col gap-1.5 lg:col-span-4">
                <label htmlFor="dt-search" className="text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dt-search"
                    placeholder={searchPlaceholder}
                    value={localSearch}
                    onChange={handleSearchInputChange}
                    className="h-10 rounded-lg pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Sort dropdown */}
              {(sortOptions && sortOptions.length > 0) && (
                <div className="flex flex-col gap-1.5 lg:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Sort</label>
                  <Popover open={sortOpen} onOpenChange={setSortOpen}>
                    <PopoverTrigger>
                      <SelectTrigger className="h-10! w-full rounded-lg border-input bg-background shadow-sm transition-colors hover:bg-muted focus:ring-2 focus:ring-ring/20">
                        <SelectValue placeholder="Sort by">
                          {currentSort && currentDirection ? (
                            <span className="flex items-center gap-2">
                              {currentDirection === "asc" ? <ArrowUpDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                              {sortOptions.find((o) => o.sort === currentSort)?.label}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <ArrowUpDown className="h-3.5 w-3.5" />
                              Sort by
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </PopoverTrigger>
                    <PopoverContent sideOffset={6} className="min-w-(--anchor-width) rounded-lg border-border shadow-lg">
                      <SelectGroup>
                        <SelectLabel>Sort by</SelectLabel>
                        {sortOptions.map((opt) => (
                          <SelectItem
                            key={opt.sort}
                            value={opt.sort}
                            className="cursor-pointer rounded-md"
                            onSelect={() => handleSortOptionSelect(opt)}
                          >
                            <span className="flex items-center gap-2">
                              {opt.direction === "asc" ? <ArrowUpDown className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Additional filters */}
              {filters.map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1.5 lg:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {filter.label}
                  </label>
                  {filter.type === "select" && (
                    <Select
                      value={filterValues[filter.key] || ""}
                      onValueChange={(v) => onFilterChange?.(filter.key, v ?? "")}
                    >
                      <SelectTrigger className="h-10! w-full rounded-lg border-input bg-background shadow-sm transition-colors hover:bg-muted focus:ring-2 focus:ring-ring/20">
                        <SelectValue placeholder={filter.placeholder || `All ${filter.label}`} />
                      </SelectTrigger>
                      <SelectContent sideOffset={6} className="min-w-(--anchor-width) rounded-lg border-border shadow-lg">
                        <SelectGroup>
                          <SelectLabel>Filter by {filter.label.toLowerCase()}</SelectLabel>
                          <SelectItem value="" className="cursor-pointer rounded-md">
                            <span className="flex items-center gap-2 text-foreground">
                              <ListFilter className="h-3.5 w-3.5" />
                              {filter.placeholder || `All ${filter.label}`}
                            </span>
                          </SelectItem>
                          {filter.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="cursor-pointer rounded-md">
                              <span className="flex items-center gap-2">{opt.label}</span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                  {filter.type === "date" && (
                    <div className="flex h-10 items-center overflow-hidden rounded-lg border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring/50">
                      <input
                        type="date"
                        value={filterValues[filter.key] || ""}
                        onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                        aria-label={filter.label}
                        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-foreground [color-scheme:light] outline-none dark:[color-scheme:dark]"
                      />
                    </div>
                  )}
                  {filter.type === "text" && (
                    <Input
                      placeholder={filter.placeholder || filter.label}
                      value={filterValues[filter.key] || ""}
                      onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                      className="h-10 w-full rounded-lg border-input bg-background"
                    />
                  )}
                </div>
              ))}

              {/* Action buttons */}
              <div className="flex items-end gap-2 lg:col-span-2">
                <Button type="submit" className="h-10 flex-1 gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 lg:flex-none">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </Button>
                {onClearFilters && (
                  <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={onClearFilters}>
                    Reset
                  </Button>
                )}
                {onRefresh && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-1.5 rounded-lg"
                    onClick={onRefresh}
                    title="Reload table data"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reload</span>
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="min-w-0 gap-0 overflow-hidden border-border p-0 py-0 shadow-sm">
        {/* Loading bar */}
        <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
          {isNavigating && (
            <div className="absolute inset-0 animate-[table-loading-bar_1s_ease-in-out_infinite] bg-primary" />
          )}
        </div>
        <style>{`
          @keyframes table-loading-bar {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes row-flash {
            0% { background-color: var(--primary-100); }
            100% { background-color: transparent; }
          }
        `}</style>

        <CardContent className="min-w-0 overflow-x-auto p-0">
          <Table className={`transition-opacity duration-150 ${isNavigating ? "opacity-60" : "opacity-100"}`}>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                {currentlyVisibleColumns.map((col, i) => {
                  const sortKey = typeof col.sortable === "string" ? col.sortable : col.sortable === true ? col.header.toLowerCase().replace(/\s+/g, "_") : null;
                  const isActiveSort = sortKey !== null && currentSort === sortKey;

                  const sortIcon = col.sortable && enableColumnSorting ? (
                    isActiveSort ? (
                      currentDirection === "asc" ? (
                        <ArrowUpDown className="h-3 w-3 text-primary" aria-hidden="true" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-primary" aria-hidden="true" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
                    )
                  ) : null;

                  return (
                    <TableHead
                      key={i}
                      style={col.width ? { width: col.width } : undefined}
                      aria-sort={col.sortable && enableColumnSorting ? (isActiveSort ? (currentDirection === "asc" ? "ascending" : "descending") : "none") : undefined}
                      className={cn(
                        "h-11 bg-muted/50 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
                        i === 0 && "pl-4 sm:pl-6",
                        col.align && alignClass[col.align],
                        col.hideOnMobile && "hidden md:table-cell",
                        col.sortable && enableColumnSorting && "select-none hover:text-foreground",
                        col.className,
                      )}
                    >
                      {col.sortable && enableColumnSorting ? (
                        <button
                          type="button"
                          onClick={() => sortKey && handleSortClick(sortKey)}
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
                {hasActions && (
                  <TableHead
                    style={{ width: actionsWidth }}
                    className="h-11 bg-muted/50 pr-4 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:pr-6"
                  >
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.map((row, i) => {
                const isHighlighted = highlightedIds.has(row.id);

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-b border-border transition-colors duration-700 last:border-0 hover:bg-muted/50",
                      isHighlighted ? "animate-[row-flash_2s_ease-out] bg-primary/10" : i % 2 === 1 && "bg-muted/20",
                    )}
                  >
                    {currentlyVisibleColumns.map((col, j) => (
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
                    {hasActions && (
                      <TableCell style={{ width: actionsWidth }} className="py-3 pr-4 text-right sm:pr-6">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {editHref && (
                            <a
                              href={editHref(row)}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-amber-600 text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-neutral-950"
                            >
                              <Edit className="h-4 w-4" />
                            </a>
                          )}
                          {(deleteUrl || onDelete) && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-red-600 hover:bg-red-600/10 hover:text-red-600"
                              onClick={() => {
                                const id = row.id;
                                if (window.confirm(deleteConfirmMessage)) {
                                  if (deleteUrl) {
                                    window.location.href = deleteUrl(id);
                                  } else if (onDelete) {
                                    onDelete(id);
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>

        {showPagination && lastPage > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
            <p className="shrink-0 text-xs text-muted-foreground sm:text-sm">
              Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, total)} of {total} results
            </p>

            {lastPage > 5 ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => navigateToPage(page - 1)}
                  aria-label="Previous page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover open={pageJumpOpen} onOpenChange={setPageJumpOpen}>
                  <PopoverTrigger>
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Page {page} of {lastPage}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent align="center" className="w-48 space-y-2 border-border bg-popover p-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const parsed = Number(pageJumpInput);
                        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= lastPage) {
                          navigateToPage(parsed);
                        }
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <input
                        type="number"
                        min={1}
                        max={lastPage}
                        value={pageJumpInput}
                        onChange={(e) => setPageJumpInput(e.target.value)}
                        placeholder={`1–${lastPage}`}
                        className="h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/20"
                        autoFocus
                      />
                      <button type="submit" className="h-8 shrink-0 rounded-md bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                        Go
                      </button>
                    </form>

                    <div className="max-h-56 space-y-0.5 overflow-y-auto border-t border-border pt-1.5">
                      {Array.from({ length: lastPage }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => navigateToPage(pageNum)}
                          className={`flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                            pageNum === page
                              ? "bg-primary/15 font-medium text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          Page {pageNum}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={page >= lastPage}
                  onClick={() => navigateToPage(page + 1)}
                  aria-label="Next page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <div className="flex flex-nowrap items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant={page <= 1 ? "outline" : "default"}
                  disabled={page <= 1}
                  onClick={() => navigateToPage(page - 1)}
                  aria-label="Previous page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: lastPage }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    type="button"
                    size="icon"
                    variant={pageNum === page ? "default" : "outline"}
                    onClick={() => navigateToPage(pageNum)}
                    aria-label={pageNum === page ? `Page ${pageNum} (current)` : `Page ${pageNum}`}
                    className="h-8 w-8 shrink-0 rounded-md text-sm"
                  >
                    {pageNum}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="icon"
                  variant={page >= lastPage ? "outline" : "default"}
                  disabled={page >= lastPage}
                  onClick={() => navigateToPage(page + 1)}
                  aria-label="Next page"
                  className="h-8 w-8 shrink-0 rounded-md text-sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}