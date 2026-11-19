import { useState } from "react";
import { Landmark } from "lucide-react";
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
import {
  type BankAccount,
  type MasterList,
} from "./api";
import {
  ResourceTable,
  type ColumnDef,
} from "./components/ResourceTable";
import {
  useCreateMasterRecord,
  useDeleteMasterRecord,
  useUpdateMasterRecord,
} from "./mutations";
import { useMasterRecords } from "./queries";

export function BankAccountsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState<string>("id");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BankAccount | null>(null);
  const [formAccountName, setFormAccountName] = useState("");
  const [formFundCluster, setFormFundCluster] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formAccountNum, setFormAccountNum] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useMasterRecords<BankAccount>(
    "bank-accounts",
    {
      page,
      search: submittedSearch,
      sort,
      direction,
    },
  );

  const createMutation = useCreateMasterRecord();
  const updateMutation = useUpdateMasterRecord();
  const deleteMutation = useDeleteMasterRecord();

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormAccountName("");
    setFormFundCluster("");
    setFormBankName("");
    setFormAccountNum("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: BankAccount) => {
    setEditingItem(item);
    setFormAccountName(item.account_name);
    setFormFundCluster(item.fund_cluster);
    setFormBankName(item.bank_name);
    setFormAccountNum(item.account_num);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      account_name: formAccountName.trim(),
      fund_cluster: formFundCluster.trim(),
      bank_name: formBankName.trim(),
      account_num: formAccountNum.trim(),
    };

    if (
      !payload.account_name ||
      !payload.fund_cluster ||
      !payload.bank_name ||
      !payload.account_num
    ) {
      setFormError("All fields are required.");
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          resource: "bank-accounts",
          id: editingItem.id,
          payload,
        });
      } else {
        await createMutation.mutateAsync({
          resource: "bank-accounts",
          payload,
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setFormError(errObj?.message || "Failed to save bank account.");
    }
  };

  const handleDelete = async (row: BankAccount) => {
    await deleteMutation.mutateAsync({
      resource: "bank-accounts",
      id: row.id,
    });
  };

  const columns: ColumnDef<BankAccount>[] = [
    {
      header: "ID",
      sortable: "id",
      render: (row, index) =>
        row.display_number ?? (page - 1) * 20 + index + 1,
    },
    {
      header: "Account Name",
      sortable: "account_name",
      render: (row) => row.account_name,
    },
    {
      header: "Fund Cluster",
      sortable: "fund_cluster",
      render: (row) =>
        row.fund_cluster?.trim() ? row.fund_cluster : "N/A",
    },
    {
      header: "Bank Name",
      sortable: "bank_name",
      render: (row) => (
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
        >
          {row.bank_name}
        </Badge>
      ),
    },
    {
      header: "Account Number",
      sortable: "account_num",
      render: (row) => (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
          {row.account_num}
        </code>
      ),
    },
  ];

  return (
    <>
      <ResourceTable<BankAccount>
        title="Bank Account Information"
        icon={Landmark}
        addLabel="Add Bank Account"
        onAdd={handleOpenAdd}
        columns={columns}
        data={data as MasterList<BankAccount>}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyIcon={Landmark}
        emptyMessage="No bank accounts found"
        deleteConfirmMessage="Are you sure you want to delete this bank account?"
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
          { label: "A–Z", sort: "account_name", direction: "asc" },
          { label: "Z–A", sort: "account_name", direction: "desc" },
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
              {editingItem ? "Edit Bank Account" : "Add Bank Account"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                value={formAccountName}
                onChange={(e) => setFormAccountName(e.target.value)}
                placeholder="Enter account name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fund_cluster">Fund Cluster *</Label>
              <Input
                id="fund_cluster"
                value={formFundCluster}
                onChange={(e) => setFormFundCluster(e.target.value)}
                placeholder="Enter fund cluster"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={formBankName}
                onChange={(e) => setFormBankName(e.target.value)}
                placeholder="Enter bank name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_num">Account Number *</Label>
              <Input
                id="account_num"
                value={formAccountNum}
                onChange={(e) => setFormAccountNum(e.target.value)}
                placeholder="Enter account number"
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
export default BankAccountsPage;
