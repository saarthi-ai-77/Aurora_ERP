"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Building2,
  Users,
  ChevronRight,
  Plus,
  X,
  UserMinus,
  Loader2,
} from "lucide-react";
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
  name: string;
  yearId: string;
  yearNumber: number;
  yearAcademicYear: string | null;
  courseName: string;
  departmentName: string;
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
            name: `${course.name} — Year ${year.number} ${term.name}`,
            yearId: year.id,
            yearNumber: year.number,
            yearAcademicYear: year.academicYear,
            courseName: course.name,
            departmentName: dept.name,
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
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", termId: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["academic", "tree"],
    queryFn: () => academicApi.getAcademicTree(),
  });

  const { data: sectionDetailData, isLoading: detailLoading } = useQuery({
    queryKey: ["academic", "section", selectedSection],
    queryFn: () => academicApi.getSectionDetail(selectedSection!),
    enabled: !!selectedSection,
  });


  const { sections, terms } = flattenTree(data?.data ?? []);

  const filtered = sections.filter(
    (s) =>
      s.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.departmentName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const createMutation = useMutation({
    mutationFn: () => academicApi.createSection({ name: createForm.name, termId: createForm.termId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
      setShowCreateModal(false);
      setCreateForm({ name: "", termId: "" });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: ({ studentId }: { studentId: string }) =>
      academicApi.removeStudentFromSection(selectedSection!, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "section", selectedSection] });
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
    },
  });

  const detail = sectionDetailData?.data;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Academic Sections
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Courses, terms, and sections across all departments.
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

      {/* Section Grid */}
      {isLoading ? (
        <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
          Loading sections…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((section) => (
            <div
              key={section.id}
              className="card p-5 hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => setSelectedSection(section.id)}
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
            </div>
          ))}

          {filtered.length === 0 && !isLoading && (
            <div className="col-span-full card p-8 text-center" style={{ color: "var(--text-muted)" }}>
              No sections found.
            </div>
          )}
        </div>
      )}

      {/* Create Section Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="card p-6 w-full max-w-md mx-4"
            style={{ background: "var(--bg-surface)" }}
          >
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
                  Section Name
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. A, B, C"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
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
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {createMutation.isError && (
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  {(createMutation.error as any)?.response?.data?.message ?? "Failed to create section"}
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

      {/* Section Detail Drawer */}
      {selectedSection && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={() => setSelectedSection(null)} />
          <div
            className="w-full max-w-lg h-full overflow-y-auto shadow-xl"
            style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                  Section Detail
                </h2>
                <button onClick={() => setSelectedSection(null)}>
                  <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
                </div>
              ) : detail ? (
                <div className="space-y-6">
                  {/* Meta */}
                  <div className="card p-4 space-y-1">
                    <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                      Section {detail.name}
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {detail.term?.year?.course?.department?.name} ·{" "}
                      {detail.term?.year?.course?.name} · Year {detail.term?.year?.number}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {detail.term?.name}
                    </p>
                  </div>

                  {/* Faculty Assignments */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      Faculty Assignments ({detail.facultyAssignments?.length ?? 0})
                    </h3>
                    {detail.facultyAssignments?.length > 0 ? (
                      <div className="space-y-2">
                        {detail.facultyAssignments.map((fa: any) => (
                          <div key={fa.id} className="card p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                {fa.subject?.name}{" "}
                                <span style={{ color: "var(--text-muted)" }}>({fa.subject?.code})</span>
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                {fa.faculty?.firstName} {fa.faculty?.lastName} · {fa.faculty?.staffId}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        No faculty assigned yet.
                      </p>
                    )}
                  </div>

                  {/* Students */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      Students ({detail.studentProfiles?.length ?? 0})
                    </h3>
                    {detail.studentProfiles?.length > 0 ? (
                      <div className="space-y-2">
                        {detail.studentProfiles.map((s: any) => (
                          <div
                            key={s.id}
                            className="card p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                {s.registrationNumber}
                              </p>
                            </div>
                            <button
                              className="p-1 rounded hover:bg-red-50 transition-colors"
                              title="Remove from section"
                              onClick={() => removeStudentMutation.mutate({ studentId: s.id })}
                              disabled={removeStudentMutation.isPending}
                            >
                              <UserMinus className="w-4 h-4" style={{ color: "var(--red)" }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        No students enrolled yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
