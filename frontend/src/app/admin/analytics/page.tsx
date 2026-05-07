"use client";

import { Users, BookOpen, GraduationCap, Building2, BarChart } from "lucide-react";

export default function AdminAnalyticsPage() {
  const stats = [
    { label: "Total Students", value: "1,245", icon: GraduationCap },
    { label: "Total Faculty", value: "84", icon: Users },
    { label: "Active Courses", value: "32", icon: BookOpen },
    { label: "Departments", value: "6", icon: Building2 },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            System Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            High-level overview of Aurora ERP's academic and operational metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="stat-card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-secondary)" }}>
                {s.label}
              </p>
              <h3 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </h3>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              <s.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section (Mocked with simple CSS bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
              Attendance Overview (Current Month)
            </h3>
          </div>
          
          <div className="space-y-5">
            {[
              { dept: "Computer Science", present: 88 },
              { dept: "Mechanical Eng", present: 76 },
              { dept: "Civil Eng", present: 81 },
              { dept: "Electronics", present: 85 },
            ].map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{d.dept}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{d.present}%</span>
                </div>
                <div className="progress-track w-full">
                  <div
                    className="progress-fill"
                    style={{ width: `${d.present}%`, background: "var(--accent)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5" style={{ color: "var(--accent)" }} />
            <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
              Assignment Submission Rates
            </h3>
          </div>
          
          <div className="space-y-5">
            {[
              { year: "1st Year", rate: 92 },
              { year: "2nd Year", rate: 84 },
              { year: "3rd Year", rate: 78 },
              { year: "4th Year", rate: 89 },
            ].map((y, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{y.year}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{y.rate}%</span>
                </div>
                <div className="progress-track w-full">
                  <div
                    className="progress-fill"
                    style={{ width: `${y.rate}%`, background: "var(--accent)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
