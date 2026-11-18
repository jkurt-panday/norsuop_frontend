import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLedgerRecord,
  deleteLedgerRecord,
  getLedgerPdf,
  importLedger,
  sendLedgerEmails,
  updateLedgerRecord,
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
    onSuccess: (_, value) => {
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] });
      if (value.payload.student_id) {
        client.invalidateQueries({
          queryKey: ["ledger", value.ledger, "balance", value.payload.student_id],
        });
      }
    },
  });
}

export function useUpdateLedgerRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ledger,
      id,
      payload,
    }: {
      ledger: Ledger;
      id: number;
      payload: LedgerTransactionRequest;
    }) => updateLedgerRecord(ledger, id, payload),
    onSuccess: (_, value) => {
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] });
      if (value.payload.student_id) {
        client.invalidateQueries({
          queryKey: ["ledger", value.ledger, "balance", value.payload.student_id],
        });
      }
    },
  });
}

export function useDeleteLedgerRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (variables: {
      ledger: Ledger;
      id: number;
      studentId?: number;
    }) => deleteLedgerRecord(variables.ledger, variables.id),
    onSuccess: (_, value) => {
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] });
      if (value.studentId) {
        client.invalidateQueries({
          queryKey: ["ledger", value.ledger, "balance", value.studentId],
        });
      }
    },
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
