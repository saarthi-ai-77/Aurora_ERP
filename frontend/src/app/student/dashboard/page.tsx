"use client";

import Topbar from "@/components/layout/topbar";
import { getStoredUser } from "@/lib/auth";
import { 
  BarChart, 
  AlertTriangle, 
  Clock, 
  FileX,
  Bell,
  CalendarDays,
  FileCheck,
  TrendingUp,
  UploadCloud,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const user = getStoredUser();

  return (
    <>
      <Topbar title="Dashboard" breadcrumb={["Dashboard"]} />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Welcome Banner */}
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
            <Link href="/student/assignments" className="btn-primary">
              <UploadCloud className="w-4 h-4" />
              Upload Assignment
            </Link>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                <BarChart className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Overall Attendance</p>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>86.5%</p>
            <div className="progress-track mt-3">
              <div className="progress-fill" style={{ width: "86.5%", background: "var(--accent)" }} />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Attendance Alerts</p>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>2</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Subjects below 75%</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Upcoming Deadlines</p>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>4</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Due within 7 days</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded" style={{ background: "var(--red-light)", color: "var(--red)" }}>
                <FileX className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Missed Assignments</p>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>1</p>
            <p className="text-xs" style={{ color: "var(--red)" }}>Requires immediate action</p>
          </div>
        </div>

        {/* Dashboard Layout: Center feed & Right stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Feed Column */}
          <div className="col-span-2 space-y-6">
            
            {/* Upcoming Deadlines Widget */}
            <div className="card">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <CalendarDays className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  Upcoming Deadlines
                </h2>
                <Link href="/student/assignments" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>View all</Link>
              </div>
              <div className="p-0">
                <table className="erp-table text-xs">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Course</th>
                      <th>Due Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-medium">Lab Report 10</td>
                      <td>Problem Solving With Python...</td>
                      <td style={{ color: "var(--text-secondary)" }}>Feb 22, 2026</td>
                      <td>
                        <Link href="/student/assignments" className="flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
                          Upload <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium">Reflective Journal 10</td>
                      <td>Problem Solving With Python...</td>
                      <td style={{ color: "var(--text-secondary)" }}>Feb 22, 2026</td>
                      <td>
                        <Link href="/student/assignments" className="flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}>
                          Upload <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Notices Widget */}
            <div className="card">
              <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <Bell className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  Recent Notices
                </h2>
                <Link href="/student/noticeboard" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>Noticeboard</Link>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-2 h-2 mt-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Mid-Term Examination Schedule Released</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Examinations Branch • 2 hours ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-300" />
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>Guest Lecture on AI Ethics</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Computer Science Dept • 1 day ago</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* Quick Links */}
            <div className="card p-4">
              <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Quick Links</h2>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/student/attendance" className="p-3 rounded text-center border transition-colors" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                  <BarChart className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--accent)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Attendance</span>
                </Link>
                <Link href="/student/calendar" className="p-3 rounded text-center border transition-colors" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                  <CalendarDays className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--accent)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Calendar</span>
                </Link>
                <Link href="/student/noticeboard" className="p-3 rounded text-center border transition-colors" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                  <Bell className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--accent)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Notices</span>
                </Link>
                <Link href="/student/catalog" className="p-3 rounded text-center border transition-colors" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
                  <FileCheck className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--accent)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Catalog</span>
                </Link>
              </div>
            </div>

            {/* Attendance Trend */}
            <div className="card p-4">
              <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "var(--accent)" }} />
                Attendance Trend
              </h2>
              <div className="h-32 flex items-end gap-2 px-2 pb-2">
                {/* Mock bar chart */}
                {[75, 82, 88, 85, 90, 86].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t relative group" style={{ height: `${h}%`, background: "var(--accent-border)" }}>
                    <div className="absolute inset-x-0 bottom-0 rounded-t transition-all group-hover:opacity-80" style={{ height: `${h}%`, background: "var(--accent)" }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-2 text-[10px]" style={{ color: "var(--text-muted)" }}>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>
            </div>

            {/* Latest Marks */}
            <div className="card p-4">
              <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Latest Marks</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Lab Quiz 2</span>
                  <span className="font-semibold" style={{ color: "var(--accent)" }}>42 / 50</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Mid-Term I</span>
                  <span className="font-semibold" style={{ color: "var(--accent)" }}>88 / 100</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
