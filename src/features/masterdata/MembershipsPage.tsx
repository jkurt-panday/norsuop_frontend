import { useState } from "react";
import { Users } from "lucide-react";
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
import { type MasterList, type Membership } from "./api";
import { ResourceTable, type ColumnDef } from "./components/ResourceTable";
import {
  useCreateMasterRecord,
  useDeleteMasterRecord,
  useUpdateMasterRecord,
} from "./mutations";
import { useMasterRecords } from "./queries";

const formatDate = (dateString?: string): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

export function MembershipsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState<string>("id");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Membership | null>(null);
  const [formMemberCode, setFormMemberCode] = useState("");
  const [formMemberDesc, setFormMemberDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } =
    useMasterRecords<Membership>("memberships", {
      page,
      search: submittedSearch,
      sort,
      direction,
    });

  const createMutation = useCreateMasterRecord();
  const updateMutation = useUpdateMasterRecord();
  const deleteMutation = useDeleteMasterRecord();

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormMemberCode("");
    setFormMemberDesc("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Membership) => {
    setEditingItem(item);
    setFormMemberCode(item.member_code);
    setFormMemberDesc(item.member_desc);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = formMemberCode.trim();
    const desc = formMemberDesc.trim();

    if (!code || !desc) {
      setFormError("Both member code and description are required.");
      return;
    }

    const payload = {
      member_code: code,
      member_desc: desc,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          resource: "memberships",
          id: editingItem.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync({
          resource: "memberships",
          payload,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setFormError(errObj?.message || "Failed to save membership.");
    }
  };

  const handleDelete = async (row: Membership) => {
    await deleteMutation.mutateAsync({
      resource: "memberships",
      id: row.id,
    });
  };

  const columns: ColumnDef<Membership>[] = [
    {
      header: "ID",
      sortable: "id",
      render: (row, index) =>
        row.display_number ?? (page - 1) * 20 + index + 1,
    },
    {
      header: "Member Code",
      sortable: "member_code",
      render: (row) => (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
        >
          {row.member_code}
        </Badge>
      ),
    },
    {
      header: "Description",
      sortable: "member_desc",
      render: (row) => row.member_desc,
    },
    {
      header: "Created At",
      sortable: "created_at",
      render: (row) => formatDate(row.created_at),
      className: "text-muted-foreground",
    },
  ];

  return (
    <>
      <ResourceTable<Membership>
        title="Memberships"
        icon={Users}
        addLabel="Add Membership"
        onAdd={handleOpenAdd}
        columns={columns}
        data={data as MasterList<Membership>}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyIcon={Users}
        emptyMessage="No memberships found"
        deleteConfirmMessage="Are you sure you want to delete this membership?"
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
          { label: "A–Z (Code)", sort: "member_code", direction: "asc" },
          { label: "A–Z (Desc)", sort: "member_desc", direction: "asc" },
        ]}
        onPageChange={setPage}
        onReload={() => refetch()}
        onReset={() => {
          setSearch("");
          setSubmittedSearch("");
          setSort("id");
          setDirection("asc");
          setPage(1);
        }}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Membership" : "Add Membership"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="member_code">Member Code *</Label>
              <Input
                id="member_code"
                value={formMemberCode}
                onChange={(e) => setFormMemberCode(e.target.value)}
                placeholder="e.g. FACULTY"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member_desc">Description *</Label>
              <Input
                id="member_desc"
                value={formMemberDesc}
                onChange={(e) => setFormMemberDesc(e.target.value)}
                placeholder="e.g. University Faculty Member"
                required
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

export default MembershipsPage;
