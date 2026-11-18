import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLedgerRecord,
  deleteLedgerRecord,
  getLedgerPdf,
  importLedger,
  sendLedgerEmails,
  type Ledger,
  type LedgerTransactionRequest,
} from "./api";

export function useCreateLedgerRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ledger,
      payload,
    }: {
      ledger: Ledger;
      payload: LedgerTransactionRequest;
    }) => createLedgerRecord(ledger, payload),
    onSuccess: (_, value) =>
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] }),
  });
}

export function useDeleteLedgerRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ ledger, id }: { ledger: Ledger; id: number }) =>
      deleteLedgerRecord(ledger, id),
    onSuccess: (_, value) =>
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] }),
  });
}

export function useImportLedger() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ledger,
      file,
      presetCourseId,
      presetAcademicTermId,
    }: {
      ledger: Ledger;
      file: File;
      presetCourseId?: number;
      presetAcademicTermId?: number;
    }) => importLedger(ledger, file, presetCourseId, presetAcademicTermId),
    onSuccess: (_, value) =>
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] }),
  });
}

export function useLedgerPdf() {
  return useMutation({
    mutationFn: ({
      ledger,
      studentId,
    }: {
      ledger: Ledger;
      studentId: number;
    }) => getLedgerPdf(ledger, studentId),
  });
}

export function useSendLedgerEmails() {
  return useMutation({
    mutationFn: ({
      ledger,
      payload,
    }: {
      ledger: Ledger;
      payload: {
        student_ids: number[];
        school_year?: string;
        semester?: string;
        subject?: string;
        note?: string;
      };
    }) => sendLedgerEmails(ledger, payload),
  });
}
