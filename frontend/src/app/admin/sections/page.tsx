"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Building2, Users, Plus, X, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { academicApi } from "@/lib/api/academic.api";

interface SectionRow {
  id: string;
  name: string;
  courseName: string;
  departmentName: string;
  termName: string;
  termId: string;
  studentCount: number;
}

interface TermNode {
  id: string;
  label: string;
}

function flattenTree(tree: any[]): { sections: SectionRow[]; terms: TermNode[] } {
  const sections: SectionRow[] = [];
  const terms: TermNode[] = [];

  for (const dept of tree) {
    for (const course of dept.courses ?? []) {
      for (const year of course.years ?? []) {
        for (const term of year.terms ?? []) {
          terms.push({
            id: term.id,
            label: `${course.name} — Year ${year.number} ${term.name}`,
          });
          for (const section of term.sections ?? []) {
            sections.push({
              id: section.id,
              name: section.name,
              courseName: course.name,
              departmentName: dept.name,
              termName: term.name,
              termId: term.id,
              studentCount: section._count?.studentProfiles ?? 0,
            });
          }
        }
      }
    }
  }
  return { sections, terms };
}

export default function AdminSectionsPage() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    name: "", 
    departmentId: "",
    courseId: "",
    yearId: "",
    termId: "" 
  });

  // Main Listing Query (Lightweight)
  const { data: structure, isLoading } = useQuery({
    queryKey: ["academic", "structure"],
    queryFn: () => academicApi.getStructure(),
  });

  const sections: SectionRow[] = (structure?.data?.sections ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    courseName: s.term?.year?.course?.name ?? "N/A",
    departmentName: s.term?.year?.course?.department?.name ?? "N/A",
    termName: s.term?.name ?? "N/A",
    termId: s.term?.id ?? "",
    studentCount: s._count?.studentProfiles ?? 0,
  }));

  const filtered = sections.filter(
    (s) =>
      s.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Cascading Selection Queries for Modal
  const { data: departments } = useQuery({
    queryKey: ["academic", "departments"],
    queryFn: () => academicApi.getDepartments(),
    enabled: showCreateModal,
  });

  const { data: courses } = useQuery({
    queryKey: ["academic", "courses", createForm.departmentId],
    queryFn: () => academicApi.getCourses(createForm.departmentId),
    enabled: !!createForm.departmentId,
  });

  const { data: years } = useQuery({
    queryKey: ["academic", "years", createForm.courseId],
    queryFn: () => academicApi.getYears(createForm.courseId),
    enabled: !!createForm.courseId,
  });

  const { data: terms } = useQuery({
    queryKey: ["academic", "terms", createForm.yearId],
    queryFn: () => academicApi.getTerms(createForm.yearId),
    enabled: !!createForm.yearId,
  });

  const createMutation = useMutation({
    mutationFn: () => academicApi.createSection({ name: createForm.name, termId: createForm.termId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "structure"] });
      setShowCreateModal(false);
      setCreateForm({ name: "", departmentId: "", courseId: "", yearId: "", termId: "" });
    },
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Academic Sections
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Create and manage sections across all courses and terms.
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          New Section
        </button>
      </div>

      {/* Search */}
      {sections.length > 0 && (
        <div className="card p-4">
          <div className="search-bar w-full md:w-96">
            <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search course, section, or department…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading sections…
        </div>
      ) : sections.length === 0 ? (
        /* Empty State */
        <div
          className="card p-12 flex flex-col items-center justify-center text-center"
          style={{ border: "2px dashed var(--border)" }}
        >
          <Building2 className="w-12 h-12 mb-4" style={{ color: "var(--text-muted)" }} />
          <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--text-primary)" }}>
            No sections created yet
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Sections are the core unit of academic operations. Create a section to start assigning
            students, subjects, and faculty.
          </p>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Create Section
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((section) => (
            <Link
              key={section.id}
              href={`/admin/sections/${section.id}`}
              className="card p-5 hover:border-gray-300 transition-colors block"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--bg-surface-2)" }}
                  >
                    <Building2 className="w-5 h-5" style={{ color: "var(--accent)" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                      Section {section.name}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {section.departmentName} · {section.courseName}
                    </p>
                  </div>
                </div>
                <span className="badge badge-under-review">{section.termName}</span>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm font-medium">{section.studentCount} Students</span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full card p-8 text-center" style={{ color: "var(--text-muted)" }}>
              No sections match your search.
            </div>
          )}
        </div>
      )}

      {/* Create Section Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                Create Section
              </h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Department
                </label>
                <select
                  className="input w-full"
                  value={createForm.departmentId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, departmentId: e.target.value, courseId: "", yearId: "", termId: "" }))}
                >
                  <option value="">Select Department…</option>
                  {(departments?.data ?? []).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {createForm.departmentId && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Course
                  </label>
                  <select
                    className="input w-full"
                    value={createForm.courseId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, courseId: e.target.value, yearId: "", termId: "" }))}
                  >
                    <option value="">Select Course…</option>
                    {(courses?.data ?? []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.courseId && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Academic Year
                  </label>
                  <select
                    className="input w-full"
                    value={createForm.yearId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, yearId: e.target.value, termId: "" }))}
                  >
                    <option value="">Select Year…</option>
                    {(years?.data ?? []).map((y: any) => (
                      <option key={y.id} value={y.id}>Year {y.number} ({y.academicYear})</option>
                    ))}
                  </select>
                </div>
              )}

              {createForm.yearId && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Term
                  </label>
                  <select
                    className="input w-full"
                    value={createForm.termId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, termId: e.target.value }))}
                  >
                    <option value="">Select Term…</option>
                    {(terms?.data ?? []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Section Name
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. A, B, C"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {createMutation.isError && (
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  {(createMutation.error as any)?.response?.data?.message ?? "Failed to create section"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button className="btn btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!createForm.name || !createForm.termId || createMutation.isPending}
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
    </div>
  );
}
