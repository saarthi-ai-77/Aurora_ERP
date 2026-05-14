"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Library,
  UserCheck,
  Plus,
  X,
  Loader2,
  UserMinus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { academicApi } from "@/lib/api/academic.api";
import { usersApi } from "@/lib/api/users.api";
import { cn } from "@/lib/utils";

type Tab = "students" | "subjects" | "faculty";

export default function SectionDetailPage() {
  const STUDENT_PAGE_SIZE = 20;
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("students");
  const [studentSearch, setStudentSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);

  // ─── Create student modal ────────────────────────────────────────────────────
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    registrationNumber: "",
  });

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const { data: sectionData, isLoading } = useQuery({
    queryKey: ["academic", "section", id],
    queryFn: () => academicApi.getSectionDetail(id),
    enabled: !!id,
  });

  const { data: termSubjectsData } = useQuery({
    queryKey: ["academic", "term-subjects", sectionData?.data?.term?.id],
    queryFn: () => academicApi.getTermSubjects(sectionData!.data!.term.id),
    enabled: !!sectionData?.data?.term?.id,
  });

  const { data: studentsData } = useQuery({
    queryKey: ["academic", "section-students", id, studentPage],
    queryFn: () => academicApi.getSectionStudents(id, { page: studentPage, limit: STUDENT_PAGE_SIZE }),
    enabled: !!id,
  });

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const createStudentMutation = useMutation({
    mutationFn: () =>
      usersApi.createStudent({
        ...studentForm,
        sectionId: id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "section", id] });
      qc.invalidateQueries({ queryKey: ["academic", "section-students", id] });
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
      setShowCreateStudent(false);
      setStudentForm({ firstName: "", lastName: "", email: "", registrationNumber: "" });
    },
  });

  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => academicApi.removeStudentFromSection(id, studentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "section", id] });
      qc.invalidateQueries({ queryKey: ["academic", "section-students", id] });
      qc.invalidateQueries({ queryKey: ["academic", "tree"] });
    },
  });

  const assignSubjectMutation = useMutation({
    mutationFn: (subjectId: string) => academicApi.assignSubjectToSection(id, subjectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "section", id] });
    },
  });

  const removeSubjectMutation = useMutation({
    mutationFn: (subjectId: string) => academicApi.removeSubjectFromSection(id, subjectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic", "section", id] });
    },
  });

  // ─── Derived data ────────────────────────────────────────────────────────────

  const section = sectionData?.data;
  const assignedSubjectIds = new Set(
    (section?.sectionSubjects ?? []).map((ss: any) => ss.subject.id),
  );
  const availableSubjects = (termSubjectsData?.data ?? []).filter(
    (s: any) => !assignedSubjectIds.has(s.id),
  );
  const students = studentsData?.data ?? [];
  const studentPagination = studentsData?.pagination;
  const totalStudents = studentPagination?.total ?? 0;

  const filteredStudents = students.filter((s: any) =>
    `${s.firstName} ${s.lastName} ${s.registrationNumber}`
      .toLowerCase()
      .includes(studentSearch.toLowerCase()),
  );

  const filteredAvailableSubjects = availableSubjects.filter((s: any) =>
    `${s.name} ${s.code}`.toLowerCase().includes(subjectSearch.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--text-muted)" }}>Section not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back + Header */}
      <div>
        <button
          className="flex items-center gap-2 text-sm mb-4"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => router.push("/admin/sections")}
        >
          <ArrowLeft className="w-4 h-4" />
          All Sections
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Section {section.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              {section.term?.year?.course?.department?.name} ·{" "}
              {section.term?.year?.course?.name} · Year {section.term?.year?.number} ·{" "}
              {section.term?.name}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="badge badge-under-review">{section.term?.name}</span>
          </div>
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex gap-4 flex-wrap">
        {[
          { label: "Students", value: totalStudents, icon: Users },
          { label: "Subjects", value: section.sectionSubjects?.length ?? 0, icon: Library },
          { label: "Faculty", value: section.facultyAssignments?.length ?? 0, icon: UserCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="card px-4 py-3 flex items-center gap-3 flex-shrink-0"
          >
            <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <div>
              <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>
                {value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-0">
          {(["students", "subjects", "faculty"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-3 text-sm font-medium capitalize transition-colors"
              style={{
                color: tab === t ? "var(--accent)" : "var(--text-secondary)",
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Students Tab ─────────────────────────────────────────────────────── */}
      {tab === "students" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="search-bar flex-1 max-w-sm">
              <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input
                placeholder="Search by name or reg. number…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary flex items-center gap-2 flex-shrink-0"
              onClick={() => setShowCreateStudent(true)}
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>

          {filteredStudents.length === 0 ? (
            <div
              className="card p-10 flex flex-col items-center text-center"
              style={{ border: "2px dashed var(--border)" }}
            >
              <Users className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                {totalStudents === 0 ? "No students enrolled" : "No students found on this page"}
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                {totalStudents === 0
                  ? "Add students to this section to begin operations."
                  : "Try a different search term or move to another page."}
              </p>
              {totalStudents === 0 && (
                <button
                  className="btn btn-primary flex items-center gap-2"
                  onClick={() => setShowCreateStudent(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Student
                </button>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Name</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Reg. Number</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Status</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="p-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {s.registrationNumber}
                      </td>
                      <td className="p-4">
                        <span className={`badge ${s.academicStatus === "ACTIVE" ? "badge-present" : "badge-absent"}`}>
                          {s.academicStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          className="p-1.5 rounded hover:bg-red-50 transition-colors"
                          title="Remove from section"
                          onClick={() => removeStudentMutation.mutate(s.id)}
                          disabled={removeStudentMutation.isPending}
                        >
                          <UserMinus className="w-4 h-4" style={{ color: "var(--red)" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {studentPagination && studentPagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Page {studentPagination.page} of {studentPagination.pages} · {studentPagination.total} students
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                      disabled={studentPage <= 1}
                      onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
                      disabled={studentPage >= studentPagination.pages}
                      onClick={() => setStudentPage((p) => Math.min(studentPagination.pages, p + 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Subjects Tab ─────────────────────────────────────────────────────── */}
      {tab === "subjects" && (
        <div className="space-y-6">
          {/* Assigned subjects */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Assigned Subjects ({section.sectionSubjects?.length ?? 0})
            </h3>
            {section.sectionSubjects?.length === 0 ? (
              <div
                className="card p-8 text-center"
                style={{ border: "2px dashed var(--border)" }}
              >
                <Library className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No subjects assigned yet. Add subjects from the list below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {section.sectionSubjects.map((ss: any) => (
                  <div
                    key={ss.id}
                    className="card p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="badge badge-under-review">{ss.subject.code}</span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {ss.subject.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {ss.subject.credits} credits
                        </p>
                      </div>
                    </div>
                    <button
                      className="p-1.5 rounded hover:bg-red-50 transition-colors"
                      onClick={() => removeSubjectMutation.mutate(ss.subject.id)}
                      disabled={removeSubjectMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "var(--red)" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available subjects from term */}
          {availableSubjects.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Available in {section.term?.name} ({availableSubjects.length})
              </h3>
              <div className="search-bar mb-3 max-w-sm">
                <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  placeholder="Search subjects…"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                {filteredAvailableSubjects.map((s: any) => (
                  <div
                    key={s.id}
                    className="card p-3 flex items-center justify-between"
                    style={{ opacity: 0.8 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="badge" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                        {s.code}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {s.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {s.credits} credits
                        </p>
                      </div>
                    </div>
                    <button
                      className="text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1.5"
                      style={{
                        background: "var(--accent)",
                        color: "white",
                      }}
                      onClick={() => assignSubjectMutation.mutate(s.id)}
                      disabled={assignSubjectMutation.isPending}
                    >
                      <Plus className="w-3 h-3" />
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {availableSubjects.length === 0 && section.sectionSubjects?.length > 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              All subjects in this term are already assigned to this section.
            </p>
          )}

          {availableSubjects.length === 0 && section.sectionSubjects?.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No subjects exist in this term yet.{" "}
              <a href="/admin/subjects" className="underline" style={{ color: "var(--accent)" }}>
                Create subjects
              </a>{" "}
              first.
            </p>
          )}
        </div>
      )}

      {/* ── Faculty Tab ──────────────────────────────────────────────────────── */}
      {tab === "faculty" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Faculty assigned to teach subjects in this section.
            </p>
            <a
              href="/admin/faculty-assignments"
              className="text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              Manage Assignments →
            </a>
          </div>

          {section.facultyAssignments?.length === 0 ? (
            <div
              className="card p-10 flex flex-col items-center text-center"
              style={{ border: "2px dashed var(--border)" }}
            >
              <UserCheck className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                No faculty assigned
              </p>
              <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                Go to Faculty Assignments to map faculty to subjects in this section.
              </p>
              <a
                href="/admin/faculty-assignments"
                className="btn btn-primary"
              >
                Assign Faculty
              </a>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Faculty</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Subject</th>
                    <th className="text-left p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Staff ID</th>
                  </tr>
                </thead>
                <tbody>
                  {section.facultyAssignments.map((fa: any) => (
                    <tr key={fa.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="p-4">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {fa.faculty?.firstName} {fa.faculty?.lastName}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-under-review">{fa.subject?.code}</span>
                          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            {fa.subject?.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {fa.faculty?.staffId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Create Student Modal ────────────────────────────────────────────── */}
      {showCreateStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 w-full max-w-md mx-4" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
                Add Student to Section {section.name}
              </h2>
              <button onClick={() => setShowCreateStudent(false)}>
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    First Name
                  </label>
                  <input
                    className="input w-full"
                    value={studentForm.firstName}
                    onChange={(e) => setStudentForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Last Name
                  </label>
                  <input
                    className="input w-full"
                    value={studentForm.lastName}
                    onChange={(e) => setStudentForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <input
                  className="input w-full"
                  type="email"
                  placeholder="student@aurora.ac.in"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Registration Number
                </label>
                <input
                  className="input w-full"
                  placeholder="e.g. REG-24001"
                  value={studentForm.registrationNumber}
                  onChange={(e) => setStudentForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                />
              </div>

              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Default password: <strong>Aurora@123</strong> — student can change after first login.
              </p>

              {createStudentMutation.isError && (
                <p className="text-sm" style={{ color: "var(--red)" }}>
                  {(createStudentMutation.error as any)?.response?.data?.message ?? "Failed to create student"}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  className="btn btn-secondary flex-1"
                  onClick={() => setShowCreateStudent(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={
                    !studentForm.firstName ||
                    !studentForm.lastName ||
                    !studentForm.email ||
                    !studentForm.registrationNumber ||
                    createStudentMutation.isPending
                  }
                  onClick={() => createStudentMutation.mutate()}
                >
                  {createStudentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create & Enroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
