import { describe, expect, it } from "vitest";
import {
  getSemesterRank,
  parseStartYear,
  sortAcademicTerms,
  type LedgerAcademicTerm,
} from "./queries";

describe("academic term sorting helpers", () => {
  describe("parseStartYear", () => {
    it("parses 4-digit start year from standard school year strings", () => {
      expect(parseStartYear("2025-2026")).toBe(2025);
      expect(parseStartYear("2026-2027")).toBe(2026);
      expect(parseStartYear("AY 2024-2025")).toBe(2024);
      expect(parseStartYear("2023")).toBe(2023);
    });

    it("returns 0 for undefined, null, or strings without a 4-digit year", () => {
      expect(parseStartYear(undefined)).toBe(0);
      expect(parseStartYear("")).toBe(0);
      expect(parseStartYear("N/A")).toBe(0);
      expect(parseStartYear("Year 24-25")).toBe(0);
    });
  });

  describe("getSemesterRank", () => {
    it("ranks Summer and Midyear as 3", () => {
      expect(getSemesterRank("Summer")).toBe(3);
      expect(getSemesterRank("summer")).toBe(3);
      expect(getSemesterRank("Midyear")).toBe(3);
      expect(getSemesterRank("Midyear Term")).toBe(3);
    });

    it("ranks Second Semester / 2nd Sem as 2", () => {
      expect(getSemesterRank("Second Semester")).toBe(2);
      expect(getSemesterRank("2nd Sem")).toBe(2);
      expect(getSemesterRank("2nd Semester")).toBe(2);
      expect(getSemesterRank("second semester")).toBe(2);
    });

    it("ranks First Semester / 1st Sem as 1", () => {
      expect(getSemesterRank("First Semester")).toBe(1);
      expect(getSemesterRank("1st Sem")).toBe(1);
      expect(getSemesterRank("1st Semester")).toBe(1);
      expect(getSemesterRank("first semester")).toBe(1);
    });

    it("ranks unknown or empty semesters as 0", () => {
      expect(getSemesterRank(undefined)).toBe(0);
      expect(getSemesterRank("")).toBe(0);
      expect(getSemesterRank("Unknown")).toBe(0);
      expect(getSemesterRank("Trimester 1")).toBe(0);
    });
  });

  describe("sortAcademicTerms", () => {
    it("sorts latest school year first regardless of ID order", () => {
      const terms: LedgerAcademicTerm[] = [
        { id: 99, school_year: "2024-2025", semester: "First Semester" },
        { id: 1, school_year: "2026-2027", semester: "First Semester" },
        { id: 50, school_year: "2025-2026", semester: "First Semester" },
      ];

      const sorted = sortAcademicTerms(terms);
      expect(sorted.map((t) => t.school_year)).toEqual([
        "2026-2027",
        "2025-2026",
        "2024-2025",
      ]);
    });

    it("sorts semesters within the same school year (Summer > 2nd Sem > 1st Sem)", () => {
      const terms: LedgerAcademicTerm[] = [
        { id: 1, school_year: "2025-2026", semester: "1st Sem" },
        { id: 2, school_year: "2025-2026", semester: "Summer" },
        { id: 3, school_year: "2025-2026", semester: "2nd Sem" },
      ];

      const sorted = sortAcademicTerms(terms);
      expect(sorted.map((t) => t.semester)).toEqual([
        "Summer",
        "2nd Sem",
        "1st Sem",
      ]);
    });

    it("breaks ties with ID descending when year and semester rank are identical", () => {
      const terms: LedgerAcademicTerm[] = [
        { id: 10, school_year: "2025-2026", semester: "First Semester" },
        { id: 25, school_year: "2025-2026", semester: "1st Sem" },
        { id: 5, school_year: "2025-2026", semester: "First Semester" },
      ];

      const sorted = sortAcademicTerms(terms);
      expect(sorted.map((t) => t.id)).toEqual([25, 10, 5]);
    });

    it("safely handles empty arrays and terms with missing fields", () => {
      expect(sortAcademicTerms([])).toEqual([]);

      const malformed: LedgerAcademicTerm[] = [
        { id: 1, school_year: "", semester: "" },
        { id: 2, school_year: "2025-2026", semester: "First Semester" },
      ];

      const sorted = sortAcademicTerms(malformed);
      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(1);
    });

    it("does not mutate the original array", () => {
      const original: LedgerAcademicTerm[] = [
        { id: 1, school_year: "2024-2025", semester: "1st Sem" },
        { id: 2, school_year: "2025-2026", semester: "1st Sem" },
      ];
      const copy = [...original];

      sortAcademicTerms(original);
      expect(original).toEqual(copy);
    });
  });
});
