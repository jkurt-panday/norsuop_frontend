import { useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { ApiError } from "../../api/client";
import { type MasterResource, type MasterRecord } from "./api";
import { useMasterRecords } from "./queries";
import RequestTable, { type ColumnDef, type SortOptionDef, type StatusOption } from "@/components/ui/request-table";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Landmark, CreditCard, Users, Shield, FileText, GraduationCap, Building, School, Pencil, Trash2 } from "lucide-react";

const labels: Record<MasterResource, string> = {
  memberships: "Memberships",
  "payment-options": "Payment options",
  "bank-accounts": "Bank accounts",
  uacs: "UACS",
  "authorized-officials": "Authorized officials",
  courses: "Courses",
  "academic-terms": "Academic terms",
  "college-offices": "College offices",
};

const resourceIcons: Record<MasterResource, LucideIcon> = {
  memberships: Users,
  "payment-options": CreditCard,
  "bank-accounts": Landmark,
  uacs: FileText,
  "authorized-officials": Shield,
  courses: GraduationCap,
  "academic-terms": School,
  "college-offices": Building,
};

const columnConfigs: Record<MasterResource, ColumnDef<MasterRecord>[]> = {
  memberships: [
    { header: "Code", sortable: "member_code", render: (r) => <span className="font-mono text-sm">{String(r.member_code ?? "")}</span> },
    { header: "Description", sortable: "member_desc", render: (r) => <span>{String(r.member_desc ?? "")}</span> },
  ],
  "payment-options": [
    { header: "Payment Option", sortable: "payment_desc", render: (r) => <span>{String(r.payment_desc ?? "")}</span> },
  ],
  "bank-accounts": [
    { header: "Account Name", sortable: "account_name", render: (r) => <span>{String(r.account_name ?? "")}</span> },
    { header: "Bank", sortable: "bank_name", render: (r) => <span>{String(r.bank_name ?? "")}</span> },
    { header: "Account #", sortable: "account_num", render: (r) => <span className="font-mono text-sm">{String(r.account_num ?? "")}</span> },
    { header: "Fund Cluster", sortable: "fund_cluster", render: (r) => <span>{String(r.fund_cluster ?? "")}</span> },
  ],
  uacs: [
    { header: "UACS Code", sortable: "uacs_object_code", render: (r) => <span className="font-mono text-sm">{String(r.uacs_object_code ?? "")}</span> },
    { header: "Account Title", sortable: "account_title", render: (r) => <span>{String(r.account_title ?? "")}</span> },
  ],
  "authorized-officials": [
    { header: "Name", sortable: "name", render: (r) => <span>{String(r.name ?? "")}</span> },
    { header: "Position", sortable: "position", render: (r) => <span>{String(r.position ?? "")}</span> },
    { header: "Office", sortable: "office", render: (r) => <span>{String(r.office ?? "")}</span> },
  ],
  courses: [
    { header: "Code", sortable: "course_code", render: (r) => <span className="font-mono text-sm">{String(r.course_code ?? "")}</span> },
    { header: "Description", sortable: "course_desc", render: (r) => <span>{String(r.course_desc ?? "")}</span> },
    { header: "College", sortable: "course_college", render: (r) => <span>{String(r.course_college ?? "")}</span> },
  ],
  "academic-terms": [
    { header: "School Year", sortable: "school_year", render: (r) => <span>{String(r.school_year ?? "")}</span> },
    { header: "Semester", sortable: "semester", render: (r) => <span>{String(r.semester ?? "")}</span> },
  ],
  "college-offices": [
    { header: "Name", sortable: "name", render: (r) => <span>{String(r.name ?? "")}</span> },
  ],
};

const sortOptions: Record<MasterResource, SortOptionDef[]> = {
  memberships: [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "Code A–Z", sort: "member_code", direction: "asc" },
    { label: "Code Z–A", sort: "member_code", direction: "desc" },
  ],
  "payment-options": [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "payment_desc", direction: "asc" },
    { label: "Z–A", sort: "payment_desc", direction: "desc" },
  ],
  "bank-accounts": [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "account_name", direction: "asc" },
    { label: "Z–A", sort: "account_name", direction: "desc" },
  ],
  uacs: [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "account_title", direction: "asc" },
    { label: "Z–A", sort: "account_title", direction: "desc" },
  ],
  "authorized-officials": [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "name", direction: "asc" },
    { label: "Z–A", sort: "name", direction: "desc" },
  ],
  courses: [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "course_code", direction: "asc" },
    { label: "Z–A", sort: "course_code", direction: "desc" },
  ],
  "academic-terms": [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "school_year", direction: "asc" },
    { label: "Z–A", sort: "school_year", direction: "desc" },
  ],
  "college-offices": [
    { label: "Newest", sort: "created_at", direction: "desc" },
    { label: "Oldest", sort: "created_at", direction: "asc" },
    { label: "A–Z", sort: "name", direction: "asc" },
    { label: "Z–A", sort: "name", direction: "desc" },
  ],
};

const emptyIcons: Record<MasterResource, React.ComponentType<{ className?: string }>> = {
  memberships: Users,
  "payment-options": CreditCard,
  "bank-accounts": Landmark,
  uacs: FileText,
  "authorized-officials": Shield,
  courses: GraduationCap,
  "academic-terms": School,
  "college-offices": Building,
};

const emptyMessages: Record<MasterResource, string> = {
  memberships: "No memberships found",
  "payment-options": "No payment options found",
  "bank-accounts": "No bank accounts found",
  uacs: "No UACS codes found",
  "authorized-officials": "No authorized officials found",
  courses: "No courses found",
  "academic-terms": "No academic terms found",
  "college-offices": "No college offices found",
};

const statusOptions: Record<MasterResource, StatusOption[]> = {
  memberships: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  "payment-options": [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  "bank-accounts": [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  uacs: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  "authorized-officials": [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  courses: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  "academic-terms": [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
  "college-offices": [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
};

interface MasterDataPageProps {
  initialResource?: MasterResource;
}

export function MasterDataPage({ initialResource = "memberships" }: MasterDataPageProps) {
  const navigate = useNavigate();
  const resource = initialResource;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const columns = useMemo(() => columnConfigs[resource] ?? [], [resource]);
  const currentSortOptions = useMemo(() => sortOptions[resource] ?? [], [resource]);
  const currentEmptyIcon = useMemo(() => emptyIcons[resource], [resource]);
  const currentEmptyMessage = useMemo(() => emptyMessages[resource], [resource]);
  const HeaderIcon = useMemo(() => resourceIcons[resource], [resource]);
  const currentStatusOptions = useMemo(() => statusOptions[resource] ?? [], [resource]);

  const query = useMasterRecords(resource, { page, search, sort, direction, filters: { status, date_from: dateFrom, date_to: dateTo } });

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleSortChange = useCallback((newSort: string, newDirection: "asc" | "desc") => {
    setSort(newSort);
    setDirection(newDirection);
    setPage(1);
  }, []);

  const handleFilterSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  }, []);

  const handleFilterReset = useCallback(() => {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setSort("");
    setDirection("asc");
    setPage(1);
  }, []);

  if (query.isPending) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 pb-12 px-4">
        <div className="flex flex-col gap-4 border-b border-border pb-5">
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      </main>
    );
  }

  if (query.isError) {
    return (
      <main className="mx-auto max-w-7xl space-y-6 pb-12 px-4">
        <div className="flex flex-col gap-4 border-b border-border pb-5">
          <h1 className="text-3xl font-bold tracking-tight text-destructive">Unable to load master data</h1>
          <p className="text-muted-foreground">
            {query.error instanceof ApiError ? query.error.message : "Loading failed."}
          </p>
        </div>
      </main>
    );
  }

  const data = query.data.data;
  const meta = query.data.meta;
  const total = meta?.total ?? 0;
  const lastPage = meta?.last_page ?? 1;
  const currentPage = meta?.current_page ?? 1;

  const paginatedData = {
    data,
    links: [],
    from: ((currentPage - 1) * (meta?.per_page ?? 10)) + 1,
    to: Math.min(currentPage * (meta?.per_page ?? 10), total),
    total,
    current_page: currentPage,
    last_page: lastPage,
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 pb-12 px-4">
      <RequestTable<MasterRecord>
        title={labels[resource]}
        description={`Manage ${labels[resource].toLowerCase()} for the Order of Payment system.`}
        icon={HeaderIcon}
        addLabel={`Add ${labels[resource].slice(0, -1)}`}
        addHref={`/staff/${resource}/create`}
        columns={columns}
        resource={paginatedData}
        resourceKey={resource}
        renderActions={(row: MasterRecord) => (
          <>
            <Link
              to={`/staff/${resource}/${row.id}/edit`}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-amber-600 text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-neutral-950"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-red-600 hover:bg-red-600/10 hover:text-red-600"
              onClick={() => {
                if (window.confirm(`Delete ${labels[resource].slice(0, -1).toLowerCase()}?`)) {
                  navigate(`/staff/${resource}/${row.id}/delete`);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
        emptyIcon={currentEmptyIcon}
        emptyMessage={currentEmptyMessage}
        onPageChange={setPage}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={`Search ${labels[resource].toLowerCase()}...`}
        status={status}
        onStatusChange={setStatus}
        statusOptions={currentStatusOptions}
        statusPlaceholder="All Statuses"
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        onFilterSubmit={handleFilterSubmit}
        onFilterReset={handleFilterReset}
        sortOptions={currentSortOptions}
        enableColumnSorting={true}
        highlightDuration={2000}
        actionsWidth="110px"
        sort={sort}
        direction={direction}
        onSortChange={handleSortChange}
      />
    </main>
  );
}