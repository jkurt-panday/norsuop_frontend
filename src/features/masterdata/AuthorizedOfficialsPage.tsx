import { useState } from "react";
import { CheckCircle2, Shield, Users } from "lucide-react";
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
import { type AuthorizedOfficial, type MasterList } from "./api";
import { ResourceTable, type ColumnDef } from "./components/ResourceTable";
import {
  useCreateMasterRecord,
  useDeleteMasterRecord,
  useSetActiveOfficial,
  useUpdateMasterRecord,
} from "./mutations";
import { useMasterRecords } from "./queries";

const formatDate = (dateString?: string): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function AuthorizedOfficialsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState<string>("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  // Feedback state for actions (e.g. Set Active)
  const [toastFeedback, setToastFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AuthorizedOfficial | null>(
    null,
  );
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formCourse, setFormCourse] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } =
    useMasterRecords<AuthorizedOfficial>("authorized-officials", {
      page,
      search: submittedSearch,
      sort,
      direction,
    });

  const createMutation = useCreateMasterRecord();
  const updateMutation = useUpdateMasterRecord();
  const deleteMutation = useDeleteMasterRecord();
  const setActiveMutation = useSetActiveOfficial();

  const showToast = (type: "success" | "error", text: string) => {
    setToastFeedback({ type, text });
    setTimeout(() => {
      setToastFeedback((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormPosition("");
    setFormCourse("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AuthorizedOfficial) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPosition(item.position);
    setFormCourse(item.course ?? "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formName.trim();
    const position = formPosition.trim();

    if (!name || !position) {
      setFormError("Name and position are required.");
      return;
    }

    const payload = {
      name,
      position,
      course: formCourse.trim() ? formCourse.trim() : null,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          resource: "authorized-officials",
          id: editingItem.id,
          payload,
        });
        showToast("success", "Authorized official updated successfully.");
      } else {
        await createMutation.mutateAsync({
          resource: "authorized-officials",
          payload,
        });
        showToast("success", "Authorized official created successfully.");
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setFormError(errObj?.message || "Failed to save authorized official.");
    }
  };

  const handleDelete = async (row: AuthorizedOfficial) => {
    try {
      await deleteMutation.mutateAsync({
        resource: "authorized-officials",
        id: row.id,
      });
      showToast("success", "Authorized official deleted successfully.");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast(
        "error",
        errObj?.message || "Failed to delete authorized official.",
      );
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      await setActiveMutation.mutateAsync(id);
      showToast("success", "Authorized official set as active.");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast(
        "error",
        errObj?.message || "Failed to set official as active.",
      );
    }
  };

  const columns: ColumnDef<AuthorizedOfficial>[] = [
    {
      header: "Name",
      sortable: "name",
      width: "280px",
      render: (row) => (
        <span className="block font-medium text-foreground">{row.name}</span>
      ),
    },
    {
      header: "Position",
      sortable: "position",
      render: (row) => row.position,
    },
    {
      header: "Course / Credentials",
      sortable: "course",
      render: (row) => row.course ?? "—",
    },
    {
      header: "Active Status",
      sortable: "is_active",
      width: "140px",
      render: (row) =>
        row.is_active ? (
          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border dark:border-emerald-800/40 dark:bg-emerald-950/50 dark:text-emerald-400">
            Current
          </span>
        ) : (
          <button
            type="button"
            onClick={() => handleSetActive(row.id)}
            disabled={setActiveMutation.isPending}
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            title="Set as current signatory"
          >
            <Shield className="h-3 w-3" />
            Set Active
          </button>
        ),
    },
    {
      header: "Date Added",
      sortable: "created_at",
      width: "160px",
      render: (row) => formatDate(row.created_at),
      className: "whitespace-nowrap text-muted-foreground",
    },
  ];

  return (
    <>
      {toastFeedback && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toastFeedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100"
              : "border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastFeedback.text}</span>
        </div>
      )}

      <ResourceTable<AuthorizedOfficial>
        title="Authorized Officials"
        icon={Users}
        addLabel="Add Authorized Official"
        onAdd={handleOpenAdd}
        columns={columns}
        data={data as MasterList<AuthorizedOfficial>}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyIcon={Users}
        emptyMessage="No authorized officials found"
        deleteConfirmMessage="Are you sure you want to delete this authorized official?"
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
          { label: "A–Z (Name)", sort: "name", direction: "asc" },
          { label: "Newest", sort: "created_at", direction: "desc" },
          { label: "Oldest", sort: "created_at", direction: "asc" },
        ]}
        onPageChange={setPage}
        onReload={() => refetch()}
        onReset={() => {
          setSearch("");
          setSubmittedSearch("");
          setSort("name");
          setDirection("asc");
          setPage(1);
        }}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? "Edit Authorized Official"
                : "Add Authorized Official"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="official_name">Name *</Label>
              <Input
                id="official_name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Dr. Jane Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="official_position">Position *</Label>
              <Input
                id="official_position"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="e.g. University Registrar"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="official_course">
                Course / Credentials (Optional)
              </Label>
              <Input
                id="official_course"
                value={formCourse}
                onChange={(e) => setFormCourse(e.target.value)}
                placeholder="e.g. Ph.D., Ed.D."
              />
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

export default AuthorizedOfficialsPage;
