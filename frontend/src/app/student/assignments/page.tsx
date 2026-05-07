"use client";
import { useState } from "react";
import Topbar from "@/components/layout/topbar";
import { Search, Upload, X, ChevronLeft, ChevronRight } from "lucide-react";

const ALL_ASSIGNMENTS = [
  { id: "1",  title: "Literature Survey",             type: "Simple Assessment", course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 02:02 PM", dueDate: "Feb 22, 2026 11:02 PM", status: "NOT_PUBLISHED", submission: null,            uploadable: false },
  { id: "2",  title: "Design & Implementation",       type: "Simple Assessment", course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 02:00 PM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: null,            uploadable: false },
  { id: "3",  title: "Reflective Journal Writing 10", type: "Assignment",        course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 10:00 AM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Not Submitted", uploadable: true  },
  { id: "4",  title: "Lab Report 10",                 type: "Assignment",        course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 10:00 AM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Not Submitted", uploadable: true  },
  { id: "5",  title: "Group Assignment",              type: "Assignment",        course: "Problem Solving With Python Programming-2", startDate: "Feb 16, 2026 06:06 PM", dueDate: "Feb 22, 2026 06:06 PM", status: "NOT_PUBLISHED", submission: "Not Submitted", uploadable: true  },
  { id: "6",  title: "Assignment II",                 type: "Assignment",        course: "Problem Solving With Python Programming-2", startDate: "Feb 15, 2026 05:56 PM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Not Submitted", uploadable: true  },
  { id: "7",  title: "Assignment II",                 type: "Assignment",        course: "Calculus and Differential Equations",       startDate: "Feb 15, 2026 02:32 PM", dueDate: "Feb 22, 2026 11:32 PM", status: "NOT_PUBLISHED", submission: "Not Submitted", uploadable: true  },
  { id: "8",  title: "Reflective Journal Writing 8",  type: "Assignment",        course: "Problem Solving With Python Programming-2", startDate: "Feb 15, 2026 10:00 AM", dueDate: "Feb 18, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Submitted",     uploadable: false },
  { id: "9",  title: "Lab Quiz 2",                    type: "Simple Assessment", course: "Data Structures & Algorithms",              startDate: "Feb 10, 2026 09:00 AM", dueDate: "Feb 12, 2026 10:00 PM", status: "GRADED",        submission: null,            uploadable: false, marks: "42/50" },
  { id: "10", title: "Assignment I",                   type: "Assignment",        course: "Database Management Systems",               startDate: "Feb 01, 2026 09:00 AM", dueDate: "Feb 08, 2026 11:59 PM", status: "MISSED",        submission: "Missed",        uploadable: false },
];

// Detail modal (matches ref image 3)
function AssignmentModal({ assignment, onClose }: { assignment: typeof ALL_ASSIGNMENTS[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {assignment.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-4 gap-4 px-5 py-4" style={{ background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Start Date", value: assignment.startDate },
            { label: "Due Date",   value: assignment.dueDate,  highlight: true },
            { label: "Course",     value: assignment.course },
            { label: "Faculty",    value: "Sai Rahul Mallidi" },
          ].map(({ label, value, highlight }) => (
            <div key={label}>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: highlight ? "var(--accent)" : "var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-5 p-5">
          {/* Description / rubric */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
              Description
            </p>
            <table className="w-full text-xs" style={{ border: "1px solid var(--border)", borderRadius: 4 }}>
              <thead>
                <tr style={{ background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left p-2 font-semibold" style={{ color: "var(--text-secondary)" }}>Journal Entry Guidelines</th>
                  <th className="text-left p-2 font-semibold" style={{ color: "var(--text-secondary)" }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { guideline: "1. Experience (Class Content)", desc: "Briefly describe the topics or concepts discussed in the class." },
                  { guideline: "2. Feelings (Emotional Reactions)", desc: "Share your emotional reactions and thoughts during the class." },
                  { guideline: "3. Learning (Key Insights)", desc: "Reflect on what you learned from the class." },
                  { guideline: "4. Application (Practical Use)", desc: "Describe how you plan to apply the theory you've learned." },
                ].map((row) => (
                  <tr key={row.guideline} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="p-2 font-medium align-top" style={{ color: "var(--text-secondary)", width: "40%" }}>{row.guideline}</td>
                    <td className="p-2 align-top" style={{ color: "var(--accent)" }}>{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 p-3 rounded text-xs" style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)" }}>
              <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Document</p>
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--accent)" }}>Reflective_Journal_format_1.docx</span>
                <Upload className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
              </div>
            </div>
          </div>

          {/* Upload section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Upload</p>
            <label
              htmlFor="file-upload"
              className="flex items-center justify-center h-32 rounded cursor-pointer transition-colors"
              style={{
                border: "2px dashed var(--border-strong)",
                background: "var(--bg-surface-2)",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
            >
              Click and Attach files here
              <input id="file-upload" type="file" accept=".pdf" className="hidden" />
            </label>
            <p className="text-xs mt-1.5 text-center" style={{ color: "var(--text-muted)" }}>
              PDF only · Max 5 MB
            </p>

            {/* Submission history table */}
            <div className="mt-4">
              <table className="erp-table text-xs">
                <thead>
                  <tr>
                    <th>Created Date</th>
                    <th>Updated Date</th>
                    <th>Attachment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: "var(--text-muted)" }}>—</td>
                    <td style={{ color: "var(--text-muted)" }}>—</td>
                    <td style={{ color: "var(--text-muted)" }}>📄</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>No records found</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentAssignments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "ongoing">("ongoing");
  const [selected, setSelected] = useState<typeof ALL_ASSIGNMENTS[0] | null>(null);

  const filtered = ALL_ASSIGNMENTS.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Topbar title="Assessments" breadcrumb={["Profile"]} />

      {selected && (
        <AssignmentModal assignment={selected} onClose={() => setSelected(null)} />
      )}

      <div
        className="p-5"
        style={{ background: "var(--bg-page)", minHeight: "calc(100vh - var(--topbar-height))" }}
      >
        <div className="card overflow-hidden">
          {/* Tabs + search */}
          <div
            className="flex items-center justify-between px-5 pt-4 pb-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1">
              {(["all", "ongoing"] as const).map((tab) => {
                const labels = { all: `All (${ALL_ASSIGNMENTS.length})`, ongoing: `Ongoing (${ALL_ASSIGNMENTS.filter((a) => a.submission === "Not Submitted").length})` };
                const icons  = { all: "☰", ongoing: "📋" };
                return (
                  <button
                    key={tab}
                    id={`tab-${tab}`}
                    onClick={() => setFilter(tab)}
                    className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative"
                    style={{
                      color: filter === tab ? "var(--accent)" : "var(--text-muted)",
                      borderBottom: filter === tab ? "2px solid var(--accent)" : "2px solid transparent",
                      marginBottom: -1,
                    }}
                  >
                    <span>{icons[tab]}</span>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="search-bar mb-2">
              <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <input
                id="assignments-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Name"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Course Name</th>
                  <th>Start Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Results / Attainment</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <button
                        className="text-left font-medium hover:underline"
                        style={{ color: "var(--text-primary)" }}
                        onClick={() => setSelected(a)}
                      >
                        {a.title}
                      </button>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{a.type}</td>
                    <td>
                      <a style={{ color: "var(--accent)" }} href="#" className="hover:underline text-sm">
                        {a.course}
                      </a>
                    </td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12, whiteSpace: "nowrap" }}>{a.startDate}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12, whiteSpace: "nowrap" }}>{a.dueDate}</td>
                    <td>
                      <div className="flex flex-col gap-1 items-start">
                        {a.status === "NOT_PUBLISHED" && <span className="badge badge-not-published">Not Published</span>}
                        {a.status === "GRADED"        && <span className="badge badge-graded">Graded</span>}
                        {a.status === "MISSED"        && <span className="badge badge-missed">Missed</span>}
                        {a.status === "SUBMITTED"     && <span className="badge badge-submitted">Submitted</span>}

                        {a.submission && (
                          <span className={`badge ${a.submission === "Submitted" ? "badge-submitted" : a.submission === "Missed" ? "badge-missed" : "badge-not-submitted"}`}>
                            {a.submission}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        {a.marks && (
                          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{a.marks}</span>
                        )}
                        {a.uploadable && (
                          <button
                            id={`upload-btn-${a.id}`}
                            onClick={() => setSelected(a)}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: "var(--accent)" }}
                            title="Upload submission"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-light)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Showing {filtered.length} of {ALL_ASSIGNMENTS.length} assessments
            </span>
            <div className="flex items-center gap-1">
              <button
                id="prev-page"
                className="p-1.5 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="px-2.5 py-1 rounded text-xs font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                1
              </button>
              <button
                id="next-page"
                className="p-1.5 rounded transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
