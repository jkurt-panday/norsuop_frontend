import { useState } from "react";
import type { Ledger, LedgerTransactionRequest } from "./api";
import { useCreateLedgerRecord } from "./mutations";
export function LedgerTransactionForm({ ledger }: { ledger: Ledger }) {
  const mutation = useCreateLedgerRecord();
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [termId, setTermId] = useState("");
  const [type, setType] = useState("ar");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [particulars, setParticulars] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <form
      className="processing-form"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({
          ledger,
          payload: {
            student_id: Number(studentId),
            course_id: Number(courseId),
            academic_term_id: Number(termId),
            entry_type: type as LedgerTransactionRequest["entry_type"],
            transaction_date: date,
            particulars,
            rate: Number(rate),
            amount: Number(amount),
            status: "posted",
          },
        });
      }}
    >
      <h2>Add transaction</h2>
      <input
        type="number"
        placeholder="Student ID"
        value={studentId}
        onChange={(event) => setStudentId(event.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Course ID"
        value={courseId}
        onChange={(event) => setCourseId(event.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Academic term ID"
        value={termId}
        onChange={(event) => setTermId(event.target.value)}
        required
      />
      <select value={type} onChange={(event) => setType(event.target.value)}>
        <option value="ar">AR</option>
        <option value="payment">Payment</option>
        <option value="adjustment">Adjustment</option>
      </select>
      <input
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        required
      />
      <input
        placeholder="Particulars"
        value={particulars}
        onChange={(event) => setParticulars(event.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Rate"
        value={rate}
        onChange={(event) => setRate(event.target.value)}
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        required
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Add transaction"}
      </button>
    </form>
  );
}
