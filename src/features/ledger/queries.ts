import { useQuery } from "@tanstack/react-query";
import { getLedgerBalance, getLedgerRecords, type Ledger } from "./api";
export function useLedgerRecords(ledger: Ledger, page: number, search: string) {
  return useQuery({
    queryKey: ["ledger", ledger, page, search],
    queryFn: ({ signal }) => getLedgerRecords(ledger, page, search, signal),
    placeholderData: (previous) => previous,
  });
}
export function useLedgerBalance(
  ledger: Ledger,
  studentId: number | undefined,
) {
  return useQuery({
    queryKey: ["ledger", ledger, "balance", studentId],
    queryFn: ({ signal }) => getLedgerBalance(ledger, studentId!, signal),
    enabled: studentId !== undefined,
  });
}
