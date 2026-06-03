"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addStudent, deleteStudent, updateStudentNotes } from "@/lib/dashboard/actions";
import type { StudentRow } from "@/lib/supabase/database.types";

type StudentLedgerProps = {
  students: StudentRow[];
};

export function StudentLedger({ students }: StudentLedgerProps) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await addStudent({ studentName, parentEmail, notes });

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStudentName("");
    setParentEmail("");
    setNotes("");
    router.refresh();
    setLoading(false);
  }

  async function handleSaveNotes(studentId: string) {
    const value = editingNotes[studentId];
    if (value === undefined) return;

    const result = await updateStudentNotes(studentId, value);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleDelete(studentId: string) {
    if (!confirm("Remove this student from your ledger?")) return;

    const result = await deleteStudent(studentId);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="yazz-surface">
        <CardHeader>
          <CardTitle>Add a student</CardTitle>
          <CardDescription>
            Track families manually, or students appear automatically after bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="student-name" className="text-sm font-medium">
                Student name
              </label>
              <Input
                id="student-name"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Alex Smith"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="parent-email" className="text-sm font-medium">
                Parent email
              </label>
              <Input
                id="parent-email"
                type="email"
                required
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="student-notes" className="text-sm font-medium">
                Notes
              </label>
              <Input
                id="student-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Year group, focus areas, etc."
              />
            </div>
            <div className="sm:col-span-2">
              {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={loading}>
                {loading ? "Adding…" : "Add student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="yazz-surface overflow-hidden">
        <CardContent className="p-0">
          {students.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No students yet. Add one above or wait for a booking.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Parent email</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {students.map((row) => {
                  const draftNotes = editingNotes[row.id] ?? row.notes ?? "";
                  const dirty = draftNotes !== (row.notes ?? "");

                  return (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-medium">{row.student_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.parent_email}</td>
                      <td className="px-4 py-3">
                        <Input
                          value={draftNotes}
                          onChange={(e) =>
                            setEditingNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          onBlur={() => {
                            if (dirty) void handleSaveNotes(row.id);
                          }}
                          placeholder="Add notes…"
                          className="h-8"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(row.id)}
                          aria-label="Delete student"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
