"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, GraduationCap, Building2, BarChart, Activity, Clock } from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics.api";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="stat-card flex items-center justify-between">
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </p>
        <h3 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {value ?? "—"}
        </h3>
      </div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "admin"],
    queryFn: () => analyticsApi.getAdminSummary(),
  });

  const counts = data?.data?.counts ?? {};
  const recentActivity: any[] = data?.data?.recentActivity ?? [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          System Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          High-level overview of Aurora ERP's academic and operational metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Students" value={counts.students ?? "—"} icon={GraduationCap} />
        <StatCard label="Total Faculty" value={counts.faculty ?? "—"} icon={Users} />
        <StatCard label="Departments" value={counts.departments ?? "—"} icon={Building2} />
        <StatCard label="Active Courses" value={counts.courses ?? "—"} icon={BookOpen} />
        <StatCard label="Active Sections" value={counts.sections ?? "—"} icon={BarChart} />
        <StatCard label="Published Assignments" value={counts.activeAssignments ?? "—"} icon={BookOpen} />
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="w-5 h-5" style={{ color: "var(--accent)" }} />
          <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
            Recent Activity
          </h3>
        </div>

        {isLoading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((entry: any) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    {entry.actor}
                  </span>
                  <span className="mx-2 text-sm" style={{ color: "var(--text-muted)" }}>·</span>
                  <span className="badge badge-under-review text-xs">{entry.action}</span>
                </div>
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Clock className="w-3 h-3" />
                  {new Date(entry.time).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No recent activity.</p>
        )}
      </div>
    </div>
  );
}
