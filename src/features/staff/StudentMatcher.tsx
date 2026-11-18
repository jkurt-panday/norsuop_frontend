import { useEffect, useState } from "react";
import { Search, Loader2, UserCheck, AlertCircle } from "lucide-react";
import { searchOpStudents } from "./api";
import { useLinkOpStudent } from "./editMutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StudentMatcherProps {
  id: number;
  initialQuery?: string;
  onSuccess?: () => void;
}

export function StudentMatcher({ id, initialQuery = "", onSuccess }: StudentMatcherProps) {
  const [term, setTerm] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [students, setStudents] = useState<
    Array<{ id: number; student_number: string; full_name: string }>
  >([]);
  const [hasSearched, setHasSearched] = useState(false);

  const mutation = useLinkOpStudent();

  useEffect(() => {
    if (term.trim().length < 2) {
      setStudents([]);
      setIsSearching(false);
      setHasSearched(false);
      return undefined;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      searchOpStudents(term.trim(), controller.signal)
        .then((response) => {
          setStudents(response.students ?? []);
          setHasSearched(true);
        })
        .catch(() => {
          setStudents([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  const handleLink = (studentId: number) => {
    mutation.mutate(
      { id, studentId },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card className="border-amber-200/80 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            <Search className="size-3.5" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Match Student Record
            </CardTitle>
            <CardDescription className="text-xs">
              Link this order of payment request to an existing student profile.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 text-sm"
            placeholder="Type student name or student number..."
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            disabled={mutation.isPending}
          />
          {isSearching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {mutation.isError && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Failed to link student. Please try again."}
            </span>
          </div>
        )}

        {hasSearched && students.length === 0 && !isSearching && term.trim().length >= 2 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No students found matching &ldquo;{term.trim()}&rdquo;.
          </p>
        )}

        {students.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-1.5 rounded-lg border bg-background p-1.5">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-md p-2 transition-colors hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {student.full_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {student.student_number}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={mutation.isPending}
                  onClick={() => handleLink(student.id)}
                >
                  <UserCheck className="size-3.5" />
                  <span>Link</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
