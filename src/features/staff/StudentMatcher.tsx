import { useEffect, useState } from "react";
import { searchOpStudents } from "./api";
import { useLinkOpStudent } from "./editMutations";

export function StudentMatcher({ id }: { id: number }) {
  const [term, setTerm] = useState("");
  const [students, setStudents] = useState<
    Array<{ id: number; student_number: string; full_name: string }>
  >([]);
  const mutation = useLinkOpStudent();
  useEffect(() => {
    if (term.trim().length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchOpStudents(term, controller.signal)
        .then((response) => setStudents(response.students))
        .catch(() => undefined);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);
  return (
    <section className="processing-form">
      <h2>Match student</h2>
      <input
        placeholder="Search student number or name"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      {term.trim().length >= 2 &&
        students.map((student) => (
          <button
            type="button"
            key={student.id}
            onClick={() => mutation.mutate({ id, studentId: student.id })}
          >
            {student.full_name} ({student.student_number})
          </button>
        ))}
    </section>
  );
}
