import { useState } from "react";
import { CreditCard } from "lucide-react";
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
import { type MasterList, type PaymentOption } from "./api";
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

export function PaymentOptionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState<string>("id");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentOption | null>(null);
  const [formPaymentDesc, setFormPaymentDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } =
    useMasterRecords<PaymentOption>("payment-options", {
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
    setFormPaymentDesc("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: PaymentOption) => {
    setEditingItem(item);
    setFormPaymentDesc(item.payment_desc);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const desc = formPaymentDesc.trim();
    if (!desc) {
      setFormError("Payment description is required.");
      return;
    }

    const payload = { payment_desc: desc };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          resource: "payment-options",
          id: editingItem.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync({
          resource: "payment-options",
          payload,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setFormError(errObj?.message || "Failed to save payment option.");
    }
  };

  const handleDelete = async (row: PaymentOption) => {
    await deleteMutation.mutateAsync({
      resource: "payment-options",
      id: row.id,
    });
  };

  const columns: ColumnDef<PaymentOption>[] = [
    {
      header: "ID",
      sortable: "id",
      render: (row, index) =>
        row.display_number ?? (page - 1) * 20 + index + 1,
    },
    {
      header: "Payment Description",
      sortable: "payment_desc",
      render: (row) => row.payment_desc,
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
      <ResourceTable<PaymentOption>
        title="Payment Detail Options"
        icon={CreditCard}
        addLabel="Add Payment Option"
        onAdd={handleOpenAdd}
        columns={columns}
        data={data as MasterList<PaymentOption>}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyIcon={CreditCard}
        emptyMessage="No payment detail options found"
        deleteConfirmMessage="Are you sure you want to delete this payment option?"
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
          { label: "A–Z", sort: "payment_desc", direction: "asc" },
          { label: "Z–A", sort: "payment_desc", direction: "desc" },
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
              {editingItem ? "Edit Payment Option" : "Add Payment Option"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="payment_desc">Payment Description *</Label>
              <Input
                id="payment_desc"
                value={formPaymentDesc}
                onChange={(e) => setFormPaymentDesc(e.target.value)}
                placeholder="e.g. Tuition Fee"
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

export default PaymentOptionsPage;
