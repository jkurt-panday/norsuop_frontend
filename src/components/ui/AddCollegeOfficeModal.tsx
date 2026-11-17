import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../api/client";
import { Button } from "./button";
import { Input } from "./input";
import { Field, FieldError, FieldLabel } from "./field";

type CollegeOffice = { id: number; name: string };

interface AddCollegeOfficeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (item: CollegeOffice) => void;
}

const inputClass =
  "h-12 rounded-xl border-slate-300 bg-white px-4 text-base shadow-sm transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30";

export default function AddCollegeOfficeModal({
  open,
  onOpenChange,
  onCreated,
}: AddCollegeOfficeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    if (!processing) onOpenChange(false);
  }

  async function submit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("This field is required.");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      const created = await api<CollegeOffice>(
        "/api/v1/public/college-offices",
        { method: "POST", body: JSON.stringify({ name: trimmedName }) },
      );
      onCreated(created);
      setName("");
      onOpenChange(false);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.errors.name?.[0] ?? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg rounded-2xl border bg-white p-0 shadow-2xl backdrop:bg-slate-950/50"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => onOpenChange(false)}
    >
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-xl font-semibold text-blue-900">Add Office / College</h2>
          <p className="mt-1 text-sm text-slate-500">Add a new office or college to the list.</p>
        </div>
        <Field>
          <FieldLabel htmlFor="new-college-office-name" className="font-medium text-slate-700">Name</FieldLabel>
          <Input
            id="new-college-office-name"
            className={inputClass}
            placeholder="College of Arts and Sciences"
            value={name}
            onChange={(event) => { setName(event.target.value); setError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void submit(); } }}
            autoFocus
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close} disabled={processing}>Cancel</Button>
          <Button type="button" onClick={() => void submit()} disabled={processing} className="bg-blue-600 hover:bg-blue-400">{processing ? "Adding…" : "Add"}</Button>
        </div>
      </div>
    </dialog>
  );
}
