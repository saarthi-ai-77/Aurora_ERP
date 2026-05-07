"use client";
import Topbar from "@/components/layout/topbar";
import { Users, Building2, Bell, FileText, Shield, Activity } from "lucide-react";

const STATS = [
  { id: "stat-students", label: "Total Students",    value: "1,450", icon: Users,     color: "var(--accent)" },
  { id: "stat-faculty",  label: "Faculty Members",   value: "82",    icon: Shield,    color: "var(--green)" },
  { id: "stat-sections", label: "Active Sections",   value: "24",    icon: Building2, color: "var(--purple)" },
  { id: "stat-notices",  label: "Notices Posted",    value: "17",    icon: Bell,      color: "var(--amber)" },
];

const RECENT_ACTIONS = [
  { id: "1", actor: "Dr. Ramesh Kumar",  action: "Marked attendance for CSE-A",                     time: "2 mins ago",  role: "Faculty" },
  { id: "2", actor: "Admin",             action: "Created user: Sneha Reddy (Student)",              time: "15 mins ago", role: "Admin" },
  { id: "3", actor: "Dr. Priya Singh",   action: "Graded Assignment 1 for IT-A (28 submissions)",   time: "1 hour ago",  role: "Faculty" },
  { id: "4", actor: "Admin",             action: "Posted notice: Mid-Term Exam Schedule",            time: "3 hours ago", role: "Admin" },
  { id: "5", actor: "Dr. Arun Nair",     action: "Reopened submission for Rahul Sharma",            time: "5 hours ago", role: "Faculty" },
];

const QUICK_ACTIONS = [
  { id: "action-add-user",       label: "Add User",       icon: Users,     href: "/admin/users/new" },
  { id: "action-post-notice",    label: "Post Notice",    icon: Bell,      href: "/admin/noticeboard/new" },
  { id: "action-create-section", label: "Create Section", icon: Building2, href: "/admin/sections/new" },
  { id: "action-assign-faculty", label: "Assign Faculty", icon: Shield,    href: "/admin/sections" },
  { id: "action-audit-logs",     label: "Audit Logs",     icon: FileText,  href: "/admin/audit-logs" },
  { id: "action-analytics",      label: "Analytics",      icon: Activity,  href: "/admin/analytics" },
];

export default function AdminDashboard() {
  return (
    <>
      <Topbar title="Admin Dashboard" breadcrumb={["Dashboard"]} />
      <div className="p-5 space-y-5" style={{ background: "var(--bg-page)", minHeight: "calc(100vh - var(--topbar-height))" }}>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.id} id={s.id} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Quick Actions */}
          <div className="lg:col-span-1 card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <a
                  key={a.id}
                  id={a.id}
                  href={a.href}
                  className="flex flex-col items-center gap-2 p-4 rounded transition-colors text-center"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent-light)";
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface-2)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <a.icon className="w-5 h-5" />
                  <span className="text-xs font-medium leading-tight">{a.label}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {RECENT_ACTIONS.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white mt-0.5"
                    style={{ background: r.role === "Admin" ? "var(--purple)" : "var(--accent)" }}
                  >
                    {r.actor.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{r.actor}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{r.action}</p>
                  </div>
                  <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>{r.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
