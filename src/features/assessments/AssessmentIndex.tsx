import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition, type SubmitEvent } from "react";
import { Link } from "react-router";
import { format, parseISO } from "date-fns";
import { useCurrentUser } from "../auth/queries";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarIcon,
  Columns3,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { AssessmentItem as Assessment, AssessmentFilterParams as AssessmentFilters } from "./api";
import { getAssessmentCourses, deleteAssessment } from "./api";
import { AssessmentIndexSkeleton } from "./AssessmentIndexSkeleton";
import { useAssessments } from "./queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const initialFilters: AssessmentFilters = {
  page: 1,
  per_page: 10,
  search: "",
  sort: "created_at",
  direction: "desc",
  date_from: "",
  date_to: "",
  enrolled_under: "",
  sy_last_attended: "",
  semester: "",
  status: "",
};
const statuses = ["pending", "mailed", "rejected", "completed"];
const statusLabel = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);
const statusDotClass: Record<string, string> = {
  pending: "bg-amber-500",
  mailed: "bg-blue-500",
  rejected: "bg-red-500",
  completed: "bg-emerald-500",
};
const enrolledUnder = ["Undergraduate", "Graduate", "School of Law"];
const semesters = ["First Semester", "Second Semester", "Summer"];
const schoolYears = Array.from({ length: 27 }, (_, index) => {
  const currentYear = new Date().getFullYear();
  const startYear =
    (new Date().getMonth() >= 5 ? currentYear : currentYear - 1) - index;
  return `${startYear}-${startYear + 1}`;
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function badgeVariant(value: string | null) {
  if (
    value === "completed" ||
    value === "Undergraduate" ||
    value === "First Semester"
  )
    return "success" as const;
  if (value === "pending" || value === "Summer") return "warning" as const;
  if (value === "rejected") return "destructive" as const;
  return "info" as const;
}
function fullName(assessment: Assessment) {
  return [
    assessment.first_name,
    assessment.middle_name?.charAt(0) && `${assessment.middle_name.charAt(0)}.`,
    assessment.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}
function toDate(value: string) {
  return value ? parseISO(value) : undefined;
}
function toDateInput(value: Date | undefined) {
  return value ? format(value, "yyyy-MM-dd") : "";
}

function DateFilter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: Date;
  max?: Date;
}) {
  const date = toDate(value);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-10 w-40 justify-start gap-2 rounded-lg font-normal"
            aria-label={label}
          />
        }
      >
        <CalendarIcon className="size-4 text-muted-foreground" />
        {date ? format(date, "MMM d, yyyy") : label}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => onChange(toDateInput(selected))}
          disabled={(day) => Boolean((min && day < min) || (max && day > max))}
        />
      </PopoverContent>
    </Popover>
  );
}

function FilterCombobox({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const values = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  const selected = values.find((option) => option.value === value);
  const isStatusFilter = label === "Status";
  const renderOptionLabel = (option: { value: string; label: string }) => (
    <span className="inline-flex items-center gap-2">
      {isStatusFilter && (
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${statusDotClass[option.value] ?? "bg-muted-foreground"}`}
        />
      )}
      {option.label}
    </span>
  );
  return (
    <Combobox
      items={values}
      value={selected?.label ?? ""}
      onValueChange={(next) =>
        onChange(values.find((option) => option.label === next)?.value ?? "")
      }
    >
      <ComboboxInput
        placeholder={label}
        aria-label={label}
        showClear={Boolean(value)}
        className={`h-10 w-40 rounded-lg ${isStatusFilter && selected ? "pl-7" : ""}`}
      >
        {isStatusFilter && selected && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${statusDotClass[selected.value] ?? "bg-muted-foreground"}`}
            />
          </span>
        )}
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>No options found.</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option.value} value={option.label}>
              {renderOptionLabel(option)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function AssessmentIndex() {
  const queryClient = useQueryClient();
  const { data: authData } = useCurrentUser();
  const isAdmin = authData?.data?.role === "admin";
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [courseId, setCourseId] = useState("");
  const [enrolled, setEnrolled] = useState("");
  const [semester, setSemester] = useState("");
  const [sy, setSy] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [goToPage, setGoToPage] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const defaults = { email: true, course: true, enrolledUnder: true, schoolYear: true, semester: true, submitted: true, status: true };
    if (typeof window === "undefined") return defaults;
    try { return { ...defaults, ...JSON.parse(window.localStorage.getItem("assessment-visible-columns") ?? "{}") }; } catch { return defaults; }
  });
  const toggleColumn = (column: string) => setVisibleColumns((current) => {
    const next = { ...current, [column]: !current[column] };
    try { window.localStorage.setItem("assessment-visible-columns", JSON.stringify(next)); } catch { /* ignore storage errors */ }
    return next;
  });
  const query = useAssessments(filters);
  const coursesQuery = useQuery({
    queryKey: ["assessment-courses"],
    queryFn: ({ signal }) => getAssessmentCourses(signal),
    staleTime: 300_000,
  });

  if (query.isPending || coursesQuery.isPending) {
    return <AssessmentIndexSkeleton />;
  }

  const updateFilters = (next: Partial<AssessmentFilters>) =>
    startTransition(() => setFilters((current) => ({ ...current, ...next })));
  const applyFilters = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({
      page: 1,
      search: search.trim(),
      status,
      course_id: courseId,
      enrolled_under: enrolled,
      semester,
      sy_last_attended: sy,
      date_from: dateFrom,
      date_to: dateTo,
    });
  };
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setCourseId("");
    setEnrolled("");
    setSemester("");
    setSy("");
    setDateFrom("");
    setDateTo("");
    setFilters(initialFilters);
  };
  const goToPageNumber = () => {
    const page = Number.parseInt(goToPage, 10);
    if (!Number.isInteger(page)) return;
    updateFilters({
      page: Math.min(Math.max(1, page), query.data?.meta.last_page ?? 1),
    });
    setGoToPage("");
  };
  const sort = (column: AssessmentFilters["sort"]) =>
    updateFilters({
      page: 1,
      sort: column,
      direction:
        filters.sort === column && filters.direction === "asc" ? "desc" : "asc",
    });
  const sortIcon = (column: AssessmentFilters["sort"]) =>
    filters.sort !== column ? (
      <ArrowUpDown className="ml-1 size-3.5 opacity-50" />
    ) : filters.direction === "asc" ? (
      <ArrowUp className="ml-1 size-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 size-3.5 text-primary" />
    );
  const remove = async (assessment: Assessment) => {
    if (
      !window.confirm(
        `Delete assessment ${assessment.reference_number}? This action cannot be undone.`,
      )
    )
      return;
    await deleteAssessment(assessment.id);
    await queryClient.invalidateQueries({ queryKey: ["assessments"] });
  };

  return (
    <div className="min-h-screen w-full min-w-0 space-y-4 bg-page-background">
      <title>Index Assessment</title>
      <Card className="rounded-2xl bg-card px-2! py-2! shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between p-3">
          <div>
            <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              Assessments
            </CardTitle>
            <CardDescription className="mt-1">
              Review, filter, and manage submitted assessment requests.
            </CardDescription>
          </div>
          {/* <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="gap-1.5"
          >
            <RefreshCw
              className={query.isFetching ? "size-4 animate-spin" : "size-4"}
            />
            {query.isFetching ? "Reloading..." : "Reload"}
          </Button> */}
        </CardHeader>
      </Card>
      <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <form
            onSubmit={applyFilters}
            className="flex items-center justify-between gap-3 px-4 py-4"
          >
            <div className="flex w-full flex-col gap-3">
              <div className="flex w-full items-center gap-2">
                <Input
                  placeholder="Search for reference number, first/last name, email"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl px-4 text-sm sm:w-150 sm:flex-none"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  aria-label="Search assessments"
                >
                  <Search className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={resetFilters}
                  title="Reset table"
                  className="h-10 w-10 shrink-0 rounded-xl"
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0 rounded-xl"
                        aria-label="Choose visible columns"
                      />
                    }
                  >
                    <Columns3 className="size-4" />
                    <span className="hidden sm:inline">Columns</span>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3">
                    <p className="mb-2 text-sm font-semibold">
                      Visible columns
                    </p>
                    <div className="grid gap-1">
                      {Object.entries({
                        email: "Email",
                        course: "Course",
                        enrolledUnder: "Enrolled Under",
                        schoolYear: "SY Last Attended",
                        semester: "Semester",
                        submitted: "Submitted",
                        status: "Status",
                      }).map(([column, label]) => (
                        <label
                          key={column}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                        >
                          <Checkbox
                            checked={visibleColumns[column]}
                            onCheckedChange={() => toggleColumn(column)}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-full overflow-x-auto rounded-xl border border-border/70 bg-muted/20 p-3">
                <table className="w-full min-w-190 table-fixed border-collapse">
                  <thead>
                    <tr>
                      <th colSpan={2} className="w-2/5 border-b border-r border-border/70 px-3 pb-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Date range
                      </th>
                      <th colSpan={4} className="border-b border-border/70 px-3 pb-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Filters
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="w-1/5 border-r border-border/70 px-3 pt-3 align-top">
                        <DateFilter
                          label="From date"
                          value={dateFrom}
                          max={toDate(dateTo)}
                          onChange={setDateFrom}
                        />
                      </td>
                      <td className="w-1/5 border-r border-border/70 px-3 pt-3 align-top">
                        <DateFilter
                          label="To date"
                          value={dateTo}
                          min={toDate(dateFrom)}
                          onChange={setDateTo}
                        />
                      </td>
                      <td colSpan={4} className="px-3 pt-3 align-top">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <FilterCombobox
                            label="Status"
                            value={status}
                            options={statuses.map((value) => ({
                              value,
                              label: statusLabel(value),
                            }))}
                            onChange={setStatus}
                          />
                          <FilterCombobox
                            label="Course"
                            value={courseId}
                            options={(coursesQuery.data?.data ?? []).map(
                              (course) => ({
                                value: String(course.id),
                                label: `${course.course_code} - ${course.course_desc}`,
                              }),
                            )}
                            onChange={setCourseId}
                          />
                          <FilterCombobox
                            label="Enrolled Under"
                            value={enrolled}
                            options={enrolledUnder}
                            onChange={setEnrolled}
                          />
                          <FilterCombobox
                            label="Semester"
                            value={semester}
                            options={semesters}
                            onChange={setSemester}
                          />
                          <FilterCombobox
                            label="SY Last Attended"
                            value={sy}
                            options={schoolYears}
                            onChange={setSy}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {query.isError ? (
            <p className="p-6 text-destructive">
              Unable to load assessments: {query.error.message}
            </p>
          ) : query.data.data.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              No assessments matched your filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4!">
                    <button
                      className="inline-flex items-center"
                      onClick={() => sort("reference_number")}
                    >
                      Reference No. {sortIcon("reference_number")}
                    </button>
                  </TableHead>
                  <TableHead>Name</TableHead>
                  {visibleColumns.email && <TableHead>Email</TableHead>}
                  {visibleColumns.course && <TableHead>Course</TableHead>}
                  {visibleColumns.enrolledUnder && (
                    <TableHead>Enrolled Under</TableHead>
                  )}
                  {visibleColumns.schoolYear && (
                    <TableHead>SY Last Attended</TableHead>
                  )}
                  {visibleColumns.semester && <TableHead>Semester</TableHead>}
                  {visibleColumns.submitted && (
                    <TableHead>
                      <button
                        className="inline-flex items-center"
                        onClick={() => sort("created_at")}
                      >
                        Submitted {sortIcon("created_at")}
                      </button>
                    </TableHead>
                  )}
                  {visibleColumns.status && <TableHead>Status</TableHead>}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((assessment) => (
                  <TableRow
                    key={assessment.id}
                    className="even:bg-gray-100 dark:even:bg-muted/30 hover:bg-gray-600/20 dark:hover:bg-muted/50"
                  >
                    <TableCell className="px-3! py-2! pl-4! font-medium text-primary">
                      {assessment.reference_number}
                    </TableCell>
                    <TableCell className="py-2!">
                      {fullName(assessment)}
                    </TableCell>
                    {visibleColumns.email && (
                      <TableCell className="py-2!">
                        {assessment.email}
                      </TableCell>
                    )}
                    {visibleColumns.course && (
                      <TableCell className="py-2! text-left">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="cursor-default">
                              <span className="inline-flex cursor-default rounded-full bg-blue-400 px-3 py-1 text-xs font-semibold text-white">
                                {assessment.course?.course_code ?? "Unassigned"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="inline-start"
                              className="bg-blue-500 text-white"
                            >
                              {assessment.course?.course_desc ??
                                "No course assigned"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    )}
                    {visibleColumns.enrolledUnder && (
                      <TableCell className="py-2!">
                        <Badge
                          variant={badgeVariant(assessment.enrolled_under)}
                        >
                          {assessment.enrolled_under}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.schoolYear && (
                      <TableCell className="py-2!">
                        {assessment.sy_last_attended}
                      </TableCell>
                    )}
                    {visibleColumns.semester && (
                      <TableCell className="py-2!">
                        <Badge variant={badgeVariant(assessment.semester)}>
                          {assessment.semester}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.submitted && (
                      <TableCell className="py-2!">
                        {formatDate(assessment.created_at)}
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell className="py-2!">
                        <Badge variant={badgeVariant(assessment.status)}>
                          {assessment.status
                            ? assessment.status[0].toUpperCase() +
                              assessment.status.slice(1)
                            : "Unknown"}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="py-2!">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/staff/assessments/${assessment.id}/edit`}
                          className="inline-flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white transition-colors hover:bg-amber-600"
                          aria-label={`Edit ${assessment.reference_number}`}
                          title={`Edit ${assessment.reference_number}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                        {isAdmin && (
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600"
                            aria-label={`Delete ${assessment.reference_number}`}
                            title={`Delete ${assessment.reference_number}`}
                            onClick={() => void remove(assessment)}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {query.data && (
          <CardFooter className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3">
            <p className="justify-self-start text-sm text-muted-foreground">
              Showing{" "}
              {query.data.data.length
                ? (query.data.meta.current_page - 1) *
                    query.data.meta.per_page +
                  1
                : 0}
              –
              {Math.min(
                query.data.meta.current_page * query.data.meta.per_page,
                query.data.meta.total,
              )}{" "}
              of {query.data.meta.total}
            </p>
            <div className="flex items-center gap-2 justify-self-end">
              <label
                htmlFor="assessment-go-to-page"
                className="whitespace-nowrap text-sm text-muted-foreground"
              >
                Go to page:
              </label>
              <Input
                id="assessment-go-to-page"
                type="number"
                min={1}
                max={query.data.meta.last_page}
                value={goToPage}
                onChange={(event) => setGoToPage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") goToPageNumber();
                }}
                className="h-8 w-16 rounded-lg px-2 text-center"
                aria-label="Page number"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={goToPageNumber}
                disabled={!goToPage}
                className="h-8 rounded-lg"
              >
                Go
              </Button>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      // disabled={filters.page === 1 || query.isFetching}
                      onClick={() =>
                        updateFilters({
                          page: Math.max(1, (filters.page ?? 1) - 1),
                        })
                      }
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: query.data.meta.last_page },
                    (_, index) => index + 1,
                  )
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === query.data.meta.last_page ||
                        Math.abs(page - query.data.meta.current_page) <= 1,
                    )
                    .map((page, index, pages) => (
                      <span key={page} className="contents">
                        {index > 0 && pages[index - 1] !== page - 1 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={page === query.data.meta.current_page}
                            // disabled={query.isFetching}
                            onClick={() => updateFilters({ page })}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </span>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      disabled={
                        filters.page === query.data.meta.last_page ||
                        query.isFetching
                      }
                      onClick={() =>
                        updateFilters({
                          page: Math.min(
                            query.data.meta.last_page,
                            (filters.page ?? 1) + 1,
                          ),
                        })
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
