"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import Topbar from "@/components/layout/topbar";
import { BookOpen, CheckCircle2, Clock, Users, BarChart3, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FacultyDashboard() {
  const user = getStoredUser();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['faculty-dashboard'],
    queryFn: () => analyticsApi.getFacultyDashboard(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--topbar-height))]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const data = analytics?.data || { sections: [], pendingTasks: [], stats: { activeSections: 0, totalStudents: 0 } };
  const stats = [
    { id: "stat-sections",  label: "My Sections",   value: data.stats.activeSections, icon: Users,        color: "var(--accent)" },
    { id: "stat-reviews",   label: "Pending Reviews", value: data.pendingTasks.length, icon: Clock,        color: "var(--amber)" },
    { id: "stat-students",  label: "Total Students", value: data.stats.totalStudents,  icon: CheckCircle2, color: "var(--green)" },
  ];

  return (
    <>
      <Topbar title="Dashboard" breadcrumb={["Dashboard"]} />
      <div className="p-6 space-y-6 animate-in fade-in duration-500 bg-gray-50 min-h-[calc(100vh-var(--topbar-height))]">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900">Academic Overview</h1>
          <p className="text-sm text-gray-500">Monitor section performance and pending grading tasks.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</span>
                <s.icon className="w-5 h-5 opacity-20" style={{ color: s.color }} />
              </div>
              <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/50">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">Section Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    <tr>
                      <th className="px-6 py-3">Section & Subject</th>
                      <th className="px-6 py-3">Total Submissions</th>
                      <th className="px-6 py-3">Pending Grading</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.sections.map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{s.sectionName}</p>
                          <p className="text-xs text-gray-500">{s.subjectName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-600">{s.totalSubmissions}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-bold",
                            s.pendingGrading > 0 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                          )}>
                            {s.pendingGrading} pending
                          </span>
                        </td>
                      </tr>
                    ))}
                    {data.sections.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">No sections assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50/50">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">Pending Reviews</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    <tr>
                      <th className="px-6 py-3">Student</th>
                      <th className="px-6 py-3">Assignment</th>
                      <th className="px-6 py-3">Submitted</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.pendingTasks.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">{r.studentName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{r.assignmentTitle}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-400">{new Date(r.submittedAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Link 
                            href="/faculty/assignments"
                            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            Grade <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {data.pendingTasks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">All caught up! No pending reviews.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h2 className="font-bold flex items-center gap-2 mb-4 text-gray-900">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link href="/faculty/attendance" className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                  <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">Mark Attendance</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                </Link>
                <Link href="/faculty/assignments" className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group">
                  <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-600">Create Assignment</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
