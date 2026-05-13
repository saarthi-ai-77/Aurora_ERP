"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import Topbar from "@/components/layout/topbar";
import { getStoredUser } from "@/lib/auth";
import {
  BarChart,
  AlertTriangle,
  Clock,
  FileX,
  Bell,
  CalendarDays,
  TrendingUp,
  UploadCloud,
  ArrowRight,
  Loader2,
  Megaphone,
  Pin
} from "lucide-react";
import { noticeboardApi } from "@/lib/api/noticeboard.api";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const user = getStoredUser();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => analyticsApi.getStudentDashboard(),
  });

  const { data: noticesData } = useQuery({
    queryKey: ['noticeboard', 'student'],
    queryFn: () => noticeboardApi.getMyNotices(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-var(--topbar-height))]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const data = analytics?.data;
  const attendance = data?.attendance || { percentage: 0, totalSessions: 0, present: 0 };
  const assignments = data?.assignments || { total: 0, graded: 0, pending: 0 };
  const upcoming = data?.upcomingDeadlines || [];
  const recentNotices: any[] = (noticesData?.data ?? []).slice(0, 4);

  return (
    <>
      <Topbar title="Dashboard" breadcrumb={["Dashboard"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Welcome back, {user?.name || "Student"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Here is your academic overview for the Current Term.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/student/assignments" className="btn-primary h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all shadow-sm">
              <UploadCloud className="w-4 h-4" />
              Upload Assignment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <BarChart className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Overall Attendance</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{attendance.percentage.toFixed(1)}%</p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-1000", attendance.percentage >= 75 ? "bg-green-500" : "bg-red-500")} 
                style={{ width: `${attendance.percentage}%` }} 
              />
            </div>
          </div>

          <div className="stat-card bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Present Sessions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{attendance.present}</p>
            <p className="text-xs text-gray-400">Out of {attendance.totalSessions} sessions</p>
          </div>

          <div className="stat-card bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Graded Work</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assignments.graded}</p>
            <p className="text-xs text-gray-400">{assignments.total} total assignments</p>
          </div>

          <div className="stat-card bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <FileX className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Pending Submissions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{assignments.pending}</p>
            <p className="text-xs text-red-500">Requires action</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold flex items-center gap-2 text-gray-900">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  Upcoming Deadlines
                </h2>
                <Link href="/student/assignments" className="text-xs text-indigo-600 hover:underline">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    <tr>
                      <th className="px-6 py-3">Assignment</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {upcoming.map((a: any) => (
                      <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900">{a.title}</p>
                          <p className="text-xs text-gray-500">{a.subject?.name || 'Academic'}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(a.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link href="/student/assignments" className="text-indigo-600 font-medium flex items-center gap-1 hover:gap-2 transition-all">
                            Submit <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {upcoming.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">No upcoming deadlines</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-4 border-b pb-4">
                <h2 className="font-bold flex items-center gap-2 text-gray-900">
                  <Bell className="w-4 h-4 text-indigo-600" />
                  Recent Notices
                </h2>
                <Link href="/student/noticeboard" className="text-xs text-indigo-600 hover:underline">View All</Link>
              </div>
              {recentNotices.length > 0 ? (
                <div className="divide-y">
                  {recentNotices.map((n: any) => (
                    <div key={n.id} className="flex items-start gap-3 py-3 px-1">
                      <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-indigo-50 text-indigo-500">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1">
                          {n.title}
                          {n.isPinned && <Pin className="w-3 h-3 text-gray-400 shrink-0" />}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{n.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No recent notices.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h2 className="font-bold mb-4 text-xs uppercase tracking-widest text-gray-400">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/student/attendance" className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-200 transition-all text-center group">
                  <BarChart className="w-6 h-6 mx-auto mb-2 text-indigo-400 group-hover:text-indigo-600" />
                  <span className="text-xs font-bold text-gray-600">Attendance</span>
                </Link>
                <Link href="/student/assignments" className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-indigo-200 transition-all text-center group">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-indigo-400 group-hover:text-indigo-600" />
                  <span className="text-xs font-bold text-gray-600">Deadlines</span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h2 className="font-bold flex items-center gap-2 mb-4 text-gray-900">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Performance Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Graded Assignments</span>
                  <span className="font-bold text-indigo-600">{assignments.graded} / {assignments.total}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-1000" 
                    style={{ width: `${assignments.total > 0 ? (assignments.graded / assignments.total) * 100 : 0}%` }} 
                  />
                </div>
                <p className="text-[10px] text-gray-400 italic">Historical GPA trends will be available in future updates.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
