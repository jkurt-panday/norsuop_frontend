import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Course, type MasterList } from "./api";
import { ResourceTable, type ColumnDef } from "./components/ResourceTable";
import {
  useCreateMasterRecord,
  useDeleteMasterRecord,
  useUpdateMasterRecord,
} from "./mutations";
import { useMasterRecords } from "./queries";

export function CoursesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState<string>("id");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [collegeFilter, setCollegeFilter] = useState<string>("");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Course | null>(null);
  const [formCourseCode, setFormCourseCode] = useState("");
  const [formCourseDesc, setFormCourseDesc] = useState("");
  const [formCourseCollege, setFormCourseCollege] = useState<
    "Graduate School" | "School of Law"
  >("Graduate School");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useMasterRecords<Course>(
    "courses",
    {
      page,
      search: submittedSearch,
      sort,
      direction,
      filters: collegeFilter ? { college: collegeFilter } : undefined,
    },
  );

  const createMutation = useCreateMasterRecord();
  const updateMutation = useUpdateMasterRecord();
  const deleteMutation = useDeleteMasterRecord();

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormCourseCode("");
    setFormCourseDesc("");
    setFormCourseCollege("Graduate School");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Course) => {
    setEditingItem(item);
    setFormCourseCode(item.course_code);
    setFormCourseDesc(item.course_desc);
    setFormCourseCollege(
      item.course_college === "School of Law"
        ? "School of Law"
        : "Graduate School",
    );
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formCourseCode.trim();
    const desc = formCourseDesc.trim();

    if (!code || !desc || !formCourseCollege) {
      setFormError("All fields are required.");
      return;
    }

    const payload = {
      course_code: code,
      course_desc: desc,
      course_college: formCourseCollege,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          resource: "courses",
          id: editingItem.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync({
          resource: "courses",
          payload,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setFormError(errObj?.message || "Failed to save course.");
    }
  };

  const handleDelete = async (row: Course) => {
    await deleteMutation.mutateAsync({
      resource: "courses",
      id: row.id,
    });
  };

  const columns: ColumnDef<Course>[] = [
    {
      header: "ID",
      sortable: "id",
      width: "80px",
      render: (_row, index) =>
        (page - 1) * 20 + index + 1,
    },
    {
      header: "Course Code",
      sortable: "course_code",
      width: "160px",
      render: (row) => (
        <Badge
          variant="secondary"
          className="bg-blue-500/10 font-bold tracking-wide text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
        >
          {row.course_code}
        </Badge>
      ),
    },
    {
      header: "Course Description",
      sortable: "course_desc",
      render: (row) => (
        <span className="font-medium text-foreground">{row.course_desc}</span>
      ),
    },
    {
      header: "College",
      sortable: "course_college",
      width: "180px",
      render: (row) => (
        <Badge
          variant="outline"
          className={
            row.course_college === "Graduate School"
              ? "border-emerald-600/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-purple-600/30 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
          }
        >
          {row.course_college}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <ResourceTable<Course>
        title="Courses"
        icon={GraduationCap}
        addLabel="Add Course"
        onAdd={handleOpenAdd}
        columns={columns}
        data={data as MasterList<Course>}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyIcon={GraduationCap}
        emptyMessage="No courses found"
        deleteConfirmMessage="Are you sure you want to delete this course?"
        filters={
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Filter by College"
              value={collegeFilter}
              onChange={(e) => {
                setCollegeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Colleges</option>
              <option value="Graduate School">Graduate School</option>
              <option value="School of Law">School of Law</option>
            </select>
          </div>
        }
        searchPlaceholder="Search courses..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={() => {
          setPage(1);
          setSubmittedSearch(search);
        }}
        currentSort={sort}
        currentDirection={direction}
        onSortChange={(newSort, newDirection) => {
          setSort(newSort);
          setDirection(newDirection);
        }}
        sortOptions={[
          { label: "Newest", sort: "created_at", direction: "desc" },
          { label: "Oldest", sort: "created_at", direction: "asc" },
          { label: "Code (A–Z)", sort: "course_code", direction: "asc" },
          { label: "Code (Z–A)", sort: "course_code", direction: "desc" },
        ]}
        onPageChange={setPage}
        onReload={() => refetch()}
        onReset={() => {
          setSearch("");
          setSubmittedSearch("");
          setCollegeFilter("");
          setSort("id");
          setDirection("asc");
          setPage(1);
        }}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Course" : "Add Course"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="course_code">Course Code *</Label>
              <Input
                id="course_code"
                value={formCourseCode}
                onChange={(e) => setFormCourseCode(e.target.value)}
                placeholder="e.g. MBA"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course_desc">Course Description *</Label>
              <Input
                id="course_desc"
                value={formCourseDesc}
                onChange={(e) => setFormCourseDesc(e.target.value)}
                placeholder="e.g. Master in Business Administration"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course_college">College *</Label>
              <select
                id="course_college"
                value={formCourseCollege}
                onChange={(e) =>
                  setFormCourseCollege(
                    e.target.value as "Graduate School" | "School of Law",
                  )
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="Graduate School">Graduate School</option>
                <option value="School of Law">School of Law</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CoursesPage;
