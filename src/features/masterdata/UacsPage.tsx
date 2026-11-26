import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
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
import { exportUacs, type MasterList, type UACS } from "./api";
import { ResourceTable, type ColumnDef } from "./components/ResourceTable";
import {
  useCreateMasterRecord,
  useDeleteMasterRecord,
  useImportUacs,
  useUpdateMasterRecord,
} from "./mutations";
import { useMasterRecords } from "./queries";

export function UacsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState<string>("id");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const [toastFeedback, setToastFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UACS | null>(null);
  const [formNorsuObjectCode, setFormNorsuObjectCode] = useState("");
  const [formNorsuSubObjectCode, setFormNorsuSubObjectCode] = useState("");
  const [formUacsObjectCode, setFormUacsObjectCode] = useState("");
  const [formUacsSubObjectCode, setFormUacsSubObjectCode] = useState("");
  const [formRcaCode, setFormRcaCode] = useState("");
  const [formAccountTitle, setFormAccountTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isFetching, refetch } = useMasterRecords<UACS>(
    "uacs",
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
  const importMutation = useImportUacs();

  const showToast = (type: "success" | "error", text: string) => {
    setToastFeedback({ type, text });
    setTimeout(() => {
      setToastFeedback((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormNorsuObjectCode("");
    setFormNorsuSubObjectCode("");
    setFormUacsObjectCode("");
    setFormUacsSubObjectCode("");
    setFormRcaCode("");
    setFormAccountTitle("");
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: UACS) => {
    setEditingItem(item);
    setFormNorsuObjectCode(item.norsu_object_code ?? "");
    setFormNorsuSubObjectCode(item.norsu_sub_object_code ?? "");
    setFormUacsObjectCode(item.uacs_object_code ?? "");
    setFormUacsSubObjectCode(item.uacs_sub_object_code ?? "");
    setFormRcaCode(item.rca_code ?? "");
    setFormAccountTitle(item.account_title ?? "");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      norsu_object_code: formNorsuObjectCode.trim() || null,
      norsu_sub_object_code: formNorsuSubObjectCode.trim() || null,
      uacs_object_code: formUacsObjectCode.trim() || null,
      uacs_sub_object_code: formUacsSubObjectCode.trim() || null,
      rca_code: formRcaCode.trim() || null,
      account_title: formAccountTitle.trim() || null,
    };

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          resource: "uacs",
          id: editingItem.id,
          payload,
        });
        showToast("success", "UACS updated successfully.");
      } else {
        await createMutation.mutateAsync({
          resource: "uacs",
          payload,
        });
        showToast("success", "UACS created successfully.");
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setFormError(errObj?.message || "Failed to save UACS record.");
    }
  };

  const handleDelete = async (row: UACS) => {
    try {
      await deleteMutation.mutateAsync({
        resource: "uacs",
        id: row.id,
      });
      showToast("success", "UACS record deleted successfully.");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast("error", errObj?.message || "Failed to delete UACS record.");
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportUacs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uacs_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("success", "UACS export downloaded successfully.");
    } catch {
      showToast("error", "Failed to export UACS records.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await importMutation.mutateAsync(file);
      showToast("success", res.message || "Imported UACS successfully.");
      refetch();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showToast("error", errObj?.message || "Failed to import UACS file.");
    } finally {
      e.target.value = "";
    }
  };

  const columns: ColumnDef<UACS>[] = [
    {
      header: "ID",
      sortable: "id",
      width: "55px",
      render: (row, index) =>
        row.display_number ?? (page - 1) * 20 + index + 1,
    },
    {
      header: "NORSU Object Code",
      sortable: "norsu_object_code",
      width: "105px",
      className: "text-base text-foreground",
      render: (row) => row.norsu_object_code ?? "—",
    },
    {
      header: "NORSU Sub-Object Code",
      sortable: "norsu_sub_object_code",
      width: "105px",
      className: "text-base text-foreground",
      render: (row) => row.norsu_sub_object_code ?? "—",
    },
    {
      header: "UACS Object Code",
      sortable: "uacs_object_code",
      width: "105px",
      className: "text-base text-foreground",
      render: (row) => row.uacs_object_code ?? "—",
    },
    {
      header: "UACS Sub-Object Code",
      sortable: "uacs_sub_object_code",
      width: "105px",
      className: "text-base text-foreground",
      render: (row) => row.uacs_sub_object_code ?? "—",
    },
    {
      header: "RCA Code",
      sortable: "rca_code",
      width: "95px",
      className: "text-base text-foreground",
      render: (row) => row.rca_code ?? "—",
    },
    {
      header: "Account Title",
      sortable: "account_title",
      width: "300px",
      className: "whitespace-normal text-base text-foreground",
      render: (row) => (
        <span className="font-medium text-foreground wrap-break-word">
          {row.account_title ?? "—"}
        </span>
      ),
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

      <ResourceTable<UACS>
        title="UACS"
        icon={FileSpreadsheet}
        addLabel="Add UACS"
        onAdd={handleOpenAdd}
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exporting..." : "Export"}</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>{importMutation.isPending ? "Importing..." : "Import"}</span>
            </Button>
          </div>
        }
        columns={columns}
        data={data as MasterList<UACS>}
        isLoading={isLoading}
        isFetching={isFetching}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        emptyIcon={FileSpreadsheet}
        emptyMessage="No UACS records found"
        deleteConfirmMessage="Are you sure you want to delete this UACS record?"
        searchPlaceholder="Search UACS codes or account titles"
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
          { label: "Account Title (A–Z)", sort: "account_title", direction: "asc" },
          { label: "UACS Code (A–Z)", sort: "uacs_object_code", direction: "asc" },
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
              {editingItem ? "Edit UACS" : "Add UACS"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="norsu_object_code">NORSU Object Code</Label>
              <Input
                id="norsu_object_code"
                value={formNorsuObjectCode}
                onChange={(e) => setFormNorsuObjectCode(e.target.value)}
                placeholder="e.g. 50203010"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="norsu_sub_object_code">NORSU Sub-Object Code</Label>
              <Input
                id="norsu_sub_object_code"
                value={formNorsuSubObjectCode}
                onChange={(e) => setFormNorsuSubObjectCode(e.target.value)}
                placeholder="e.g. 01"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="uacs_object_code">UACS Object Code</Label>
              <Input
                id="uacs_object_code"
                value={formUacsObjectCode}
                onChange={(e) => setFormUacsObjectCode(e.target.value)}
                placeholder="e.g. 5020301000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="uacs_sub_object_code">UACS Sub-Object Code</Label>
              <Input
                id="uacs_sub_object_code"
                value={formUacsSubObjectCode}
                onChange={(e) => setFormUacsSubObjectCode(e.target.value)}
                placeholder="e.g. 00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rca_code">RCA Code</Label>
              <Input
                id="rca_code"
                value={formRcaCode}
                onChange={(e) => setFormRcaCode(e.target.value)}
                placeholder="e.g. RCA-101"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="account_title">Account Title</Label>
              <Input
                id="account_title"
                value={formAccountTitle}
                onChange={(e) => setFormAccountTitle(e.target.value)}
                placeholder="e.g. Office Supplies Expenses"
              />
            </div>
            <DialogFooter className="pt-2">
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

export default UacsPage;
