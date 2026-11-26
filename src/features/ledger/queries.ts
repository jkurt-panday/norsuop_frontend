import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import {
  getLedgerBalance,
  getLedgerEmailRecipients,
  getLedgerRecords,
  getLedgerRoster,
  searchLedgerStudents,
  type Ledger,
  type LedgerFilterParams,
} from "./api";

export function useLedgerRecords(
  ledger: Ledger,
  pageOrFilters: number | LedgerFilterParams = 1,
  search = "",
) {
  const queryKey =
    typeof pageOrFilters === "object"
      ? ["ledger", ledger, pageOrFilters]
      : ["ledger", ledger, pageOrFilters, search];

  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      getLedgerRecords(ledger, pageOrFilters, search, signal),
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
    enabled: studentId !== undefined && studentId > 0,
  });
}

export function useLedgerStudents(
  ledger: Ledger,
  query: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["ledger", ledger, "students", query.trim()],
    queryFn: ({ signal }) => searchLedgerStudents(ledger, query.trim(), 50, signal),
    enabled,
  });
}

export function useSearchLedgerStudents(
  ledger: Ledger,
  query: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["ledger", ledger, "students-search", query.trim()],
    queryFn: ({ signal }) => searchLedgerStudents(ledger, query.trim(), 50, signal),
    enabled: enabled && query.trim().length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLedgerEmailRecipients(
  ledger: Ledger,
  filters: LedgerFilterParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: ["ledger", ledger, "email-recipients", filters],
    queryFn: ({ signal }) => getLedgerEmailRecipients(ledger, filters, signal),
    enabled,
  });
}

export function useLedgerRoster(ledger: Ledger, enabled = true) {
  return useQuery({
    queryKey: ["ledger", ledger, "roster"],
    queryFn: ({ signal }) => getLedgerRoster(ledger, signal),
    enabled,
  });
}

export type LedgerCourse = {
  id: number;
  course_code: string;
  course_desc: string;
  course_college: string;
};

export type LedgerAcademicTerm = {
  id: number;
  school_year: string;
  semester: string;
};

export function getSemesterRank(semester?: string): number {
  if (!semester) return 0;
  const s = semester.toLowerCase().trim();
  if (s.includes("summer") || s.includes("midyear")) {
    return 3;
  }
  if (s.includes("second") || s.includes("2nd")) {
    return 2;
  }
  if (s.includes("first") || s.includes("1st")) {
    return 1;
  }
  return 0;
}

export function parseStartYear(schoolYear?: string): number {
  const match = schoolYear?.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : 0;
}

export function sortAcademicTerms(
  terms: LedgerAcademicTerm[],
): LedgerAcademicTerm[] {
  return [...terms].sort((a, b) => {
    const yearDiff = parseStartYear(b.school_year) - parseStartYear(a.school_year);
    if (yearDiff !== 0) {
      return yearDiff;
    }
    const semDiff = getSemesterRank(b.semester) - getSemesterRank(a.semester);
    if (semDiff !== 0) {
      return semDiff;
    }
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

export function useLedgerMasterData(ledger: Ledger) {
  const college = ledger === "graduate" ? "Graduate School" : "School of Law";

  return useQuery({
    queryKey: ["ledger", ledger, "master-data"],
    queryFn: async ({ signal }) => {
      const [coursesRes, termsRes] = await Promise.all([
        api<{ data: LedgerCourse[] }>("/api/v1/courses?per_page=100", { signal }),
        api<{ data: LedgerAcademicTerm[] }>("/api/v1/academic-terms?per_page=100", { signal }),
      ]);

      const filteredCourses = (coursesRes.data ?? []).filter(
        (c) => !c.course_college || c.course_college === college,
      );

      return {
        courses: filteredCourses,
        academicTerms: sortAcademicTerms(termsRes.data ?? []),
      };
    },
  });
}
