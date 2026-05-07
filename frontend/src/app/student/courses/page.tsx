"use client";

import Topbar from "@/components/layout/topbar";
import { Download, Users, Mail } from "lucide-react";

const COURSES = [
  { id: "CS301", name: "Problem Solving With Python Programming-2", credits: 3, faculty: "Sai Rahul Mallidi", type: "Core", term: "Term 4", dept: "Computer Science" },
  { id: "MT201", name: "Calculus and Differential Equations", credits: 4, faculty: "Dr. A. Sharma", type: "Core", term: "Term 4", dept: "Mathematics" },
  { id: "CS302", name: "Data Structures & Algorithms", credits: 4, faculty: "Dr. K. Reddy", type: "Core", term: "Term 4", dept: "Computer Science" },
  { id: "CS303", name: "Database Management Systems", credits: 3, faculty: "Prof. S. Gupta", type: "Core", term: "Term 4", dept: "Computer Science" },
];

export default function StudentCourses() {
  return (
    <>
      <Topbar title="My Courses" breadcrumb={["Courses"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map((course) => (
            <div key={course.id} className="card overflow-hidden flex flex-col">
              <div className="p-5 flex-1" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                    {course.id}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                    {course.credits} Credits
                  </span>
                </div>
                <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{course.name}</h3>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{course.dept} • {course.term}</p>
                
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: "var(--accent)" }}>
                    {course.faculty.charAt(0)}
                  </div>
                  <span className="font-medium">{course.faculty}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 flex items-center justify-between">
                <button className="flex items-center gap-1.5 text-xs font-medium hover:underline" style={{ color: "var(--accent)" }}>
                  <Download className="w-3.5 h-3.5" />
                  Syllabus
                </button>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-gray-200 transition-colors" style={{ color: "var(--text-secondary)" }} aria-label="Contact Faculty">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-gray-200 transition-colors" style={{ color: "var(--text-secondary)" }} aria-label="Classmates">
                    <Users className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
