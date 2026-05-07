"use client";
import Topbar from "@/components/layout/topbar";
import { AlertTriangle, TrendingUp, BookOpen, Clock, FileX } from "lucide-react";
import { getStoredUser } from "@/lib/auth";

// Mock data — will be replaced with API calls
const MOCK_ATTENDANCE = [
  { subject: "Data Structures & Algorithms", code: "DSA", attended: 34, total: 40, percentage: 85 },
  { subject: "Database Management Systems",  code: "DBMS", attended: 29, total: 40, percentage: 72.5 },
  { subject: "Operating Systems",            code: "OS",   attended: 22, total: 40, percentage: 55 },
  { subject: "Computer Networks",            code: "CN",   attended: 37, total: 40, percentage: 92.5 },
  { subject: "Software Engineering",         code: "SE",   attended: 31, total: 40, percentage: 77.5 },
];

const MOCK_ASSIGNMENTS = [
  { id: "1", title: "Reflective Journal Writing 10", type: "Assignment", course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 10:00 AM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Not Submitted" },
  { id: "2", title: "Lab Report 10",                 type: "Assignment", course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 10:00 AM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Not Submitted" },
  { id: "3", title: "Group Assignment",              type: "Assignment", course: "Problem Solving With Python Programming-2", startDate: "Feb 16, 2026 06:06 PM", dueDate: "Feb 22, 2026 06:06 PM", status: "NOT_PUBLISHED", submission: "Not Submitted" },
  { id: "4", title: "Assignment II",                 type: "Assignment", course: "Problem Solving With Python Programming-2", startDate: "Feb 15, 2026 05:56 PM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: "Not Submitted" },
  { id: "5", title: "Assignment II",                 type: "Assignment", course: "Calculus and Differential Equations",       startDate: "Feb 15, 2026 02:32 PM", dueDate: "Feb 22, 2026 11:32 PM", status: "NOT_PUBLISHED", submission: "Not Submitted" },
  { id: "6", title: "Literature Survey",             type: "Simple Assessment", course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 02:02 PM", dueDate: "Feb 22, 2026 11:02 PM", status: "NOT_PUBLISHED", submission: null },
  { id: "7", title: "Design & Implementation",       type: "Simple Assessment", course: "Problem Solving With Python Programming-2", startDate: "Feb 18, 2026 02:00 PM", dueDate: "Feb 22, 2026 11:00 PM", status: "NOT_PUBLISHED", submission: null },
];

const MOCK_NOTICES = [
  { id: "1", title: "Mid-Term Examination Schedule Released", category: "EXAMS",      isPinned: true,  date: "May 6" },
  { id: "2", title: "National Level Hackathon — Register by May 15", category: "HACKATHONS", isPinned: false, date: "May 5" },
  { id: "3", title: "Guest Lecture: AI Ethics – Dr. Sharma",  category: "EVENTS",     isPinned: false, date: "May 4" },
];

const NOTICE_COLORS: Record<string, { bg: string; color: string }> = {
  EXAMS:      { bg: "#fef2f2", color: "#dc2626" },
  HACKATHONS: { bg: "#f5f3ff", color: "#7c3aed" },
  EVENTS:     { bg: "#eff6ff", color: "#1d4ed8" },
  ACADEMIC:   { bg: "#f0fdf4", color: "#16a34a" },
  WORKSHOPS:  { bg: "#fffbeb", color: "#d97706" },
  GENERAL:    { bg: "#f9fafb", color: "#6b7280" },
};

function AttendancePct({ pct }: { pct: number }) {
  const color = pct >= 75 ? "var(--green)" : pct >= 60 ? "var(--amber)" : "var(--red)";
  const bar = pct >= 75 ? "#16a34a" : pct >= 60 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-3">
      <div className="progress-track flex-1" style={{ maxWidth: 120 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: bar }} />
      </div>
      <span className="text-xs font-semibold" style={{ color, minWidth: 38, textAlign: "right" }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const user = getStoredUser();
  const overall = MOCK_ATTENDANCE.reduce((s, a) => s + a.percentage, 0) / MOCK_ATTENDANCE.length;
  const lowAtt  = MOCK_ATTENDANCE.filter((a) => a.percentage < 75);
  const pending  = MOCK_ASSIGNMENTS.filter((a) => a.submission === "Not Submitted").length;
  const missed   = MOCK_ASSIGNMENTS.filter((a) => a.submission === "Missed").length;
  const deadlines = 2;

  return (
    <>
      <Topbar
        title="Dashboard"
        breadcrumb={["Profile"]}
      />

      <div className="p-5 space-y-5" style={{ background: "var(--bg-page)", minHeight: "calc(100vh - var(--topbar-height))" }}>

        {/* Low attendance warning */}
        {lowAtt.length > 0 && (
          <div className="alert-warning">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Attendance Alert — </span>
              {lowAtt.length} subject{lowAtt.length > 1 ? "s" : ""} below 75%:{" "}
              {lowAtt.map((s) => s.code).join(", ")}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: "stat-att",    label: "Overall Attendance", value: `${overall.toFixed(1)}%`, icon: TrendingUp, color: overall >= 75 ? "var(--green)" : "var(--amber)" },
            { id: "stat-pend",   label: "Pending Submissions", value: pending, icon: BookOpen, color: "var(--accent)" },
            { id: "stat-dl",     label: "Due This Week",       value: deadlines, icon: Clock, color: "var(--amber)" },
            { id: "stat-missed", label: "Missed",              value: missed, icon: FileX, color: "var(--red)" },
          ].map((s) => (
            <div key={s.id} id={s.id} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Attendance */}
          <div className="lg:col-span-2 card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Subject-wise Attendance
            </h2>
            <div className="space-y-4">
              {MOCK_ATTENDANCE.map((s) => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.subject}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.attended}/{s.total} classes</span>
                  </div>
                  <AttendancePct pct={s.percentage} />
                </div>
              ))}
            </div>
          </div>

          {/* Notices */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Notices
            </h2>
            <div className="space-y-3">
              {MOCK_NOTICES.map((n) => {
                const c = NOTICE_COLORS[n.category] || NOTICE_COLORS.GENERAL;
                return (
                  <div
                    key={n.id}
                    className="p-3 rounded cursor-pointer transition-colors"
                    style={{
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {n.isPinned && <span style={{ color: "var(--amber)", fontSize: 12 }}>📌</span>}
                      <p className="text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                        {n.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="badge"
                        style={{ background: c.bg, color: c.color, borderColor: "transparent", fontSize: 10 }}
                      >
                        {n.category}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{n.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="card">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recent Assessments
            </h2>
            <a
              href="/student/assignments"
              className="text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              View all →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Course Name</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Results</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ASSIGNMENTS.slice(0, 5).map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium" style={{ color: "var(--text-primary)" }}>{a.title}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{a.type}</td>
                    <td>
                      <a style={{ color: "var(--accent)" }} href="#" className="hover:underline">
                        {a.course}
                      </a>
                    </td>
                    <td style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{a.dueDate}</td>
                    <td>
                      <span className="badge badge-not-published">Not Published</span>
                    </td>
                    <td>
                      {a.submission ? (
                        <span className="badge badge-not-submitted">{a.submission}</span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
