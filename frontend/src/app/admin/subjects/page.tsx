"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Library, Plus, X, Loader2 } from "lucide-react";
import { academicApi } from "@/lib/api/academic.api";

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  credits: number;
  termId: string;
  termLabel: string;
  isArchived: boolean;
}

interface TermNode {
  id: string;
  label: string;
}

function flattenTreeForSubjects(tree: any[]): { subjects: SubjectRow[]; terms: TermNode[] } {
  const subjects: SubjectRow[] = [];
  const terms: TermNode[] = [];

  for (const dept of tree) {
    for (const course of dept.courses ?? []) {
      for (const year of course.years ?? []) {
        for (const term of year.terms ?? []) {
          const label = `${course.name} — Year ${year.number} ${term.name}`;
          terms.push({ id: term.id, label });
          for (const subject of term.subjects ?? []) {
            subjects.push({
              id: subject.id,
              name: subject.name,
              code: subject.code,
              credits: subject.credits ?? 3,
              termId: term.id,
              termLabel: label,
              isArchived: subject.isArchived,
            });
          }
        }
      }
    }
  }

  return { subjects, terms };
}

export default function AdminSubjectsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", code: "", termId: "", credits: 3 });
  const [editForm, setEditForm] = useState({ name: "", credits: 3 });

  const { data, isLoading } = useQuery({
    queryKey: ["academic", "tree"],
    queryFn: () => academicApi.getAcademicTree(),
  });

  const { subjects, terms } = flattenTreeForSubjects(data?.data ?? []);

  const filtered = subjects.filter(
    (s) =>
      !s.isArchived &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.termLabel.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const createMutation = useMutation({
    mutationFn: () =>
      academicApi.createSubject({
        name: createForm.name,
        code: createForm.code,
        termId: createForm.termId,
        credits: createForm.credits,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
      setShowCreateModal(false);
      setCreateForm({ name: "", code: "", termId: "", credits: 3 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      academicApi.updateSubject(editingSubject!.id, {
        name: editForm.name,
        credits: editForm.credits,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
      setEditingSubject(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => academicApi.archiveSubject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
    },
  });

  const openEdit = (subject: SubjectRow) => {
    setEditingSubject(subject);
    setEditForm({ name: subject.name, credits: subject.credits });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Subjects
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage subjects across all terms and courses.
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Subject
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="search-bar w-full md:w-96">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search by name, code, or term…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Subject Table */}
      {isLoading ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading subjects…
        </div>
      ) : subjects.length === 0 ? (
        <div
          className="card p-12 flex flex-col items-center justify-center text-center"
          style={{ border: "2px dashed var(--border)" }}
        >
          <Library className="w-12 h-12 mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            No subjects created yet
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Create subjects and assign them to terms. Then map them to sections from the Sections page.
          </p>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Create Subject
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Subject</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Code</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Credits</th>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Term</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((subject) => (
                <tr
                  key={subject.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  className="hover:bg-gray-50/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--bg-surface-2)" }}
                      >
                        <Library className="w-4 h-4" style={{ color: "var(--accent)" }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {subject.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="badge badge-under-review">{subject.code}</span>
                  </td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {subject.credits} cr
                  </td>
                  <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {subject.termLabel}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        className="text-xs px-3 py-1.5 rounded font-medium"
                        style={{
                          background: "var(--bg-surface-2)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border)",
                        }}
                        onClick={() => openEdit(subject)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs px-3 py-1.5 rounded font-medium"
                        style={{
                          background: "transparent",
                          color: "var(--red)",
                          border: "1px solid var(--red)",
                        }}
                        onClick={() => {
                          if (confirm(`Archive subject "${subject.name}"?`)) {
                            archiveMutation.mutate(subject.id);
                          }
                        }}
                        disabled={archiveMutation.isPending}
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No subjects found.
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
                New Subject
              </h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Subject Name
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. Data Structures"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Subject Code
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. CS-301"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Term
                </label>
                <select
                  className="input w-full"
                  value={createForm.termId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, termId: e.target.value }))}
                >
                  <option value="">Select a term…</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Credits
                </label>
                <input
                  className="input w-full"
                  type="number"
                  min={1}
                  max={10}
                  value={createForm.credits}
                  onChange={(e) => setCreateForm((f) => ({ ...f, credits: parseInt(e.target.value) || 3 }))}
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  {(createMutation.error as any)?.response?.data?.message ?? "Failed to create subject"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!createForm.name || !createForm.code || !createForm.termId || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                Edit Subject
              </h2>
              <button onClick={() => setEditingSubject(null)}>
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Subject Name
                </label>
                <input
                  className="input w-full"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Credits
                </label>
                <input
                  className="input w-full"
                  type="number"
                  min={1}
                  max={10}
                  value={editForm.credits}
                  onChange={(e) => setEditForm((f) => ({ ...f, credits: parseInt(e.target.value) || 3 }))}
                />
              </div>

              {updateMutation.isError && (
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  {(updateMutation.error as any)?.response?.data?.message ?? "Failed to update subject"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn btn-secondary flex-1" onClick={() => setEditingSubject(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!editForm.name || updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
