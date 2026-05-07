"use client";
import Topbar from "@/components/layout/topbar";
import { BookOpen, CheckCircle2, Clock, Users, BarChart3, AlertTriangle } from "lucide-react";
import { getStoredUser } from "@/lib/auth";

const MOCK_SECTION_STATS = [
  { section: "CSE-A", avgAttendance: 82, submissionRate: 78, pending: 12 },
  { section: "CSE-B", avgAttendance: 74, submissionRate: 65, pending: 18 },
  { section: "IT-A",  avgAttendance: 89, submissionRate: 91, pending: 5  },
];

const MOCK_PENDING = [
  { id: "1", student: "Rahul Sharma",  assignment: "Assignment 1 – ER Diagram",        subject: "DBMS", section: "CSE-A", date: "May 6" },
  { id: "2", student: "Priya Patel",   assignment: "Reflective Journal – Week 4",      subject: "SE",   section: "CSE-B", date: "May 5" },
  { id: "3", student: "Ankit Kumar",   assignment: "Assignment 1 – ER Diagram",        subject: "DBMS", section: "IT-A",  date: "May 7" },
  { id: "4", student: "Sneha Reddy",   assignment: "Lab Report 10",                    subject: "DS",   section: "CSE-A", date: "May 7" },
];

export default function FacultyDashboard() {
  const user = getStoredUser();

  return (
    <>
      <Topbar title="Dashboard" breadcrumb={["Dashboard"]} />
      <div className="p-5 space-y-5" style={{ background: "var(--bg-page)", minHeight: "calc(100vh - var(--topbar-height))" }}>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: "stat-sections",  label: "My Sections",              value: 3,  icon: Users,        color: "var(--accent)" },
            { id: "stat-reviews",   label: "Pending Reviews",          value: 4,  icon: Clock,        color: "var(--amber)" },
            { id: "stat-graded",    label: "Assignments Graded",       value: 47, icon: CheckCircle2, color: "var(--green)" },
            { id: "stat-low-att",   label: "Low Attendance Students",  value: 8,  icon: AlertTriangle, color: "var(--red)" },
          ].map((s) => (
            <div key={s.id} id={s.id} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Section overview */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <BarChart3 className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Section Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Avg. Attendance</th>
                  <th>Submission Rate</th>
                  <th>Pending Reviews</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SECTION_STATS.map((s) => (
                  <tr key={s.section}>
                    <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{s.section}</td>
                    <td>
                      <span className="font-semibold" style={{ color: s.avgAttendance >= 75 ? "var(--green)" : "var(--amber)" }}>
                        {s.avgAttendance}%
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress-track" style={{ width: 100 }}>
                          <div className="progress-fill" style={{ width: `${s.submissionRate}%`, background: "var(--accent)" }} />
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.submissionRate}%</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--amber)", fontWeight: 600 }}>{s.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending reviews */}
        <div className="card">
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <BookOpen className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Pending Submission Reviews</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Subject</th>
                  <th>Section</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PENDING.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium" style={{ color: "var(--text-primary)" }}>{r.student}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{r.assignment}</td>
                    <td><span className="badge badge-graded">{r.subject}</span></td>
                    <td style={{ color: "var(--accent)", fontWeight: 500 }}>{r.section}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.date}</td>
                    <td>
                      <button
                        id={`review-${r.id}`}
                        className="btn-secondary text-xs py-1 px-3"
                        style={{ color: "var(--accent)", borderColor: "var(--accent-border)" }}
                      >
                        Review
                      </button>
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
