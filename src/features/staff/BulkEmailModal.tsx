"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Mail, Search, UserRound, ChevronDown, Loader2, Send, X, CheckSquare, Square, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { getEmailRecipients } from "./api";
import { useBulkEmailOp } from "./mutations";
import { toast } from "sonner";

interface EmailRecipient {
  id: number;
  reference_number: string;
  email: string;
  firstname_or_office: string;
  middlename_or_project?: string | null;
  lastname_or_agency: string;
  staff_input?: {
    id: number;
    status: string;
    emailed_at?: string | null;
    email_status?: string | null;
  } | null;
}

type EmailTarget = 'specific' | 'all_paid' | 'all_processed' | 'all_pending' | 'all_cancelled';

interface BulkEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatFullName(row: EmailRecipient): string {
  return [row.firstname_or_office, row.middlename_or_project, row.lastname_or_agency]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatTimeAgo(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getStatusBadge(status: string): string {
  switch (status) {
    case "paid": return "light-green";
    case "processed": return "dark-green";
    case "cancelled": return "red";
    case "pending": return "orange";
    case "unprocessed": return "grey";
    default: return "grey";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\u0022")
    .replace(/'/g, "&#039;");
}

function buildEmailPreviewHtml(
  emailNote: string,
  allRecipients: EmailRecipient[],
  selectedIds: Set<number>
): string {
  const noteHtml = emailNote.trim() ? "<p>" + escapeHtml(emailNote).replace(/\n/g, '<br>') + "</p>" : '';
  const previewRecipient = allRecipients.find(r => selectedIds.has(r.id)) ?? allRecipients[0];
  const recipientName = previewRecipient ? previewRecipient.firstname_or_office + " " + previewRecipient.lastname_or_agency : 'Recipient';
  const reference = previewRecipient?.reference_number ?? '—';
  const amount = previewRecipient ? Number(previewRecipient.amount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  return "<!DOCTYPE html>" +
    "<html><body style=\"font-family: Arial, sans-serif; color: #1e293b;\">" +
    "<p>Dear " + escapeHtml(recipientName) + ",</p>" +
    "<p>Please find attached your Order of Payment (Reference No. <strong>" + escapeHtml(reference) + "</strong>) for the amount of <strong>₱" + escapeHtml(amount) + "</strong>.</p>" +
    noteHtml +
    "<p>Two copies are attached:</p><ul><li>A5 portrait — for individual filing</li><li>Legal landscape — 3-up copies (Payor's / Cash Unit's / Accounting Unit's)</li></ul>" +
    "<p>Please present this at the Cash / Treasury Unit to complete payment.</p>" +
    "<p>Regards,<br>NORSU Accounting Office</p></body></html>";
}

export function BulkEmailModal({ open, onOpenChange }: BulkEmailModalProps) {
  const [emailTarget, setEmailTarget] = useState<EmailTarget>('specific');
  const [emailSearch, setEmailSearch] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [allRecipients, setAllRecipients] = useState<EmailRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [isQueueStalled, setIsQueueStalled] = useState(false);
  const [showSelectedPopover, setShowSelectedPopover] = useState(false);
  const [selectedPopoverSearch, setSelectedPopoverSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const bulkEmailMutation = useBulkEmailOp();

  const handlePopoverEscape = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setShowSelectedPopover(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSelectedPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoadingRecipients(true);
    setAllRecipients([]);
    setSelectedIds(new Set());
    setEmailSubject('');
    setEmailNote('');
    setEmailSearch('');
    setEmailTarget('specific');
    setIsQueueStalled(false);

    getEmailRecipients()
      .then((json) => {
        if (cancelled) return;
        setAllRecipients(json.data ?? []);
        setIsQueueStalled(Boolean(json.queue_stalled));
        setIsLoadingRecipients(false);
      })
      .catch(() => {
        if (cancelled) return;
        toast.error('Failed to load recipients.');
        setIsLoadingRecipients(false);
      });

    return () => { cancelled = true; };
  }, [open]);

  const eligibleRecipients = allRecipients.filter(row => row.staff_input && row.email);

  const filteredSpecific = useMemo(() =>
    emailSearch.trim() === ''
      ? allRecipients
      : allRecipients.filter(row => {
          const q = emailSearch.toLowerCase();
          const fullName = formatFullName(row).toLowerCase();
          return fullName.includes(q) || row.reference_number.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
        }),
  [allRecipients, emailSearch]);

  const bulkRecipients = useMemo(() =>
    emailTarget === 'specific'
      ? []
      : eligibleRecipients.filter(row => {
          const recipientStatus = row.staff_input?.status;
          return (
            (emailTarget === 'all_paid' && recipientStatus === 'paid') ||
            (emailTarget === 'all_processed' && recipientStatus === 'processed') ||
            (emailTarget === 'all_pending' && recipientStatus === 'pending') ||
            (emailTarget === 'all_cancelled' && recipientStatus === 'cancelled')
          );
        }),
  [emailTarget, eligibleRecipients]);

  const filteredBulkRecipients = useMemo(() =>
    emailSearch.trim() === ''
      ? bulkRecipients
      : bulkRecipients.filter(row => {
          const q = emailSearch.toLowerCase();
          const fullName = formatFullName(row).toLowerCase();
          return fullName.includes(q) || row.reference_number.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
        }),
  [bulkRecipients, emailSearch]);

  const prevBulkTargetRef = useRef<string | null>(null);
  useEffect(() => {
    const isBulkMode = emailTarget !== 'specific';
    const wasBulkMode = prevBulkTargetRef.current !== null && prevBulkTargetRef.current !== 'specific';
    if (prevBulkTargetRef.current !== emailTarget) {
      if (isBulkMode) {
        if (wasBulkMode && prevBulkTargetRef.current !== emailTarget) {
          setSelectedIds(new Set(bulkRecipients.map(r => r.id)));
        } else if (!wasBulkMode) {
          setSelectedIds(new Set(bulkRecipients.map(r => r.id)));
        }
      } else {
        setSelectedIds(new Set());
      }
    }
    prevBulkTargetRef.current = emailTarget;
  }, [emailTarget, bulkRecipients]);

  const computeTargetIds = () => Array.from(selectedIds);

  const toggleSelectId = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isSendingRef = useRef(false);
  const handleSendBulkEmail = async () => {
    if (isSendingRef.current) return;
    isSendingRef.current = true;
    const ids = computeTargetIds();
    if (ids.length === 0) {
      toast.error('No eligible recipients selected.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const res = await bulkEmailMutation.mutateAsync({
        form_input_ids: ids,
        subject: emailSubject || undefined,
        note: emailNote || undefined,
      });
      toast.success(res.message ?? `Emails sent to ${ids.length} recipient(s).`);
      onOpenChange(false);
    } catch (err) {
      console.error('Bulk email error:', err);
      const message = err instanceof Error ? err.message : 'Failed to send emails. Please try again.';
      toast.error(message);
    } finally {
      setIsSendingEmail(false);
      isSendingRef.current = false;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-600" />
            Send Order of Payment Emails
          </DialogTitle>
          <DialogDescription>
            Choose which recipients should receive their Order of Payment receipts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 overflow-y-auto">
            {isQueueStalled && (
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
                <div className="font-semibold">Queue worker not running</div>
                <div className="mt-1 text-xs">
                  Emails are sent in the background by a queue worker. Start one with
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
                    php artisan queue:work
                  </code>
                  before sending — otherwise the requests stay queued and no email goes out.
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Whom do you want to send email to?
              </label>
              <Select
                value={emailTarget}
                onValueChange={(v) => {
                  if (['specific', 'all_paid', 'all_processed', 'all_pending', 'all_cancelled'].includes(v)) {
                    setEmailTarget(v as EmailTarget);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-lg border-input bg-background shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="specific">Specific person</SelectItem>
                  <SelectItem value="all_paid">All paid</SelectItem>
                  <SelectItem value="all_processed">All processed</SelectItem>
                  <SelectItem value="all_pending">All pending</SelectItem>
                  <SelectItem value="all_cancelled">All cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailTarget === 'specific' && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{filteredSpecific.length}</span>
                    <span>recipient(s)</span>
                  </div>
                  <div className="relative max-w-md flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, reference, or email"
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      className="h-9 rounded-lg pl-9 text-sm"
                    />
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="relative" ref={popoverRef}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSelectedPopover(!showSelectedPopover)}
                        className="h-9 shrink-0 gap-1.5 px-3"
                      >
                        <UserRound className="h-4 w-4" />
                        <span className="hidden sm:inline">{selectedIds.size} selected</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      {showSelectedPopover && (
                        <div className="absolute top-full right-0 z-10 mt-1.5 w-80 rounded-lg border border-border bg-card py-1 text-card-foreground shadow-lg" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between border-b border-border px-3 py-2">
                            <span className="text-sm font-medium text-foreground">Selected Recipients</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-xs text-rose-600 hover:text-rose-700">Clear All</Button>
                          </div>
                          <div className="border-b border-border px-3 py-2">
                            <Input placeholder="Search selected..." value={selectedPopoverSearch} onChange={(e) => setSelectedPopoverSearch(e.target.value)} className="h-9 text-sm" autoFocus />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {Array.from(selectedIds)
                              .map((id) => allRecipients.find(r => r.id === id))
                              .filter((row): row is EmailRecipient => row !== undefined)
                              .filter((row) => {
                                if (!selectedPopoverSearch.trim()) return true;
                                const q = selectedPopoverSearch.toLowerCase();
                                const fullName = formatFullName(row).toLowerCase();
                                return fullName.includes(q) || row.reference_number.toLowerCase().includes(q) || row.email.toLowerCase().includes(q);
                              })
                              .map((row) => (
                                <button
                                  key={row.id}
                                  type="button"
                                  role="checkbox"
                                  aria-checked={selectedIds.has(row.id)}
                                  onClick={() => toggleSelectId(row.id)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset focus-visible:outline-none"
                                >
                                  <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-foreground">{formatFullName(row)}</div>
                                    <div className="truncate text-xs text-muted-foreground">{row.reference_number} · {row.email}</div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-card">
                  {isLoadingRecipients ? (
                    <div className="flex items-center justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : filteredSpecific.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No matching recipients</div>
                  ) : (
                    filteredSpecific.map((row) => {
                      const eligible = row.staff_input && row.email;
                      const isSelected = selectedIds.has(row.id);
                      const timeAgo = formatTimeAgo(row.staff_input?.emailed_at);
                      const status = row.staff_input?.status ?? 'unprocessed';
                      return (
                        <button
                          key={row.id}
                          type="button"
                          role="checkbox"
                          aria-checked={isSelected}
                          disabled={!eligible}
                          onClick={() => { if (eligible) toggleSelectId(row.id); }}
                          className={`flex w-full items-start gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-0 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset focus-visible:outline-none disabled:cursor-not-allowed ${eligible ? 'bg-card text-foreground hover:bg-muted/50' : 'bg-muted/40 opacity-60'}`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {eligible ? (
                              isSelected ? <CheckSquare className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Square className="h-4 w-4 text-slate-300" aria-hidden="true" />
                            ) : <Square className="h-4 w-4 text-slate-200" aria-hidden="true" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="truncate font-medium text-foreground">{formatFullName(row)}</div>
                              <StatusBadge status={status} className="text-xs" />
                              {row.staff_input?.email_status === 'pending' && <Badge variant="warning" className="text-[10px]">Email queued</Badge>}
                              {row.staff_input?.email_status === 'failed' && <Badge variant="destructive" className="text-[10px]">Email failed</Badge>}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{row.reference_number} · {row.email}</div>
                            {timeAgo ? (
                              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-600"><Mail className="h-3 w-3" /> Sent email {timeAgo}</div>
                            ) : eligible ? (
                              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> Not sent an email</div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {emailTarget !== 'specific' && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{bulkRecipients.length}</span>
                    <span>recipient(s)</span>
                    <Input placeholder="Search recipients..." value={emailSearch} onChange={(e) => setEmailSearch(e.target.value)} className="h-9 w-64 rounded-lg text-sm" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedIds.size > 0 && (
                      <div className="relative" ref={popoverRef}>
                        <Button id="selected-recipients-trigger" type="button" variant="ghost" size="sm" aria-haspopup="dialog" aria-expanded={showSelectedPopover} onClick={() => setShowSelectedPopover(!showSelectedPopover)} className="h-9 gap-1.5 px-3">
                          <UserRound className="h-4 w-4" />
                          <span>{selectedIds.size} selected</span>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                        {showSelectedPopover && (
                          <div role="dialog" aria-label="Selected recipients" tabIndex={-1} onKeyDown={handlePopoverEscape} className="absolute top-full right-0 z-10 mt-1.5 w-80 rounded-lg border border-border bg-card py-1 text-card-foreground shadow-lg focus:outline-none" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                              <span className="text-sm font-medium text-foreground">Selected Recipients</span>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-xs text-rose-600 hover:text-rose-700">Clear All</Button>
                            </div>
                            <div className="border-b border-border px-3 py-2"><Input placeholder="Search selected..." value={selectedPopoverSearch} onChange={(e) => setSelectedPopoverSearch(e.target.value)} className="h-9 text-sm" autoFocus /></div>
                            <div className="max-h-48 overflow-y-auto">
                              {Array.from(selectedIds).map((id) => allRecipients.find(r => r.id === id)).filter((row): row is EmailRecipient => row !== undefined).filter((row) => { if (!selectedPopoverSearch.trim()) return true; const q = selectedPopoverSearch.toLowerCase(); const fullName = formatFullName(row).toLowerCase(); return fullName.includes(q) || row.reference_number.toLowerCase().includes(q) || row.email.toLowerCase().includes(q); }).map((row) => (
                                <div key={row.id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-muted/40" onClick={() => toggleSelectId(row.id)}>
                                  <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-foreground">{formatFullName(row)}</div><div className="truncate text-xs text-muted-foreground">{row.reference_number} · {row.email}</div></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedIds.size === filteredBulkRecipients.length ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="h-9 px-3">Unselect All</Button>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedIds(new Set(filteredBulkRecipients.map(r => r.id)))} className="h-9 px-3">Select All</Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 max-h-72 overflow-y-auto rounded-md border border-border bg-card">
                  {filteredBulkRecipients.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No matching recipients found</div>
                  ) : (
                    filteredBulkRecipients.map((row) => {
                      const isSelected = selectedIds.has(row.id);
                      const timeAgo = formatTimeAgo(row.staff_input?.emailed_at);
                      const status = row.staff_input?.status ?? 'unprocessed';
                      return (
                        <div key={row.id} className="flex cursor-pointer items-start gap-2 border-b border-border px-3 py-2 text-sm last:border-0 hover:bg-muted/40" onClick={() => toggleSelectId(row.id)}>
                          <div className="mt-0.5 shrink-0">{isSelected ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-slate-300" />}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="truncate font-medium text-foreground">{formatFullName(row)}</div>
                              <StatusBadge status={status} className="text-xs" />
                              {row.staff_input?.email_status === 'pending' && <Badge variant="warning" className="text-[10px]">Email queued</Badge>}
                              {row.staff_input?.email_status === 'failed' && <Badge variant="destructive" className="text-[10px]">Email failed</Badge>}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{row.reference_number} · {row.email}</div>
                            {timeAgo ? <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-600"><Mail className="h-3 w-3" /> Sent email {timeAgo}</div> : <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> Not sent an email</div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{selectedIds.size}</span> selected</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Subject (optional)</label>
              <Input placeholder="Leave blank for default subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="h-10 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Note (optional)</label>
              <Textarea placeholder="Optional message to include" value={emailNote} onChange={(e) => setEmailNote(e.target.value)} rows={3} className="rounded-lg" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Live Preview</label>
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe title="Email preview" srcDoc={buildEmailPreviewHtml(emailNote, allRecipients, selectedIds)} className="h-[24rem] w-full bg-card" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSendingEmail}>Cancel</Button>
          <Button type="button" onClick={handleSendBulkEmail} disabled={isSendingEmail || computeTargetIds().length === 0} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{isSendingEmail ? 'Sending...' : `Send (${computeTargetIds().length})`}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}