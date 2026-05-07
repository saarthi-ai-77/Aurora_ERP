"use client";

import Topbar from "@/components/layout/topbar";
import { Download, AlertCircle } from "lucide-react";

const ATTENDANCE = [
  { id: "CS301", name: "Problem Solving With Python Programming-2", faculty: "Sai Rahul Mallidi", total: 42, present: 36, absent: 4, leave: 1, late: 1, percent: 88, status: "Safe" },
  { id: "MT201", name: "Calculus and Differential Equations", faculty: "Dr. A. Sharma", total: 38, present: 24, absent: 14, leave: 0, late: 0, percent: 63, status: "Critical" },
  { id: "CS302", name: "Data Structures & Algorithms", faculty: "Dr. K. Reddy", total: 40, present: 29, absent: 9, leave: 2, late: 0, percent: 72, status: "Warning" },
  { id: "CS303", name: "Database Management Systems", faculty: "Prof. S. Gupta", total: 35, present: 33, absent: 2, leave: 0, late: 0, percent: 94, status: "Safe" },
];

export default function StudentAttendance() {
  return (
    <>
      <Topbar title="Attendance Overview" breadcrumb={["Attendance"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Subject-wise Attendance</h2>
          <button className="btn-secondary">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Faculty</th>
                <th className="text-center">Total Sessions</th>
                <th className="text-center">Present</th>
                <th className="text-center">Absent</th>
                <th className="text-center">Leave</th>
                <th className="text-center">Late</th>
                <th className="text-center">Attendance %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ATTENDANCE.map((row) => (
                <tr key={row.id}>
                  <td>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{row.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{row.id}</p>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{row.faculty}</td>
                  <td className="text-center font-medium" style={{ color: "var(--text-primary)" }}>{row.total}</td>
                  <td className="text-center" style={{ color: "var(--accent)" }}>{row.present}</td>
                  <td className="text-center text-red-600">{row.absent}</td>
                  <td className="text-center text-amber-600">{row.leave}</td>
                  <td className="text-center text-gray-500">{row.late}</td>
                  <td className="text-center">
                    <span className="font-bold" style={{ color: row.percent >= 75 ? "var(--accent)" : row.percent >= 65 ? "var(--amber)" : "var(--red)" }}>
                      {row.percent}%
                    </span>
                  </td>
                  <td>
                    {row.status === "Safe" && <span className="badge" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Safe</span>}
                    {row.status === "Warning" && <span className="badge" style={{ background: "var(--amber-light)", color: "var(--amber)", border: "1px solid var(--amber-border)" }}>Warning</span>}
                    {row.status === "Critical" && <span className="badge" style={{ background: "var(--red-light)", color: "var(--red)", border: "1px solid var(--red-border)" }}>Critical</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 px-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--accent)" }}></div>
            <span style={{ color: "var(--text-secondary)" }}>Safe (&gt;75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--amber)" }}></div>
            <span style={{ color: "var(--text-secondary)" }}>Warning (65-75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--red)" }}></div>
            <span style={{ color: "var(--text-secondary)" }}>Critical (&lt;65%)</span>
          </div>
        </div>

      </div>
    </>
  );
}
