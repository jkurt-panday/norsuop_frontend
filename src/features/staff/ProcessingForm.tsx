import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { ApiError } from "../../api/client";
import { useProcessStaffRequest } from "./processingMutations";
import type { BankAccount, UacsItem } from "./api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProcessingFormProps {
  id: number;
  bankAccounts?: BankAccount[];
  uacsList?: UacsItem[];
  onComplete?: () => void;
  initialValues?: {
    status?: string;
    fundcluster_id?: number;
    uacs_id?: number;
    ref_date?: string | null;
    purpose?: string | null;
  };
}

export function ProcessingForm({
  id,
  bankAccounts = [],
  uacsList = [],
  onComplete,
  initialValues,
}: ProcessingFormProps) {
  const mutation = useProcessStaffRequest();
  const today = new Date().toISOString().slice(0, 10);

  const [status, setStatus] = useState(initialValues?.status ?? "processed");
  const [fundclusterId, setFundclusterId] = useState(
    initialValues?.fundcluster_id ? String(initialValues.fundcluster_id) : ""
  );
  const [uacsId, setUacsId] = useState(
    initialValues?.uacs_id ? String(initialValues.uacs_id) : ""
  );
  const [refDate, setRefDate] = useState(initialValues?.ref_date ?? today);
  const [purpose, setPurpose] = useState(initialValues?.purpose ?? "");
  const [uacsSearch, setUacsSearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const filteredUacs = uacsList.filter((item) => {
    if (!uacsSearch.trim()) return true;
    const term = uacsSearch.toLowerCase();
    return (
      item.uacs_object_code.toLowerCase().includes(term) ||
      item.account_title.toLowerCase().includes(term)
    );
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};

    if (!fundclusterId) {
      errors.fundcluster_id = "Please select a bank account.";
    }
    if (!uacsId) {
      errors.uacs_id = "Please select a UACS account code.";
    }
    if (!refDate) {
      errors.ref_date = "Reference date is required.";
    } else if (refDate > today) {
      errors.ref_date = "Reference date cannot be in the future.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    mutation.mutate(
      {
        id,
        payload: {
          form_input_id: id,
          status,
          fundcluster_id: Number(fundclusterId),
          uacs_id: Number(uacsId),
          ref_date: refDate,
          purpose: purpose.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onComplete?.();
        },
      }
    );
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Process Order of Payment</CardTitle>
        <CardDescription className="text-xs">
          Assign fund cluster, accounting classification code, and date for cashier collection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mutation.isError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Processing error</p>
                <p className="text-xs">
                  {mutation.error instanceof ApiError
                    ? mutation.error.message
                    : mutation.error instanceof Error
                      ? mutation.error.message
                      : "Processing failed. Please check form values."}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Processing Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="processed">Ready for Payment (Processed)</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>

            {/* Reference Date */}
            <div className="space-y-1.5">
              <Label htmlFor="ref_date">Reference Date</Label>
              <Input
                id="ref_date"
                type="date"
                max={today}
                value={refDate}
                onChange={(e) => {
                  setRefDate(e.target.value);
                  if (fieldErrors.ref_date) {
                    setFieldErrors((prev) => ({ ...prev, ref_date: "" }));
                  }
                }}
                aria-invalid={!!fieldErrors.ref_date}
                required
              />
              {fieldErrors.ref_date && (
                <p className="text-xs text-destructive">{fieldErrors.ref_date}</p>
              )}
            </div>
          </div>

          {/* Bank Account */}
          <div className="space-y-1.5">
            <Label htmlFor="bank_account">Bank Account / Fund Cluster</Label>
            {bankAccounts.length === 0 ? (
              <Input
                id="bank_account"
                type="number"
                min="1"
                placeholder="Enter Bank Account ID"
                value={fundclusterId}
                onChange={(e) => setFundclusterId(e.target.value)}
                required
              />
            ) : (
              <select
                id="bank_account"
                value={fundclusterId}
                onChange={(e) => {
                  setFundclusterId(e.target.value);
                  if (fieldErrors.fundcluster_id) {
                    setFieldErrors((prev) => ({ ...prev, fundcluster_id: "" }));
                  }
                }}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a Bank Account...</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} — {account.account_name} ({account.account_num})
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.fundcluster_id && (
              <p className="text-xs text-destructive">{fieldErrors.fundcluster_id}</p>
            )}
          </div>

          {/* UACS Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="uacs_code">UACS Account Code</Label>
              {uacsList.length > 5 && (
                <span className="text-[11px] text-muted-foreground">
                  {filteredUacs.length} available
                </span>
              )}
            </div>

            {uacsList.length > 8 && (
              <Input
                placeholder="Filter UACS by code or description..."
                value={uacsSearch}
                onChange={(e) => setUacsSearch(e.target.value)}
                className="h-7 text-xs"
              />
            )}

            {uacsList.length === 0 ? (
              <Input
                id="uacs_code"
                type="number"
                min="1"
                placeholder="Enter UACS ID"
                value={uacsId}
                onChange={(e) => setUacsId(e.target.value)}
                required
              />
            ) : (
              <select
                id="uacs_code"
                value={uacsId}
                onChange={(e) => {
                  setUacsId(e.target.value);
                  if (fieldErrors.uacs_id) {
                    setFieldErrors((prev) => ({ ...prev, uacs_id: "" }));
                  }
                }}
                className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select UACS Code...</option>
                {filteredUacs.map((uacs) => (
                  <option key={uacs.id} value={uacs.id}>
                    {uacs.uacs_object_code} — {uacs.account_title}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.uacs_id && (
              <p className="text-xs text-destructive">{fieldErrors.uacs_id}</p>
            )}
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="purpose">Purpose / Remarks (Optional)</Label>
              <span className="text-[11px] text-muted-foreground">
                {purpose.length}/350
              </span>
            </div>
            <Textarea
              id="purpose"
              maxLength={350}
              placeholder="Provide specific payment purpose or ledger notes..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="h-18 resize-none text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="gap-1.5"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Confirm Processing</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
