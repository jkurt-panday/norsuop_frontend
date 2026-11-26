import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  applyLatinHonor,
  applyMembership,
  createCohortLedger,
  createLedgerRecord,
  deleteLedgerRecord,
  getLedgerPdf,
  importLedger,
  sendLedgerEmails,
  updateLedgerRecord,
  type CohortStoreRequest,
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

export function useCohortStore() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ledger,
      payload,
    }: {
      ledger: Ledger;
      payload: CohortStoreRequest;
    }) => createCohortLedger(ledger, payload),
    onSuccess: (_, value) => {
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] });
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
        exam_period?: "Midterm" | "Final";
        exam_deadline?: string;
      };
    }) => sendLedgerEmails(ledger, payload),
  });
}

export function useApplyMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ledger,
      id,
      membership,
    }: {
      ledger: Ledger;
      id: number;
      membership: "NAPU" | "NORSUFFA";
    }) => applyMembership(ledger, id, membership),
    onSuccess: (_, value) => {
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] });
    },
  });
}

export function useApplyLatinHonor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      ledger,
      id,
      latin_honor,
    }: {
      ledger: Ledger;
      id: number;
      latin_honor: "SUMMA" | "MAGNA" | "CUM_LAUDE";
    }) => applyLatinHonor(ledger, id, latin_honor),
    onSuccess: (_, value) => {
      client.invalidateQueries({ queryKey: ["ledger", value.ledger] });
    },
  });
}
