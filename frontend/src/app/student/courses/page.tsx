"use client";

import { useQuery } from "@tanstack/react-query";
import Topbar from "@/components/layout/topbar";
import { Download, Users, Mail, Loader2, BookOpen } from "lucide-react";
import { academicApi } from "@/lib/api/academic.api";

export default function StudentCourses() {
  const { data: contextData, isLoading } = useQuery({
    queryKey: ["academic-context"],
    queryFn: () => academicApi.getMyContext(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--topbar-height))]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const context = contextData?.data;
  const subjects = context?.subjects || [];
  const deptName = context?.department?.name || "Academic";
  const termName = context?.term?.name || "Current Term";

  return (
    <>
      <Topbar title="My Courses" breadcrumb={["Courses"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        {subjects.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
            <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-bold text-gray-700">No Enrolled Subjects</h3>
            <p className="text-sm text-gray-500 max-w-md mt-1">
              You are not currently enrolled in any subjects for this term. Please contact the administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject: any) => {
              const faculty = subject.facultyAssignments?.[0]?.faculty;
              const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : "Not Assigned";
              return (
                <div key={subject.id} className="card overflow-hidden flex flex-col">
                  <div className="p-5 flex-1" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded" style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                        {subject.code}
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                        {subject.credits} Credits
                      </span>
                    </div>
                    <h3 className="text-base font-semibold mb-1 animate-pulse-once" style={{ color: "var(--text-primary)" }}>{subject.name}</h3>
                    <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{deptName} • {termName}</p>
                    
                    <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: "var(--accent)" }}>
                        {facultyName.charAt(0)}
                      </div>
                      <span className="font-medium">{facultyName}</span>
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
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
