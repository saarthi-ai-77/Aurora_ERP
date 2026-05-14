"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Plus, X, Loader2, Search, Trash2 } from "lucide-react";
import { academicApi } from "@/lib/api/academic.api";
import { usersApi } from "@/lib/api/users.api";

interface AssignmentRow {
  id: string;
  facultyName: string;
  staffId: string;
  sectionName: string;
  subjectName: string;
  subjectCode: string;
  termName: string;
  yearLabel: string;
}

function buildRows(assignments: any[]): AssignmentRow[] {
  return assignments.map((a) => ({
    id: a.id,
    facultyName: `${a.faculty?.firstName ?? ""} ${a.faculty?.lastName ?? ""}`.trim(),
    staffId: a.faculty?.staffId ?? "",
    sectionName: a.section?.name ?? "",
    subjectName: a.subject?.name ?? "",
    subjectCode: a.subject?.code ?? "",
    termName: a.term?.name ?? "",
    yearLabel: a.year?.academicYear ?? `Year ${a.year?.number ?? ""}`,
  }));
}

function flattenTree(tree: any[]) {
  const terms: { id: string; label: string; yearId: string }[] = [];
  const subjects: { id: string; name: string; code: string; termId: string }[] = [];
  const sections: { id: string; name: string; termId: string }[] = [];

  for (const dept of tree) {
    for (const course of dept.courses ?? []) {
      for (const year of course.years ?? []) {
        for (const term of year.terms ?? []) {
          const label = `${course.name} — Year ${year.number} ${term.name}`;
          terms.push({ id: term.id, label, yearId: year.id });
          for (const section of term.sections ?? []) {
            sections.push({ id: section.id, name: section.name, termId: term.id });
          }
          for (const subject of term.subjects ?? []) {
            subjects.push({ id: subject.id, name: subject.name, code: subject.code, termId: term.id });
          }
        }
      }
    }
  }

  return { terms, subjects, sections };
}

export default function AdminFacultyAssignmentsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    facultyId: "",
    termId: "",
    sectionId: "",
    subjectId: "",
    yearId: "",
  });

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ["academic", "faculty-assignments"],
    queryFn: () => academicApi.getAllFacultyAssignments(),
  });

  const { data: treeData } = useQuery({
    queryKey: ["academic", "tree"],
    queryFn: () => academicApi.getAcademicTree(),
  });

  const { data: facultyData } = useQuery({
    queryKey: ["users", "faculty"],
    queryFn: () => usersApi.getAll("FACULTY", { page: 1, limit: 100 }),
  });

  const rows = buildRows(assignmentsData?.data ?? []);
  const { terms, subjects, sections } = flattenTree(treeData?.data ?? []);
  const facultyList: any[] = facultyData?.data ?? [];

  // Filter sections/subjects based on selected term
  const termSections = sections.filter((s) => s.termId === form.termId);
  const termSubjects = subjects.filter((s) => s.termId === form.termId);
  const selectedTerm = terms.find((t) => t.id === form.termId);

  const filtered = rows.filter(
    (r) =>
      r.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.staffId.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: () =>
      academicApi.createFacultyAssignment({
        facultyId: form.facultyId,
        sectionId: form.sectionId,
        subjectId: form.subjectId,
        termId: form.termId,
        yearId: selectedTerm?.yearId ?? "",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "faculty-assignments"] });
      setShowCreateModal(false);
      setForm({ facultyId: "", termId: "", sectionId: "", subjectId: "", yearId: "" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => academicApi.revokeFacultyAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "faculty-assignments"] });
    },
  });

  const handleTermChange = (termId: string) => {
    setForm((f) => ({ ...f, termId, sectionId: "", subjectId: "" }));
  };

  const isFormValid =
    form.facultyId && form.termId && form.sectionId && form.subjectId && selectedTerm?.yearId;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Faculty Assignments
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Assign faculty to sections and subjects for each term.
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Assign Faculty
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by faculty, subject, or section…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Assignments Table */}
      {isLoading ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading assignments…
        </div>
      ) : rows.length === 0 ? (
        <div
          className="card p-12 flex flex-col items-center justify-center text-center"
          style={{ border: "2px dashed var(--border)" }}
        >
          <UserCheck className="w-12 h-12 mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            No faculty assignments yet
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Assign faculty to section-subject combinations. Faculty will only see sections and
            students they are assigned to.
          </p>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Assign Faculty
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Faculty</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Section</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Subject</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Term</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  className="hover:bg-gray-50/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white"
                        style={{ background: "var(--accent)" }}
                      >
                        {row.facultyName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {row.facultyName}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {row.staffId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="badge badge-under-review">Section {row.sectionName}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{row.subjectName}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{row.subjectCode}</p>
                  </td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {row.termName} · {row.yearLabel}
                  </td>
                  <td className="p-4">
                    <button
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      title="Revoke assignment"
                      onClick={() => {
                        if (confirm("Revoke this faculty assignment?")) {
                          revokeMutation.mutate(row.id);
                        }
                      }}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "var(--red)" }} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No faculty assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                Assign Faculty
              </h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Faculty
                </label>
                <select
                  className="input w-full"
                  value={form.facultyId}
                  onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value }))}
                >
                  <option value="">Select faculty…</option>
                  {facultyList.map((u: any) => (
                    <option key={u.id} value={u.facultyProfile?.id ?? u.id}>
                      {u.facultyProfile?.firstName} {u.facultyProfile?.lastName} — {u.facultyProfile?.staffId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Term
                </label>
                <select
                  className="input w-full"
                  value={form.termId}
                  onChange={(e) => handleTermChange(e.target.value)}
                >
                  <option value="">Select term…</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Section
                </label>
                <select
                  className="input w-full"
                  value={form.sectionId}
                  onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                  disabled={!form.termId}
                >
                  <option value="">Select section…</option>
                  {termSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Subject
                </label>
                <select
                  className="input w-full"
                  value={form.subjectId}
                  onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                  disabled={!form.termId}
                >
                  <option value="">Select subject…</option>
                  {termSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {createMutation.isError && (
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  {(createMutation.error as any)?.response?.data?.message ?? "Failed to create assignment"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!isFormValid || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
