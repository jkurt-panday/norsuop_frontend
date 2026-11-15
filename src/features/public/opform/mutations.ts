import { useMutation } from "@tanstack/react-query";
import { submitOpForm } from "./api";

export function useSubmitOpForm() {
  return useMutation({ mutationFn: submitOpForm });
}
