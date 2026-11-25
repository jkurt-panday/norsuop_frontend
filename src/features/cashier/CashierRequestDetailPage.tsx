import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  Building,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { ApiError } from "../../api/client";
import {
  getCashierAmount,
  getCashierOrDate,
  getCashierOrNo,
  getCashierPayorName,
  getCashierReferenceNumber,
  getCashierStatus,
} from "./api";
import { useCashierPayment } from "./mutations";
import { useCashierRequest } from "./queries";
import { CashierRequestDetailSkeleton } from "./CashierRequestDetailSkeleton";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function parseDateInput(value: string) {
  return value ? parseISO(value) : undefined;
}

export function CashierRequestDetailPage() {
  const id = Number(useParams().id);
  const query = useCashierRequest(Number.isFinite(id) ? id : undefined);
  const mutation = useCashierPayment();

  const [status, setStatus] = useState("paid");
  const [orNo, setOrNo] = useState("");
  const [orDate, setOrDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize fields when request data arrives
  useEffect(() => {
    if (query.data?.data) {
      const current = query.data.data;
      const initialStatus = getCashierStatus(current);
      if (initialStatus === "paid" || initialStatus === "cancelled") {
        setStatus(initialStatus);
      } else {
        setStatus("paid");
      }
      setOrNo(getCashierOrNo(current) ?? "");
      const existingOrDate = getCashierOrDate(current);
      if (existingOrDate) {
        // Normalize to YYYY-MM-DD format for form submission
        try {
          setOrDate(format(parseISO(existingOrDate), "yyyy-MM-dd"));
        } catch {
          setOrDate(existingOrDate);
        }
      }
    }
  }, [query.data]);

  // Auto-promote or validate status when typing OR number
  const handleOrNoChange = (value: string) => {
    setOrNo(value);
    if (value.trim() && status !== "paid") {
      setStatus("paid");
    }
    if (fieldErrors.or_no) {
      setFieldErrors((prev) => ({ ...prev, or_no: "" }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage(null);
    const errors: Record<string, string> = {};

    if (status === "paid") {
      if (!orNo.trim()) {
        errors.or_no = "Official Receipt (OR) number is required for paid status.";
      }
      if (!orDate) {
        errors.or_date = "OR Date is required for paid status.";
      }
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
          status,
          or_no: orNo.trim() || undefined,
          or_date: orDate || undefined,
        },
      },
      {
        onSuccess: () => {
          setSuccessMessage("Payment record updated successfully.");
          void query.refetch();
        },
      }
    );
  };

  if (query.isPending) {
    return <CashierRequestDetailSkeleton />;
  }

  if (query.isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 my-8">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Unable to load payment request
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {query.error instanceof ApiError
                ? query.error.message
                : "The requested cashier payment record could not be loaded."}
            </p>
          </div>
          <div>
            <Button variant="outline" size="sm">
              <Link to="/cashier/requests">Back to payment requests</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const request = query.data.data;
  const refNumber = getCashierReferenceNumber(request);
  const payor = getCashierPayorName(request);
  const amount = getCashierAmount(request);
  const currentStatus = getCashierStatus(request);
  const existingOrNo = getCashierOrNo(request)?.trim() ?? "";
  const formInput = request.form_input ?? request.formInput;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-border/70 bg-card px-2! py-2! shadow-sm">
        <CardHeader className="flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="bg-[#3399FF] bg-clip-text font-['Poppins'] text-2xl! font-black tracking-tight text-transparent sm:text-4xl">
              {refNumber}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Processed on {formatDate(request.created_at ?? request.ref_date)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStatus} />
            <Link
              to="/cashier/requests"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Order of Payment Details */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Order of Payment Overview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Verified billable items and client details
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">
                    Amount to Collect
                  </span>
                  <p className="text-2xl font-bold text-blue-500 tabular-nums">
                    {currencyFormatter.format(amount)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-medium text-muted-foreground flex items-center gap-1">
                    <User className="size-3" /> Payor / Client
                  </span>
                  <p className="font-medium text-lg mt-0.5">
                    {payor || "—"}
                  </p>
                </div>

                <div>
                  <span className="text-medium text-muted-foreground flex items-center gap-1">
                    <Building className="size-3" /> Office / College
                  </span>
                  <p className="font-medium text-lg mt-0.5">
                    {formInput?.office_or_college ??
                      request.office_or_college ??
                      "—"}
                  </p>
                </div>

                <div>
                  <span className="text-medium text-muted-foreground">
                    Contact Number
                  </span>
                  <p className="font-medium text-lg mt-0.5">
                    {formInput?.contact_num ?? request.contact_num ?? "—"}
                  </p>
                </div>

                <div>
                  <span className="text-medium text-muted-foreground">
                    Payment Nature / Detail
                  </span>
                  <p className="font-medium text-lg mt-0.5">
                    {formInput?.payment_detail_option?.payment_desc ??
                      request.payment_detail_option?.payment_desc ??
                      "—"}
                  </p>
                </div>

                <div>
                  <span className="text-medium text-muted-foreground">
                    Client Category / Membership
                  </span>
                  <p className="font-medium text-lg mt-0.5">
                    {formInput?.membership?.member_desc ??
                      request.membership?.member_desc ??
                      "—"}
                  </p>
                </div>

                {(formInput?.course ?? request.course) && (
                  <div className="sm:col-span-2">
                    <span className="text-medium text-muted-foreground flex items-center gap-1">
                      <GraduationCap className="size-3" /> Course Program
                    </span>
                    <p className="font-medium text-lg mt-0.5">
                      {(formInput?.course ?? request.course)?.course_code} —{" "}
                      {(formInput?.course ?? request.course)?.course_desc}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Existing OR Banner if Paid */}
          {currentStatus === "paid" && getCashierOrNo(request) && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CardContent className=" flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                    Payment Recorded
                  </div>
                  <div className="text-xs text-emerald-800 dark:text-emerald-400 font-mono">
                    Official Receipt:{" "}
                    <span className="font-bold">{getCashierOrNo(request)}</span>{" "}
                    · Date: {formatDate(getCashierOrDate(request))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Payment Recording Form */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  Record Payment
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Enter Official Receipt details to confirm university fee
                collection.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {successMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {mutation.isError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Update failed</p>
                      <p>
                        {mutation.error instanceof ApiError
                          ? mutation.error.message
                          : mutation.error instanceof Error
                            ? mutation.error.message
                            : "Payment record could not be updated."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="payment_status">Payment Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => {
                        if (value !== null) setStatus(value);
                      }}
                    >
                    <SelectTrigger
                      id="payment_status"
                      aria-label="Payment Status"
                      className={"px-4 py-5!"}
                    >
                      <SelectValue>
                        {status === "paid"
                          ? "Paid"
                          : status === "processed"
                            ? "Processed"
                            : status === "cancelled"
                              ? "Cancelled"
                              : status}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid (Issue Receipt)</SelectItem>
                      <SelectItem value="processed">
                        Ready for Payment (Processed)
                      </SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* OR Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="or_no">
                    Official Receipt (OR) Number{" "}
                    {status === "paid" && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
<Input
                      id="or_no"
                      placeholder="e.g. 1234567"
                      value={orNo}
                      onChange={(e) => handleOrNoChange(e.target.value)}
                      aria-invalid={!!fieldErrors.or_no}
                      required={status === "paid"}
                      className="text-sm tabular-nums px-4 py-5!"
                    />
                  {fieldErrors.or_no && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.or_no}
                    </p>
                  )}
                </div>

                {/* OR Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="or_date">
                    OR Date{" "}
                    {status === "paid" && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full justify-start gap-2 rounded-lg px-4 font-normal text-sm"
                          aria-label="OR Date"
                           aria-invalid={!!fieldErrors.or_date}
                         />
                      }
                    >
                      <CalendarIcon className="size-4 text-muted-foreground" />
                      {orDate
                        ? format(parseDateInput(orDate)!, "MMM d, yyyy")
                        : "Select OR date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parseDateInput(orDate)}
                         onSelect={(selected) => {
                           setOrDate(selected ? format(selected, "yyyy-MM-dd") : "");
                          if (fieldErrors.or_date) {
                            setFieldErrors((prev) => ({ ...prev, or_date: "" }));
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.or_date && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.or_date}
                    </p>
                  )}
                </div>

                <div className="pt-2">
<Button
                      type="submit"
                      disabled={mutation.isPending}
                     className="w-full gap-1.5 px-4 py-5!"
                   >
                     {mutation.isPending ? (
                       <>
                         <Loader2 className="size-4 animate-spin" />
                         <span>Saving Payment...</span>
                       </>
                     ) : (
                       <>
                         <CreditCard className="size-4" />
                         <span>Save</span>
                       </>
                     )}
                   </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
