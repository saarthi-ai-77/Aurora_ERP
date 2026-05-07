"use client";

import { useState } from "react";
import { Plus, Search, FileText, CheckCircle, Clock } from "lucide-react";

// Mock Data
const MOCK_ASSIGNMENTS = [
  {
    id: "1",
    title: "Database Normalization Case Study",
    course: "DBMS (CS301)",
    section: "A",
    dueDate: "Oct 25, 2026",
    status: "Published",
    submissions: 45,
    totalStudents: 60,
  },
  {
    id: "2",
    title: "SQL Query Optimization",
    course: "DBMS (CS301)",
    section: "B",
    dueDate: "Oct 28, 2026",
    status: "Draft",
    submissions: 0,
    totalStudents: 60,
  },
  {
    id: "3",
    title: "React Native Setup Assignment",
    course: "Mobile Dev (CS402)",
    section: "A",
    dueDate: "Nov 02, 2026",
    status: "Published",
    submissions: 12,
    totalStudents: 55,
  },
];

export default function FacultyAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_ASSIGNMENTS.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Assignments
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage and review student assignments across your courses.
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="search-bar w-full md:w-80">
          <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select className="erp-input w-full md:w-40 bg-gray-50">
            <option value="all">All Courses</option>
            <option value="cs301">DBMS (CS301)</option>
            <option value="cs402">Mobile Dev (CS402)</option>
          </select>
          <select className="erp-input w-full md:w-32 bg-gray-50">
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Course & Section</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Submissions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText
                        className="w-4 h-4"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span>{assignment.title}</span>
                    </div>
                  </td>
                  <td>
                    <div>{assignment.course}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Section {assignment.section}
                    </div>
                  </td>
                  <td>{assignment.dueDate}</td>
                  <td>
                    <span
                      className={`badge ${
                        assignment.status === "Published"
                          ? "badge-submitted"
                          : "badge-not-published"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="progress-track w-24">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (assignment.submissions / assignment.totalStudents) * 100
                            }%`,
                            background: "var(--accent)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">
                        {assignment.submissions}/{assignment.totalStudents}
                      </span>
                    </div>
                  </td>
                  <td>
                    <button className="btn-secondary text-xs px-3 py-1.5">
                      Review
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <p style={{ color: "var(--text-muted)" }}>No assignments found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
